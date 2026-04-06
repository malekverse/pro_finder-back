const Review = require("../models/Review");
const Follow = require("../models/follow");
const User = require("../models/User");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");

// Ajouter un avis
exports.createReview = async (req, res) => {
  try {
    const { company_id, rating, comment } = req.body;
    const user_id = req.user;

    // Vérifier si l'utilisateur suit l'entreprise (ou a déjà interagi, selon le besoin)
    // Ici on vérifie s'il suit l'entreprise
    const follow = await Follow.findOne({ user_id, company_id });
    if (!follow) {
      return res.status(403).json({ message: "Vous devez suivre l'entreprise pour laisser un avis." });
    }

    // Vérifier si l'utilisateur est bloqué
    if (follow.is_blocked) {
      return res.status(403).json({ message: "Vous avez été bloqué par cette entreprise." });
    }

    // Créer ou mettre à jour l'avis (si l'index unique n'est pas suffisant pour la logique applicative)
    const review = await Review.findOneAndUpdate(
      { user_id, company_id },
      { rating, comment },
      { new: true, upsert: true, runValidators: true }
    );

    // Notification (seulement si ce n'est pas sa propre entreprise)
    if (req.companyId?.toString() !== company_id.toString()) {
      const user = await User.findById(user_id);
      await Notification.create({
        recipient_id: company_id,
        recipient_type: "Company",
        sender_id: user_id,
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
exports.getCompanyReviews = async (req, res) => {
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

// Supprimer un avis
exports.deleteReview = async (req, res) => {
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

// Récupérer la note moyenne d'une entreprise
exports.getAverageRating = async (req, res) => {
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
