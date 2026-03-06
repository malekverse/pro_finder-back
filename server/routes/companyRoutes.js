const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");

router.get("/dashboard",verifyJWT,authorizeRoles("company","admin"),companyController.getDashboard);
router.get("/profile",verifyJWT,authorizeRoles("company","admin"),companyController.getCompanyProfile);
router.put("/profile",verifyJWT,authorizeRoles("company","admin"),companyController.updateCompanyProfile);
router.get("/users",verifyJWT,authorizeRoles("company","admin"),companyController.getCompanyUsers);
router.put("/assign-role",verifyJWT,authorizeRoles("company","admin"),companyController.assignRoleToUser);


module.exports = router;