const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");
const checkPermission = require("../middleware/checkPermission");
const upload = require("../config/multer");

// Toutes les routes de gestion exigent d'être authentifié et d'avoir la permission
router.post("/create", verifyJWT, checkPermission("manage_catalog"), upload.any(), productController.createProduct);

router.get("/company/:companyId", productController.getCompanyProducts);

router.put("/update/:id", verifyJWT, checkPermission("manage_catalog"), upload.any(), productController.updateProduct);

router.delete("/delete/:id", verifyJWT, checkPermission("manage_catalog"), productController.deleteProduct);

router.get("/all", productController.getAllProducts);
router.get("/followed", verifyJWT, productController.getFollowedProducts);

module.exports = router;