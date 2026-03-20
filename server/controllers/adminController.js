const User = require("../models/User");
const Company = require("../models/company"); // Vérifie bien le chemin et la majuscule !
const getDashboard = async (req, res) => {
  const usersCount = await User.countDocuments();

  res.json({
    message: "Admin Dashboard",
    totalUsers: usersCount
  });
};

const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};

const changeUserRole = async (req, res) => {
  const { userId, role } = req.body;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.roles = [role];
  await user.save();

  res.json({ message: "Role updated" });
};
const verifyCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    company.Status = "active";
    await company.save();
    res.json({ message: "Company verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error verifying company" });
  }
};
const getPendingCompanies = async (req, res) => {
  try {
    const pendingCompanies = await Company.find({ Status: "pending" });
    res.json(pendingCompanies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching pending companies" });
  }
};
// Dans controllers/adminController.js
const rejectCompany = async (req, res) => {
    try {
        const { companyId } = req.params;
        // Supprime l'entreprise de la base de données
        await Company.findByIdAndDelete(companyId); 
        res.status(200).json({ message: "Entreprise refusée et supprimée." });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors du rejet de l'entreprise." });
    }
};

module.exports = { 
  getDashboard,
  getAllUsers,
  changeUserRole,
  verifyCompany,
  getPendingCompanies,
  rejectCompany
};  