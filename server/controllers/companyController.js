const Company = require("../models/company");

const getDashboard = async (req, res) => {
  res.json({
    message: "Company Dashboard",
    userId: req.user.id
  });
};
const getCompanyProfile = async (req, res) => {
  const company = await Company.findById(req.user.id);
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

  const company = await Company.findById(req.user.id);
  if (!company) return res.status(404).json({ message: "Company not found" });

  company.companyName = companyName || company.companyName;
  company.phone = phone || company.phone;
  company.website = website || company.website;
  company.logoUrl = logoUrl || company.logoUrl;
  company.description = description || company.description;

  await company.save();

  res.json({ message: "Company profile updated" });
};
const hello = async (req, res) => {
  res.json({
    message: "Hello Company",
  });
};


module.exports = {
  getDashboard,
  getCompanyProfile,
  updateCompanyProfile,
  hello
};