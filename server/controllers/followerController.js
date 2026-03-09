const Follow = require("../models/follow");
const User = require("../models/User");



// suivre une company
const followCompany = async (req, res) => {

  try {

    const { company_id } = req.body;

    const alreadyFollow = await Follow.findOne({
      user_id: req.user,
      company_id
    });

    if (alreadyFollow) {
      return res.status(400).json({ message: "Already following" });
    }

    const follow = await Follow.create({
      user_id: req.user,
      company_id
    });

    res.status(201).json(follow);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }

};


// voir followers d'une company
const getCompanyFollowers = async (req, res) => {

  try {

    const followers = await Follow.find({
      company_id: req.user
    }).populate("user_id", "fullName email");

    res.json(followers);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }

};


// unfollow
const unfollowCompany = async (req, res) => {

  try {

    const { company_id } = req.body;

    const follow = await Follow.findOneAndDelete({
      user_id: req.user,
      company_id
    });

    if (!follow) {
      return res.status(404).json({ message: "Follow not found" });
    }

    res.json({ message: "Unfollowed company" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }

};
const assignRoleToFollower = async (req, res) => {

  try {

    const { user_id, role_id } = req.body;

    const follow = await Follow.findOne({
      user_id,
      company_id: req.user
    });

    if (!follow) {
      return res.status(404).json({ message: "Follower not found" });
    }

    follow.role_id = role_id;

    await follow.save();

    res.json({
      message: "Role assigned successfully"
    });

  } catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

};


module.exports = {
  followCompany,
  getCompanyFollowers,
  unfollowCompany
};