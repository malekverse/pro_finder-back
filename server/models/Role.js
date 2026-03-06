const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: true
  },

  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  },

  permissions: [
    {
      type: String
    }
  ]
},
{ timestamps: true }
);

module.exports = mongoose.model("Role", roleSchema);