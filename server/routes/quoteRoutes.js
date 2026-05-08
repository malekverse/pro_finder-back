const express = require("express");
const router = express.Router();
const quoteController = require("../controllers/quoteController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");
const checkPermission = require("../middleware/checkPermission");

router.use(verifyJWT);

// Routes for Provider (creating, getting all quotes)
router.post("/create", checkPermission("manage_documents"), quoteController.createQuote);
router.post("/request", quoteController.createQuoteRequest);
router.put("/:id", checkPermission("manage_documents"), quoteController.updateQuote);
router.get("/company", checkPermission("manage_documents"), quoteController.getCompanyQuotes);

// Routes for both Company and User (getting user-specific quotes and updating status)
router.get("/user", quoteController.getUserQuotes);
router.put("/:id/status", quoteController.updateQuoteStatus);

module.exports = router;
