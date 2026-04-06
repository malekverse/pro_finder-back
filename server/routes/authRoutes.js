const express=require("express");
const router=express.Router();
const authController=require("../controllers/authController");
const verifyJWT = require("../middleware/verifyJWT");

router.route("/register").post(authController.register);
router.route("/login").post(authController.login);
router.route("/logout").post(authController.logout);
router.route("/refresh").get(authController.refresh);
router.post("/switch-company/:companyId", verifyJWT, authController.switchCompany);

module.exports=router;