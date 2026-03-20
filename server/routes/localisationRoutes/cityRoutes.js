const express = require("express");
const router = express.Router();
const cityController = require("../../controllers/localisation/cityController");

router.get("/getCities", cityController.getCities);
router.get("/getCitiesByRegion/:region_id", cityController.getCitiesByRegion);
router.post("/createCity", cityController.createCity);
router.put("/updateCity/:id", cityController.updateCity);
router.get("/getCityById/:id", cityController.getCityById);
router.get("/getCityByName/:name", cityController.getCityByName);
// Ajoutez cette ligne
router.delete("/deleteCity/:id", cityController.deleteCity);


module.exports = router;    