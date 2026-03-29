const express = require("express");
const router = express.Router();
const countryController = require("../../controllers/localisation/countryController");
const verifyJWT = require("../../middleware/verifyJWT");
const authorizeRoles = require("../../middleware/authorizeRoles");

router.post("/createCountry", verifyJWT, authorizeRoles("admin"), countryController.createCountry);
router.put("/updateCountry/:id", verifyJWT, authorizeRoles("admin"), countryController.updateCountry);
router.get("/getCountries", countryController.getCountries);
router.get("/getCountryById/:id", countryController.getCountryById);
router.get("/getCountryByName/:name", countryController.getCountryByName);
router.get("/getCountryByCode/:code", countryController.getCountryByCode);
router.delete("/deleteCountry/:id", verifyJWT, authorizeRoles("admin"), countryController.deleteCountry);

module.exports = router;
