const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");

const adminController = require("../controllers/adminController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");

router.get("/dashboard",verifyJWT,authorizeRoles("admin"),
  adminController.getDashboard
);
router.get("/activities", verifyJWT, authorizeRoles("admin"), adminController.getActivities);
router.put("/change-password", verifyJWT, authorizeRoles("admin"), adminController.changePassword);

router.get("/pending",verifyJWT,authorizeRoles("admin"),adminController.getPendingCompanies);
router.get("/pending-companies",verifyJWT,authorizeRoles("admin"),adminController.getPendingCompanies);
router.put("/verify/:companyId",verifyJWT,authorizeRoles("admin"),adminController.verifyCompany);
router.get("/users",verifyJWT,authorizeRoles("admin"),adminController.getAllUsers);
router.delete("/reject/:companyId", verifyJWT, authorizeRoles("admin"), adminController.rejectCompany);


module.exports = router;

