const Country = require("../../models/country");
const { getCountries  } = require('@countrystatecity/countries');

// CREATE
const createCountry = async (req, res) => {
  try {
    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await Country.findOne({ code });
    if (existing) {
      return res.status(400).json({ message: "Country already exists" });
    }

    const country = await Country.create({ name, code });

    res.status(201).json(country);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL
const getAllCountries = async (req, res) => {
  try {
    const countries = await getCountries();

    res.json(countries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET BY ID
const getCountryById = async (req, res) => {
  try {
    const country = await Country.findById(req.params.id);
    if (!country)
      return res.status(404).json({ message: "Country not found" });

    res.json(country);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCountryByName = async (req, res) => {
  try {
    const country = await Country.findOne({ name: req.params.name });
    if (!country)
      return res.status(404).json({ message: "Country not found" });

    res.json(country);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getCountryByCode = async (req, res) => {
  try {
    const country = await Country.findOne({ code: req.params.code });
    if (!country)
      return res.status(404).json({ message: "Country not found" });

    res.json(country);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const deleteCountry = async (req, res) => {
  try {
    await Country.findByIdAndDelete(req.params.id);
    res.json({ message: "Country deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  createCountry,
  getAllCountries,
  getCountryById,
  deleteCountry,
  getCountryByName,
  getCountryByCode
};