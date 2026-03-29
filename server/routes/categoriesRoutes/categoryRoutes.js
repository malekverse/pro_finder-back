const express = require("express");
const router = express.Router();
const categoryController = require("../../controllers/Categories/categoryController");
const verifyJWT = require("../../middleware/verifyJWT");
const authorizeRoles = require("../../middleware/authorizeRoles");


router.get("/categories", categoryController.getCategories);
router.post("/createCategory", verifyJWT, authorizeRoles("admin"), categoryController.createCategorie);
router.put("/updateCategory/:id", verifyJWT, authorizeRoles("admin"), categoryController.updateCategory);
router.delete("/deleteCategory/:id", verifyJWT, authorizeRoles("admin"), categoryController.deleteCategory);

module.exports=router;