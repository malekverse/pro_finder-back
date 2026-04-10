const Quote = require("../models/Quote");
const Contract = require("../models/Contract");
const Notification = require("../models/Notification");
const Company = require("../models/company");

// CREATE QUOTE
exports.createQuote = async (req, res) => {
  try {
    const { userId, reservationId, items, taxRate, validUntil, notes } = req.body;
    const companyId = req.companyId;

    if (!userId || !items || items.length === 0 || !validUntil) {
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }

    // Calculer les totaux
    let subTotal = 0;
    const calculatedItems = items.map(item => {
      const total = item.quantity * item.unitPrice;
      subTotal += total;
      return { ...item, total };
    });

    const rate = taxRate || 19;
    const taxAmount = (subTotal * rate) / 100;
    const totalAmount = subTotal + taxAmount;

    // Générer un numéro de devis unique (Ex: QT-2024-001)
    const count = await Quote.countDocuments({ companyId });
    const quoteNumber = `QT-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;

    const newQuote = new Quote({
      quoteNumber,
      companyId,
      userId,
      reservationId,
      items: calculatedItems,
      subTotal,
      taxRate: rate,
      taxAmount,
      totalAmount,
      validUntil,
      notes,
      status: "draft"
    });

    await newQuote.save();
    res.status(201).json(newQuote);
  } catch (error) {
    console.error("[createQuote]", error);
    res.status(500).json({ message: "Erreur lors de la création du devis" });
  }
};

// GET ALL QUOTES FOR COMPANY
exports.getCompanyQuotes = async (req, res) => {
  try {
    const companyId = req.companyId;
    console.log("[getCompanyQuotes] Fetching for companyId:", companyId);
    
    if (!companyId) {
      return res.status(400).json({ message: "ID entreprise manquant dans le token" });
    }

    const quotes = await Quote.find({ companyId })
      .populate("userId", "fullName email")
      .sort({ createdAt: -1 });
    
    console.log(`[getCompanyQuotes] Found ${quotes.length} quotes`);
    res.json(quotes);
  } catch (error) {
    console.error("[getCompanyQuotes] Error:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des devis" });
  }
};

// GET ALL QUOTES FOR USER (CLIENT)
exports.getUserQuotes = async (req, res) => {
  try {
    const userId = req.user;
    console.log("[getUserQuotes] Fetching for userId:", userId);
    
    // Devis pour le client (on exclut les brouillons)
    const quotes = await Quote.find({ userId, status: { $ne: "draft" } })
      .populate("companyId", "companyName logoUrl email phone")
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
exports.updateQuoteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const companyId = req.companyId;
    const userId = req.user;

    // Determine role and find quote
    let quote;
    let isCompany = false;

    // Try to find as company first
    if (companyId) {
      quote = await Quote.findOne({ _id: id, companyId });
      if (quote) isCompany = true;
    }

    // If not found as company, try as user
    if (!quote) {
      quote = await Quote.findOne({ _id: id, userId });
    }

    if (!quote) return res.status(404).json({ message: "Devis non trouvé" });

    // Security: Only the client can accept/reject, and only if it was sent
    if (!isCompany) {
      if (status === "accepted" || status === "rejected") {
        if (quote.status !== "sent") {
          return res.status(400).json({ message: "Le devis doit être envoyé avant d'être accepté ou refusé" });
        }
        quote.status = status;
        
        // Notify company
        try {
          await Notification.create({
            recipient_id: quote.companyId,
            recipient_type: "Company",
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
          const company = await Company.findById(companyId);
          if (company) {
            await Notification.create({
              recipient_id: quote.userId,
              recipient_type: "User",
              sender_id: companyId,
              sender_type: "Company",
              type: "quote",
              related_id: quote._id,
              message: `${company.companyName} vous a envoyé un nouveau devis (${quote.quoteNumber}).`
            });
          }
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
