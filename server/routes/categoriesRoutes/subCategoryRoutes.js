const express = require("express");
const router = express.Router();
const subCategoryController = require("../../controllers/Categories/subCategoryController");

router.get("/subCategories", subCategoryController.getSubCategories);
router.get("/subCategories/:categoryId", subCategoryController.getSubCategoriesByCategory);
router.post("/createSubCategory", subCategoryController.createSubCategory);
router.put("/updateSubCategory/:id", subCategoryController.updateSubCategory);
router.delete("/deleteSubCategory/:id", subCategoryController.deleteSubCategory);

module.exports=router;
