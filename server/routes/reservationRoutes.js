const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservationController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");

router.use(verifyJWT);

// Client
router.post("/create", reservationController.createReservation);
router.get("/my", reservationController.getMyReservations);
router.get("/available-slots", reservationController.getAvailableSlots);

// Company / Team
router.get("/company", authorizeRoles("company", "professional", "admin", "owner", "team_member"), reservationController.getCompanyReservations);
router.put("/update/:reservationId", authorizeRoles("company", "professional", "admin", "owner", "team_member"), reservationController.updateReservationStatus);
router.post("/block", authorizeRoles("company", "professional", "admin", "owner", "team_member"), reservationController.createManualBlock);
router.delete("/block/:id", authorizeRoles("company", "professional", "admin", "owner", "team_member"), reservationController.deleteManualBlock);

module.exports = router;
