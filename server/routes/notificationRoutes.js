const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const verifyJWT = require("../middleware/verifyJWT");

// All routes are protected
router.use(verifyJWT);

router.get("/", notificationController.getNotifications);
router.put("/:notificationId/read", notificationController.markAsRead);
router.put("/read-all", notificationController.markAllAsRead);

module.exports = router;
