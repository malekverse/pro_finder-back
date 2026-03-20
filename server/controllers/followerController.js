const Follow = require("../models/follow");
const User = require("../models/User");
const mongoose = require("mongoose");


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

const getFollowerCount = async (req, res) => {
  try {
    
    const followers = await Follow.countDocuments({ company_id: req.user });
    res.json({ followers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching followers" });
  }
};
const getFollowersStats = async (req, res) => {
  try {
    const stats = await Follow.aggregate([
      {
        $match: {
          company_id: new mongoose.Types.ObjectId(req.user)  // attention à ce que req.user soit company ID
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },  // groupe par mois (1 = Janvier, 12 = Décembre)
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching followers stats" });
  }
};



module.exports = {
  followCompany,
  unfollowCompany,
  getFollowerCount,
  getFollowersStats
};