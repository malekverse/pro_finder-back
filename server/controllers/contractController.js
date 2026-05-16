const Contract = require("../models/Contract");
const Notification = require("../models/Notification");
const Company = require("../models/company");

// CREATE CONTRACT
const createContract = async (req, res) => {
  try {
    console.log("[createContract] Body:", JSON.stringify(req.body));
    const { userId, quoteId, title, content, startDate, endDate, totalValue, terms } = req.body;
    
    const hasCompany = !!req.companyId;
    const isProfessional = !hasCompany && req.roles?.includes("professional");
    const ownerId = hasCompany ? req.companyId : req.user;

    const mongoose = require("mongoose");

    // Validation des IDs
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("[createContract] Invalid userId:", userId);
      return res.status(400).json({ message: "ID client invalide" });
    }
    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      console.log("[createContract] Invalid ownerId:", ownerId);
      return res.status(401).json({ message: "ID prestataire invalide ou manquant" });
    }

    if (!userId || !title || !content || !startDate || totalValue === undefined) {
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }

    // Nettoyage de la valeur totale (remplacer virgule par point si nécessaire)
    let cleanedTotalValue = totalValue;
    if (typeof totalValue === 'string') {
      cleanedTotalValue = parseFloat(totalValue.replace(',', '.'));
    } else {
      cleanedTotalValue = parseFloat(totalValue);
    }

    if (isNaN(cleanedTotalValue)) {
      return res.status(400).json({ message: "La valeur totale doit être un nombre valide" });
    }

    // Validation du quoteId
    const validQuoteId = mongoose.Types.ObjectId.isValid(quoteId) ? quoteId : undefined;

    // Générer un numéro de contrat unique
    const totalCount = await Contract.countDocuments({});
    const contractNumber = `CTR-${new Date().getFullYear()}-${(totalCount + 1).toString().padStart(4, '0')}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    const contractData = {
      contractNumber,
      userId,
      quoteId: validQuoteId,
      title,
      content,
      startDate,
      endDate: endDate || undefined,
      totalValue: cleanedTotalValue,
      terms,
      status: "pending_signature"
    };

    if (isProfessional) {
      contractData.professionalId = ownerId;
    } else {
      contractData.companyId = ownerId;
    }

    console.log("[createContract] Creating with:", JSON.stringify(contractData));
    const newContract = new Contract(contractData);

    await newContract.save();
    console.log("[createContract] Saved successfully:", newContract._id);

    // Notify client
    try {
      const providerId = newContract.companyId || newContract.professionalId;
      const providerType = newContract.companyId ? "Company" : "Professional";
      
      let providerName = "Un professionnel";
      if (newContract.companyId) {
        const Company = require("../models/company");
        const company = await Company.findById(newContract.companyId);
        providerName = company?.companyName || providerName;
      } else {
        const Professional = require("../models/Professional");
        const pro = await Professional.findById(newContract.professionalId);
        providerName = pro?.fullName || providerName;
      }

      await Notification.create({
        recipient_id: userId,
        recipient_type: "User",
        sender_id: providerId,
        sender_type: providerType,
        type: "contract",
        related_id: newContract._id,
        message: `${providerName} vous a envoyé un nouveau contrat (${newContract.contractNumber}).`
      });
    } catch (notifError) {
      console.error("[createContract] Notification failed:", notifError);
    }

    res.status(201).json(newContract);
  } catch (error) {
    console.error("[createContract] Error detail:", error);
    res.status(500).json({ 
      message: "Erreur lors de la création du contrat",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// GET ALL CONTRACTS FOR COMPANY
const getCompanyContracts = async (req, res) => {
  try {
    const id = req.companyId || req.user;
    const isProfessional = req.roles?.includes("professional");
    const query = isProfessional ? { professionalId: id } : { companyId: id };

    if (!id) {
      return res.status(400).json({ message: "ID prestataire manquant" });
    }

    const contracts = await Contract.find(query)
      .populate("userId", "fullName email")
      .populate("quoteId", "quoteNumber")
      .sort({ createdAt: -1 });
    res.json(contracts);
  } catch (error) {
    console.error("[getCompanyContracts] Error:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des contrats" });
  }
};

// GET ALL CONTRACTS FOR USER (CLIENT)
const getUserContracts = async (req, res) => {
  try {
    const userId = req.user;
    const contracts = await Contract.find({ userId })
      .populate("companyId", "companyName logoUrl email phone")
      .populate("professionalId", "fullName photoProfessional email phone")
      .populate("quoteId", "quoteNumber")
      .sort({ createdAt: -1 });
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération de vos contrats" });
  }
};

// UPDATE CONTRACT STATUS
const updateContractStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, signatureDate } = req.body;
    const isProfessional = req.roles?.includes("professional");
    const ownerId = req.companyId || req.user;
    const userId = req.user;

    // Determine role and find contract
    let contract;
    let isProvider = false;

    // Try to find as provider first
    if (ownerId) {
      const queryOwner = isProfessional ? { _id: id, professionalId: ownerId } : { _id: id, companyId: ownerId };
      contract = await Contract.findOne(queryOwner);
      if (contract) isProvider = true;
    }

    // If not found as company, try as user
    if (!contract) {
      contract = await Contract.findOne({ _id: id, userId });
    }

    if (!contract) return res.status(404).json({ message: "Contrat non trouvé" });

    // Notifications
    if (!isProvider && status === "signed") {
      contract.status = status;
      if (signatureDate) contract.signatureDate = signatureDate;
      
      // Update linked reservation to 'confirmed' if applicable
      if (contract.quoteId) {
        try {
          const Quote = require("../models/Quote");
          const Reservation = require("../models/Reservation");
          const quote = await Quote.findById(contract.quoteId);
          if (quote && quote.reservationId) {
            await Reservation.findByIdAndUpdate(quote.reservationId, { status: "confirmed" });
          }
        } catch (linkError) {
          console.error("[updateContractStatus] Link update failed:", linkError);
        }
      }
      
      try {
        const providerId = contract.companyId || contract.professionalId;
        const providerType = contract.companyId ? "Company" : "Professional";
        
        await Notification.create({
          recipient_id: providerId,
          recipient_type: providerType,
          sender_id: userId,
          sender_type: "User",
          type: "contract",
          related_id: contract._id,
          message: `Le client a signé le contrat ${contract.contractNumber}.`
        });
      } catch (notifError) {
        console.error("[updateContractStatus] Notification failed:", notifError);
      }
    } else if (isProvider) {
      contract.status = status;
      if (signatureDate) contract.signatureDate = signatureDate;
    } else {
      contract.status = status;
    }

    await contract.save();
    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour du contrat" });
  }
};
module.exports = {
  createContract,
  getCompanyContracts,
  getUserContracts,
  updateContractStatus
};
