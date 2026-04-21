const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  subcategory_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubCategory",
    required: true
  },
  status: {
    type: String,
    enum: ["Actif", "Inactif"],
    default: "Actif"
  }

}, { timestamps: true });

module.exports = mongoose.model("Service", serviceSchema);