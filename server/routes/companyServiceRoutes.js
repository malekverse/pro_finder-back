const express = require("express");
const router = express.Router();
const companyServiceController = require("../controllers/companyServiceController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");
const upload = require("../config/multer");

// Toutes les routes de gestion exigent d'être authentifié en tant qu'entreprise/admin/owner
router.post(
  "/create",
  verifyJWT,
  authorizeRoles("company", "admin", "owner"),
  upload.any(),
  companyServiceController.createService
);

router.get("/company/:companyId", companyServiceController.getCompanyServices);

router.put(
  "/update/:id",
  verifyJWT,
  authorizeRoles("company", "admin", "owner"),
  upload.any(),
  companyServiceController.updateService
);

router.delete(
  "/delete/:id",
  verifyJWT,
  authorizeRoles("company", "admin", "owner"),
  companyServiceController.deleteService
);

router.get("/all", companyServiceController.getAllServices);
router.get("/followed", verifyJWT, companyServiceController.getFollowedServices);

module.exports = router;