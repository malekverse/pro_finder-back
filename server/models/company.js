const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    companyName : {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    website: {
      type: String,
    },

    description: {
      type: String,
    },

    logoUrl: {
      type: String,
    },

    coverUrl: {
      type: String,
    },

    roles: {
      type: [String],
      default: ["company"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Company", companySchema);