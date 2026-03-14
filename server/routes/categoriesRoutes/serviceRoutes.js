const express = require("express");
const router = express.Router();
const serviceController = require("../../controllers/Categories/serviceController");

router.get("/services", serviceController.getServices);
router.get("/services/:subCategoryId", serviceController.getServicesBySubCategory);
router.post("/createService", serviceController.createService);
router.put("/updateService/:id", serviceController.updateService);
router.delete("/deleteService/:id", serviceController.deleteService);

module.exports=router;
