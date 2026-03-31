const path = require("path");
const Product = require("../models/Product");

// CREATE
const createProduct = async (req, res) => {
  try {
    const { name, category, price, description, stock } = req.body;
    const companyId = req.companyId || req.user;

    if (!name || !category || !price) {
      return res.status(400).json({ message: "Nom, catégorie et prix sont obligatoires" });
    }

    const images = req.files && req.files.images ? req.files.images.map((f) => {
      const relativePath = path.relative(path.join(__dirname, '..'), f.path);
      return relativePath.replace(/\\/g, '/');
    }) : [];

    const product = await Product.create({
      name,
      category,
      price,
      description,
      stock: stock || 0,
      images,
      companyId,
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("[createProduct]", err);
    res.status(500).json({ message: "Erreur lors de la création du produit" });
  }
};

// GET BY COMPANY
const getCompanyProducts = async (req, res) => {
  try {
    const companyId = req.params.companyId || req.companyId || req.user;
    const products = await Product.find({ companyId }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error("[getCompanyProducts]", err);
    res.status(500).json({ message: "Erreur lors de la récupération des produits" });
  }
};

// UPDATE
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, description, stock, existingImages } = req.body;
    const companyId = req.companyId || req.user;

    const product = await Product.findOne({ _id: id, companyId });
    if (!product) {
      return res.status(404).json({ message: "Produit non trouvé ou non autorisé" });
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
    
    product.name = name || product.name;
    product.category = category || product.category;
    product.price = price || product.price;
    product.description = description || product.description;
    product.stock = stock !== undefined ? stock : product.stock;
    product.images = [...finalImages, ...newImages];

    await product.save();
    res.json(product);
  } catch (err) {
    console.error("[updateProduct]", err);
    res.status(500).json({ message: "Erreur lors de la mise à jour du produit" });
  }
};

// DELETE
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId || req.user;

    const product = await Product.findOneAndDelete({ _id: id, companyId });
    if (!product) {
      return res.status(404).json({ message: "Produit non trouvé ou non autorisé" });
    }

    res.json({ message: "Produit supprimé avec succès" });
  } catch (err) {
    console.error("[deleteProduct]", err);
    res.status(500).json({ message: "Erreur lors de la suppression du produit" });
  }
};

// GET ALL (Global search)
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("companyId", "companyName logoUrl").sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error("[getAllProducts]", err);
    res.status(500).json({ message: "Erreur lors de la récupération des produits" });
  }
};

module.exports = {
  createProduct,
  getCompanyProducts,
  updateProduct,
  deleteProduct,
  getAllProducts
};
