const express = require("express");
const router = express.Router();
const quoteController = require("../controllers/quoteController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");

router.use(verifyJWT);

// Routes for Provider (creating, getting all quotes)
router.post("/create", authorizeRoles("company", "owner", "manager", "professional"), quoteController.createQuote);
router.get("/company", authorizeRoles("company", "owner", "manager", "professional"), quoteController.getCompanyQuotes);

// Routes for both Company and User (getting user-specific quotes and updating status)
router.get("/user", quoteController.getUserQuotes);
router.put("/:id/status", quoteController.updateQuoteStatus);

module.exports = router;
