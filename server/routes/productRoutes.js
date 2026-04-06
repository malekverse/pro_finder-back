const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");
const upload = require("../config/multer");

// Toutes les routes de gestion exigent d'être authentifié en tant qu'entreprise/admin/owner
router.post("/create",verifyJWT,authorizeRoles("company", "admin", "owner"),upload.any(),productController.createProduct);

router.get("/company/:companyId", productController.getCompanyProducts);

router.put("/update/:id",verifyJWT,authorizeRoles("company", "admin", "owner"),upload.any(),productController.updateProduct);

router.delete("/delete/:id",verifyJWT,authorizeRoles("company", "admin", "owner"),productController.deleteProduct);

router.get("/all", productController.getAllProducts);
router.get("/followed", verifyJWT, productController.getFollowedProducts);

module.exports = router;