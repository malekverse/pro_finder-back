const express = require("express");
const router = express.Router();

const followerController = require("../controllers/followerController");
const verifyJWT = require("../middleware/verifyJWT");
const authorizeRoles = require("../middleware/authorizeRoles");

router.use(verifyJWT);

router.post("/follow", followerController.followCompany);
router.delete("/unfollow", followerController.unfollowCompany);
router.get("/check/:companyId", followerController.checkFollowStatus);

router.post("/follow-pro", followerController.followProfessional);
router.delete("/unfollow-pro", followerController.unfollowProfessional);
router.get("/check-pro/:professionalId", followerController.checkFollowProStatus);

router.get("/my-follows", followerController.getUserFollowedCompanies);
router.get("/my-managed", followerController.getUserManagedCompanies);
router.get("/count", followerController.getFollowerCount);
router.get("/feed", followerController.getFollowedFeed);
router.get("/followers-stats", followerController.getFollowersStats);
router.get("/followers_stats", followerController.getFollowersStats);
module.exports = router;