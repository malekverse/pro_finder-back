const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");
const upload = require("../config/cloudinary").upload;

router.get("/followers", verifyJWT, authorizeRoles("company", "admin", "owner"), companyController.getCompanyFollowers);
router.get("/dashboard", verifyJWT, authorizeRoles("company", "admin", "owner"), companyController.getDashboard);

// Tout utilisateur connecté peut voir le profil public d'une entreprise (fil d'actualité)
router.get("/public/:companyId", verifyJWT, companyController.getPublicCompanyProfile);
router.get("/profile", verifyJWT, authorizeRoles("company", "admin", "owner"), companyController.getCompanyProfile);
router.put(
  "/updateprofile",
  verifyJWT,
  authorizeRoles("company", "admin", "owner"),
  upload.fields([{ name: "logo", maxCount: 1 }, { name: "cover", maxCount: 1 }]),
  companyController.updateCompanyProfile
);
router.get("/users", verifyJWT, authorizeRoles("company", "admin", "owner"), companyController.getCompanyUsers);
router.put("/assign-role", verifyJWT, authorizeRoles("company", "admin", "owner"), companyController.assignRoleToUser);
router.put("/update-role", verifyJWT, authorizeRoles("company", "admin", "owner"), companyController.updateRoleToUser);
router.delete("/delete-role", verifyJWT, authorizeRoles("company", "admin", "owner"), companyController.deleteRoleToUser);
router.get("/my-access/:companyId", verifyJWT, companyController.getUserAccessToCompany);
router.get("/services/:serviceId", verifyJWT, authorizeRoles("company", "admin"), companyController.getCompaniesByService);

// ✅ Route suggestions — doit être AVANT module.exports
router.get("/suggested", verifyJWT, companyController.getSuggestedCompanies);

// ✅ Route recherche publique
router.get("/search", companyController.searchCompanies);

module.exports = router;