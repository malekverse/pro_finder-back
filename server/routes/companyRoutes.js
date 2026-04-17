const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");
const checkPermission = require("../middleware/checkPermission");
const upload = require("../config/multer");

router.get("/followers", verifyJWT, authorizeRoles("company", "admin", "owner", "team_member"), companyController.getCompanyFollowers);
router.get("/dashboard", verifyJWT, authorizeRoles("company", "admin", "owner", "team_member"), companyController.getDashboard);

// Tout le monde peut voir le profil public d'une entreprise (visiteurs compris)
router.get("/public/:companyId", companyController.getPublicCompanyProfile);
router.get("/profile", verifyJWT, authorizeRoles("company", "admin", "owner", "team_member"), companyController.getCompanyProfile);
router.put(
  "/updateprofile",
  verifyJWT,
  authorizeRoles("company", "admin", "owner", "team_member"),
  upload.any(),
  companyController.updateCompanyProfile
);
router.get("/users", verifyJWT, authorizeRoles("company", "admin", "owner", "team_member"), companyController.getCompanyUsers);
router.put("/assign-role", verifyJWT, authorizeRoles("company", "admin", "owner", "team_member"), companyController.assignRoleToUser);
router.put("/update-role", verifyJWT, authorizeRoles("company", "admin", "owner", "team_member"), companyController.updateRoleToUser);
router.delete("/delete-role", verifyJWT, authorizeRoles("company", "admin", "owner", "team_member"), companyController.deleteRoleToUser);
router.get("/my-access/:companyId", verifyJWT, companyController.getUserAccessToCompany);
router.get("/services/:serviceId", verifyJWT, authorizeRoles("company", "admin"), companyController.getCompaniesByService);

// ✅ Route suggestions — doit être AVANT module.exports
router.get("/suggested", verifyJWT, companyController.getSuggestedCompanies);

// ✅ Route recherche publique
router.get("/search", companyController.searchCompanies);
router.get("/recommended", companyController.getRecommendedCompanies);

// Gestion des followers (blocage)
router.get("/blocked", verifyJWT, authorizeRoles("company", "admin", "owner", "team_member"), companyController.getBlockedUsers);
router.put("/followers/:followId/block", verifyJWT, checkPermission("block_user"), companyController.toggleBlockFollower);

// Sauvegarde entreprise générée par l'IA
router.post("/ai-create", companyController.createScrapedCompany);
router.get("/claim-preview", companyController.getClaimPreview);
router.post("/claim-profile", companyController.claimCompanyProfile);
router.post("/request-claim/:companyId", companyController.requestClaim);

module.exports = router;