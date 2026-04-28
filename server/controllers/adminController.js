const User = require("../models/User");
const Company = require("../models/company");
const Professional = require("../models/Professional");
const Activity = require("../models/Activity");
const Category = require("../models/Category");
const Service = require("../models/Service");
const City = require("../models/city");
const Report = require("../models/Report");
const bcrypt = require("bcrypt");
const { sendStatusEmail } = require("../utils/emailService");

const getDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCompanies = await Company.countDocuments();
    const totalCities = await City.countDocuments();
    const totalCategories = await Category.countDocuments();
    const totalServices = await Service.countDocuments();
    const totalReports = await Report.countDocuments({ status: "pending" });

    const pendingCompanies = await Company.countDocuments({ Status: "pending" });
    const verifiedCompanies = await Company.countDocuments({ Status: "active" });

    // Récupérer les 5 dernières entreprises en attente
    const recentPending = await Company.find({ Status: "pending" })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("companyName createdAt Status")
      .lean();

    // CALCUL DES DONNÉES RÉELLES POUR LA COURBE (6 derniers mois)
    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
    const growthData = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const userCount = await User.countDocuments({ createdAt: { $lt: nextD } });
      const companyCount = await Company.countDocuments({ createdAt: { $lt: nextD } });

      growthData.push({
        name: monthNames[d.getMonth()],
        users: userCount,
        companies: companyCount
      });
    }

    const totalProfessionals = await Professional.countDocuments();
    const pendingProfessionals = await Professional.countDocuments({ Status: "pending" });
    const verifiedProfessionals = await Professional.countDocuments({ Status: "active" });

    res.json({
      totalUsers,
      totalCompanies,
      totalProfessionals,
      pendingCompanies,
      verifiedCompanies,
      pendingProfessionals,
      verifiedProfessionals,
      totalReports,
      recentPending,
      growthData,
      stats: {
        users: totalUsers,
        companies: totalCompanies,
        professionals: totalProfessionals,
        villes: totalCities,
        categories: totalCategories,
        services: totalServices,
        reports: totalReports
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching dashboard data" });
  }
};

const getActivities = async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: "Error fetching activities" });
  }
};

const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const adminId = req.user;

  // Validation du nouveau mot de passe (min 8 caractères, 1 lettre, 1 chiffre, 1 caractère spécial)
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      message: "Nouveau mot de passe non conforme : il doit contenir au moins 8 caractères, dont une lettre, un chiffre et un caractère spécial (@$!%*#?&)."
    });
  }

  try {
    const admin = await User.findById(adminId);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const match = await bcrypt.compare(oldPassword, admin.password);
    if (!match) return res.status(400).json({ message: "Old password incorrect" });

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    await Activity.create({
      adminId,
      action: "Changement de mot de passe",
      target: admin.email,
      status: "success"
    });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating password" });
  }
};

const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};

const changeUserRole = async (req, res) => {
  const { userId, role } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.roles = [role];
    await user.save();

    await Activity.create({
      adminId: req.user,
      action: "Modification de rôle",
      target: user.email,
      status: "info"
    });

    res.json({ message: "Role updated" });
  } catch (error) {
    res.status(500).json({ message: "Error changing user role" });
  }
};

const verifyCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    company.Status = "active";
    await company.save();

    // Envoyer l'email de bienvenue
    try {
      await sendStatusEmail(company.email, company.companyName, "active");
    } catch (emailErr) {
      console.error("Email notification failed:", emailErr);
    }

    await Activity.create({
      adminId: req.user,
      action: "Vérification d'entreprise",
      target: company.companyName,
      status: "success"
    });

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

const rejectCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { reason } = req.body;

    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ message: "Company not found" });

    const name = company.companyName;

    // Au lieu de supprimer, on change le statut et on garde le motif
    company.Status = "rejected";
    company.rejectionReason = reason || "Motif non spécifié";
    await company.save();

    // Envoyer l'email de refus
    try {
      await sendStatusEmail(company.email, name, "rejected", reason);
    } catch (emailErr) {
      console.error("Email notification failed:", emailErr);
    }

    await Activity.create({
      adminId: req.user,
      action: "Refus d'entreprise",
      target: `${name} (Motif: ${reason || 'Non spécifié'})`,
      status: "error"
    });

    res.status(200).json({ message: `Entreprise refusée. Motif : ${reason || 'Non spécifié'}` });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors du rejet de l'entreprise." });
  }
};
const resolveCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { reason } = req.body;

    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ message: "Company not found" });

    const name = company.companyName;
    company.Status = "active ";
    await company.save();

    await Activity.create({
      adminId: req.user,
      action: "Résolution d'entreprise",
      target: `${name} (Motif: ${reason || 'Non spécifié'})`,
      status: "success"
    });

  } catch (error) {
    res.status(500).json({ message: "Erreur lors du résolution de l'entreprise." });
  }
};

const contactCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { message, type } = req.body;

    console.log(`[contactCompany] Tentative d'envoi d'email à l'entreprise ID: ${companyId}`);

    const company = await Company.findById(companyId);
    if (!company) {
      console.log(`[contactCompany] Entreprise non trouvée avec l'ID: ${companyId}`);
      return res.status(404).json({ message: "Entreprise non trouvée" });
    }

    if (!company.email) {
      console.log(`[contactCompany] Email manquant pour l'entreprise: ${company.companyName}`);
      return res.status(400).json({ message: "L'entreprise n'a pas d'adresse email enregistrée." });
    }

    console.log(`[contactCompany] Envoi d'un email de type '${type}' à ${company.email}`);

    try {
      await sendStatusEmail(company.email, company.companyName, type || "manual", message);
    } catch (emailError) {
      console.error("[contactCompany] Erreur Nodemailer détaillée:", emailError.message);
      return res.status(500).json({
        message: "Erreur Nodemailer",
        error: emailError.message,
        details: "Vérifiez vos identifiants EMAIL_USER et EMAIL_PASS. Si vous utilisez Gmail, avez-vous créé un 'Mot de passe d'application' ?"
      });
    }

    await Activity.create({
      adminId: req.user,
      action: "Envoi d'email à l'entreprise",
      target: company.companyName,
      status: "success"
    });

    res.json({ message: "Email envoyé avec succès" });
  } catch (err) {
    console.error("[contactCompany] Erreur générale:", err);
    res.status(500).json({ message: "Erreur serveur lors de l'envoi de l'email", error: err.message });
  }
};

const contactProfessional = async (req, res) => {
  try {
    const { professionalId } = req.params;
    const { message, type } = req.body;

    const professional = await Professional.findById(professionalId);
    if (!professional) return res.status(404).json({ message: "Professionnel non trouvé" });

    if (!professional.email) return res.status(400).json({ message: "Le professionnel n'a pas d'adresse email enregistrée." });

    try {
      await sendStatusEmail(professional.email, professional.fullName, type || "manual", message);
    } catch (emailError) {
      console.error("[contactProfessional] Erreur Nodemailer:", emailError.message);
      return res.status(500).json({ message: "Erreur lors de l'envoi de l'email" });
    }

    await Activity.create({
      adminId: req.user,
      action: "Envoi d'email au professionnel",
      target: professional.fullName,
      status: "success"
    });

    res.json({ message: "Email envoyé avec succès" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

const getPendingProfessionals = async (req, res) => {
  try {
    const pending = await Professional.find({ Status: "pending" });
    res.json(pending);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching pending professionals" });
  }
};

const verifyProfessional = async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.professionalId);
    if (!professional) return res.status(404).json({ message: "Professional not found" });

    professional.Status = "active";
    await professional.save();

    try {
      await sendStatusEmail(professional.email, professional.fullName, "active");
    } catch (emailErr) {
      console.error("Email notification failed:", emailErr);
    }

    await Activity.create({
      adminId: req.user,
      action: "Vérification de professionnel",
      target: professional.fullName,
      status: "success"
    });

    res.json({ message: "Professional verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error verifying professional" });
  }
};

const rejectProfessional = async (req, res) => {
  try {
    const { professionalId } = req.params;
    const { reason } = req.body;

    const professional = await Professional.findById(professionalId);
    if (!professional) return res.status(404).json({ message: "Professional not found" });

    const name = professional.fullName;
    professional.Status = "rejected";
    professional.rejectionReason = reason || "Motif non spécifié";
    await professional.save();

    try {
      await sendStatusEmail(professional.email, name, "rejected", reason);
    } catch (emailErr) {
      console.error("Email notification failed:", emailErr);
    }

    await Activity.create({
      adminId: req.user,
      action: "Refus de professionnel",
      target: `${name} (Motif: ${reason || 'Non spécifié'})`,
      status: "error"
    });

    res.status(200).json({ message: `Professionnel refusé. Motif : ${reason || 'Non spécifié'}` });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors du rejet du professionnel." });
  }
};

module.exports = {
  getDashboard,
  getActivities,
  getAllUsers,
  changeUserRole,
  verifyCompany,
  getPendingCompanies,
  rejectCompany,
  changePassword,
  resolveCompany,
  contactCompany,
  contactProfessional,
  getPendingProfessionals,
  verifyProfessional,
  rejectProfessional
};