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
  upload.fields([{ name: "images", maxCount: 5 }]),
  companyServiceController.createService
);

router.get("/company/:companyId", companyServiceController.getCompanyServices);

router.put(
  "/update/:id",
  verifyJWT,
  authorizeRoles("company", "admin", "owner"),
  upload.fields([{ name: "images", maxCount: 5 }]),
  companyServiceController.updateService
);

router.delete(
  "/delete/:id",
  verifyJWT,
  authorizeRoles("company", "admin", "owner"),
  companyServiceController.deleteService
);

router.get("/all", companyServiceController.getAllServices);

module.exports = router;
