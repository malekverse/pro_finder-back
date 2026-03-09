const express = require("express");
const router = express.Router();

const followerController = require("../controllers/followerController");
const verifyJWT = require("../middleware/verifyJWT");

router.use(verifyJWT);

router.post("/follow", followerController.followCompany);
router.delete("/unfollow", followerController.unfollowCompany);

module.exports = router;