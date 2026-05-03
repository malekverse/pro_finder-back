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

}, { timestamps: true });

module.exports = mongoose.model("Service", serviceSchema);