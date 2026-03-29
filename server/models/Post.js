const mongoose = require("mongoose");

// ── Schéma commentaire ────────────────────────────────────────────────────
const commentSchema = new mongoose.Schema(
  {
    author_id:  { type: mongoose.Schema.Types.ObjectId, required: true },
    authorType: { type: String, enum: ["User", "Company"], required: true },
    text:       { type: String, required: true, trim: true },
    companyId:  { type: mongoose.Schema.Types.ObjectId, default: null }, // pour owner/member
  },
  { timestamps: true }
);

// ── Schéma post ───────────────────────────────────────────────────────────
const postSchema = new mongoose.Schema(
  {
    author_id:  { type: mongoose.Schema.Types.ObjectId, required: true },
    authorType: { type: String, enum: ["User", "Company"], required: true },

    content: { type: String, trim: true, default: "" },

    // ✅ Tableau de chemins d'images (pas de limite)
    images: [{ type: String }],

    // ✅ Likes — tableau d'IDs
    likes: [{ type: mongoose.Schema.Types.ObjectId }],

    // ✅ Commentaires
    comments: [commentSchema],

    // ✅ Partages
    sharesCount: { type: Number, default: 0 },
    shares: [{ type: mongoose.Schema.Types.ObjectId }],

    // ✅ Soft delete (ne supprime pas vraiment de la DB)
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);