const Company = require("../models/company");
const Follow = require("../models/follow");
const Role = require("../models/Role");
const User = require("../models/User");

const getDashboard = async (req, res) => {
  res.json({ message: "Company Dashboard", companyId: req.user });
};
const getCompanyFollowers = async (req, res) => {
  const company = await Company.findById(req.user);
  if (!company) return res.status(404).json({ message: "Company not found" });
  const followers = await Follow.find({ company_id: req.user })
    .populate("user_id", "fullName email")
    .populate("role_id", "name permissions");
  res.json(followers);
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

//  Lister tous les users de la company avec rôle et permissions
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

// Assigner un rôle à un user
const assignRoleToUser = async (req, res) => {
  const { email, role } = req.body;
  try {
    
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    
    const follow = await Follow.findOne({ user_id: user._id, company_id: req.user });
    if (!follow) return res.status(404).json({ message: "User not following this company" });

  
    const roleDoc = await Role.findOne({ name: role });
    if (!roleDoc) return res.status(404).json({ message: "Role not found" });

    //Assigner le rôle
    follow.role_id = roleDoc._id;
    await follow.save();

    res.json({ message: "Role assigned successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error assigning role" });
  }
};

// Mettre à jour le rôle d’un utilisateur
const updateRoleToUser = async (req, res) => {
  const { email, role_id } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const follow = await Follow.findOne({
      user_id: user._id,
      company_id: req.user
    });

    if (!follow) {
      return res.status(404).json({ message: "User not following this company" });
    }

    follow.role_id = role_id;
    await follow.save();

    res.json({ message: "Role updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating role" });
  }
};

// Supprimer le rôle d’un utilisateur
const deleteRoleToUser = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const follow = await Follow.findOne({
      user_id: user._id,
      company_id: req.user
    });

    if (!follow) {
      return res.status(404).json({ message: "User not following this company" });
    }

    follow.role_id = null;
    await follow.save();

    res.json({ message: "Role removed successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting role" });
  }
};

module.exports = {
  getDashboard,
  getCompanyProfile,
  updateCompanyProfile,
  getCompanyUsers,
  assignRoleToUser,
  getCompanyFollowers,
  updateRoleToUser,
  deleteRoleToUser
};