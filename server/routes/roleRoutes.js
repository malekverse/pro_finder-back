const express = require("express");
const router = express.Router();

const roleController = require("../controllers/roleController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");

router.use(verifyJWT);

router.post("/createRole", authorizeRoles("SuperAdmin","company"), roleController.createRole);
router.get("/getRoles", authorizeRoles("SuperAdmin"), roleController.getRoles);
router.put("/:roleId", authorizeRoles("SuperAdmin"), roleController.updateRole);
router.delete("/:roleId", authorizeRoles("SuperAdmin"), roleController.deleteRole);


module.exports = router;