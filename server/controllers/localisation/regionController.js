const mongoose = require("mongoose");

const Region = require("../../models/region");
const Country = require("../../models/country");
const Activity = require("../../models/Activity");

const createRegion = async (req, res) => {
  try {
    const { name, country } = req.body;

    if (!name || !country || !mongoose.Types.ObjectId.isValid(country))
      return res.status(400).json({ message: "All fields are required and country must be a valid ID" });

    // Check for duplicate
    const duplicate = await Region.findOne({ name }).exec();
    if (duplicate)
      return res.status(409).json({ message: "Duplicate region name" }); // Conflict

    // Create and store the new region
    const result = await Region.create({
      name,
      country
    });

    if (req.user) {
      await Activity.create({
        adminId: req.user,
        action: "Création de région",
        target: name,
        status: "success"
      });
    }

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

    // Update the region
    const result = await Region.findByIdAndUpdate(id, {
      name,
      country
    }, { new: true });

    if (!result) return res.status(404).json({ message: "Region not found" });

    if (req.user) {
      await Activity.create({
        adminId: req.user,
        action: "Modification de région",
        target: name || result.name,
        status: "info"
      });
    }

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
    const { country_id } = req.params;

    if (!country_id || !mongoose.Types.ObjectId.isValid(country_id))
      return res.status(400).json({ message: "A valid Country ID is required" });

    const regions = await Region.find({ country: country_id }).exec();
    if (!regions.length)
      return res.status(404).json({ message: "No regions found for this country" });

    res.status(200).json({ message: "Regions found", regions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const deleteRegion = async (req, res) => {
    try {
        const { id } = req.params;

        // Vérifier si des villes ou des entreprises sont liées à cette région
        const City = require("../../models/city");
        const Company = require("../../models/company");

        const linkedCity = await City.findOne({ region: id });
        const linkedCompany = await Company.findOne({ region: id });

        if (linkedCity || linkedCompany) {
            return res.status(400).json({ 
                message: "Suppression impossible : des villes ou des entreprises sont liées à cette région." 
            });
        }

        const region = await Region.findById(id);
        if (!region) return res.status(404).json({ message: "Region not found" });

        const name = region.name;
        await Region.findByIdAndDelete(id);

        if (req.user) {
            await Activity.create({
                adminId: req.user,
                action: "Suppression de région",
                target: name,
                status: "error"
            });
        }

        res.status(200).json({ message: "Region deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
  deleteRegion,
  createRegion,
  getRegions,
  getRegionsByCountry,
  updateRegion,
  getRegionByName,
  getRegionById
};