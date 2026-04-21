const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const verifyJWT = require("../middleware/verifyJWT");

// Publique : Récupérer les avis d'une entreprise ou d'un professionnel
router.get("/company/:company_id", reviewController.getCompanyReviews);
router.get("/professional/:professional_id", reviewController.getProfessionalReviews);
router.get("/average/:company_id", reviewController.getAverageRating);
router.get("/average-pro/:professional_id", reviewController.getProfessionalAverageRating);

// Privée : Créer, modifier ou supprimer un avis (nécessite d'être connecté)
router.use(verifyJWT);
router.get("/me", reviewController.getProviderReviews);
router.post("/create", reviewController.createReview);
router.put("/update/:id", reviewController.updateReview);
router.delete("/delete/:id", reviewController.deleteReview);

module.exports = router;
