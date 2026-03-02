const User = require("../models/User");

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

module.exports = { 
  getDashboard,
  getAllUsers,
  changeUserRole
};  