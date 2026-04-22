const express = require("express");
const router = express.Router();
const professionalController = require("../controllers/professionalController");
const companyController = require("../controllers/companyController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");
const upload = require("../config/multer");

router.get("/dashboard", verifyJWT, authorizeRoles("professional", "admin"), professionalController.getDashboard);
router.get("/profile", verifyJWT, authorizeRoles("professional", "admin"), professionalController.getProfessionalProfile);
router.get("/followers", verifyJWT, authorizeRoles("professional", "admin"), professionalController.getProfessionalFollowers);
router.get("/blocked", verifyJWT, authorizeRoles("professional", "admin"), companyController.getBlockedUsers);
router.put("/followers/:followId/block", verifyJWT, authorizeRoles("professional", "admin"), companyController.toggleBlockFollower);

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

// Sauvegarde professionnel généré par l'IA
router.post("/ai-create", professionalController.createScrapedProfessional);

module.exports = router;
