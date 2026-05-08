const mongoose = require('mongoose');
const Contract = require('./models/Contract');
const Quote = require('./models/Quote');
require('dotenv').config();

mongoose.connect(process.env.DataBaseURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected to DB');
    const cResult = await Contract.updateMany({ status: { $in: ['signed', 'active'] } }, { $set: { isPaid: true } });
    console.log(`Contracts updated: ${cResult.modifiedCount}`);
    
    const qResult = await Quote.updateMany({ status: 'accepted', requiresContract: false }, { $set: { isPaid: true } });
    console.log(`Quotes updated: ${qResult.modifiedCount}`);
    
    mongoose.disconnect();
  })
  .catch(err => console.error(err));
