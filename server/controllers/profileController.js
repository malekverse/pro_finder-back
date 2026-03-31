const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const Company = require("../models/company");
const bcrypt = require("bcrypt");

const getProfile = async (req, res) => {
  try {
    let user = await User.findById(req.user).select("-password");
    if (!user) {
      user = await Company.findById(req.user).select("-password");
    }
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, companyName, phone } = req.body;

    let user = await User.findById(req.user);
    let Model = User;

    if (!user) {
      user = await Company.findById(req.user);
      Model = Company;
    }

    if (!user) return res.status(404).json({ message: "User not found" });

    

    if (Model === User) {
      user.fullName = fullName ?? user.fullName;
    } else {
      user.companyName = companyName ?? user.companyName;
    }
    
    user.phone = phone ?? user.phone;

    if (req.file) {
      user.avatarUrl = req.file.path; // Cloudinary URL
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      email: updatedUser.email,
      fullName: updatedUser.fullName || updatedUser.companyName,
      phone: updatedUser.phone,
      avatarUrl: updatedUser.avatarUrl,
      roles: updatedUser.roles,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Ancien et nouveau mot de passe requis" });
    }

    let user = await User.findById(req.user);
    let Model = User;

    if (!user) {
      user = await Company.findById(req.user);
      Model = Company;
    }

    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "L'ancien mot de passe est incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Mot de passe mis à jour avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProfile, updateProfile, changePassword };