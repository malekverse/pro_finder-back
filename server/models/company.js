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
      required: function() { return !this.isGenerated; },
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: function() { return !this.isGenerated; },
    },

    phone: {
      type: String,
      required: function() { return !this.isGenerated; },
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
        ref: "Service"
      }
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
      default: ["company"],
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

module.exports = mongoose.model("Company", companySchema);