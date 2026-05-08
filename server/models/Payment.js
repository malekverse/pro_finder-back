const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
    },
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
    items: [{
      entityType: {
        type: String,
        enum: ["Reservation", "Quote", "Order", "Contract"],
        required: true
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "items.entityType"
      },
      amount: {
        type: Number,
        required: true
      }
    }],
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
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      default: "flouci",
    },
    flouciPaymentId: {
      type: String,
    },
    developerTrackingId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payment", paymentSchema);
