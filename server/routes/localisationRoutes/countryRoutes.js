const express = require("express");
const router = express.Router();
const countryController = require("../../controllers/localisation/countryController");

router.post("/createCountry", countryController.createCountry);
router.get("/getCountries", countryController.getCountries);
router.get("/getCountryById/:id", countryController.getCountryById);
router.get("/getCountryByName/:name", countryController.getCountryByName);
router.get("/getCountryByCode/:code", countryController.getCountryByCode);
router.delete("/deleteCountry/:id", countryController.deleteCountry);

module.exports = router;
