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
      required: function() { return !this.isGenerated; },
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
      required: function() { return !this.isGenerated; },
    },
    region: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Region",
      required: function() { return !this.isGenerated; },
    },
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: function() { return !this.isGenerated; },
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
    isGenerated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Professional", professionalSchema);
