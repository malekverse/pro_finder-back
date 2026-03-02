const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DataBaseURL);

  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
};

module.exports = connectDB;