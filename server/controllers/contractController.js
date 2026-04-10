const Contract = require("../models/Contract");
const Notification = require("../models/Notification");
const Company = require("../models/company");

// CREATE CONTRACT
exports.createContract = async (req, res) => {
  try {
    const { userId, quoteId, title, content, startDate, endDate, totalValue, terms } = req.body;
    const companyId = req.companyId;

    if (!companyId) {
      return res.status(403).json({ message: "ID entreprise manquant" });
    }

    if (!userId || !title || !content || !startDate || !totalValue) {
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }

    // Générer un numéro de contrat unique (Ex: CTR-2024-001)
    const count = await Contract.countDocuments({ companyId });
    const contractNumber = `CTR-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;

    const newContract = new Contract({
      contractNumber,
      companyId,
      userId,
      quoteId: quoteId || undefined, // Eviter l'erreur de cast sur chaîne vide
      title,
      content,
      startDate,
      endDate: endDate || undefined,
      totalValue,
      terms,
      status: "pending_signature"
    });

    await newContract.save();

    // Notify client
    try {
      const company = await Company.findById(companyId);
      if (company) {
        await Notification.create({
          recipient_id: userId,
          recipient_type: "User",
          sender_id: companyId,
          sender_type: "Company",
          type: "contract",
          related_id: newContract._id,
          message: `${company.companyName} vous a envoyé un nouveau contrat (${newContract.contractNumber}).`
        });
      }
    } catch (notifError) {
      console.error("[createContract] Notification failed:", notifError);
    }

    res.status(201).json(newContract);
  } catch (error) {
    console.error("[createContract]", error);
    res.status(500).json({ message: "Erreur lors de la création du contrat" });
  }
};

// GET ALL CONTRACTS FOR COMPANY
exports.getCompanyContracts = async (req, res) => {
  try {
    const companyId = req.companyId;
    console.log("[getCompanyContracts] Fetching for companyId:", companyId);
    
    if (!companyId) {
      return res.status(400).json({ message: "ID entreprise manquant" });
    }

    const contracts = await Contract.find({ companyId })
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
exports.getUserContracts = async (req, res) => {
  try {
    const userId = req.user;
    const contracts = await Contract.find({ userId })
      .populate("companyId", "companyName logoUrl email phone")
      .populate("quoteId", "quoteNumber")
      .sort({ createdAt: -1 });
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération de vos contrats" });
  }
};

// UPDATE CONTRACT STATUS
exports.updateContractStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, signatureDate } = req.body;
    const companyId = req.companyId;
    const userId = req.user;

    // Determine role and find contract
    let contract;
    let isCompany = false;

    // Try to find as company first
    if (companyId) {
      contract = await Contract.findOne({ _id: id, companyId });
      if (contract) isCompany = true;
    }

    // If not found as company, try as user
    if (!contract) {
      contract = await Contract.findOne({ _id: id, userId });
    }

    if (!contract) return res.status(404).json({ message: "Contrat non trouvé" });

    // Notifications
    if (!isCompany && status === "signed") {
      contract.status = status;
      if (signatureDate) contract.signatureDate = signatureDate;
      
      try {
        await Notification.create({
          recipient_id: contract.companyId,
          recipient_type: "Company",
          sender_id: userId,
          sender_type: "User",
          type: "contract",
          related_id: contract._id,
          message: `Le client a signé le contrat ${contract.contractNumber}.`
        });
      } catch (notifError) {
        console.error("[updateContractStatus] Notification failed:", notifError);
      }
    } else if (isCompany) {
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
