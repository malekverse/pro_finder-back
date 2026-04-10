const express = require("express");
const router = express.Router();
const quoteController = require("../controllers/quoteController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");

router.use(verifyJWT);

// Routes for Company (creating, getting all company quotes)
router.post("/create", authorizeRoles("company", "owner", "manager"), quoteController.createQuote);
router.get("/company", authorizeRoles("company", "owner", "manager"), quoteController.getCompanyQuotes);

// Routes for both Company and User (getting user-specific quotes and updating status)
router.get("/user", quoteController.getUserQuotes);
router.put("/:id/status", quoteController.updateQuoteStatus);

module.exports = router;
