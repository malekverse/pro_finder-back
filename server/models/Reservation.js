const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
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
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyService",
      required: false,
    },
    date: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String, // format "HH:mm"
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "paid", "cancelled", "completed", "blocked"],
      default: "pending",
    },
    isManualBlock: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String,
      trim: true,
    },
    adminNotes: {
      type: String,
      trim: true,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Reservation", reservationSchema);
