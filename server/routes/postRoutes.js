const express    = require("express");
const router     = express.Router();
const postController = require("../controllers/postController");
const verifyJWT  = require("../middleware/verifyJWT");
const checkPermission = require("../middleware/checkPermission");
const upload = require("../config/multer");

// ✅ Toutes les routes nécessitent un token
router.use(verifyJWT);

// ── Posts ─────────────────────────────────────────────────────────────────
// Créer un post (plusieurs images sans limite)
router.post("/",
  checkPermission("create_post"),
  upload.array("imagesPost"),
  postController.createPost
);

// Feed — tous les posts (public une fois connecté)
router.get("/", postController.getAllPosts);

// Mes posts
router.get("/my", postController.getMyPosts);

// Publications d'une entreprise (doit être avant /:id)
router.get("/company/:companyId", postController.getPostsByCompany);

// Un post par ID
router.get("/:id", postController.getPost);

// Modifier un post
router.put("/:id",
  checkPermission("update_post"),
  upload.any(),
  postController.updatePost
);

// Supprimer un post
router.delete("/:id", 
  checkPermission("delete_post"),
  postController.deletePost
);

// ── Likes ─────────────────────────────────────────────────────────────────
router.post("/:id/like", 
  checkPermission("like_post"),
  postController.toggleLike
);

// ── Commentaires ──────────────────────────────────────────────────────────
router.post("/:id/comment", 
  checkPermission("comment_post"),
  postController.addComment
);
router.delete("/:id/comment/:commentId", 
  checkPermission("comment_post"),
  postController.deleteComment
);

module.exports = router;