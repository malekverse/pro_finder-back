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
    res.status(500).json({ message:"follow company failed" });
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
    res.status(500).json({ message:"unfollow company failed" });
  }

};


module.exports = {
  followCompany,
  unfollowCompany
};