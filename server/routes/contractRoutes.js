const express = require("express");
const router = express.Router();
const contractController = require("../controllers/contractController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");

router.use(verifyJWT);

// Routes for Provider (creating, getting all contracts)
router.post("/create", authorizeRoles("company", "owner", "manager", "professional"), contractController.createContract);
router.get("/company", authorizeRoles("company", "owner", "manager", "professional"), contractController.getCompanyContracts);

// Routes for both Company and User (getting user-specific contracts and updating status)
router.get("/user", contractController.getUserContracts);
router.put("/:id/status", contractController.updateContractStatus);

module.exports = router;
