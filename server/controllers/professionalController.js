const Professional = require("../models/Professional");
const Follow = require("../models/follow");
const Review = require("../models/Review");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../utils/emailService");
const bcrypt = require("bcrypt");

const Category = require("../models/Category");
const SubCategory = require("../models/SubCategory");
const Service = require("../models/Service");
const Country = require("../models/country");
const Region = require("../models/region");
const City = require("../models/city");

// ── Profil connecté ──────────────────────────────────────────
const getProfessionalProfile = async (req, res) => {
  try {
    const professionalId = req.professionalId || req.user;
    const professional = await Professional.findById(professionalId);
    if (!professional) return res.status(404).json({ message: "Professional not found" });

    res.json({
      fullName: professional.fullName,
      phone: professional.phone,
      website: professional.website,
      photoProfessional: professional.photoProfessional,
      description: professional.description,
      email: professional.email,
      country: professional.country || null,
      region: professional.region || null,
      city: professional.city || null,
    });
  } catch (err) {
    console.error("[API] Error in getProfessionalProfile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getProfessionalFollowers = async (req, res) => {
  try {
    const professionalId = req.professionalId || req.user;

    const followers = await Follow.find({
      professional_id: professionalId,
      is_blocked: { $ne: true }
    })
      .populate("user_id", "fullName email avatarUrl phone")
      .sort({ createdAt: -1 });

    res.json(followers);
  } catch (error) {
    console.error("Error fetching professional followers:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── Profil public par ID ─────────────────────────────────────
const getPublicProfessionalProfile = async (req, res) => {
  try {
    const { professionalId } = req.params;
    if (!professionalId) return res.status(400).json({ message: "professionalId requis" });

    const professional = await Professional.findById(professionalId).lean();
    if (!professional) return res.status(404).json({ message: "Professional not found" });

    const followersCount = await Follow.countDocuments({ professional_id: professionalId, is_blocked: { $ne: true } });

    let cName = professional.country, rName = professional.region, cityName = professional.city;
    try {
      if (professional.country && mongoose.isValidObjectId(professional.country)) {
        const cDoc = await Country.findById(professional.country).select("name").lean();
        cName = cDoc?.name || null;
      }
      if (professional.region && mongoose.isValidObjectId(professional.region)) {
        const rDoc = await Region.findById(professional.region).select("name").lean();
        rName = rDoc?.name || null;
      }
      if (professional.city && mongoose.isValidObjectId(professional.city)) {
        const cityDoc = await City.findById(professional.city).select("name").lean();
        cityName = cityDoc?.name || null;
      }
    } catch (e) {
      console.error("Error populating professional profile address", e);
    }

    res.json({
      _id: professional._id,
      fullName: professional.fullName,
      phone: professional.phone,
      website: professional.website,
      photoProfessional: professional.photoProfessional,
      description: professional.description,
      email: professional.email,
      country: cName,
      region: rName,
      city: cityName,
      followersCount,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ── Mise à jour profil ───────────────────────────────────────
const updateProfessionalProfile = async (req, res) => {
  try {
    const professionalId = req.professionalId || req.user;
    const { fullName, phone, website, description, country, region, city } = req.body;

    const professional = await Professional.findById(professionalId);
    if (!professional) return res.status(404).json({ message: "Professional not found" });

    professional.fullName = fullName || professional.fullName;
    professional.phone = phone || professional.phone;
    professional.website = website || professional.website;
    professional.description = description || professional.description;
    professional.country = country || professional.country;
    professional.region = region || professional.region;
    professional.city = city || professional.city;

    // Gestion photo
    const photoFile = req.files?.find(f => f.fieldname === "photoProfessional");
    if (photoFile) {
      if (professional.photoProfessional) {
        const oldPath = path.join(__dirname, "..", professional.photoProfessional.replace(/\//g, path.sep));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      professional.photoProfessional = photoFile.path.replace(/\\/g, "/");
    }

    const updated = await professional.save();
    res.json(updated);
  } catch (err) {
    console.error("[updateProfessionalProfile]", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ── Recherche publique ───────────────────────────────────────
const searchProfessionals = async (req, res) => {
  try {
    const { q, country, region, city, category, subCategory, service } = req.query;
    let query = { Status: "active" };

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
            { fullName: kwRegex },
            { description: kwRegex }
          ];

          if (servs.length > 0) orConditions.push({ services: { $in: servs.map(s => s._id) } });
          if (countries.length > 0) orConditions.push({ country: { $in: countries.map(c => c._id) } });
          if (regions.length > 0) orConditions.push({ region: { $in: regions.map(r => r._id) } });
          if (cities.length > 0) orConditions.push({ city: { $in: cities.map(c => c._id) } });

          return { $or: orConditions };
        }));

        // On veut que le professionnel matche TOUS les mots-clés
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
      const servicesDocs = await Service.find({ subcategory_id: subCategory }).select("_id");
      query.services = { $in: servicesDocs.map(s => s._id) };
    } else if (category && category !== "") {
      const subs = await SubCategory.find({ category_id: category }).select("_id");
      const servicesDocs = await Service.find({ subcategory_id: { $in: subs.map(s => s._id) } }).select("_id");
      query.services = { $in: servicesDocs.map(s => s._id) };
    }

    // On utilise Professional.collection.find pour bypasser le casting strict de Mongoose
    let professionalsRaw = await mongoose.connection.db.collection("professionals").find(query)
      .limit(50)
      .toArray();

    let professionals = professionalsRaw.map(p => ({ ...p, _id: p._id.toString() }));

    // Tri par pertinence
    if (q && q.trim() !== "") {
      const searchTerm = q.toLowerCase().trim();
      professionals.sort((a, b) => {
        const nameA = a.fullName.toLowerCase();
        const nameB = b.fullName.toLowerCase();
        if (nameA === searchTerm && nameB !== searchTerm) return -1;
        if (nameB === searchTerm && nameA !== searchTerm) return 1;
        const startsWithA = nameA.startsWith(searchTerm);
        const startsWithB = nameB.startsWith(searchTerm);
        if (startsWithA && !startsWithB) return -1;
        if (startsWithB && !startsWithA) return 1;
        return nameA.localeCompare(nameB);
      });
      professionals = professionals.slice(0, 20);
    }

    // Enrichir avec followers, rating, localisations
    const enriched = await Promise.all(
      professionals.map(async (pro) => {
        const followersCount = await Follow.countDocuments({ professional_id: pro._id, is_blocked: { $ne: true } });

        const stats = await Review.aggregate([
          { $match: { professional_id: new mongoose.Types.ObjectId(pro._id) } },
          { $group: { _id: "$professional_id", averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } },
        ]);
        const rating = stats.length > 0
          ? { average: stats[0].averageRating.toFixed(1), count: stats[0].totalReviews }
          : { average: 0, count: 0 };

        let cName = pro.country, rName = pro.region, cityN = pro.city;
        let categoryName = "Multi-services";
        let servicesList = [];
        try {
          if (pro.country && mongoose.isValidObjectId(pro.country)) {
            const cDoc = await Country.findById(pro.country).select("name").lean();
            cName = cDoc?.name || null;
          }
          if (pro.region && mongoose.isValidObjectId(pro.region)) {
            const rDoc = await Region.findById(pro.region).select("name").lean();
            rName = rDoc?.name || null;
          }
          if (pro.city && mongoose.isValidObjectId(pro.city)) {
            const cityDoc = await City.findById(pro.city).select("name").lean();
            cityN = cityDoc?.name || null;
          }
          if (pro.services && pro.services.length > 0) {
            // Récupérer les noms des services (limité à 12 pour le feed)
            const serviceDocs = await Service.find({ _id: { $in: pro.services } }).select("name subcategory_id").limit(12).lean();
            servicesList = serviceDocs.map(s => s.name);

            // Vérifier si tous les services appartiennent à la même catégorie
            const subIds = [...new Set(serviceDocs.map(s => s.subcategory_id).filter(id => id))];
            const subs = await SubCategory.find({ _id: { $in: subIds } }).select("category_id").lean();
            const catIds = [...new Set(subs.map(s => s.category_id.toString()))];

            if (catIds.length === 1) {
              const Category = mongoose.model("Category");
              const catDoc = await Category.findById(catIds[0]).select("name").lean();
              categoryName = catDoc?.name || "Multi-services";
            } else if (catIds.length > 1) {
              categoryName = "Multi-services";
            } else {
              categoryName = "Services";
            }
          }
        } catch (e) { console.error("Error populating pro details", e); }

        return { ...pro, followersCount, rating, country: cName, region: rName, city: cityN, categoryName, servicesList };
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la recherche" });
  }
};

// ── Suggestions aléatoires ───────────────────────────────────
const getSuggestedProfessionals = async (req, res) => {
  try {
    const userId = req.user;
    const followed = await Follow.find({ user_id: userId, professional_id: { $ne: null } }).lean();
    const followedIds = followed.map(f => new mongoose.Types.ObjectId(f.professional_id));

    const professionals = await Professional.aggregate([
      { $match: { _id: { $nin: followedIds }, Status: "active" } },
      { $sample: { size: 6 } },
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
          let: { proId: "$_id" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$professional_id", "$$proId"] }, { $ne: ["$is_blocked", true] }] } } }
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
          fullName: 1, photoProfessional: 1, description: 1,
          city: { $ifNull: ["$cityName", null] },
          region: { $ifNull: ["$regionName", null] },
          country: { $ifNull: ["$countryName", null] },
          followersCount: 1
        }
      }
    ]);

    res.json(professionals);
  } catch (err) {
    console.error("[getSuggestedProfessionals]", err);
    res.status(500).json({ message: err.message });
  }
};

// ── Recommandés (les mieux notés) ────────────────────────────
const getRecommendedProfessionals = async (req, res) => {
  try {
    const topReviews = await Review.aggregate([
      { $match: { professional_id: { $ne: null } } },
      { $group: { _id: "$professional_id", averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } },
      { $match: { totalReviews: { $gt: 0 } } },
      { $sort: { averageRating: -1, totalReviews: -1 } },
      { $limit: 6 },
    ]);

    const topIds = topReviews.map(r => r._id);

    const professionals = await Professional.find({ _id: { $in: topIds }, Status: "active" })
      .select("fullName photoProfessional city region country description")
      .lean();

    const enriched = await Promise.all(
      professionals.map(async (pro) => {
        const reviewStat = topReviews.find(r => r._id.toString() === pro._id.toString());
        let cityName = pro.city;
        if (pro.city && mongoose.isValidObjectId(pro.city)) {
          const cityDoc = await City.findById(pro.city).select("name").lean();
          cityName = cityDoc?.name || null;
        }
        return {
          ...pro,
          city: cityName,
          averageRating: reviewStat?.averageRating.toFixed(1) || 0,
          totalReviews: reviewStat?.totalReviews || 0,
        };
      })
    );

    enriched.sort((a, b) => b.averageRating - a.averageRating);
    res.json(enriched);
  } catch (err) {
    console.error("[getRecommendedProfessionals]", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ── Dashboard ────────────────────────────────────────────────
const getDashboard = async (req, res) => {
  res.json({ message: "Professional Dashboard", professionalId: req.professionalId || req.user });
};

const createScrapedProfessional = async (req, res) => {
  try {
    const { fullName, description, suggestedCategory, website, serviceId, email, phone } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ message: "Le nom complet et l'email de contact sont requis." });
    }

    // Protection : Vérifier que l'e-mail n'est pas déjà dans la base
    const existingEmail = await Professional.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ message: "Ce professionnel existe déjà dans la base (e-mail en doublon)." });
    }

    // Le mot de passe reste provisoire tant que le pro n'a pas revendiqué
    const fakePassword = `AI_GENERATED_${Math.random().toString(36).slice(-8)}`;
    const hashedPassword = await bcrypt.hash(fakePassword, 10);

    // Pour Professional, certains champs sont requis par le schéma (country, region, city)
    // On va chercher des IDs par défaut ou laisser l'utilisateur choisir lors de la revendication
    // Mais pour le moment, le schéma impose Country/Region/City.
    // Je vais essayer de trouver des valeurs par défaut (ex: Tunisie) si possible, 
    // ou alors on doit assouplir le schéma (isGenerated: true).

    const proData = {
      fullName,
      description: description ? `${description}\n\n[Catégorie suggérée : ${suggestedCategory}]` : `[Catégorie suggérée : ${suggestedCategory}]`,
      website,
      email,
      phone: phone || "00000000",
      password: hashedPassword,
      Status: "active",
      roles: ["professional"],
      isGenerated: true,
    };

    // Si on a un service identifié formellement
    if (serviceId) {
      proData.services = [serviceId];
    }

    // Problème: le schéma impose country, region, city.
    // Dans createScrapedCompany, le schéma a été assoupli avec "required: function() { return !this.isGenerated; }"
    // Je dois vérifier si Professional.js a cette souplesse.
    // D'après ma lecture précédente de Professional.js, NON.
    // Donc je devrais peut-être d'abord modifier Professional.js.

    const newProfessional = new Professional(proData);
    const savedProfessional = await newProfessional.save();

    // Création du Token de Revendication (Valide 7 jours)
    const claimToken = jwt.sign(
      { professionalId: savedProfessional._id, email },
      process.env.ACCESS_TOKEN_SECRET || "default_secret",
      { expiresIn: '7d' }
    );

    const claimUrl = `${process.env.CLIENT_URL || 'http://localhost:3001'}/claim-pro?token=${claimToken}`;

    const htmlEmail = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 25px; border-radius: 12px;">
        <h1 style="color: #1a2b47; font-size: 24px; text-align: center;">Félicitations !</h1>
        <p>Bonjour,</p>
        <p>L'équipe de <strong>ProFinder</strong> a le plaisir de vous informer que votre profil professionnel <b>${fullName}</b> a été référencé sur notre réseau.</p>
        <p>Afin de pouvoir compléter votre profil et recevoir des demandes de clients, vous devez prendre le contrôle de votre fiche.</p>
        <div style="text-align: center; margin: 35px 0;">
          <a href="${claimUrl}" style="background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Revendiquer mon profil (Gratuit)
          </a>
        </div>
        <p style="color: #64748b; font-size: 13px;">Si ce bouton ne fonctionne pas, copiez-collez ce lien : <br/>${claimUrl}</p>
        <p>À très bientôt sur ProFinder !</p>
      </div>
    `;

    try {
      await sendEmail(email, "Prenez le contrôle de votre profil sur ProFinder !", htmlEmail);
    } catch (mailError) {
      console.error("Erreur lors de l'envoi de l'email:", mailError);
    }

    res.status(201).json({
      success: true,
      message: "Professionnel généré sauvegardé avec succès.",
      professional: savedProfessional,
    });
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du professionnel scrapé :", error);
    res.status(500).json({ success: false, message: "Erreur serveur lors de la sauvegarde.", error: error.message });
  }
};

module.exports = {
  getDashboard,
  getProfessionalProfile,
  getPublicProfessionalProfile,
  updateProfessionalProfile,
  getProfessionalFollowers,
  searchProfessionals,
  getSuggestedProfessionals,
  getRecommendedProfessionals,
  createScrapedProfessional,
};
