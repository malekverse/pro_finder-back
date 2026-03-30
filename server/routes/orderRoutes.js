const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");

router.use(verifyJWT);

// Client
router.post("/create", orderController.createOrder);
router.get("/my", orderController.getMyOrders);

// Company / Team
router.get("/company", authorizeRoles("company", "admin", "owner", "team_member"), orderController.getCompanyOrders);
router.put("/update/:orderId", authorizeRoles("company", "admin", "owner", "team_member"), orderController.updateOrderStatus);

module.exports = router;
