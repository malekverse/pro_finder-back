const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");

router.get("/my", verifyJWT, invoiceController.getMyInvoices);
router.get("/provider", verifyJWT, authorizeRoles("company", "professional"), invoiceController.getProviderInvoices);

module.exports = router;
