const Country = require("../../models/country");
const Activity = require("../../models/Activity");

// CREATE
const createCountry = async (req, res) => {
  try {
    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: "Veuillez remplir tous les champs (Nom et Code ISO)" });
    }

    const existing = await Country.findOne({ 
      $or: [
        { code: code.toUpperCase() },
        { name: { $regex: new RegExp(`^${name}$`, 'i') } }
      ]
    });

    if (existing) {
      return res.status(400).json({ message: "Ce pays ou ce code ISO existe déjà" });
    }

    const country = await Country.create({ name, code: code.toUpperCase() });

    // Enregistrer l'activité seulement si un utilisateur est authentifié
    if (req.user) {
      await Activity.create({
        adminId: req.user,
        action: "Création de pays",
        target: name,
        status: "success"
      });
    }

    res.status(201).json(country);
  } catch (error) {
    console.error("[createCountry]", error);
    res.status(500).json({ message: "Erreur lors de la création du pays : " + error.message });
  }
};

const updateCountry = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;
    const country = await Country.findByIdAndUpdate(id, { name, code: code?.toUpperCase() }, { new: true });
    if (!country) return res.status(404).json({ message: "Country not found" });

    if (req.user) {
      await Activity.create({
        adminId: req.user,
        action: "Modification de pays",
        target: name,
        status: "info"
      });
    }

    res.json(country);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL
const getCountries = async (req, res) => {
  try {
    const countries = await Country.find();
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
    const { id } = req.params;

    // Vérifier si des régions ou des entreprises sont liées à ce pays
    const Region = require("../../models/region");
    const Company = require("../../models/company");

    const linkedRegion = await Region.findOne({ country: id });
    const linkedCompany = await Company.findOne({ country: id });

    if (linkedRegion || linkedCompany) {
      return res.status(400).json({ 
        message: "Suppression impossible : des régions ou des entreprises sont liées à ce pays." 
      });
    }

    const country = await Country.findById(id);
    if (!country) return res.status(404).json({ message: "Country not found" });

    const name = country.name;
    await Country.findByIdAndDelete(id);

    if (req.user) {
      await Activity.create({
        adminId: req.user,
        action: "Suppression de pays",
        target: name,
        status: "error"
      });
    }

    res.json({ message: "Country deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  createCountry,
  updateCountry,
  getCountries,
  getCountryById,
  deleteCountry,
  getCountryByName,
  getCountryByCode
};