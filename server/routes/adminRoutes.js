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


module.exports = router;