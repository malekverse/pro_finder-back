const Company = require("../models/company");
const Follow = require("../models/follow");
const Role = require("../models/Role");
const User = require("../models/User");
const Review = require("../models/Review");
const fs = require('fs');
const mongoose = require("mongoose");
const path = require("path");
const SubCategory = mongoose.model("SubCategory");
const Service = mongoose.model("Service");
const Country = mongoose.model("Country");
const Region = mongoose.model("Region");
const City = mongoose.model("City");

const getDashboard = async (req, res) => {
  res.json({ message: "Company Dashboard", companyId: req.user });
};
const getCompanyFollowers = async (req, res) => {
  try {
    const idToUse = req.companyId || req.user;
    const companyId = new mongoose.Types.ObjectId(idToUse);
    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ message: "Company not found" });
    
    // On ne récupère que les abonnés ACTIFS (non bloqués) qui n'ont PAS de role_id
    const followers = await Follow.find({ 
      company_id: companyId, 
      role_id: null
    })
      .populate("user_id", "fullName email avatarUrl phone")
      .sort({ createdAt: -1 });

    // Filtrer manuellement pour être sûr (migration au vol)
    const activeFollowers = followers.filter(f => f.is_blocked !== true);
      
    res.json(activeFollowers);
  } catch (error) {
    console.error("Error fetching followers:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getBlockedUsers = async (req, res) => {
  try {
    const idToUse = req.companyId || req.user;
    const companyId = new mongoose.Types.ObjectId(idToUse);
    
    const blocked = await Follow.find({ 
      company_id: companyId, 
      is_blocked: true 
    })
      .populate("user_id", "fullName email avatarUrl phone")
      .sort({ updatedAt: -1 });
      
    res.json(blocked);
  } catch (error) {
    console.error("Error fetching blocked users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const toggleBlockFollower = async (req, res) => {
  try {
    const { followId } = req.params;
    const idToUse = req.companyId || req.user;
    const companyId = new mongoose.Types.ObjectId(idToUse);

    const follow = await Follow.findOne({ _id: followId, company_id: companyId });
    if (!follow) {
      return res.status(404).json({ message: "Relation d'abonnement non trouvée" });
    }

    follow.is_blocked = !follow.is_blocked;
    await follow.save();

    res.json({ 
      message: follow.is_blocked ? "Utilisateur bloqué" : "Utilisateur débloqué", 
      is_blocked: follow.is_blocked 
    });
  } catch (error) {
    console.error("Error toggling block status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getCompanyProfile = async (req, res) => {
  try {
    // Utiliser req.companyId (pour les team members comme owner) ou req.user (pour le compte principal)
    const idToUse = req.companyId || req.user;
    const companyId = new mongoose.Types.ObjectId(idToUse);
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json({
      companyName: company.companyName,
      phone: company.phone,
      website: company.website,
      logoUrl: company.logoUrl,
      description: company.description,
      email: company.email,
      coverUrl: company.coverUrl,
      country: company.country || null,
      region: company.region || null,
      city: company.city || null,
    });
  } catch (err) {
    console.error("[API] Error in getCompanyProfile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/** Profil entreprise par ID — pour les utilisateurs (feed) : ne dépend pas du compte connecté */
const getPublicCompanyProfile = async (req, res) => {
  try {
    const { companyId } = req.params;
    if (!companyId) {
      return res.status(400).json({ message: "companyId requis" });
    }

    const company = await Company.findById(companyId).lean();
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Récupérer le nombre de followers (uniquement non bloqués)
    const followersCount = await Follow.countDocuments({ company_id: companyId, is_blocked: { $ne: true } });

    // Récupérer les noms des localisations manuellement pour plus de robustesse
    let cName = null, rName = null, cityName = null;
    try {
      if (company.country) {
        const cDoc = await Country.findById(company.country).select("name").lean();
        cName = cDoc?.name || null;
      }
      if (company.region) {
        const rDoc = await Region.findById(company.region).select("name").lean();
        rName = rDoc?.name || null;
      }
      if (company.city) {
        const cityDoc = await City.findById(company.city).select("name").lean();
        cityName = cityDoc?.name || null;
      }
    } catch (e) { 
      console.error("Error populating profile address", e); }

    res.json({
      _id: company._id,
      companyName: company.companyName,
      phone: company.phone,
      website: company.website,
      logoUrl: company.logoUrl,
      description: company.description,
      email: company.email,
      coverUrl: company.coverUrl,
      country: cName,
      region: rName,
      city: cityName,
      followersCount
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateCompanyProfile = async (req, res) => {
  const { companyName, phone, website, description, country, region, city } = req.body;
  const idToUse = req.companyId || req.user;
  const companyId = new mongoose.Types.ObjectId(idToUse);

  const company = await Company.findById(companyId);
  if (!company) return res.status(404).json({ message: "Company not found" });

  company.companyName  = companyName  || company.companyName;
  company.phone        = phone        || company.phone;
  company.website      = website      || company.website;
  company.description  = description  || company.description;
  company.country      = country      || company.country;
  company.region       = region       || company.region;
  company.city         = city         || company.city;

  // Gestion logo
  if (req.files?.logo) {
    const file = req.files.logo[0];
    const relativePath = path.relative(path.join(__dirname, '..'), file.path);
    company.logoUrl = relativePath.replace(/\\/g, '/');
  }

  // Gestion cover
  if (req.files?.cover) {
    const file = req.files.cover[0];
    const relativePath = path.relative(path.join(__dirname, '..'), file.path);
    company.coverUrl = relativePath.replace(/\\/g, '/');
  }

  const updatedCompany = await company.save();
  res.json(updatedCompany);
};

//  Lister tous les membres de l'équipe de la company (avec rôle, non bloqués)
const getCompanyUsers = async (req, res) => {
  try {
    const idToUse = req.companyId || req.user;
    const companyId = new mongoose.Types.ObjectId(idToUse);
    const follows = await Follow.find({ 
      company_id: companyId, 
      role_id: { $ne: null }
    })
      .populate("user_id", "fullName email avatarUrl phone")
      .populate("role_id", "name permissions");

    // Filtrer manuellement pour être sûr (migration au vol)
    const activeTeam = follows.filter(f => f.is_blocked !== true);

    res.json(activeTeam);
  } catch (err) {
    console.error("Error in getCompanyUsers:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Assigner un rôle à un user
const assignRoleToUser = async (req, res) => {
  const { email, role } = req.body;
  try {
    const idToUse = req.companyId || req.user;
    const companyId = new mongoose.Types.ObjectId(idToUse);
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const follow = await Follow.findOne({ user_id: user._id, company_id: companyId });
    if (!follow) return res.status(404).json({ message: "User not following this company" });

    const roleDoc = await Role.findOne({ name: role });
    if (!roleDoc) return res.status(404).json({ message: "Role not found" });

    //Assigner le rôle
    follow.role_id = roleDoc._id;
    await follow.save();

    res.json({ message: "Role assigned successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error assigning role" });
  }
};

// Mettre à jour le rôle d’un utilisateur
const updateRoleToUser = async (req, res) => {
  const { email, role_id } = req.body;
  const idToUse = req.companyId || req.user;
  const companyId = new mongoose.Types.ObjectId(idToUse);

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const follow = await Follow.findOne({
      user_id: user._id,
      company_id: companyId
    });

    if (!follow) {
      return res.status(404).json({ message: "User not following this company" });
    }

    follow.role_id = role_id;
    await follow.save();

    res.json({ message: "Role updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating role" });
  }
};

// Supprimer le rôle d’un utilisateur
const deleteRoleToUser = async (req, res) => {
  const { email } = req.body;
  const idToUse = req.companyId || req.user;
  const companyId = new mongoose.Types.ObjectId(idToUse);

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const follow = await Follow.findOne({
      user_id: user._id,
      company_id: companyId
    });

    if (!follow) {
      return res.status(404).json({ message: "User not following this company" });
    }

    follow.role_id = null;
    await follow.save();

    res.json({ message: "Role removed successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting role" });
  }
};

const getUserAccessToCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    const follow = await Follow.findOne({
      user_id: req.user,
      company_id: companyId
    }).populate("role_id", "name permissions");

    if (!follow || !follow.role_id) {
      return res.status(403).json({
        message: "Vous n'avez pas accès à cette company"
      });
    }

    res.json({
      role: follow.role_id.name,
      permissions: follow.role_id.permissions
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
const getSuggestedCompanies = async (req, res) => {
  try {
    const userId = req.user;

    // 1. Companies déjà suivies
    const followed = await Follow.find({ user_id: userId }).lean();
    const followedIds = followed.map((f) => new mongoose.Types.ObjectId(f.company_id));

    // 2. Companies aléatoires non suivies avec nombre de followers et adresse
    const companies = await Company.aggregate([
      {
        $match: {
          _id: { $nin: followedIds },
          Status: "active"
        },
      },
      { $sample: { size: 6 } },
      // S'assurer que les champs sont des ObjectIds pour le $lookup
      {
        $addFields: {
          countryObj: { $cond: { if: { $ne: ["$country", null] }, then: { $toObjectId: "$country" }, else: null } },
          regionObj: { $cond: { if: { $ne: ["$region", null] }, then: { $toObjectId: "$region" }, else: null } },
          cityObj: { $cond: { if: { $ne: ["$city", null] }, then: { $toObjectId: "$city" }, else: null } }
        }
      },
      {
        $lookup: {
          from: "follows", 
          let: { companyId: "$_id" },
          pipeline: [
            { $match: { $expr: { $and: [ { $eq: ["$company_id", "$$companyId"] }, { $ne: ["$is_blocked", true] } ] } } }
          ],
          as: "followers"
        }
      },
      {
        $lookup: {
          from: "countries",
          localField: "countryObj",
          foreignField: "_id",
          as: "countryData"
        }
      },
      {
        $lookup: {
          from: "regions",
          localField: "regionObj",
          foreignField: "_id",
          as: "regionData"
        }
      },
      {
        $lookup: {
          from: "cities",
          localField: "cityObj",
          foreignField: "_id",
          as: "cityData"
        }
      },
      {
        $addFields: {
          followersCount: { $size: "$followers" },
          countryName: { $arrayElemAt: ["$countryData.name", 0] },
          regionName: { $arrayElemAt: ["$regionData.name", 0] },
          cityName: { $arrayElemAt: ["$cityData.name", 0] }
        }
      },
      {
        $project: {
          companyName: 1,
          logoUrl: 1,
          description: 1,
          city: { $ifNull: ["$cityName", null] },
          region: { $ifNull: ["$regionName", null] },
          country: { $ifNull: ["$countryName", null] },
          followersCount: 1
        },
      },
    ]);

    res.json(companies);
  } catch (err) {
    console.error("[getSuggestedCompanies]", err);
    res.status(500).json({ message: err.message });
  }
};

const searchCompanies = async (req, res) => {
  try {
    const { q, country, region, city, category, subCategory, service } = req.query;
    let query = { Status: "active" };

    // Log pour aider l'admin/dev à comprendre pourquoi rien ne s'affiche
    const totalCompanies = await Company.countDocuments();
    const activeCompanies = await Company.countDocuments({ Status: "active" });
    const pendingCompanies = await Company.countDocuments({ Status: "pending" });

    // Filtre texte
    if (q && q.trim() !== "") {
      query.companyName = { $regex: q, $options: "i" };
    }

    // Filtres Géo - Support flexible pour IDs en String ou ObjectId
    if (country && country !== "") {
      query.country = mongoose.isValidObjectId(country) 
        ? { $in: [country, new mongoose.Types.ObjectId(country)] } 
        : country;
    }
    if (region && region !== "") {
      query.region = mongoose.isValidObjectId(region) 
        ? { $in: [region, new mongoose.Types.ObjectId(region)] } 
        : region;
    }
    if (city && city !== "") {
      query.city = mongoose.isValidObjectId(city) 
        ? { $in: [city, new mongoose.Types.ObjectId(city)] } 
        : city;
    }

    // Filtres Taxonomie
    if (service && service !== "") {
      try {
        const serviceId = new mongoose.Types.ObjectId(service);
        query.services = { $in: [serviceId] };
      } catch (e) {
        query.services = service; 
      }
    } else if (subCategory && subCategory !== "") {
      const Service = mongoose.model("Service");
      const servicesDocs = await Service.find({ subcategory_id: subCategory }).select("_id");
      query.services = { $in: servicesDocs.map(s => s._id) };
    } else if (category && category !== "") {
      const subs = await SubCategory.find({ category_id: category }).select("_id");
      const servicesDocs = await Service.find({ subcategory_id: { $in: subs.map(s => s._id) } }).select("_id");
      query.services = { $in: servicesDocs.map(s => s._id) };
    }


    let companies = await Company.find(query)
      .select("companyName logoUrl description city region country website phone services Status")
      .limit(50)
      .lean();

    // Tri par pertinence si une recherche textuelle est effectuée
    if (q && q.trim() !== "") {
      const searchTerm = q.toLowerCase().trim();
      companies.sort((a, b) => {
        const nameA = a.companyName.toLowerCase();
        const nameB = b.companyName.toLowerCase();

        // 1. Match exact
        if (nameA === searchTerm && nameB !== searchTerm) return -1;
        if (nameB === searchTerm && nameA !== searchTerm) return 1;

        // 2. Commence par
        const startsWithA = nameA.startsWith(searchTerm);
        const startsWithB = nameB.startsWith(searchTerm);
        if (startsWithA && !startsWithB) return -1;
        if (startsWithB && !startsWithA) return 1;

        // 3. Contient le terme (déjà filtré par MongoDB regex, mais au cas où pour la stabilité du tri)
        const indexA = nameA.indexOf(searchTerm);
        const indexB = nameB.indexOf(searchTerm);
        if (indexA !== indexB) return indexA - indexB;

        return nameA.localeCompare(nameB);
      });
      
      // Limiter à 20 résultats après le tri
      companies = companies.slice(0, 20);
    }


    // Pour chaque entreprise, récupérer son nombre de followers et les NOMS de localisation
    const Country = mongoose.model("Country");
    const Region = mongoose.model("Region");
    const City = mongoose.model("City");

    const companiesWithDetails = await Promise.all(
      companies.map(async (company) => {
        const followersCount = await Follow.countDocuments({ company_id: company._id, is_blocked: { $ne: true } });
        
        // Récupérer les stats d'avis
        const stats = await Review.aggregate([
          { $match: { company_id: company._id } },
          {
            $group: {
              _id: "$company_id",
              averageRating: { $avg: "$rating" },
              totalReviews: { $sum: 1 },
            },
          },
        ]);

        const rating = stats.length > 0 ? {
          average: stats[0].averageRating.toFixed(1),
          count: stats[0].totalReviews
        } : { average: 0, count: 0 };

        let cName = null, rName = null, cityName = null;
        
        try {
          if (company.country) {
            const cDoc = await Country.findById(company.country).select("name").lean();
            cName = cDoc?.name || null;
          }
          if (company.region) {
            const rDoc = await Region.findById(company.region).select("name").lean();
            rName = rDoc?.name || null;
          }
          if (company.city) {
            const cityDoc = await City.findById(company.city).select("name").lean();
            cityName = cityDoc?.name || null;
          }
        } catch (e) { console.error("Error populating address names", e); }

        return { 
          ...company, 
          followersCount,
          rating,
          country: cName,
          region: rName,
          city: cityName
        };
      })
    );

    res.json(companiesWithDetails);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la recherche" });
  }
};

const getRecommendedCompanies = async (req, res) => {
  try {
    // 1. Obtenir les IDs des entreprises avec les meilleures notes
    const topReviews = await Review.aggregate([
      {
        $group: {
          _id: "$company_id",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
      { $match: { totalReviews: { $gt: 0 } } },
      { $sort: { averageRating: -1, totalReviews: -1 } },
      { $limit: 6 }
    ]);

    const topCompanyIds = topReviews.map(r => r._id);

    // 2. Récupérer les détails des entreprises
    const companies = await Company.find({ 
      _id: { $in: topCompanyIds },
      Status: "active" 
    })
    .select("companyName logoUrl city region country description")
    .lean();

    // 3. Enrichir avec les stats et les noms de localisation
    const enriched = await Promise.all(
      companies.map(async (company) => {
        const reviewStat = topReviews.find(r => r._id.toString() === company._id.toString());
        
        let cityName = null;
        if (company.city) {
          const cityDoc = await mongoose.model("City").findById(company.city).select("name").lean();
          cityName = cityDoc?.name || null;
        }

        return {
          ...company,
          city: cityName,
          averageRating: reviewStat?.averageRating.toFixed(1) || 0,
          totalReviews: reviewStat?.totalReviews || 0
        };
      })
    );

    // Trier par note (car .find ne garde pas l'ordre du $in)
    enriched.sort((a, b) => b.averageRating - a.averageRating);

    res.json(enriched);
  } catch (err) {
    console.error("[getRecommendedCompanies]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const getCompaniesByService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const companies = await Company.find({ services: serviceId });
    res.json(companies);
  } catch (err) {

    res.status(500).json({ message: "Error fetching companies" });
  }
};


module.exports = {
 
  getDashboard,
  getCompanyProfile,
  getPublicCompanyProfile,
  updateCompanyProfile,
  getCompanyUsers,
  assignRoleToUser,
  getCompanyFollowers,
  updateRoleToUser,
  deleteRoleToUser,
  getUserAccessToCompany,
  getCompaniesByService,
  getSuggestedCompanies,
  getRecommendedCompanies,
  searchCompanies,
  toggleBlockFollower,
  getBlockedUsers
};