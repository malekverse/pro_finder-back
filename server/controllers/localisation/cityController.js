const City = require("../../models/city");
const Region = require("../../models/region");


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
    const cities = await City.find().populate({
      path: "region",
      select: "name",
      populate: {
        path: "country",
        select: "name"
      }
    });

    res.json(cities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getCitiesByRegion = async (req, res) => {
  try {
    const { region_id } = req.params;
    
    const cities = await City.find({ 
      region: region_id 
    }).populate({
      path: "region",
      select: "name",
      populate: {
        path: "country",
        select: "name"
      } 
    });

    if (!cities.length)
      return res.status(404).json({ message: "No cities found for this region" });

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