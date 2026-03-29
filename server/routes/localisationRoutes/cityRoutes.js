const express = require("express");
const router = express.Router();
const cityController = require("../../controllers/localisation/cityController");
const verifyJWT = require("../../middleware/verifyJWT");
const authorizeRoles = require("../../middleware/authorizeRoles");

router.get("/getCities", cityController.getCities);
router.get("/getCitiesByRegion/:region_id", cityController.getCitiesByRegion);
router.post("/createCity", verifyJWT, authorizeRoles("admin"), cityController.createCity);
router.put("/updateCity/:id", verifyJWT, authorizeRoles("admin"), cityController.updateCity);
router.get("/getCityById/:id", cityController.getCityById);
router.get("/getCityByName/:name", cityController.getCityByName);
router.delete("/deleteCity/:id", verifyJWT, authorizeRoles("admin"), cityController.deleteCity);


module.exports = router;    