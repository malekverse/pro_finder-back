const City = require("../../models/city");
const Region = require("../../models/region");
const Activity = require("../../models/Activity");


const createCity = async (req, res) => {
  try {
    const { name, region } = req.body;

    if (!name || !region)
      return res.status(400).json({ message: "Missing required fields" });

    const regionExist = await Region.findById(region);
    if (!regionExist)
      return res.status(404).json({ message: "Region not found" });

    const city = await City.create({ name, region });

    if (req.user) {
      await Activity.create({
        adminId: req.user,
        action: "Création de ville",
        target: name,
        status: "success"
      });
    }

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

    // Update the city
    const result = await City.findByIdAndUpdate(id, {
      name,
      region
    }, { new: true });

    if (!result) return res.status(404).json({ message: "City not found" });

    if (req.user) {
      await Activity.create({
        adminId: req.user,
        action: "Modification de ville",
        target: name || result.name,
        status: "info"
      });
    }

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
const deleteCity = async (req, res) => {
    try {
        const { id } = req.params;
        const Company = require("../../models/company");

        const city = await City.findById(id);
        if (!city) return res.status(404).json({ message: "Ville non trouvée" });

        // Vérifier si des entreprises utilisent cette ville
        const isUsed = await Company.findOne({ city: id });
        if (isUsed) {
            return res.status(400).json({ 
                message: "Impossible de supprimer cette ville car elle est utilisée par une ou plusieurs entreprises." 
            });
        }

        const name = city.name;
        await City.findByIdAndDelete(id);

        if (req.user) {
            await Activity.create({
                adminId: req.user,
                action: "Suppression de ville",
                target: name,
                status: "error"
            });
        }

        res.status(200).json({ message: "Ville supprimée avec succès" });
    } catch (error) {
        console.error("Error deleting city:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
  createCity,
  getCities,
  getCitiesByRegion,
  updateCity,
  getCityById,
  getCityByName,
  deleteCity
};