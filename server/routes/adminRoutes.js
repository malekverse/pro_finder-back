const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");

const adminController = require("../controllers/adminController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");

router.get("/dashboard",verifyJWT,authorizeRoles("admin"),
  adminController.getDashboard
);

router.get("/dashboard",verifyJWT,authorizeRoles("company","admin"),companyController.getDashboard);
router.get("/profile",verifyJWT,authorizeRoles("company","admin"),companyController.getCompanyProfile);
router.put("/profile",verifyJWT,authorizeRoles("company","admin"),companyController.updateCompanyProfile);
router.get("/pending",verifyJWT,authorizeRoles("admin"),adminController.getPendingCompanies);
router.put("/verify/:companyId",verifyJWT,authorizeRoles("admin"),adminController.verifyCompany);
router.get("/users",verifyJWT,authorizeRoles("admin"),adminController.getAllUsers);
router.delete("/reject/:companyId", verifyJWT, authorizeRoles("admin"), adminController.rejectCompany);


module.exports = router;

