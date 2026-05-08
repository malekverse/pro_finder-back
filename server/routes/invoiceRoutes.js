const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");
const checkPermission = require("../middleware/checkPermission");

router.get("/my", verifyJWT, invoiceController.getMyInvoices);
router.get("/provider", verifyJWT, checkPermission("manage_documents"), invoiceController.getProviderInvoices);

module.exports = router;
