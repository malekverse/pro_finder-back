const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["professional", "company"],
    required: true
  },
  status: {
    type: String,
    enum: ["Actif", "Inactif"],
    default: "Actif"
  }
}, { timestamps: true });

module.exports = mongoose.model("Category", categorySchema);