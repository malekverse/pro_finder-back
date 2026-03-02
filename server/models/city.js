const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  region: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "Region",
    required: true
  },
  name: { 
    type: String,
     required: true
     }
});
module.exports = mongoose.model('City', citySchema);