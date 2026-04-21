const Quote = require("../models/Quote");
const Contract = require("../models/Contract");
const Notification = require("../models/Notification");
const Company = require("../models/company");
const mongoose = require("mongoose");

// CREATE QUOTE
const createQuote = async (req, res) => {
  try {

    const { userId, reservationId, items, taxRate, validUntil, notes } = req.body;
    
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
      status: "draft"
    };

    if (isProfessional) {
      quoteData.professionalId = ownerId;
    } else {
      quoteData.companyId = ownerId;
    }


    const newQuote = new Quote(quoteData);

    // Notify client
    try {
      const providerId = newQuote.companyId || newQuote.professionalId;
      const providerType = newQuote.companyId ? "Company" : "Professional";
      
      let providerName = "Un professionnel";
      if (newQuote.companyId) {
        const Company = require("../models/company");
        const company = await Company.findById(newQuote.companyId);
        providerName = company?.companyName || providerName;
      } else {
        const Professional = require("../models/Professional");
        const pro = await Professional.findById(newQuote.professionalId);
        providerName = pro?.fullName || providerName;
      }

      await Notification.create({
        recipient_id: userId,
        recipient_type: "User",
        sender_id: providerId,
        sender_type: providerType,
        type: "quote",
        related_id: newQuote._id,
        message: `${providerName} vous a envoyé un nouveau devis (${newQuote.quoteNumber}).`
      });
    } catch (notifError) {
      console.error("[createQuote] Notification failed:", notifError);
    }

    res.status(201).json(newQuote);
  } catch (error) {

    res.status(500).json({ 
      message: "Erreur lors de la création du devis", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
    const isProfessional = req.roles?.includes("professional");
    const ownerId = req.companyId || req.user;
    const userId = req.user;

    // Determine role and find quote
    let quote;
    let isProvider = false;

    // Try to find as provider first
    if (ownerId) {
      const queryOwner = isProfessional ? { _id: id, professionalId: ownerId } : { _id: id, companyId: ownerId };
      quote = await Quote.findOne(queryOwner);
      if (quote) isProvider = true;
    }

    // If not found as company, try as user
    if (!quote) {
      quote = await Quote.findOne({ _id: id, userId });
    }

    if (!quote) return res.status(404).json({ message: "Devis non trouvé" });

    // Security: Only the client can accept/reject, and only if it was sent
    if (!isProvider) {
      if (status === "accepted" || status === "rejected") {
        if (quote.status !== "sent") {
          return res.status(400).json({ message: "Le devis doit être envoyé avant d'être accepté ou refusé" });
        }
        quote.status = status;
        
        // Notify provider
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
          // Continue even if notification fails
        }
      } else {
        return res.status(403).json({ message: "Action non autorisée pour le client" });
      }
    } 
    // Security: Only the company can send or update draft info
    else {
      if (status === "sent") {
        if (quote.status !== "draft") {
          return res.status(400).json({ message: "Seul un brouillon peut être envoyé" });
        }
        quote.status = "sent";
        
        // Notify client
        try {
          const providerId = quote.companyId || quote.professionalId;
          const providerType = quote.companyId ? "Company" : "Professional";
          
          let providerName = "Un professionnel";
          if (quote.companyId) {
            const Company = require("../models/company");
            const company = await Company.findById(quote.companyId);
            providerName = company?.companyName || providerName;
          } else {
            const Professional = require("../models/Professional");
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
          // Continue even if notification fails
        }
      } else if (status === "draft") {
        quote.status = "draft";
      } else {
        return res.status(403).json({ message: "L'entreprise ne peut pas accepter/refuser son propre devis" });
      }
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