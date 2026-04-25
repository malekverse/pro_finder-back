const Quote = require("../models/Quote");
const Contract = require("../models/Contract");
const Notification = require("../models/Notification");
const Company = require("../models/company");
const Professional = require("../models/Professional");
const mongoose = require("mongoose");

// CREATE QUOTE
const createQuote = async (req, res) => {
  try {

    const { userId, reservationId, items, taxRate, validUntil, notes, requiresContract } = req.body;
    
    // Si on a un companyId dans le token, on l'utilise en priorité (cas d'un pro travaillant pour une entreprise)
    const hasCompany = !!req.companyId;
    const isProfessional = !hasCompany && req.roles?.includes("professional");
    const ownerId = hasCompany ? req.companyId : req.user;

    // Validation des IDs
    if (!mongoose.Types.ObjectId.isValid(userId)) {

      return res.status(400).json({ message: "ID client invalide" });
    }
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
  
      return res.status(401).json({ message: "ID propriétaire invalide ou manquant" });
    }

    if (!userId || !items || items.length === 0 || !validUntil) {
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }

    // Calculer les totaux avec validation des types
    let subTotal = 0;
    const calculatedItems = items.map(item => {
      const quantity = parseFloat(item.quantity) || 1;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const total = quantity * unitPrice;
      subTotal += total;
      return {
        description: item.description,
        quantity,
        unitPrice,
        duration: item.duration || "",
        total
      };
    });

    const rate = parseFloat(taxRate) || 19;
    const taxAmount = (subTotal * rate) / 100;
    const totalAmount = subTotal + taxAmount;

    // Vérifier si reservationId est un ObjectId valide
    const validReservationId = mongoose.Types.ObjectId.isValid(reservationId) ? reservationId : null;

    // Générer un numéro de devis unique (Basé sur le total de devis dans le système pour éviter les collisions)
    const totalCount = await Quote.countDocuments({});
    const quoteNumber = `QT-${new Date().getFullYear()}-${(totalCount + 1).toString().padStart(4, '0')}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    const quoteData = {
      quoteNumber,
      userId,
      reservationId: validReservationId,
      items: calculatedItems,
      subTotal,
      taxRate: rate,
      taxAmount,
      totalAmount,
      validUntil,
      notes,
      requiresContract: requiresContract === true || requiresContract === 'true',
      status: req.body.status || "draft"
    };

    if (isProfessional) {
      quoteData.professionalId = ownerId;
    } else {
      quoteData.companyId = ownerId;
    }


    const newQuote = new Quote(quoteData);
    await newQuote.save();

    // Notify client
    try {
      const providerId = newQuote.companyId || newQuote.professionalId;
      
      let providerName = "Un professionnel";
      if (newQuote.companyId) {
        const company = await Company.findById(newQuote.companyId);
        providerName = company?.companyName || providerName;
      } else {
        const pro = await Professional.findById(newQuote.professionalId);
        providerName = pro?.fullName || providerName;
      }

      await Notification.create({
        recipient_id: userId,
        recipient_type: "User",
        sender_id: providerId,
        sender_type: newQuote.companyId ? "Company" : "Professional",
        type: "quote",
        related_id: newQuote._id,
        message: `Nouveau devis reçu de ${providerName}.`
      });
    } catch (notifErr) {
      console.error("Failed to send quote notification:", notifErr);
    }

    res.status(201).json(newQuote);
  } catch (error) {
    console.error("Create Quote Error:", error);
    res.status(500).json({ message: "Erreur lors de la création du devis" });
  }
};

// GET ALL QUOTES FOR COMPANY
const getCompanyQuotes = async (req, res) => {
  try {
    const hasCompany = !!req.companyId;
    const isProfessional = !hasCompany && req.roles?.includes("professional");
    const id = hasCompany ? req.companyId : req.user;
    
    const query = isProfessional ? { professionalId: id } : { companyId: id };

    const quotes = await Quote.find(query)
      .populate("userId", "fullName email")
      .sort({ createdAt: -1 });
    
    res.json(quotes);
  } catch (error) {
    console.error("[getCompanyQuotes] Error:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des devis" });
  }
};

// GET ALL QUOTES FOR USER (CLIENT)
const getUserQuotes = async (req, res) => {
  try {
    const userId = req.user;
    
    // Devis pour le client (on exclut les brouillons)
    const quotes = await Quote.find({ userId, status: { $ne: "draft" } })
      .populate("companyId", "companyName logoUrl email phone")
      .populate("professionalId", "fullName photoProfessional email phone")
      .sort({ createdAt: -1 })
      .lean();
    
    // Trouver les contrats liés à ces devis
    const quoteIds = quotes.map(q => q._id);
    const contracts = await Contract.find({ quoteId: { $in: quoteIds } }).select("_id quoteId contractNumber").lean();

    // Attacher l'info du contrat à chaque devis
    const quotesWithContracts = quotes.map(quote => {
      const contract = contracts.find(c => c.quoteId?.toString() === quote._id.toString());
      return {
        ...quote,
        contractId: contract ? contract._id : null,
        contractNumber: contract ? contract.contractNumber : null
      };
    });
    
    console.log(`[getUserQuotes] Found ${quotesWithContracts.length} quotes for user`);
    res.json(quotesWithContracts);
  } catch (error) {
    console.error("[getUserQuotes] Error:", error);
    res.status(500).json({ message: "Erreur lors de la récupération de vos devis" });
  }
};

// UPDATE QUOTE STATUS
const updateQuoteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user;
    const companyId = req.companyId;

    const quote = await Quote.findById(id);
    if (!quote) return res.status(404).json({ message: "Devis non trouvé" });

    // Determine roles clearly
    const isClient = quote.userId.toString() === userId.toString();
    const isProvider = (quote.companyId && companyId && quote.companyId.toString() === companyId.toString()) || 
                       (quote.professionalId && quote.professionalId.toString() === userId.toString());

    // 1. ACTION CLIENT (Accepter / Refuser)
    if (status === "accepted" || status === "rejected") {
      if (!isClient) {
        return res.status(403).json({ message: "Seul le client destinataire peut accepter ou refuser ce devis" });
      }

      if (quote.status !== "sent") {
        return res.status(400).json({ message: "Le devis doit être à l'état 'envoyé' pour être accepté ou refusé" });
      }

      quote.status = status;
      
      // UPDATE RESERVATION STATUS IF LINKED
      if (status === "accepted" && quote.reservationId) {
        try {
          const Reservation = require("../models/Reservation");
          const targetRes = await Reservation.findById(quote.reservationId);
          
          if (targetRes) {
            // Check for conflicts before confirming
            const startOfDay = new Date(targetRes.date);
            startOfDay.setHours(0,0,0,0);
            const endOfDay = new Date(targetRes.date);
            endOfDay.setHours(23,59,59,999);

            const conflict = await Reservation.findOne({
              _id: { $ne: targetRes._id },
              $or: [
                { companyId: targetRes.companyId, companyId: { $ne: null } },
                { professionalId: targetRes.professionalId, professionalId: { $ne: null } }
              ],
              date: { $gte: startOfDay, $lte: endOfDay },
              timeSlot: targetRes.timeSlot,
              status: { $in: ["confirmed", "paid", "completed", "blocked"] }
            });

            if (conflict) {
              return res.status(400).json({ 
                message: "Désolé, ce créneau n'est plus disponible. Il a été réservé par un autre client." 
              });
            }

            targetRes.status = "confirmed";
            await targetRes.save();
            console.log(`✅ [updateQuoteStatus] Linked reservation ${quote.reservationId} updated to confirmed`);
          }
        } catch (resError) {
          console.error("❌ [updateQuoteStatus] Failed to update linked reservation:", resError);
        }
      }

      // GENERATE AUTOMATIC CONTRACT IF REQUIRED
      if (status === "accepted" && quote.requiresContract) {
        try {
          // Vérifier si un contrat existe déjà pour éviter les doublons
          const Contract = require("../models/Contract");
          const existingContract = await Contract.findOne({ quoteId: quote._id });
          
          if (!existingContract) {
            const totalCount = await Contract.countDocuments({});
            const contractNumber = `CTR-${new Date().getFullYear()}-${(totalCount + 1).toString().padStart(4, '0')}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
            
            let providerName = "Prestataire";
            if (quote.companyId) {
              const company = await Company.findById(quote.companyId);
              providerName = company?.companyName || providerName;
            } else if (quote.professionalId) {
              const pro = await Professional.findById(quote.professionalId);
              providerName = pro?.fullName || providerName;
            }

            const itemsList = quote.items.map(item => `- ${item.description} (x${item.quantity}) : ${item.total} TND`).join('\n');
            
            const newContract = new Contract({
              contractNumber,
              companyId: quote.companyId,
              professionalId: quote.professionalId,
              userId: quote.userId,
              quoteId: quote._id,
              title: `Contrat de prestation - ${quote.quoteNumber}`,
              content: `Ce contrat formalise l'accord pour les services suivants :\n\n${itemsList}\n\nTotal TTC : ${quote.totalAmount} TND`,
              startDate: new Date(),
              totalValue: quote.totalAmount,
              status: "pending_signature",
              terms: quote.notes || "Conditions standards de prestation de service."
            });

            await newContract.save();

            // Notify client about the new contract
            await Notification.create({
              recipient_id: quote.userId,
              recipient_type: "User",
              sender_id: quote.companyId || quote.professionalId,
              sender_type: quote.companyId ? "Company" : "Professional",
              type: "contract",
              related_id: newContract._id,
              message: `Votre contrat pour le devis ${quote.quoteNumber} a été généré automatiquement. Veuillez le signer.`
            });

            console.log(`✅ [updateQuoteStatus] Automatic contract generated: ${contractNumber}`);
          } else {
            console.log(`ℹ️ [updateQuoteStatus] Contract already exists for quote ${quote._id}`);
          }
        } catch (contractError) {
          console.error("❌ [updateQuoteStatus] Failed to generate automatic contract:", contractError);
        }
      }

      // Notification au fournisseur
      try {
        const providerId = quote.companyId || quote.professionalId;
        const providerType = quote.companyId ? "Company" : "Professional";
        
        await Notification.create({
          recipient_id: providerId,
          recipient_type: providerType,
          sender_id: userId,
          sender_type: "User",
          type: "quote",
          related_id: quote._id,
          message: `Le client a ${status === 'accepted' ? 'accepté' : 'refusé'} votre devis ${quote.quoteNumber}.`
        });
      } catch (notifError) {
        console.error("[updateQuoteStatus] Notification failed:", notifError);
      }
    } 
    // 2. ACTION FOURNISSEUR (Envoyer / Brouillon)
    else if (status === "sent" || status === "draft") {
      if (!isProvider) {
        return res.status(403).json({ message: "Seul le fournisseur peut modifier ou envoyer ce devis" });
      }

      if (status === "sent") {
        if (quote.status !== "draft") {
          return res.status(400).json({ message: "Seul un brouillon peut être envoyé" });
        }
        
        // Notification au client
        try {
          const providerId = quote.companyId || quote.professionalId;
          const providerType = quote.companyId ? "Company" : "Professional";
          
          let providerName = "Un professionnel";
          if (quote.companyId) {
            const Company = require("../models/company");
            const company = await Company.findById(quote.companyId);
            providerName = company?.companyName || providerName;
          } else {
        const pro = await Professional.findById(quote.professionalId);
        providerName = pro?.fullName || providerName;
      }

          await Notification.create({
            recipient_id: quote.userId,
            recipient_type: "User",
            sender_id: providerId,
            sender_type: providerType,
            type: "quote",
            related_id: quote._id,
            message: `${providerName} vous a envoyé un nouveau devis (${quote.quoteNumber}).`
          });
        } catch (notifError) {
          console.error("[updateQuoteStatus] Notification failed:", notifError);
        }
      }
      quote.status = status;
    } else {
      return res.status(400).json({ message: "Statut invalide" });
    }

    await quote.save();
    res.json(quote);
  } catch (error) {
    console.error("[updateQuoteStatus]", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour du statut" });
  }
};

module.exports = {
  createQuote,
  getCompanyQuotes,
  getUserQuotes,
  updateQuoteStatus
};