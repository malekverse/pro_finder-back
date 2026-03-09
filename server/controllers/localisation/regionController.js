const mongoose = require("mongoose");

const Region = require("../../models/region");
const Country = require("../../models/country");
const { getStatesOfCountry  } = require('@countrystatecity/countries');


const createRegion = async (req, res) => {
  try {
    const { name, country } = req.body;

    if (!name || !country)
      return res.status(400).json({ message: "All fields are required" });

    // Check for duplicate
    const duplicate = await Region.findOne({ name }).exec();
    if (duplicate)
      return res.status(409).json({ message: "Duplicate region name" }); // Conflict

    // Create and store the new region
    const result = await Region.create({
      name,
      country
    });

    res.status(201).json({ message: "New region created", region: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateRegion = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, country } = req.body;

    if (!id || (!name && !country))
      return res.status(400).json({ message: "All fields are required" });

    // Check for duplicate
    const duplicate = await Region.findOne({ name }).exec();
    if (duplicate)
      return res.status(409).json({ message: "Duplicate region name" });

    // Update the region
    const result = await Region.findByIdAndUpdate(id, {
      name,
      country
    });

    res.status(200).json({ message: "Region updated", region: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRegionByName = async (req, res) => {
  try {
    const { name } = req.params;

    if (!name)
      return res.status(400).json({ message: "Region name is required" });

    const region = await Region.findOne({ name }).exec();
    if (!region)
      return res.status(404).json({ message: "Region not found" });

    res.status(200).json({ message: "Region found", region });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// GET ALL with cascade populate
const getRegions = async (req, res) => {
  try {
    const regions = await Region.find().populate({
        path: "country",
        select: "name"
      
    });

    res.json(regions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getRegionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id)
      return res.status(400).json({ message: "Region ID is required" });

    const region = await Region.findById(id).exec();
    if (!region)
      return res.status(404).json({ message: "Region not found" });

    res.status(200).json({ message: "Region found", region });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getRegionsByCountry = async (req, res) => {
  try {
    //iso2
    const { countryCode } = req.params;

    if (!countryCode)
      return res.status(400).json({ message: "Country code is required" });

   const regions = await getStatesOfCountry(countryCode);
    
    res.status(200).json({ message: "Regions found", regions });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRegion,
  getRegions,
  getRegionsByCountry,
  updateRegion,
  getRegionByName,
  getRegionById
};