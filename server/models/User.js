const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
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

    fullName: {
      type: String,
    },

    phone: {
      type: String,
    },

    avatarUrl: {
      type: String,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    roles: {
      type: [String],
      default: ["user"]
    },
  },
  {
    timestamps: true, 
  }
);

module.exports = mongoose.model("User", userSchema);