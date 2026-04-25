const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const verifyJWT = require("../middleware/verifyJWT");

// PUBLIC routes (used by Flouci redirect or feedback pages)
router.get("/verify/:payment_id", paymentController.verifyPayment);

// PROTECTED routes
router.use(verifyJWT);
router.post("/initialize", paymentController.initializePayment);
router.get("/my-payments", paymentController.getMyPayments);
router.get("/provider-payments", paymentController.getProviderPayments);

module.exports = router;
