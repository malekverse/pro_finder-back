const express = require("express");
const router = express.Router();

const followerController = require("../controllers/followerController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");

router.use(verifyJWT);

router.post("/follow", followerController.followCompany);
router.delete("/unfollow", followerController.unfollowCompany);
router.get("/check/:companyId", followerController.checkFollowStatus);
router.get("/count", followerController.getFollowerCount);
router.get("/feed", followerController.getFollowedFeed);
router.get("/followers-stats", authorizeRoles("company", "admin", "owner"), followerController.getFollowersStats);
module.exports = router;