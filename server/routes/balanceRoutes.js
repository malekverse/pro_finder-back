const express = require("express");
const router = express.Router();
const balanceController = require("../controllers/balanceController");
const verifyJWT = require("../middleware/verifyJWT");
const checkPermission = require("../middleware/checkPermission");

router.use(verifyJWT);

// Routes pour les revenus et retraits
router.get("/my-balance", checkPermission("manage_sales"), balanceController.getBalance);
router.post("/request-payout", checkPermission("manage_sales"), balanceController.requestPayout);
router.get("/payout-history", checkPermission("manage_sales"), balanceController.getPayoutHistory);

module.exports = router;
