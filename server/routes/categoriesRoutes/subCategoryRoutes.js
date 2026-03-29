const express = require("express");
const router = express.Router();
const subCategoryController = require("../../controllers/Categories/subCategoryController");
const verifyJWT = require("../../middleware/verifyJWT");
const authorizeRoles = require("../../middleware/authorizeRoles");

router.get("/subCategories", subCategoryController.getSubCategories);
router.get("/subCategories/:categoryId", subCategoryController.getSubCategoriesByCategory);
router.post("/createSubCategory", verifyJWT, authorizeRoles("admin"), subCategoryController.createSubCategory);
router.put("/updateSubCategory/:id", verifyJWT, authorizeRoles("admin"), subCategoryController.updateSubCategory);
router.delete("/deleteSubCategory/:id", verifyJWT, authorizeRoles("admin"), subCategoryController.deleteSubCategory);

module.exports=router;
