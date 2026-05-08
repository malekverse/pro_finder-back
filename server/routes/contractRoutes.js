const express = require("express");
const router = express.Router();
const contractController = require("../controllers/contractController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");
const checkPermission = require("../middleware/checkPermission");

router.use(verifyJWT);

// Routes for Provider (creating, getting all contracts)
router.post("/create", checkPermission("manage_documents"), contractController.createContract);
router.get("/company", checkPermission("manage_documents"), contractController.getCompanyContracts);

// Routes for both Company and User (getting user-specific contracts and updating status)
router.get("/user", contractController.getUserContracts);
router.put("/:id/status", contractController.updateContractStatus);

module.exports = router;
