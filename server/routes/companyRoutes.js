const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");
const checkPermission = require("../middleware/checkPermission");
const upload = require("../config/multer");

router.get("/followers", verifyJWT, checkPermission("manage_access"), companyController.getCompanyFollowers);
router.get("/dashboard", verifyJWT, companyController.getDashboard);

// Tout le monde peut voir le profil public d'une entreprise (visiteurs compris)
router.get("/public/:companyId", companyController.getPublicCompanyProfile);
router.get("/profile", verifyJWT, companyController.getCompanyProfile);
router.put(
  "/updateprofile",
  verifyJWT,
  checkPermission("manage_catalog"),
  upload.any(),
  companyController.updateCompanyProfile
);
router.get("/users", verifyJWT, checkPermission("manage_access"), companyController.getCompanyUsers);
router.put("/assign-role", verifyJWT, checkPermission("manage_access"), companyController.assignRoleToUser);
router.put("/update-role", verifyJWT, checkPermission("manage_access"), companyController.updateRoleToUser);
router.delete("/delete-role", verifyJWT, checkPermission("manage_access"), companyController.deleteRoleToUser);
router.get("/my-access/:companyId", verifyJWT, companyController.getUserAccessToCompany);
router.get("/services/:serviceId", verifyJWT, companyController.getCompaniesByService);

// ✅ Route suggestions — doit être AVANT module.exports
router.get("/suggested", verifyJWT, companyController.getSuggestedCompanies);

// ✅ Route recherche publique
router.get("/search", companyController.searchCompanies);
router.get("/recommended", companyController.getRecommendedCompanies);

// Gestion des followers (blocage)
router.get("/blocked", verifyJWT, checkPermission("manage_access"), companyController.getBlockedUsers);
router.put("/followers/:followId/block", verifyJWT, checkPermission("manage_access"), companyController.toggleBlockFollower);

// Sauvegarde entreprise générée par l'IA
router.post("/ai-create", companyController.createScrapedCompany);
router.get("/claim-preview", companyController.getClaimPreview);
router.post("/claim-profile", companyController.claimCompanyProfile);
router.post("/request-claim/:companyId", companyController.requestClaim);

module.exports = router;