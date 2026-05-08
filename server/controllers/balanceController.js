const ProviderBalance = require("../models/ProviderBalance");
const PayoutRequest = require("../models/PayoutRequest");
const Payment = require("../models/Payment");

// Get current balance and stats
exports.getBalance = async (req, res) => {
  try {
    const id = req.companyId || req.user;
    const isProfessional = req.roles?.includes("professional");
    const query = isProfessional ? { professionalId: id } : { companyId: id };

    let balance = await ProviderBalance.findOne(query);
    if (!balance) {
      // Create one if it doesn't exist
      balance = await ProviderBalance.create(query);
    }

    // Get recent successful payments
    const recentPayments = await Payment.find({ 
      ...query, 
      status: "success" 
    })
    .populate("userId", "fullName email")
    .sort({ createdAt: -1 })
    .limit(10);

    res.json({
      balance,
      recentPayments
    });
  } catch (error) {
    console.error("Error in getBalance:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Create a payout request
exports.requestPayout = async (req, res) => {
  try {
    const id = req.companyId || req.user;
    const isProfessional = req.roles?.includes("professional");
    const query = isProfessional ? { professionalId: id } : { companyId: id };
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Montant invalide" });
    }

    const balance = await ProviderBalance.findOne(query);
    if (!balance || balance.availableBalance < amount) {
      return res.status(400).json({ message: "Solde insuffisant" });
    }

    // Create the request
    const payoutRequest = new PayoutRequest({
      ...query,
      amount
    });

    // Deduct from available balance immediately for simplicity
    balance.availableBalance -= amount;
    
    await Promise.all([payoutRequest.save(), balance.save()]);

    res.json({ message: "Demande de retrait envoyée avec succès", payoutRequest });
  } catch (error) {
    console.error("Error in requestPayout:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Get payout requests history
exports.getPayoutHistory = async (req, res) => {
  try {
    const id = req.companyId || req.user;
    const isProfessional = req.roles?.includes("professional");
    const query = isProfessional ? { professionalId: id } : { companyId: id };

    const history = await PayoutRequest.find(query).sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};
