const express = require("express");
const router = express.Router();
const regionController = require("../../controllers/localisation/regionController");
const verifyJWT = require("../../middleware/verifyJWT");
const authorizeRoles = require("../../middleware/authorizeRoles");

router.get("/getRegionsByCountry/:country_id", regionController.getRegionsByCountry);
router.get("/getRegions", regionController.getRegions);
router.post("/createRegion", verifyJWT, authorizeRoles("admin"), regionController.createRegion);
router.put("/updateRegion/:id", verifyJWT, authorizeRoles("admin"), regionController.updateRegion);
router.get("/getRegionByName/:name", regionController.getRegionByName);
router.get("/getRegionById/:id", regionController.getRegionById);
router.delete("/deleteRegion/:id", verifyJWT, authorizeRoles("admin"), regionController.deleteRegion);
module.exports = router;
