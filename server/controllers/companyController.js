const Company = require("../models/company");
const Follow = require("../models/follow");
const Role = require("../models/Role");
const User = require("../models/User");

const getDashboard = async (req, res) => {
  res.json({ message: "Company Dashboard", companyId: req.user });
};

const getCompanyProfile = async (req, res) => {
  const company = await Company.findById(req.user);
  if (!company) return res.status(404).json({ message: "Company not found" });
  res.json({
    companyName: company.companyName,
    phone: company.phone,
    website: company.website,
    logoUrl: company.logoUrl,
    description: company.description,
  });
};

const updateCompanyProfile = async (req, res) => {
  const { companyName, phone, website, logoUrl, description } = req.body;

  const company = await Company.findById(req.user);
  if (!company) return res.status(404).json({ message: "Company not found" });

  company.companyName = companyName || company.companyName;
  company.phone = phone || company.phone;
  company.website = website || company.website;
  company.logoUrl = logoUrl || company.logoUrl;
  company.description = description || company.description;

  await company.save();
  res.json({ message: "Company profile updated" });
};
// ================= RBAC functions =================

// 1️⃣ Lister tous les users de la company avec rôle et permissions
const getCompanyUsers = async (req, res) => {
  try {
    const follows = await Follow.find({ company_id: req.user })
      .populate("user_id", "fullName email")
      .populate("role_id", "name permissions");

    const users = follows.map(f => ({
      fullName: f.user_id.fullName,
      email: f.user_id.email,
      role: f.role_id ? f.role_id.name : null,
      permissions: f.role_id ? f.role_id.permissions : []
    }));

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 2️⃣ Assigner un rôle à un user
const assignRoleToUser = async (req, res) => {
  const { user_id, role_id } = req.body;
  try {
    const follow = await Follow.findOne({ user_id, company_id: req.user });
    if (!follow) return res.status(404).json({ message: "User not following this company" });

    follow.role_id = role_id;
    await follow.save();
    res.json({ message: "Role assigned successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error assigning role" });
  }
};

module.exports = {
  getDashboard,
  getCompanyProfile,
  updateCompanyProfile,
  getCompanyUsers,
  assignRoleToUser
};