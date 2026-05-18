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
      default: null,
    },
    professional_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Professional",
      default: null,
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

// Un utilisateur ne peut laisser qu'un seul avis par entreprise
reviewSchema.index(
  { user_id: 1, company_id: 1 },
  {
    unique: true,
    partialFilterExpression: { company_id: { $type: "objectId" } },
  }
);
// Un utilisateur ne peut laisser qu'un seul avis par professionnel
reviewSchema.index(
  { user_id: 1, professional_id: 1 },
  {
    unique: true,
    partialFilterExpression: { professional_id: { $type: "objectId" } },
  }
);

module.exports = mongoose.model("Review", reviewSchema);
