const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const verifyJWT = require("../middleware/verifyJWT");
const upload = require("../config/multer");

router.use(verifyJWT);

router.get("/", profileController.getProfile);
router.put("/", upload.single('avatar'), profileController.updateProfile);

module.exports = router;