const mongoose = require("mongoose");

const companyServiceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    imagesServices: [{
      type: String,
    }],
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CompanyService", companyServiceSchema);
