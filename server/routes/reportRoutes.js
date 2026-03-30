const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");

// Client-side: Report a company
router.post("/create", verifyJWT, reportController.createReport);

// Admin-side: Manage reports
router.get("/all", verifyJWT, authorizeRoles("admin"), reportController.getAllReports);
router.put("/update/:reportId", verifyJWT, authorizeRoles("admin"), reportController.updateReportStatus);

module.exports = router;
