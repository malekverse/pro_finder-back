const express = require("express");
const router = express.Router();

const roleController = require("../controllers/roleController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");

router.use(verifyJWT);

router.post("/createRole", authorizeRoles("admin"), roleController.createRole);
router.get("/getRoles", authorizeRoles("admin"), roleController.getRoles);
router.put("/:roleId", authorizeRoles("admin"), roleController.updateRole);
router.delete("/:roleId", authorizeRoles("admin"), roleController.deleteRole);

module.exports = router;