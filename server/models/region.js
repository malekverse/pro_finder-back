const mongoose = require('mongoose');

const regionSchema = new mongoose.Schema({
  country: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "Country" 
},
  name: { 
    type: String,
    required: true 
}
});

module.exports = mongoose.model('Region', regionSchema);