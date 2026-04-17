const fs   = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const SERVER_URL = process.env.SERVER_URL || "http://localhost:5000";

// Récupérer les modèles via mongoose pour éviter les références circulaires
const getModels = () => {
  const mongoose = require("mongoose");
  return {
    Post:         mongoose.model("Post"),
    User:         mongoose.model("User"),
    Company:      mongoose.model("Company"),
    Professional: mongoose.model("Professional"),
    Notification: mongoose.model("Notification"),
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────
const getAuthorType = (roles) => {
  if (roles?.includes("company") || roles?.includes("owner") || roles?.includes("manager")) return "Company";
  if (roles?.includes("professional")) return "Professional";
  return "User";
};

const normalizePath = (p) => p.replace(/\\/g, "/");

// ─── CRÉER UN POST ────────────────────────────────────────────────────────
const createPost = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Veuillez vous connecter pour publier." });
    const { Post } = getModels();
    const { content } = req.body;
    const authorType  = getAuthorType(req.roles);
    const authorId    = (authorType === "Company") ? (req.companyId || req.user) : req.user;

    // Stockage local : f.path est le chemin relatif (ex: uploads/posts/...)
    const imagesPost = req.files ? req.files.filter(f => f.fieldname === 'imagesPost').map((f) => f.path.replace(/\\/g, "/")) : [];

    if (!content && imagesPost.length === 0) {
      return res.status(400).json({ message: "Le post doit contenir du texte ou une image" });
    }

    const post = await Post.create({ author_id: authorId, authorType, content: content || "", imagesPost });
    const populated = await populatePost(post._id);
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ─── OBTENIR TOUS LES POSTS ───────────────────────────────────────────────
const getAllPosts = async (req, res) => {
  try {
    const { Post, Company } = getModels();
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const { country, region, city, category, subCategory, service } = req.query;
    
    let postQuery = { isDeleted: false };
    
    // Si des filtres sont présents, on doit d'abord filtrer les entreprises
    if (country || region || city || category || subCategory || service) {
      let companyQuery = { Status: "active" };
      if (country) companyQuery.country = country;
      if (region) companyQuery.region = region;
      if (city) companyQuery.city = city;
      
      if (service) {
        companyQuery.services = service;
      } else if (subCategory) {
        const Service = mongoose.model("Service");
        const services = await Service.find({ subcategory_id: subCategory }).select("_id");
        companyQuery.services = { $in: services.map(s => s._id) };
      } else if (category) {
        const SubCategory = mongoose.model("SubCategory");
        const Service = mongoose.model("Service");
        const subs = await SubCategory.find({ category_id: category }).select("_id");
        const services = await Service.find({ subcategory_id: { $in: subs.map(s => s._id) } }).select("_id");
        companyQuery.services = { $in: services.map(s => s._id) };
      }

      const { Company, Professional } = getModels();
      const matchingCompanies = await Company.find(companyQuery).select("_id");
      const matchingProfessionals = await Professional.find(companyQuery).select("_id"); // companyQuery works for Professional too as fields names are the same
      
      const actorIds = [...matchingCompanies.map(c => c._id), ...matchingProfessionals.map(p => p._id)];
      
      postQuery.author_id = { $in: actorIds };
      postQuery.authorType = { $in: ["Company", "Professional"] };
    }

    const posts = await Post.find(postQuery).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    const total = await Post.countDocuments(postQuery);
    const populated = await Promise.all(posts.map(populateAuthor));

    res.json({
      posts: populated,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[getAllPosts]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ─── OBTENIR UN POST ──────────────────────────────────────────────────────
const getPost = async (req, res) => {
  try {
    const { Post } = getModels();
    const post = await Post.findOne({ _id: req.params.id, isDeleted: false }).lean();
    if (!post) return res.status(404).json({ message: "Post non trouvé" });
    res.json(await populateAuthor(post));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ─── MODIFIER UN POST ─────────────────────────────────────────────────────
const updatePost = async (req, res) => {
  try {
    const { Post } = getModels();
    const post = await Post.findOne({ _id: req.params.id, isDeleted: false });
    if (!post) return res.status(404).json({ message: "Post non trouvé" });

    const authorId = req.companyId || req.user;
    if (post.author_id.toString() !== authorId.toString()) {
      return res.status(403).json({ message: "Non autorisé" });
    }

    const { content } = req.body;
    const newImages = req.files ? req.files.filter(f => f.fieldname === 'imagesPost').map((f) => f.path.replace(/\\/g, "/")) : [];
    const imagesToDelete = req.body.imagesToDelete ? JSON.parse(req.body.imagesToDelete) : [];

    imagesToDelete.forEach((imgPath) => {
      const fullPath = path.join(__dirname, "..", imgPath.replace(/\//g, path.sep));
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    });

    post.imagesPost = [...post.imagesPost.filter((img) => !imagesToDelete.includes(img)), ...newImages];
    post.content = content ?? post.content;
    await post.save();

    res.json(await populatePost(post._id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ─── SUPPRIMER UN POST ────────────────────────────────────────────────────
const deletePost = async (req, res) => {
  try {
    const { Post } = getModels();
    const post = await Post.findOne({ _id: req.params.id, isDeleted: false });
    if (!post) return res.status(404).json({ message: "Post non trouvé" });

    const authorId = req.companyId || req.user;
    if (post.author_id.toString() !== authorId.toString() && !req.roles?.includes("admin")) {
      return res.status(403).json({ message: "Non autorisé" });
    }

    post.imagesPost.forEach((imgPath) => {
      const fullPath = path.join(__dirname, "..", imgPath.replace(/\//g, path.sep));
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    });

    post.isDeleted = true;
    await post.save();
    res.json({ message: "Post supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ─── LIKER / UNLIKER ──────────────────────────────────────────────────────
const toggleLike = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Veuillez vous connecter pour liker." });
    const { Post } = getModels();
    const post = await Post.findOne({ _id: req.params.id, isDeleted: false });
    if (!post) return res.status(404).json({ message: "Post non trouvé" });

    const userId = req.user;
    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.json({ liked: !alreadyLiked, likesCount: post.likes.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ─── AJOUTER UN COMMENTAIRE ───────────────────────────────────────────────
const addComment = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Veuillez vous connecter pour commenter." });
    const { Post } = getModels();
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Commentaire vide" });

    const post = await Post.findOne({ _id: req.params.id, isDeleted: false });
    if (!post) return res.status(404).json({ message: "Post non trouvé" });

    const authorType = getAuthorType(req.roles);
    // Pour un owner/member, on stocke l'author_id = req.user (user ID)
    // mais on stocke aussi le companyId pour l'affichage
    post.comments.push({
      author_id:  req.user,
      authorType,
      text:       text.trim(),
      companyId:  authorType === "Company" ? (req.companyId || null) : null,
    });
    await post.save();

    // Notification si le post appartient à une entreprise (et que ce n'est pas le manager qui commente son propre post)
    if (post.authorType === "Company" && req.companyId?.toString() !== post.author_id.toString()) {
      const { Notification, User } = getModels();
      const sender = await User.findById(req.user).select("fullName");
      await Notification.create({
        recipient_id: post.author_id,
        recipient_type: "Company",
        sender_id: req.user,
        sender_type: "User",
        type: "comment",
        related_id: post._id,
        message: `${sender?.fullName || "Quelqu'un"} a commenté votre publication.`
      });
    }

    // Retourner le commentaire avec l'auteur populé
    const { User, Company } = getModels();
    const newComment = post.comments[post.comments.length - 1];
    let commentAuthor = null;
    if (authorType === "Company" && req.companyId) {
      // owner/manager → afficher le nom de la company
      const c = await Company.findById(req.companyId).select("companyName logoUrl").lean();
      if (c) commentAuthor = { name: c.companyName, avatarUrl: c.logoUrl ? `${SERVER_URL}/${c.logoUrl}` : null };
    } else if (authorType === "Company" && !req.companyId) {
      // compte company direct → req.user est l'ID company
      const c = await Company.findById(req.user).select("companyName logoUrl").lean();
      if (c) commentAuthor = { name: c.companyName, avatarUrl: c.logoUrl ? `${SERVER_URL}/${c.logoUrl}` : null };
    } else {
      // user normal
      const u = await User.findById(req.user).select("fullName avatarUrl").lean();
      if (u) commentAuthor = { name: u.fullName, avatarUrl: u.avatarUrl ? `${SERVER_URL}/${u.avatarUrl}` : null };
    }
    res.status(201).json({ ...newComment.toObject(), commentAuthor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ─── SUPPRIMER UN COMMENTAIRE ─────────────────────────────────────────────
const deleteComment = async (req, res) => {
  try {
    const { Post } = getModels();
    const post = await Post.findOne({ _id: req.params.id, isDeleted: false });
    if (!post) return res.status(404).json({ message: "Post non trouvé" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Commentaire non trouvé" });

    const isCommentAuthor = comment.author_id.toString() === req.user;
    const isPostAuthor    = post.author_id.toString() === req.user ||
                            post.author_id.toString() === (req.companyId || "");
    const isAdmin         = req.roles?.includes("admin");

    if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
      return res.status(403).json({ message: "Non autorisé" });
    }

    post.comments = post.comments.filter((c) => c._id.toString() !== req.params.commentId);
    await post.save();
    res.json({ message: "Commentaire supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ─── PARTAGER UN POST ─────────────────────────────────────────────────────
const sharePost = async (req, res) => {
  try {
    const { Post } = getModels();
    const post = await Post.findOne({ _id: req.params.id, isDeleted: false });
    if (!post) return res.status(404).json({ message: "Post non trouvé" });

    if (!post.shares.includes(req.user)) {
      post.shares.push(req.user);
      post.sharesCount += 1;
      await post.save();
    }

    res.json({ sharesCount: post.sharesCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ─── MES POSTS ────────────────────────────────────────────────────────────
const getMyPosts = async (req, res) => {
  try {
    const { Post } = getModels();
    const authorId = req.companyId || req.user;

    const posts = await Post.find({ author_id: authorId, isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();

    const populated = await Promise.all(posts.map(populateAuthor));
    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ─── Posts d'une entreprise (page profil type LinkedIn / Facebook) ─────────
const getPostsByCompany = async (req, res) => {
  try {
    const { Post } = getModels();
    const { companyId } = req.params;

    if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ message: "ID entreprise invalide" });
    }

    const page  = parseInt(req.query.page, 10)  || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip  = (page - 1) * limit;

    const query = {
      author_id:  companyId,
      authorType: "Company",
      isDeleted:  false,
    };

    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const populated = await Promise.all(posts.map(populateAuthor));

    res.json({
      posts: populated,
      page,
      totalPages: limit ? Math.ceil(total / limit) : 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ─── HELPERS POPULATE ─────────────────────────────────────────────────────
const populateAuthor = async (post) => {
  const { User, Company } = getModels();
  let author = null;

  if (post.authorType === "Company") {
    const c = await Company.findById(post.author_id).select("companyName logoUrl").lean();
    if (c) author = { name: c.companyName, avatarUrl: c.logoUrl ? `${SERVER_URL}/${c.logoUrl}` : null };
  } else if (post.authorType === "Professional") {
    const { Professional } = getModels();
    const p = await Professional.findById(post.author_id).select("fullName photoProfessional").lean();
    if (p) author = { name: p.fullName, avatarUrl: p.photoProfessional ? `${SERVER_URL}/${p.photoProfessional}` : null };
  } else {
    const u = await User.findById(post.author_id).select("fullName avatarUrl").lean();
    if (u) author = { name: u.fullName, avatarUrl: u.avatarUrl ? `${SERVER_URL}/${u.avatarUrl}` : null };
  }

  // Populer les auteurs des commentaires
  const populatedComments = await Promise.all(
    (post.comments || []).map(async (comment) => {
      let commentAuthor = null;
      if (comment.authorType === "Company") {
        // Si companyId stocké (owner/member), utiliser companyId, sinon author_id (compte company direct)
        const lookupId = comment.companyId || comment.author_id;
        const c = await Company.findById(lookupId).select("companyName logoUrl").lean();
        if (c) commentAuthor = { name: c.companyName, avatarUrl: c.logoUrl ? `${SERVER_URL}/${c.logoUrl}` : null };
        // Fallback : si pas trouvé avec companyId, essayer author_id comme User
        if (!commentAuthor) {
          const u = await User.findById(comment.author_id).select("fullName avatarUrl").lean();
          if (u) commentAuthor = { name: u.fullName, avatarUrl: u.avatarUrl ? `${SERVER_URL}/${u.avatarUrl}` : null };
        }
      } else if (comment.authorType === "Professional") {
        const { Professional } = getModels();
        const p = await Professional.findById(comment.author_id).select("fullName photoProfessional").lean();
        if (p) commentAuthor = { name: p.fullName, avatarUrl: p.photoProfessional ? `${SERVER_URL}/${p.photoProfessional}` : null };
      } else {
        const u = await User.findById(comment.author_id).select("fullName avatarUrl").lean();
        if (u) commentAuthor = { name: u.fullName, avatarUrl: u.avatarUrl ? `${SERVER_URL}/${u.avatarUrl}` : null };
      }
      return { ...comment, commentAuthor };
    })
  );

  return {
    ...post,
    author,
    comments: populatedComments,
    imagesPost: (post.imagesPost || []).map((img) => {
      // Si c'est déjà une URL Cloudinary ou http, la retourner telle quelle
      if (img.startsWith("http")) return img;
      // Sinon construire l'URL locale (anciens posts)
      var clean = img;
      while (clean.indexOf(String.fromCharCode(92)) !== -1) {
        clean = clean.split(String.fromCharCode(92)).join("/");
      }
      var idx = clean.indexOf("uploads/");
      if (idx !== -1) clean = clean.substring(idx);
      return SERVER_URL + "/" + clean;
    }),
    likesCount:    post.likes?.length    || 0,
    commentsCount: post.comments?.length || 0,
  };
};

const populatePost = async (postId) => {
  const { Post } = getModels();
  const post = await Post.findById(postId).lean();
  return populateAuthor(post);
};

module.exports = {
  createPost, getAllPosts, getPost, updatePost, deletePost,
  toggleLike, addComment, deleteComment, sharePost, getMyPosts, getPostsByCompany,
};