const User = require("../models/User");

// GET profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE profile
const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, avatarUrl } = req.body;

    const user = await User.findById(req.user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.fullName = fullName ?? user.fullName;
    user.phone = phone ?? user.phone;
    user.avatarUrl = avatarUrl ?? user.avatarUrl;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      phone: updatedUser.phone,
      avatarUrl: updatedUser.avatarUrl,
      roles: updatedUser.roles,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
    getProfile,
    updateProfile };