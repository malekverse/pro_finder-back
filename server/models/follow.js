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
    required: true
  },

  role_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    default: null
  }
},
{ timestamps: true }
);


module.exports = mongoose.model("Follow", followSchema);