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
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
    },
    // Add fields for service requests
    bookingServiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyService",
      required: false,
    },
    bookingDate: { type: Date, required: false },
    bookingTimeSlot: { type: String, required: false },
    clientPhone: { type: String, required: false },
    clientName: { type: String, required: false },
    clientEmail: { type: String, required: false },
    items: [
      {
        description: { type: String, required: false },
        quantity: { type: Number, required: false, min: 1, default: 1 },
        unitPrice: { type: Number, required: false, min: 0, default: 0 },
        duration: { type: String }, // e.g., "1h", "60 min"
        total: { type: Number, required: false, default: 0 },
      },
    ],
    subTotal: { type: Number, required: false, min: 0, default: 0 },
    taxRate: { type: Number, default: 19 },
    taxAmount: { type: Number, required: false, min: 0, default: 0 },
    totalAmount: { type: Number, required: false, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["draft", "sent", "accepted", "rejected", "expired", "request", "demande envoyée"],
      default: "draft",
    },
    validUntil: {
      type: Date,
      required: false,
    },
    notes: { type: String },
    requiresContract: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quote", quoteSchema);
