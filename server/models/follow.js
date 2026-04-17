const mongoose = require("mongoose");

const followSchema = new mongoose.Schema(
{
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    default: null
  },

  professional_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Professional",
    default: null
  },

  role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      default: null
    },
    is_blocked: {
      type: Boolean,
      default: false
    }
  },
{ timestamps: true }
);


module.exports = mongoose.model("Follow", followSchema);