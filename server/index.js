require("dotenv").config();
const express = require("express");
const app = express();
const connectDB = require("./config/dbConn");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser")
const cors = require("cors");
const corsOptions = require("./config/CorsOptions");
const path = require('path');
const PORT = process.env.PORT || 5000;
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("./models/User");
require("./models/company");
require("./models/Post");
require("./models/Role");
require("./models/follow");
require("./models/Activity");
require("./models/Category");
require("./models/SubCategory");
require("./models/Service");
require("./models/city");
require("./models/country");
require("./models/region");
require("./models/Review");
require("./models/Professional");

connectDB();

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use("/posts", require("./routes/postRoutes"));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/users",require("./routes/usersRoutes"));

app.use("/",require("./routes/root"));

app.use("/auth",require("./routes/authRoutes"));

app.use("/profile", require("./routes/profileRoutes"));

app.use("/admin", require("./routes/adminRoutes"));

app.use("/company", require("./routes/companyRoutes"));
app.use("/professional", require("./routes/professionalRoutes"));
app.use("/products", require("./routes/productRoutes"));
app.use("/company-services", require("./routes/companyServiceRoutes"));
app.use("/reservations", require("./routes/reservationRoutes"));
app.use("/orders", require("./routes/orderRoutes"));

app.use("/localisation", require("./routes/localisationRoutes/countryRoutes"));
app.use("/localisation", require("./routes/localisationRoutes/regionRoutes"));
app.use("/localisation", require("./routes/localisationRoutes/cityRoutes"));

app.use("/roles", require("./routes/roleRoutes"));

app.use("/followers", require("./routes/followerRoutes"));

app.use("/reports", require("./routes/reportRoutes"));
app.use("/reviews", require("./routes/reviewRoutes"));
app.use("/notifications", require("./routes/notificationRoutes"));
app.use("/quotes", require("./routes/quoteRoutes"));
app.use("/contracts", require("./routes/contractRoutes"));

app.use("/categories", require("./routes/categoriesRoutes/subCategoryRoutes"));
app.use("/categories", require("./routes/categoriesRoutes/serviceRoutes"));
app.use("/categories", require("./routes/categoriesRoutes/categoryRoutes"));




mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
  app.listen(PORT, () => {
     console.log(`Server is running on port ${PORT}`);
    });
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err.message);
});