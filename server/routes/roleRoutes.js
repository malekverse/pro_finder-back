const express = require("express");
const router = express.Router();

const roleController = require("../controllers/roleController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");
const checkIfOwner = require("../middleware/checkIfOwner");
const checkPermission = require("../middleware/checkPermission");

router.use(verifyJWT);

// Seul l'admin de la plateforme peut CRÉER, MODIFIER ou SUPPRIMER des rôles
router.post("/createRole", authorizeRoles("admin"), roleController.createRole);
router.put("/:roleId", authorizeRoles("admin"), roleController.updateRole);
router.delete("/:roleId", authorizeRoles("admin"), roleController.deleteRole);

// L'admin, l'owner et la compagnie peuvent VOIR les rôles pour les assigner
router.get("/getRoles", checkPermission("manage_access"), roleController.getRoles);


module.exports = router;