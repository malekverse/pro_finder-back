const express = require("express");
const router = express.Router();

const followerController = require("../controllers/followerController");
const verifyJWT = require("../middleware/verifyJWT");

router.use(verifyJWT);

router.post("/followCompany", followerController.followCompany);
router.get("/companyFollowers", followerController.getCompanyFollowers);
router.delete("/unfollow", followerController.unfollowCompany);

module.exports = router;