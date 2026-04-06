const fs = require("fs");
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

    const imagesServices = req.files ? req.files.filter(f => f.fieldname === 'imagesServices').map((f) => f.path.replace(/\\/g, '/')) : [];

    const service = await CompanyService.create({
      name,
      description,
      price,
      duration,
      imagesServices,
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

    const newImages = req.files ? req.files.filter(f => f.fieldname === 'imagesServices').map((f) => f.path.replace(/\\/g, '/')) : [];
    
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
    service.imagesServices = [...finalImages, ...newImages];

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

    const service = await CompanyService.findOne({ _id: id, companyId });
    if (!service) {
      return res.status(404).json({ message: "Service non trouvé ou non autorisé" });
    }

    // Supprimer les images locales
    if (service.imagesServices && service.imagesServices.length > 0) {
      service.imagesServices.forEach((img) => {
        const fullPath = path.join(__dirname, "..", img.replace(/\//g, path.sep));
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      });
    }

    await CompanyService.findByIdAndDelete(id);

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

// GET FOLLOWED COMPANIES SERVICES
const getFollowedServices = async (req, res) => {
  try {
    const Follow = require("../models/follow");
    const userId = req.user;

    const follows = await Follow.find({ user_id: userId, is_blocked: { $ne: true } }).select("company_id");
    const companyIds = follows.map(f => f.company_id);

    const services = await CompanyService.find({ companyId: { $in: companyIds } })
      .populate("companyId", "companyName logoUrl")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(services);
  } catch (err) {
    console.error("[getFollowedServices]", err);
    res.status(500).json({ message: "Erreur lors de la récupération des services suivis" });
  }
};

module.exports = {
  createService,
  getCompanyServices,
  updateService,
  deleteService,
  getAllServices,
  getFollowedServices
};