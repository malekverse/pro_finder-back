const mongoose = require("mongoose");

const contractSchema = new mongoose.Schema(
  {
    contractNumber: {
      type: String,
      required: true,
      unique: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: false,
    },
    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Professional",
      required: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quoteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quote",
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    totalValue: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending_signature", "signed", "active", "completed", "terminated"],
      default: "pending_signature",
    },
    signatureDate: {
      type: Date,
    },
    terms: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contract", contractSchema);
