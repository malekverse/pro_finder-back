const mongoose = require('mongoose');

const regionSchema = new mongoose.Schema({
    name: { 
    type: String,
    required: true 
},
  country: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "Country",
    required: true
  }

});

module.exports = mongoose.model('Region', regionSchema);
