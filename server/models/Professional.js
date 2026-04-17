const mongoose = require("mongoose");

const professionalSchema = new mongoose.Schema(
  {
    fullName: {
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

    description: {
      type: String,
    },

    website: {
      type: String,
    },

    photoProfessional: {
      type: String,
    },

    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: true,
    },
    region: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Region",
      required: true,
    },
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: true,
    },

    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],

    Status: {
      type: String,
      default: "pending",
    },
    rejectionReason: {
      type: String,
    },

    roles: {
      type: [String],
      default: ["professional"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Professional", professionalSchema);
