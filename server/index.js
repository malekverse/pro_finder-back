// Load environment variables from .env file
require("dotenv").config();
const express = require("express");
const app = express();
const connectDB = require("./config/dbConn");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser")
const cors = require("cors");
const corsOptions = require("./config/CorsOptions");
const PORT = process.env.PORT || 5000;
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
connectDB();

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());


app.use("/users",require("./routes/usersRoutes"));
app.use("/",require("./routes/root"));
app.use("/auth",require("./routes/authRoutes"));
app.use("/profile", require("./routes/profileRoutes"));
app.use("/admin", require("./routes/adminRoutes"));
app.use("/company", require("./routes/companyRoutes"));
app.use("/localisation", require("./routes/localisationRoutes/countryRoutes"));
app.use("/localisation", require("./routes/localisationRoutes/regionRoutes"));
app.use("/localisation", require("./routes/localisationRoutes/cityRoutes"));



mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
  app.listen(PORT, () => {
     console.log(`Server is running on port ${PORT}`);
    });
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err.message);
});




