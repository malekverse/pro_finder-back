const Professional = require("../models/Professional");
const Follow = require("../models/follow");
const Review = require("../models/Review");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const Country = mongoose.model("Country");
const Region = mongoose.model("Region");
const City = mongoose.model("City");
const SubCategory = mongoose.model("SubCategory");
const Service = mongoose.model("Service");

// ── Profil connecté ──────────────────────────────────────────
const getProfessionalProfile = async (req, res) => {
  try {
    const professionalId = req.user;
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
    const professionalId = req.user;
    const { fullName, phone, website, description, country, region, city } = req.body;

    const professional = await Professional.findById(professionalId);
    if (!professional) return res.status(404).json({ message: "Professional not found" });

    professional.fullName    = fullName    || professional.fullName;
    professional.phone       = phone       || professional.phone;
    professional.website     = website     || professional.website;
    professional.description = description || professional.description;
    professional.country     = country     || professional.country;
    professional.region      = region      || professional.region;
    professional.city        = city        || professional.city;

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

    if (q && q.trim() !== "") {
      query.fullName = { $regex: q, $options: "i" };
    }

    // Filtres Géo
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
      const servicesDocs = await Service.find({ subcategory_id: subCategory }).select("_id");
      query.services = { $in: servicesDocs.map(s => s._id) };
    } else if (category && category !== "") {
      const subs = await SubCategory.find({ category_id: category }).select("_id");
      const servicesDocs = await Service.find({ subcategory_id: { $in: subs.map(s => s._id) } }).select("_id");
      query.services = { $in: servicesDocs.map(s => s._id) };
    }

    let professionals = await Professional.find(query)
      .select("fullName photoProfessional description city region country website phone services Status")
      .limit(50)
      .lean();

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
          { $match: { professional_id: pro._id } },
          { $group: { _id: "$professional_id", averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } },
        ]);
        const rating = stats.length > 0
          ? { average: stats[0].averageRating.toFixed(1), count: stats[0].totalReviews }
          : { average: 0, count: 0 };

        let cName = pro.country, rName = pro.region, cityN = pro.city;
        let categoryName = "Multi-services";
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
            const serviceDoc = await Service.findById(pro.services[0]).select("subcategory_id").lean();
            if (serviceDoc?.subcategory_id) {
              const subDoc = await SubCategory.findById(serviceDoc.subcategory_id).select("category_id").lean();
              if (subDoc?.category_id) {
                const Category = mongoose.model("Category");
                const catDoc = await Category.findById(subDoc.category_id).select("name").lean();
                categoryName = catDoc?.name || "Multi-services";
              }
            }
          }
        } catch (e) { console.error("Error populating pro details", e); }

        return { ...pro, followersCount, rating, country: cName, region: rName, city: cityN, categoryName };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error("[searchProfessionals]", err);
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
  res.json({ message: "Professional Dashboard", professionalId: req.user });
};

module.exports = {
  getDashboard,
  getProfessionalProfile,
  getPublicProfessionalProfile,
  updateProfessionalProfile,
  searchProfessionals,
  getSuggestedProfessionals,
  getRecommendedProfessionals,
};
