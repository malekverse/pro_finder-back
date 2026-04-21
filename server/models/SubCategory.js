const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  },
  status: {
    type: String,
    enum: ["Actif", "Inactif"],
    default: "Actif"
  }

}, { timestamps: true });

module.exports = mongoose.model("SubCategory", subCategorySchema);