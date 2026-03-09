const express = require("express");
const router = express.Router();
const cityController = require("../../controllers/localisation/cityController");

router.get("/getCities", cityController.getCities);
router.get("/getCitiesByRegion/:region_id/:countryCode", cityController.getCitiesByRegion);
router.post("/createCity", cityController.createCity);
router.put("/updateCity/:id", cityController.updateCity);
router.get("/getCityById/:id", cityController.getCityById);
router.get("/getCityByName/:name", cityController.getCityByName);



module.exports = router;    