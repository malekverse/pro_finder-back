const Category = require("../../models/Category");
const Activity = require("../../models/Activity");

const getCategories = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = type ? { type } : {};
    const categories = await Category.find(filter);
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching categories" });
  }
};

const createCategorie = async (req, res) => {
  try {
    const { name } = req.body;
    const category = new Category({ name });
    await category.save();

    // Log de l'activité seulement si l'admin est connecté
    if (req.user) {
      await Activity.create({
        adminId: req.user,
        action: "Création de catégorie",
        target: `${name}`,
        status: "success"
      });
    }

    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating category" });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const category = await Category.findByIdAndUpdate(id, { name }, { new: true });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (req.user) {
      await Activity.create({
        adminId: req.user,
        action: "Modification de catégorie",
        target: `${name}`,
        status: "info"
      });
    }

    res.json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating category" });
  }
};


const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si des entreprises sont liées à cette catégorie via leurs services
    const Company = require("../../models/company");
    const Service = require("../../models/Service");
    const SubCategory = require("../../models/SubCategory");

    // 1. Trouver toutes les sous-catégories de cette catégorie
    const subs = await SubCategory.find({ category_id: id });
    const subIds = subs.map(s => s._id);

    // 2. Trouver tous les services de ces sous-catégories
    const services = await Service.find({ subcategory_id: { $in: subIds } });
    const serviceIds = services.map(s => s._id);

    // 3. Vérifier si une entreprise utilise l'un de ces services
    const linkedCompany = await Company.findOne({ services: { $in: serviceIds } });

    if (linkedCompany) {
      return res.status(400).json({
        message: "Suppression impossible : des entreprises sont liées à cette catégorie ou à ses services."
      });
    }

    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    const name = category.name;
    await Category.findByIdAndRemove(id);

    if (req.user) {
      await Activity.create({
        adminId: req.user,
        action: "Suppression de catégorie",
        target: name,
        status: "error"
      });
    }

    res.json({ message: "Category deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting category" });
  }
};

module.exports = {
  getCategories,
  createCategorie,
  updateCategory,
  deleteCategory
}