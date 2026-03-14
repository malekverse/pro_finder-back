const express = require("express");
const router = express.Router();
const categoryController = require("../../controllers/Categories/categoryController");



router.get("/categories", categoryController.getCategories);
router.post("/createCategory", categoryController.createCategorie);
router.put("/updateCategory/:id", categoryController.updateCategory);
router.delete("/deleteCategory/:id", categoryController.deleteCategory);

module.exports=router;