const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// S'assurer qu'un utilisateur ne peut laisser qu'un seul avis par entreprise
reviewSchema.index({ user_id: 1, company_id: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
