const fs = require("fs");
const path = require("path");
const User = require("../models/User");

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {

    const { fullName, phone } = req.body;

    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.file && user.avatarUrl) {
      const oldPath = user.avatarUrl.replace(/\//g, path.sep);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    user.fullName = fullName ?? user.fullName;
    user.phone    = phone    ?? user.phone;

    if (req.file) {
      user.avatarUrl = req.file.path.split(path.sep).join("/");
    }

    const updatedUser = await user.save();

    res.json({
      _id:       updatedUser._id,
      email:     updatedUser.email,
      fullName:  updatedUser.fullName,
      phone:     updatedUser.phone,
      avatarUrl: updatedUser.avatarUrl,
      roles:     updatedUser.roles,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProfile, updateProfile };