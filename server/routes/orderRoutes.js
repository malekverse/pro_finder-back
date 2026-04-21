const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");

router.use(verifyJWT);

// Client
router.post("/create", verifyJWT, orderController.createOrder);
router.get("/company", authorizeRoles("company", "professional", "admin"), orderController.getCompanyOrders);
router.get("/company/:companyId", orderController.getCompanyOrders);
router.put("/update-status/:id", verifyJWT, authorizeRoles("company", "professional"), orderController.updateOrderStatus);
router.get("/user", verifyJWT, orderController.getMyOrders);
router.put("/update/:orderId", authorizeRoles("company", "admin", "owner", "team_member", "professional"), orderController.updateOrderStatus);

module.exports = router;
