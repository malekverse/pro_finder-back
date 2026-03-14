const express=require("express");
const router=express.Router();
const userController=require("../controllers/userController");
const authorizeRoles = require("../middleware/authorizeRoles");
const verifyJWT=require("../middleware/verifyJWT");

router.use(verifyJWT);

router.route("/").get(userController.getAllUsers);
router.get("/dashboard",verifyJWT,authorizeRoles("user","SuperAdmin"),userController.getDashboard
);

module.exports=router;