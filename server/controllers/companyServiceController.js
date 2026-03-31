const path = require("path");
const CompanyService = require("../models/CompanyService");

// CREATE
const createService = async (req, res) => {
  try {
    const { name, description, price, duration } = req.body;
    const companyId = req.companyId || req.user;

    if (!name || !price || !duration) {
      return res.status(400).json({ message: "Nom, prix et durée sont obligatoires" });
    }

    const images = req.files && req.files.images ? req.files.images.map((f) => {
      const relativePath = path.relative(path.join(__dirname, '..'), f.path);
      return relativePath.replace(/\\/g, '/');
    }) : [];

    const service = await CompanyService.create({
      name,
      description,
      price,
      duration,
      images,
      companyId,
    });

    res.status(201).json(service);
  } catch (err) {
    console.error("[createService]", err);
    res.status(500).json({ message: "Erreur lors de la création du service" });
  }
};

// GET BY COMPANY
const getCompanyServices = async (req, res) => {
  try {
    const companyId = req.params.companyId || req.companyId || req.user;
    const services = await CompanyService.find({ companyId }).sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    console.error("[getCompanyServices]", err);
    res.status(500).json({ message: "Erreur lors de la récupération des services" });
  }
};

// UPDATE
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, duration, existingImages } = req.body;
    const companyId = req.companyId || req.user;

    const service = await CompanyService.findOne({ _id: id, companyId });
    if (!service) {
      return res.status(404).json({ message: "Service non trouvé ou non autorisé" });
    }

    // New images
    const newImages = req.files && req.files.images ? req.files.images.map((f) => {
      const relativePath = path.relative(path.join(__dirname, '..'), f.path);
      return relativePath.replace(/\\/g, '/');
    }) : [];
    
    let finalImages = [];
    if (existingImages) {
        try {
            finalImages = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
        } catch (e) {
            finalImages = Array.isArray(existingImages) ? existingImages : [existingImages];
        }
    }
    
    service.name = name || service.name;
    service.description = description || service.description;
    service.price = price || service.price;
    service.duration = duration || service.duration;
    service.images = [...finalImages, ...newImages];

    await service.save();
    res.json(service);
  } catch (err) {
    console.error("[updateService]", err);
    res.status(500).json({ message: "Erreur lors de la mise à jour du service" });
  }
};

// DELETE
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId || req.user;

    const service = await CompanyService.findOneAndDelete({ _id: id, companyId });
    if (!service) {
      return res.status(404).json({ message: "Service non trouvé ou non autorisé" });
    }

    res.json({ message: "Service supprimé avec succès" });
  } catch (err) {
    console.error("[deleteService]", err);
    res.status(500).json({ message: "Erreur lors de la suppression du service" });
  }
};

// GET ALL (Global search)
const getAllServices = async (req, res) => {
  try {
    const services = await CompanyService.find().populate("companyId", "companyName logoUrl").sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    console.error("[getAllServices]", err);
    res.status(500).json({ message: "Erreur lors de la récupération des services" });
  }
};

module.exports = {
  createService,
  getCompanyServices,
  updateService,
  deleteService,
  getAllServices
};
