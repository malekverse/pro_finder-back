const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema(
  {
    quoteNumber: {
      type: String,
      required: true,
      unique: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
    },
    items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true },
      },
    ],
    subTotal: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 19 },
    taxAmount: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["draft", "sent", "accepted", "rejected", "expired"],
      default: "draft",
    },
    validUntil: {
      type: Date,
      required: true,
    },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quote", quoteSchema);
