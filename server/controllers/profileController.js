const User = require("../models/User");
const Company = require("../models/company");


// GET PROFILE
const getProfile = async (req, res) => {
  try {

    let account = await User.findById(req.user).select("-password");

    // si pas user chercher company
    if (!account) {
      account = await Company.findById(req.user).select("-password");
    }

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.json(account);

  } catch (error) {
    res.status(500).json({ message:"Error getting profile" });
  }
};



// UPDATE PROFILE
const updateProfile = async (req, res) => {
  try {

    const { fullName, phone, avatarUrl } = req.body;

    // essayer user
    let user = await User.findById(req.user);

    if (user) {

      user.fullName = fullName ?? user.fullName;
      user.phone = phone ?? user.phone;
      user.avatarUrl = avatarUrl ?? user.avatarUrl;

      const updatedUser = await user.save();

      return res.json({
        _id: updatedUser._id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        phone: updatedUser.phone,
        avatarUrl: updatedUser.avatarUrl,
        roles: updatedUser.roles,
      });
    }

    // sinon company
    let company = await Company.findById(req.user);

    if (company) {

      company.companyName = fullName ?? company.name;
      company.description = description ?? company.description;
      company.website = website ?? company.website;
      company.phone = phone ?? company.phone;
      company.logoUrl = logoUrl ?? company.logoUrl;
      company.avatarUrl = avatarUrl ?? company.avatarUrl;


      const updatedCompany = await company.save();

      return res.json({
        _id: updatedCompany._id,
        email: updatedCompany.email,
        name: updatedCompany.name,
        description: updatedCompany.description,
        website: updatedCompany.website,
        logoUrl: updatedCompany.logoUrl,
        phone: updatedCompany.phone,
        avatarUrl: updatedCompany.avatarUrl,
        roles: updatedCompany.roles,
      });
    }

    res.status(404).json({ message: "Account not found" });

  } catch (error) {
    res.status(500).json({ message:"Error updating profile" });
  }
};



module.exports = {
  getProfile,
  updateProfile
};