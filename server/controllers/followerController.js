const Follow = require("../models/follow");
const User = require("../models/User");
const mongoose = require("mongoose");

// suivre une company
const followCompany = async (req, res) => {
  try {
      console.log("BODY:", req.body);      // ← ajoute ça
  console.log("USER:", req.user);
    const { company_id } = req.body;
    const alreadyFollow = await Follow.findOne({ user_id: req.user, company_id });
    if (alreadyFollow) return res.status(400).json({ message: "Already following" });
    const follow = await Follow.create({ user_id: req.user, company_id });
    res.status(201).json(follow);
  } catch (err) {
    res.status(500).json({ message: "follow company failed" });
  }
};

// unfollow
const unfollowCompany = async (req, res) => {
  try {
    const { company_id } = req.body;
    const follow = await Follow.findOneAndDelete({ user_id: req.user, company_id });
    if (!follow) return res.status(404).json({ message: "Follow not found" });
    res.json({ message: "Unfollowed company" });
  } catch (err) {
    res.status(500).json({ message: "unfollow company failed" });
  }
};

const getFollowerCount = async (req, res) => {
  try {
    const idToUse = req.companyId || req.user;
    const followers = await Follow.countDocuments({ company_id: idToUse });
    res.json({ followers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching followers" });
  }
};

const getFollowersStats = async (req, res) => {
  try {
    const Post = mongoose.model("Post");
    const idToUse = req.companyId || req.user;
    const companyId = new mongoose.Types.ObjectId(idToUse);

    // Stats des followers par mois
    const monthlyStats = await Follow.aggregate([
      { $match: { company_id: companyId } },
      { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Stats des posts par mois
    const monthlyPostStats = await Post.aggregate([
      { $match: { author_id: companyId, authorType: "Company", isDeleted: false } },
      { $group: { _id: { $month: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Stats de l'engagement (likes + comments) par mois
    const monthlyEngagementStats = await Post.aggregate([
      { $match: { author_id: companyId, authorType: "Company", isDeleted: false } },
      { 
        $group: { 
          _id: { $month: "$createdAt" }, 
          likes: { $sum: { $size: "$likes" } },
          comments: { $sum: { $size: "$comments" } }
        } 
      },
      { $sort: { _id: 1 } }
    ]);

    const totalFollowers = await Follow.countDocuments({ company_id: companyId });
    const teamMembers = await Follow.countDocuments({ company_id: companyId, role_id: { $ne: null } });
    const totalPosts = await Post.countDocuments({ author_id: companyId, authorType: "Company", isDeleted: false });
    
    // Calcul du total des likes et commentaires
    const posts = await Post.find({ author_id: companyId, authorType: "Company", isDeleted: false });
    const totalLikes = posts.reduce((acc, p) => acc + (p.likes?.length || 0), 0);
    const totalComments = posts.reduce((acc, p) => acc + (p.comments?.length || 0), 0);

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newFollowersThisMonth = await Follow.countDocuments({
      company_id: companyId,
      createdAt: { $gte: firstDayOfMonth }
    });

    res.json({
      monthlyStats, 
      monthlyPostStats,
      monthlyEngagementStats,
      totalFollowers, 
      teamMembers, 
      totalPosts,
      totalLikes,
      totalComments,
      newFollowersThisMonth,
      retentionRate: totalFollowers > 0 ? ((teamMembers / totalFollowers) * 100).toFixed(1) : 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching followers stats" });
  }
};

// ── NOUVEAU : feed des posts des companies suivies ────────────────────────
const getFollowedFeed = async (req, res) => {
  try {
    const Post    = mongoose.model("Post");
    const Company = mongoose.model("Company");
    const UserM   = mongoose.model("User");

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    if (!req.user) {
      return res.status(401).json({ message: "Utilisateur non identifié" });
    }

    // 1. Companies suivies par l'user
    const userId = new mongoose.Types.ObjectId(req.user);
    const follows = await Follow.find({ user_id: userId }).lean();
    
    // On récupère aussi les IDs des compagnies dont l'utilisateur est membre (owner/manager)
    // pour qu'il voie aussi les posts de sa propre entreprise dans son feed
    const companyIds = follows.map((f) => f.company_id);
    
    if (req.companyId) {
      const myCompanyId = new mongoose.Types.ObjectId(req.companyId);
      if (!companyIds.some(id => id.toString() === myCompanyId.toString())) {
        companyIds.push(myCompanyId);
      }
    }



    if (companyIds.length === 0) {
      return res.json({ posts: [], page, totalPages: 0 });
    }

    // 2. Posts de ces companies
    const query = {
      author_id: { $in: companyIds }, 
      authorType: "Company", 
      isDeleted: false,
    };

    const total = await Post.countDocuments(query);

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();


    // 3. Populate auteurs
    const populated = await Promise.all(posts.map(async (post) => {
      let author = null;
      try {
        const c = await Company.findById(post.author_id).select("companyName logoUrl").lean();
        author = c ? { name: c.companyName, avatarUrl: c.logoUrl || null } : { name: "Entreprise inconnue", avatarUrl: null };
      } catch (e) {
        author = { name: "Erreur chargement", avatarUrl: null };
      }

      const populatedComments = await Promise.all((post.comments || []).map(async (comment) => {
        let commentAuthor = null;
        try {
          if (comment.authorType === "Company") {
            const cc = await Company.findById(comment.companyId || comment.author_id)
              .select("companyName logoUrl").lean();
            if (cc) commentAuthor = { name: cc.companyName, avatarUrl: cc.logoUrl || null };
          } else {
            const u = await UserM.findById(comment.author_id).select("fullName avatarUrl").lean();
            if (u) commentAuthor = { name: u.fullName, avatarUrl: u.avatarUrl || null };
          }
        } catch (e) {
          console.error("Error populating comment author", e);
        }
        return { ...comment, commentAuthor: commentAuthor || { name: "Utilisateur", avatarUrl: null } };
      }));

      return {
        ...post,
        author,
        comments: populatedComments,
        images: (post.images || []).map((img) => {
          if (!img) return null;
          if (img.startsWith("http")) return img;
          const cleanImg = img.replace(/\\/g, "/").replace(/^\/+/, "");
          return `${process.env.SERVER_URL || "http://localhost:5000"}/${cleanImg}`;
        }).filter(Boolean),
        likesCount:    post.likes?.length    || 0,
        commentsCount: post.comments?.length || 0,
      };
    }));

    res.json({ posts: populated, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const checkFollowStatus = async (req, res) => {
  try {
    const { companyId } = req.params;
    const follow = await Follow.findOne({ user_id: req.user, company_id: companyId });
    res.json({ isFollowing: !!follow });
  } catch (err) {
    res.status(500).json({ message: "Error checking follow status" });
  }
};

module.exports = {
  followCompany,
  unfollowCompany,
  getFollowerCount,
  getFollowersStats,
  getFollowedFeed,
  checkFollowStatus,
};