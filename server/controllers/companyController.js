const Company = require("../models/company");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { sendEmail } = require("../utils/emailService");
const Follow = require("../models/follow");
const Role = require("../models/Role");
const User = require("../models/User");
const Review = require("../models/Review");
const fs = require('fs');
const mongoose = require("mongoose");
const path = require("path");
const Category = require("../models/Category");
const SubCategory = require("../models/SubCategory");
const Service = require("../models/Service");
const Country = require("../models/country");
const Region = require("../models/region");
const City = require("../models/city");

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
    const isProfessional = req.roles?.includes("professional");
    const id = new mongoose.Types.ObjectId(idToUse);

    const query = isProfessional ? { professional_id: id, is_blocked: true } : { company_id: id, is_blocked: true };

    const blocked = await Follow.find(query)
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
    const isProfessional = req.roles?.includes("professional");
    const id = new mongoose.Types.ObjectId(idToUse);

    const query = isProfessional ? { _id: followId, professional_id: id } : { _id: followId, company_id: id };

    const follow = await Follow.findOne(query);
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
    let cName = company.country, rName = company.region, cityName = company.city;
    try {
      if (company.country && mongoose.isValidObjectId(company.country)) {
        const cDoc = await Country.findById(company.country).select("name").lean();
        cName = cDoc?.name || null;
      }
      if (company.region && mongoose.isValidObjectId(company.region)) {
        const rDoc = await Region.findById(company.region).select("name").lean();
        rName = rDoc?.name || null;
      }
      if (company.city && mongoose.isValidObjectId(company.city)) {
        const cityDoc = await City.findById(company.city).select("name").lean();
        cityName = cityDoc?.name || null;
      }
    } catch (e) {
      console.error("Error populating profile address", e);
    }

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
      isGenerated: company.isGenerated || false,
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

  company.companyName = companyName || company.companyName;
  company.phone = phone || company.phone;
  company.website = website || company.website;
  company.description = description || company.description;
  company.country = country || company.country;
  company.region = region || company.region;
  company.city = city || company.city;

  // Gestion logo
  const logoFile = req.files?.find(f => f.fieldname === 'logo');
  if (logoFile) {
    if (company.logoUrl) {
      const oldLogoPath = path.join(__dirname, "..", company.logoUrl.replace(/\//g, path.sep));
      if (fs.existsSync(oldLogoPath)) fs.unlinkSync(oldLogoPath);
    }
    company.logoUrl = logoFile.path.replace(/\\/g, "/"); // Chemin relatif
  }

  // Gestion cover
  const coverFile = req.files?.find(f => f.fieldname === 'cover');
  if (coverFile) {
    if (company.coverUrl) {
      const oldCoverPath = path.join(__dirname, "..", company.coverUrl.replace(/\//g, path.sep));
      if (fs.existsSync(oldCoverPath)) fs.unlinkSync(oldCoverPath);
    }
    company.coverUrl = coverFile.path.replace(/\\/g, "/"); // Chemin relatif
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
    const followed = await Follow.find({ user_id: userId, company_id: { $ne: null } }).lean()
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
          countryObj: { $cond: { if: { $and: [{ $ne: ["$country", null] }, { $regexMatch: { input: { $toString: "$country" }, regex: /^[0-9a-fA-F]{24}$/ } }] }, then: { $toObjectId: "$country" }, else: null } },
          regionObj: { $cond: { if: { $and: [{ $ne: ["$region", null] }, { $regexMatch: { input: { $toString: "$region" }, regex: /^[0-9a-fA-F]{24}$/ } }] }, then: { $toObjectId: "$region" }, else: null } },
          cityObj: { $cond: { if: { $and: [{ $ne: ["$city", null] }, { $regexMatch: { input: { $toString: "$city" }, regex: /^[0-9a-fA-F]{24}$/ } }] }, then: { $toObjectId: "$city" }, else: null } }
        }
      },
      {
        $lookup: {
          from: "follows",
          let: { companyId: "$_id" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$company_id", "$$companyId"] }, { $ne: ["$is_blocked", true] }] } } }
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

    // Filtre texte amélioré (Recherche multi-critères)
    if (q && q.trim() !== "") {
      const keywords = q.trim().split(/\s+/).filter(kw => kw.length > 0);

      if (keywords.length > 0) {
        // On prépare des recherches pour chaque mot-clé
        const keywordFilters = await Promise.all(keywords.map(async (kw) => {
          const kwRegex = { $regex: kw, $options: "i" };
          
          // Pour chaque mot-clé, on trouve les IDs correspondants dans la taxonomie et localisation
          const [cats, countries, regions, cities] = await Promise.all([
            Category.find({ name: kwRegex }).select("_id"),
            Country.find({ name: kwRegex }).select("_id"),
            Region.find({ name: kwRegex }).select("_id"),
            City.find({ name: kwRegex }).select("_id")
          ]);

          const subs = await SubCategory.find({
            $or: [{ name: kwRegex }, { category_id: { $in: cats.map(c => c._id) } }]
          }).select("_id");

          const servs = await Service.find({
            $or: [{ name: kwRegex }, { subcategory_id: { $in: subs.map(s => s._id) } }]
          }).select("_id");

          // Construction du filtre OR pour ce mot-clé précis
          const orConditions = [
            { companyName: kwRegex },
            { description: kwRegex }
          ];

          if (servs.length > 0) orConditions.push({ services: { $in: servs.map(s => s._id) } });
          if (countries.length > 0) orConditions.push({ country: { $in: countries.map(c => c._id) } });
          if (regions.length > 0) orConditions.push({ region: { $in: regions.map(r => r._id) } });
          if (cities.length > 0) orConditions.push({ city: { $in: cities.map(c => c._id) } });

          return { $or: orConditions };
        }));

        // On veut que l'entreprise matche TOUS les mots-clés
        if (keywordFilters.length > 0) {
          query.$and = keywordFilters;
        }
      }
    }

    // Filtres Géo (Gestion flexible ObjectId vs String)
    const geoFilters = [];

    if (country && country !== "") {
      if (mongoose.isValidObjectId(country)) {
        const cDoc = await Country.findById(country).select("name").lean();
        const conditions = [{ country: new mongoose.Types.ObjectId(country) }];
        if (cDoc) conditions.push({ country: { $regex: `^${cDoc.name}$`, $options: "i" } });
        geoFilters.push({ $or: conditions });
      } else {
        geoFilters.push({ country: country });
      }
    }
    if (region && region !== "") {
      if (mongoose.isValidObjectId(region)) {
        const rDoc = await Region.findById(region).select("name").lean();
        const conditions = [{ region: new mongoose.Types.ObjectId(region) }];
        if (rDoc) conditions.push({ region: { $regex: `^${rDoc.name}$`, $options: "i" } });
        geoFilters.push({ $or: conditions });
      } else {
        geoFilters.push({ region: region });
      }
    }
    if (city && city !== "") {
      if (mongoose.isValidObjectId(city)) {
        const cityDoc = await City.findById(city).select("name").lean();
        const conditions = [{ city: new mongoose.Types.ObjectId(city) }];
        if (cityDoc) conditions.push({ city: { $regex: `^${cityDoc.name}$`, $options: "i" } });
        geoFilters.push({ $or: conditions });
      } else {
        geoFilters.push({ city: city });
      }
    }

    if (geoFilters.length > 0) {
      if (!query.$and) query.$and = [];
      query.$and.push(...geoFilters);
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


    // On utilise Company.collection.find pour bypasser le casting strict de Mongoose (qui cause des erreurs quand country est un string alors que le schema attend un ObjectId)
    let companiesRaw = await mongoose.connection.db.collection("companies").find(query)
      .limit(50)
      .toArray();

    // On convertit les résultats bruts pour qu'ils ressemblent à du Mongoose lean()
    let companies = companiesRaw.map(c => ({ ...c, _id: c._id.toString() }));

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
    const companiesWithDetails = await Promise.all(
      companies.map(async (company) => {
        const followersCount = await Follow.countDocuments({ company_id: company._id, is_blocked: { $ne: true } });

        // Récupérer les stats d'avis
        const stats = await Review.aggregate([
          { $match: { company_id: new mongoose.Types.ObjectId(company._id) } },
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

        let cName = company.country, rName = company.region, cityName = company.city;
        let categoryName = "Multi-services";
        let servicesList = [];

        try {
          // Résolution adresse
          if (company.country && mongoose.isValidObjectId(company.country)) {
            const cDoc = await Country.findById(company.country).select("name").lean();
            cName = cDoc?.name || null;
          }
          if (company.region && mongoose.isValidObjectId(company.region)) {
            const rDoc = await Region.findById(company.region).select("name").lean();
            rName = rDoc?.name || null;
          }
          if (company.city && mongoose.isValidObjectId(company.city)) {
            const cityDoc = await City.findById(company.city).select("name").lean();
            cityName = cityDoc?.name || null;
          }

          // Résolution Catégorie et Services
          if (company.services && company.services.length > 0) {
            const Service = mongoose.model("Service");
            const SubCategory = mongoose.model("SubCategory");
            const Category = mongoose.model("Category");

            // Récupérer les noms des services (limité à 12 pour le feed)
            const serviceDocs = await Service.find({ _id: { $in: company.services } }).select("name subcategory_id").limit(12).lean();
            servicesList = serviceDocs.map(s => s.name);

            // Vérifier si tous les services appartiennent à la même catégorie
            const subIds = [...new Set(serviceDocs.map(s => s.subcategory_id).filter(id => id))];
            const subs = await SubCategory.find({ _id: { $in: subIds } }).select("category_id").lean();
            const catIds = [...new Set(subs.map(s => s.category_id.toString()))];

            if (catIds.length === 1) {
              const catDoc = await Category.findById(catIds[0]).select("name").lean();
              categoryName = catDoc?.name || "Multi-services";
            } else if (catIds.length > 1) {
              categoryName = "Multi-services";
            } else {
              categoryName = "Services";
            }
          }
        } catch (e) { console.error("Error populating details", e); }

        return {
          ...company,
          followersCount,
          rating,
          country: cName,
          region: rName,
          city: cityName,
          categoryName,
          servicesList
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
      { $match: { company_id: { $ne: null } } },
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


    const topCompanyIds = topReviews.map(r => r._id).filter(id => id !== null);


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
        const reviewStat = topReviews.find(r => r._id && r._id.toString() === company._id.toString());

        let cityName = company.city;
        if (company.city && mongoose.isValidObjectId(company.city)) {
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



const createScrapedCompany = async (req, res) => {
  try {
    const { companyName, description, suggestedCategory, website, serviceId, email } = req.body;

    if (!companyName || !email) {
      return res.status(400).json({ message: "Le nom de l'entreprise et l'email de contact sont requis." });
    }

    // Protection : Vérifier que l'e-mail n'est pas déjà dans la base
    const existingEmail = await Company.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ message: "Cette entreprise existe déjà dans la base (e-mail en doublon)." });
    }

    // Le mot de passe reste provisoire tant que l'entreprise n'a pas revendiqué
    const fakePassword = `AI_GENERATED_${Math.random().toString(36).slice(-8)}`;
    const bcrypt = require("bcrypt");
    const hashedPassword = await bcrypt.hash(fakePassword, 10);

    const companyData = {
      companyName,
      description: description ? `${description}\n\n[Catégorie suggérée : ${suggestedCategory}]` : `[Catégorie suggérée : ${suggestedCategory}]`,
      website,
      email, // Le vrai e-mail extrait par l'IA
      password: hashedPassword,
      isGenerated: true,
      Status: "active", // Pour qu'elle soit visible publiquement comme "à revendiquer"
    };

    // Si on a un service identifié formellement par l'IA de notre taxonomie
    if (serviceId) {
      companyData.services = [serviceId];
    }

    const newCompany = new Company(companyData);

    const savedCompany = await newCompany.save();

    // Création du Token de Revendication (Valide 7 jours)
    const claimToken = jwt.sign(
      { companyId: savedCompany._id, email },
      process.env.ACCESS_TOKEN_SECRET || "default_secret",
      { expiresIn: '7d' }
    );

    // Lien vers la page de revendication du front-end
    const claimUrl = `${process.env.CLIENT_URL || 'http://localhost:3001'}/claim?token=${claimToken}`;

    // Pour faciliter les tests locaux


    // Envoi de l'e-mail d'invitation automatiquement
    const htmlEmail = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 25px; border-radius: 12px;">
        <h1 style="color: #1a2b47; font-size: 24px; text-align: center;">Félicitations !</h1>
        <p>Bonjour,</p>
        <p>L'équipe de <strong>ProFinder</strong> a le plaisir de vous informer que votre entreprise <b>${companyName}</b> a été référencée sur notre réseau professionnel.</p>
        
        <p>Afin de pouvoir ajouter votre logo, compléter votre description et recevoir des devis de nouveaux clients, vous devez prendre le contrôle de votre fiche.</p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${claimUrl}" style="background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Revendiquer ma page (Gratuit)
          </a>
        </div>
        
        <p style="color: #64748b; font-size: 13px;">Si ce bouton ne fonctionne pas, copiez-collez ce lien : <br/>${claimUrl}</p>
        <p>À très bientôt sur ProFinder !</p>
      </div>
    `;

    try {
      await sendEmail(email, "Prenez le contrôle de votre page sur ProFinder !", htmlEmail);
    } catch (mailError) {
      console.error("Erreur lors de l'envoi de l'email mais l'entite est sauvegardee:", mailError);
    }

    res.status(201).json({
      success: true,
      message: "Entreprise générée sauvegardée avec succès.",
      company: savedCompany,
    });
  } catch (error) {
    console.error("Erreur lors de la sauvegarde de l'entreprise scrapée :", error);
    res.status(500).json({ success: false, message: "Erreur serveur lors de la sauvegarde." });
  }
};

const claimCompanyProfile = async (req, res) => {
  try {
    const { token, password, phone, country, region, city, website, description, logoUrl, coverUrl, services, companyName } = req.body;

    if (!token || !password || !phone || !country || !region || !city) {
      return res.status(400).json({ message: "Le jeton, le mot de passe, le téléphone, le pays, la région et la ville sont requis." });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || "default_secret");

    const company = await Company.findById(decoded.companyId);
    if (!company) {
      return res.status(404).json({ message: "Entreprise introuvable." });
    }

    if (!company.isGenerated) {
      return res.status(400).json({ message: "Cette entreprise a déjà été revendiquée." });
    }

    company.password = await bcrypt.hash(password, 10);
    company.companyName = companyName || company.companyName;
    company.phone = phone;

    // Only assign if provided and not empty string to avoid CastError
    if (country && mongoose.isValidObjectId(country)) company.country = country;
    if (region && mongoose.isValidObjectId(region)) company.region = region;
    if (city && mongoose.isValidObjectId(city)) company.city = city;

    company.website = website || company.website || "";
    company.description = description || company.description || "";
    company.logoUrl = logoUrl || company.logoUrl || null;
    company.coverUrl = coverUrl || company.coverUrl || null;

    if (Array.isArray(services)) {
      company.services = services.filter(s => mongoose.isValidObjectId(s));
    }

    company.isGenerated = false;
    company.Status = "approved"; // Bypass la validation admin pour les revendications

    await company.save();

    res.json({ success: true, message: "Entreprise revendiquée avec succès." });

  } catch (error) {
    console.error("Erreur lors de la revendication de l'entreprise :", error);
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Le lien de revendication a expiré." });
    }
    // Log details of the error to help debugging
    return res.status(500).json({
      message: "Erreur lors de la revendication.",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

const getClaimPreview = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Jeton manquant." });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || "default_secret");

    const company = await Company.findById(decoded.companyId)
      .populate("services")
      .populate("country")
      .populate("region")
      .populate("city");

    if (!company) {
      return res.status(404).json({ message: "Entreprise introuvable." });
    }

    if (!company.isGenerated) {
      return res.status(400).json({ message: "Cette entreprise a déjà été revendiquée." });
    }

    res.json({
      companyName: company.companyName,
      email: company.email,
      phone: company.phone,
      website: company.website,
      description: company.description,
      country: company.country?._id,
      region: company.region?._id,
      city: company.city?._id,
      services: company.services?.map(s => s._id) || [],
      logoUrl: company.logoUrl,
      coverUrl: company.coverUrl
    });

  } catch (error) {
    console.error("Erreur lors de la prévisualisation :", error);
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Le lien de revendication a expiré." });
    }
    return res.status(500).json({ message: "Erreur lors de la récupération des données." });
  }
};


const requestClaim = async (req, res) => {
  try {
    const { companyId } = req.params;
    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({ message: "Entreprise introuvable." });
    }

    if (!company.isGenerated) {
      return res.status(400).json({ message: "Cette entreprise a déjà été revendiquée." });
    }

    if (!company.email) {
      return res.status(400).json({ message: "Aucun e-mail de contact n'est associé à cette fiche. Veuillez contacter le support." });
    }

    // Génération du Token (7 jours)
    const claimToken = jwt.sign(
      { companyId: company._id },
      process.env.ACCESS_TOKEN_SECRET || "default_secret",
      { expiresIn: '7d' }
    );

    const claimUrl = `${process.env.CLIENT_URL || 'http://localhost:3001'}/claim?token=${claimToken}`;

    // On masque l'email pour la réponse (sécurité)
    const [user, domain] = company.email.split('@');
    const maskedEmail = `${user.substring(0, 2)}***@${domain}`;

    const htmlEmail = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 25px; border-radius: 12px;">
        <h1 style="color: #1a2b47; font-size: 24px; text-align: center;">Vérification de propriété</h1>
        <p>Bonjour,</p>
        <p>Une demande de revendication a été initiée pour l'entreprise <b>${company.companyName}</b> sur <strong>ProFinder</strong>.</p>
        
        <p>Si vous êtes le propriétaire légitime, cliquez sur le bouton ci-dessous pour compléter votre profil et activer votre compte :</p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${claimUrl}" style="background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Confirmer la revendication
          </a>
        </div>
        
        <p style="color: #64748b; font-size: 13px;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>
        <p>À très bientôt sur ProFinder !</p>
      </div>
    `;

    // LOG DE SÉCURITÉ (Très utile pour le dev si le SMTP échoue)
    console.log("=========================================");
    console.log("DEMANDE DE REVENDICATION POUR :", company.companyName);
    console.log("DESTINATAIRE :", company.email);
    console.log("LIEN DE SÉCURITÉ :", claimUrl);
    console.log("=========================================");

    let emailSent = true;
    let emailError = null;

    try {
      await sendEmail(company.email, "Revendiquez votre entreprise sur ProFinder", htmlEmail);
    } catch (mailErr) {
      console.error("ERREUR ENVOI EMAIL REVENDICATION:", mailErr.message);
      emailSent = false;
      emailError = mailErr.message;
    }

    if (!emailSent) {
      // On retourne quand même un succès partiel pour ne pas bloquer le développeur
      return res.json({
        success: true,
        message: "Demande générée avec succès (Mode Test / Console).",
        warning: "L'e-mail n'a pas pu être envoyé, mais le lien est disponible dans la console du serveur.",
        maskedEmail
      });
    }

    res.json({
      success: true,
      message: "L'e-mail de vérification a été envoyé.",
      maskedEmail
    });

  } catch (error) {
    console.error("Erreur requestClaim:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la demande de revendication.",
      details: error.message
    });
  }
};

module.exports = {
  getDashboard,
  getCompanyFollowers,
  getCompanyProfile,
  updateCompanyProfile,
  getCompanyUsers,
  assignRoleToUser,
  updateRoleToUser,
  deleteRoleToUser,
  getPublicCompanyProfile,
  getUserAccessToCompany,
  getCompaniesByService,
  searchCompanies,
  getSuggestedCompanies,
  getRecommendedCompanies,
  getBlockedUsers,
  toggleBlockFollower,
  createScrapedCompany,
  getClaimPreview,
  claimCompanyProfile,
  requestClaim
};