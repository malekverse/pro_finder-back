const express = require("express");
const router = express.Router();
const professionalController = require("../controllers/professionalController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");
const upload = require("../config/multer");

router.get("/dashboard", verifyJWT, authorizeRoles("professional", "admin"), professionalController.getDashboard);
router.get("/profile", verifyJWT, authorizeRoles("professional", "admin"), professionalController.getProfessionalProfile);

// Tout le monde peut voir le profil public d'un professionnel
router.get("/public/:professionalId", professionalController.getPublicProfessionalProfile);

router.put(
  "/updateprofile",
  verifyJWT,
  authorizeRoles("professional", "admin"),
  upload.any(),
  professionalController.updateProfessionalProfile
);

// Recherche publique
router.get("/search", professionalController.searchProfessionals);
router.get("/recommended", professionalController.getRecommendedProfessionals);

// Suggestions (auth)
router.get("/suggested", verifyJWT, professionalController.getSuggestedProfessionals);

module.exports = router;
