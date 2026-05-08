const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },
    items: [{
      description: String,
      quantity: Number,
      price: Number,
      total: Number,
      entityType: {
        type: String,
        enum: ["Reservation", "Quote", "Order", "Contract"]
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "items.entityType"
      },
      clientPhone: String
    }],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "TND",
    },
    status: {
      type: String,
      enum: ["paid", "pending", "cancelled"],
      default: "paid",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Invoice", invoiceSchema);
