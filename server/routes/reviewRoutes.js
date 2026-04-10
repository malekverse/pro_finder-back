const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const verifyJWT = require("../middleware/verifyJWT");

// Publique : Récupérer les avis d'une entreprise
router.get("/company/:company_id", reviewController.getCompanyReviews);
router.get("/average/:company_id", reviewController.getAverageRating);

// Privée : Créer ou supprimer un avis (nécessite d'être connecté)
router.use(verifyJWT);
router.post("/create", reviewController.createReview);
router.put("/update/:id", reviewController.updateReview);
router.delete("/delete/:id", reviewController.deleteReview);

module.exports = router;
