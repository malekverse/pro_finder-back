const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservationController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");

router.use(verifyJWT);

// Client
router.post("/create", reservationController.createReservation);
router.get("/my", reservationController.getMyReservations);

// Company / Team
router.get("/company", authorizeRoles("company", "admin", "owner", "team_member"), reservationController.getCompanyReservations);
router.put("/update/:reservationId", authorizeRoles("company", "admin", "owner", "team_member"), reservationController.updateReservationStatus);

module.exports = router;
