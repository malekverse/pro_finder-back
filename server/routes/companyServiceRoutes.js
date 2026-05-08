const express = require("express");
const router = express.Router();
const companyServiceController = require("../controllers/companyServiceController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");
const checkPermission = require("../middleware/checkPermission");
const upload = require("../config/multer");

// Toutes les routes de gestion exigent d'être authentifié et d'avoir la permission
router.post(
  "/create",
  verifyJWT,
  checkPermission("manage_catalog"),
  upload.any(),
  companyServiceController.createService
);

router.get("/company/:companyId", companyServiceController.getCompanyServices);

router.put(
  "/update/:id",
  verifyJWT,
  checkPermission("manage_catalog"),
  upload.any(),
  companyServiceController.updateService
);

router.delete(
  "/delete/:id",
  verifyJWT,
  checkPermission("manage_catalog"),
  companyServiceController.deleteService
);

router.get("/all", companyServiceController.getAllServices);
router.get("/followed", verifyJWT, companyServiceController.getFollowedServices);

module.exports = router;