const fs = require("fs");
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

    const imagesProduct = req.files ? req.files.filter(f => f.fieldname === 'imagesProduct').map((f) => f.path.replace(/\\/g, '/')) : [];

    const product = await Product.create({
      name,
      category,
      price,
      description,
      stock: stock || 0,
      imagesProduct,
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

    const newImages = req.files ? req.files.filter(f => f.fieldname === 'imagesProduct').map((f) => f.path.replace(/\\/g, '/')) : [];
    
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
    product.imagesProduct = [...finalImages, ...newImages];

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

    const product = await Product.findOne({ _id: id, companyId });
    if (!product) {
      return res.status(404).json({ message: "Produit non trouvé ou non autorisé" });
    }

    // Supprimer les images locales
    if (product.imagesProduct && product.imagesProduct.length > 0) {
      product.imagesProduct.forEach((img) => {
        const fullPath = path.join(__dirname, "..", img.replace(/\//g, path.sep));
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      });
    }

    await Product.findByIdAndDelete(id);

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

// GET FOLLOWED COMPANIES PRODUCTS
const getFollowedProducts = async (req, res) => {
  try {
    const Follow = require("../models/follow");
    const userId = req.user;

    const follows = await Follow.find({ user_id: userId, is_blocked: { $ne: true } }).select("company_id");
    const companyIds = follows.map(f => f.company_id);

    const products = await Product.find({ companyId: { $in: companyIds } })
      .populate("companyId", "companyName logoUrl")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(products);
  } catch (err) {
    console.error("[getFollowedProducts]", err);
    res.status(500).json({ message: "Erreur lors de la récupération des produits suivis" });
  }
};

module.exports = {
  createProduct,
  getCompanyProducts,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getFollowedProducts
};