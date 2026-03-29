const express = require("express");
const router = express.Router();
const serviceController = require("../../controllers/Categories/serviceController");
const verifyJWT = require("../../middleware/verifyJWT");
const authorizeRoles = require("../../middleware/authorizeRoles");

router.get("/services", serviceController.getServices);
router.get("/services/:subCategoryId", serviceController.getServicesBySubCategory);
router.post("/createService", verifyJWT, authorizeRoles("admin"), serviceController.createService);
router.put("/updateService/:id", verifyJWT, authorizeRoles("admin"), serviceController.updateService);
router.delete("/deleteService/:id", verifyJWT, authorizeRoles("admin"), serviceController.deleteService);

module.exports=router;
