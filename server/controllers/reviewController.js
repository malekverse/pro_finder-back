const Review = require("../models/Review");
const Follow = require("../models/follow");
const User = require("../models/User");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");

// Ajouter un avis
const createReview = async (req, res) => {
  try {
    const { company_id, professional_id, rating, comment } = req.body;
    const user_id = req.user;

    // Check if following
    const queryFollow = company_id ? { user_id, company_id } : { user_id, professional_id };
    const follow = await Follow.findOne(queryFollow);
    
    if (!follow) {
      return res.status(403).json({ message: "Vous devez suivre pour laisser un avis." });
    }

    if (follow.is_blocked) {
      return res.status(403).json({ message: "Vous avez été bloqué par cet utilisateur." });
    }

    const reviewQuery = company_id ? { user_id, company_id } : { user_id, professional_id };
    const review = await Review.findOneAndUpdate(
      reviewQuery,
      { rating, comment },
      { new: true, upsert: true, runValidators: true }
    );

    // Notification
    const providerId = company_id || professional_id;
    const providerType = company_id ? "Company" : "Professional";
    const isSelfReview = company_id ? (req.companyId?.toString() === company_id.toString()) : (req.user.toString() === professional_id.toString());

    if (!isSelfReview) {
      const user = await User.findById(user_id);
      await Notification.create({
        recipient_id: providerId,
        recipient_type: providerType,
        sender_id: user_id,
        sender_type: "User",
        type: "review",
        related_id: review._id,
        message: `${user.fullName} a laissé un avis de ${rating} étoiles.`
      });
    }

    res.status(201).json(review);
  } catch (err) {
    console.error("Create review error:", err);
    res.status(500).json({ message: "Erreur lors de la création de l'avis" });
  }
};

// Récupérer les avis d'une entreprise
const getCompanyReviews = async (req, res) => {
  try {
    const { company_id } = req.params;
    const reviews = await Review.find({ company_id })
      .populate("user_id", "fullName avatarUrl")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des avis" });
  }
};

const getProfessionalReviews = async (req, res) => {
  try {
    const { professional_id } = req.params;
    const reviews = await Review.find({ professional_id })
      .populate("user_id", "fullName avatarUrl")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des avis" });
  }
};

const getProviderReviews = async (req, res) => {
  try {
    const id = req.companyId || req.user;
    const isProfessional = req.roles?.includes("professional");
    const query = isProfessional ? { professional_id: id } : { company_id: id };
    
    const reviews = await Review.find(query)
      .populate("user_id", "fullName avatarUrl")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération de vos avis" });
  }
}

// Supprimer un avis
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user;

    const review = await Review.findOneAndDelete({ _id: id, user_id });
    if (!review) {
      return res.status(404).json({ message: "Avis non trouvé ou non autorisé" });
    }

    res.json({ message: "Avis supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la suppression de l'avis" });
  }
};

// Modifier un avis
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const user_id = req.user;

    const review = await Review.findOneAndUpdate(
      { _id: id, user_id },
      { rating, comment },
      { new: true, runValidators: true }
    );

    if (!review) {
      return res.status(404).json({ message: "Avis non trouvé ou non autorisé" });
    }

    res.json(review);
  } catch (err) {
    console.error("Update review error:", err);
    res.status(500).json({ message: "Erreur lors de la modification de l'avis" });
  }
};

// Récupérer la note moyenne d'une entreprise
const getAverageRating = async (req, res) => {
  try {
    const { company_id } = req.params;
    const stats = await Review.aggregate([
      { $match: { company_id: new mongoose.Types.ObjectId(company_id) } },
      {
        $group: {
          _id: "$company_id",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (stats.length === 0) {
      return res.json({ averageRating: 0, totalReviews: 0 });
    }

    res.json({
      averageRating: stats[0].averageRating.toFixed(1),
      totalReviews: stats[0].totalReviews,
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors du calcul de la note moyenne" });
  }
};

const getProfessionalAverageRating = async (req, res) => {
  try {
    const { professional_id } = req.params;
    const stats = await Review.aggregate([
      { $match: { professional_id: new mongoose.Types.ObjectId(professional_id) } },
      {
        $group: {
          _id: "$professional_id",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (stats.length === 0) {
      return res.json({ averageRating: 0, totalReviews: 0 });
    }

    res.json({
      averageRating: stats[0].averageRating.toFixed(1),
      totalReviews: stats[0].totalReviews,
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors du calcul de la note moyenne" });
  }
};

module.exports = {
  createReview,
  getCompanyReviews,
  getProfessionalReviews,
  getProviderReviews,
  deleteReview,
  updateReview,
  getAverageRating,
  getProfessionalAverageRating
};