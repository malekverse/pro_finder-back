const fs = require("fs");
const path = require("path");
const Product = require("../models/Product");

// CREATE
const createProduct = async (req, res) => {
  try {
    const { name, category, price, description, stock } = req.body;
    const imagesProduct = req.files ? req.files.filter(f => f.fieldname === 'imagesProduct').map((f) => f.path.replace(/\\/g, '/')) : [];

    let productData = {
      name,
      category,
      price,
      description,
      stock: stock || 0,
      imagesProduct,
    };

    if (req.roles.includes("professional")) {
      productData.professionalId = req.professionalId || req.user;
    } else {
      productData.companyId = req.companyId || req.user;
    }

    const product = await Product.create(productData);

    res.status(201).json(product);
  } catch (err) {
    console.error("[createProduct]", err);
    res.status(500).json({ message: "Erreur lors de la création du produit" });
  }
};

// GET BY COMPANY
const getCompanyProducts = async (req, res) => {
  try {
    const id = req.params.companyId || req.companyId || req.professionalId || req.user;
    const products = await Product.find({
      $or: [
        { companyId: id },
        { professionalId: id }
      ]
    }).sort({ createdAt: -1 });
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
    const ownerId = req.companyId || req.professionalId || req.user;
    const isProfessional = req.roles?.includes("professional");
    const query = isProfessional ? { _id: id, professionalId: ownerId } : { _id: id, companyId: ownerId };

    const product = await Product.findOne(query);
    if (!product) {
      return res.status(404).json({ message: "Produit non trouvé ou non autorisé" });
    }

    const newImages = req.files ? req.files.filter(f => f.fieldname === 'imagesProduct').map((f) => f.path.replace(/\\/g, '/')) : [];
    
    let finalImages = product.imagesProduct || [];
    if (existingImages !== undefined) {
        try {
            const parsed = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
            finalImages = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
            finalImages = Array.isArray(existingImages) ? existingImages : [existingImages];
        }
    }

    // Normaliser les chemins (enlever le SERVER_URL si présent pour rester en relatif)
    finalImages = finalImages.map(img => {
      if (typeof img !== 'string') return img;
      return img.replace(/^https?:\/\/[^/]+\//, "");
    });
    
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
    const ownerId = req.companyId || req.professionalId || req.user;
    const isProfessional = req.roles?.includes("professional");
    const query = isProfessional ? { _id: id, professionalId: ownerId } : { _id: id, companyId: ownerId };

    const product = await Product.findOne(query);
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
    const products = await Product.find()
      .populate("companyId", "companyName logoUrl")
      .populate("professionalId", "fullName photoProfessional")
      .sort({ createdAt: -1 });
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

    const follows = await Follow.find({ user_id: userId, is_blocked: { $ne: true } });
    const companyIds = follows.filter(f => f.company_id).map(f => f.company_id);
    const professionalIds = follows.filter(f => f.professional_id).map(f => f.professional_id);

    const products = await Product.find({ 
      $or: [
        { companyId: { $in: companyIds } },
        { professionalId: { $in: professionalIds } }
      ]
    })
      .populate("companyId", "companyName logoUrl")
      .populate("professionalId", "fullName photoProfessional")
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