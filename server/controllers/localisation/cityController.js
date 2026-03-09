const City = require("../../models/city");
const Region = require("../../models/region");
const {  getStatesOfCountry, getCitiesOfState } = require('@countrystatecity/countries');


const createCity = async (req, res) => {
  try {
    const { name, region } = req.body;

    if (!name || !region)
      return res.status(400).json({ message: "Missing required fields" });

    const regionExist = await Region.findOne({ name: region || region_id });
    if (!regionExist)
      return res.status(404).json({ message: "Region not found" });

    const city = await City.create({ name, region });

    res.status(201).json(city);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL with cascade populate
const getCities = async (req, res) => {
  try {

 const countryCode = 'TN';

    // 1️⃣ Récupérer tous les états/régions de la Tunisie
    //const states = await getStatesOfCountry(countryCode);

    // 2️⃣ Pour chaque état, récupérer les villes
   // let allCities = [];
    //for (const state of states) {
   //   const cities = await getCitiesOfState(countryCode, state.isoCode);
  //    allCities = allCities.concat(cities);
  //  }
  //"iso2": "12",
  const states = await getStatesOfCountry(countryCode);
        const cities = await getCitiesOfState(countryCode, "12");

    res.json(states);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCitiesByRegion = async (req, res) => {
  try {
    //iso2 pour state et country_code
    const { region_id,countryCode } = req.params;
    
    if (!region_id || !countryCode)
      return res.status(400).json({ message: "Region ID and Country Code are required"+region_id+" and "+countryCode });
    
    const cities = await getCitiesOfState(countryCode, region_id);
    res.json(cities);
  } catch (error) {
    res.status(500).json({ message:"region not found"});
  }
};
const updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, region } = req.body;

    if (!id || (!name && !region))
      return res.status(400).json({ message: "All fields are required" });

    // Check for duplicate
    const duplicate = await City.findOne({ name }).exec();
    if (duplicate)
      return res.status(409).json({ message: "Duplicate city name" });

    // Update the city
    const result = await City.findByIdAndUpdate(id, {
      name,
      region
    });

    res.status(200).json({ message: "City updated", city: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getCityById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id)
      return res.status(400).json({ message: "City ID is required" });

    const city = await City.findById(id).exec();
    if (!city)
      return res.status(404).json({ message: "City not found" });

    res.status(200).json({ message: "City found", city });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getCityByName = async (req, res) => {
  try {
    const { name } = req.params;

    if (!name)
      return res.status(400).json({ message: "City name is required" });

    const city = await City.findOne({ name }).exec();
    if (!city)
      return res.status(404).json({ message: "City not found" });

    res.status(200).json({ message: "City found", city });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  createCity,
  getCities,
  getCitiesByRegion,
  updateCity,
  getCityById,
  getCityByName
};