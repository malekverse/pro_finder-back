const express = require("express");
const router = express.Router();
const regionController = require("../../controllers/localisation/regionController");

router.get("/getRegionsByCountry/:countryCode", regionController.getRegionsByCountry);
router.get("/getRegions", regionController.getRegions);
router.post("/createRegion", regionController.createRegion);
router.put("/updateRegion/:id", regionController.updateRegion);
router.get("/getRegionByName/:name", regionController.getRegionByName);
router.get("/getRegionById/:id", regionController.getRegionById);

module.exports = router;
