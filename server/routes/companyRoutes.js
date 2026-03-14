const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");

router.get("/followers",verifyJWT,authorizeRoles("company","SuperAdmin"),companyController.getCompanyFollowers);
router.get("/dashboard",verifyJWT,authorizeRoles("company","SuperAdmin"),companyController.getDashboard);
router.get("/profile",verifyJWT,authorizeRoles("company","SuperAdmin"),companyController.getCompanyProfile);
router.put("/updateprofile",verifyJWT,authorizeRoles("company","SuperAdmin"),companyController.updateCompanyProfile);
router.get("/users",verifyJWT,authorizeRoles("company","SuperAdmin"),companyController.getCompanyUsers);
router.put("/assign-role",verifyJWT,authorizeRoles("company","SuperAdmin"),companyController.assignRoleToUser);
router.put("/update-role",verifyJWT,authorizeRoles("company","SuperAdmin"),companyController.updateRoleToUser);
router.delete("/delete-role",verifyJWT,authorizeRoles("company","SuperAdmin"),companyController.deleteRoleToUser);
router.get("/my-access/:companyId", verifyJWT, companyController.getUserAccessToCompany);
router.get("/services/:serviceId",verifyJWT,authorizeRoles("company","SuperAdmin"),companyController.getCompaniesByService);

module.exports = router;