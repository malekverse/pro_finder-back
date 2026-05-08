const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservationController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");
const checkPermission = require("../middleware/checkPermission");

router.use(verifyJWT);

// Client
router.post("/create", reservationController.createReservation);
router.get("/my", reservationController.getMyReservations);
router.get("/available-slots", reservationController.getAvailableSlots);

// Company / Team
router.get("/company", checkPermission("manage_sales"), reservationController.getCompanyReservations);
router.put("/update/:reservationId", checkPermission("manage_sales"), reservationController.updateReservationStatus);
router.post("/block", checkPermission("manage_sales"), reservationController.createManualBlock);
router.delete("/block/:id", checkPermission("manage_sales"), reservationController.deleteManualBlock);

module.exports = router;
