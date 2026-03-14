const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");

const adminController = require("../controllers/adminController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");

router.get("/dashboard",verifyJWT,authorizeRoles("SuperAdmin"),adminController.getDashboard);

router.get("/dashboard",verifyJWT,authorizeRoles("company","SuperAdmin"),companyController.getDashboard);
router.get("/profile",verifyJWT,authorizeRoles("company","SuperAdmin"),companyController.getCompanyProfile);
router.put("/profile",verifyJWT,authorizeRoles("company","SuperAdmin"),companyController.updateCompanyProfile);


module.exports = router;