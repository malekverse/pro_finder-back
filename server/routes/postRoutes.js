const express    = require("express");
const router     = express.Router();
const postController = require("../controllers/postController");
const verifyJWT  = require("../middleware/verifyJWT");
const { upload } = require("../config/cloudinary");

// ✅ Toutes les routes nécessitent un token
router.use(verifyJWT);

// ── Posts ─────────────────────────────────────────────────────────────────
// Créer un post (plusieurs images sans limite)
router.post("/",
  upload.array("images"),
  postController.createPost
);

// Feed — tous les posts
router.get("/", postController.getAllPosts);

// Mes posts
router.get("/my", postController.getMyPosts);

// Publications d'une entreprise (doit être avant /:id)
router.get("/company/:companyId", postController.getPostsByCompany);

// Un post par ID
router.get("/:id", postController.getPost);

// Modifier un post
router.put("/:id",
  upload.array("images"),
  postController.updatePost
);

// Supprimer un post
router.delete("/:id", postController.deletePost);

// ── Likes ─────────────────────────────────────────────────────────────────
router.post("/:id/like", postController.toggleLike);

// ── Commentaires ──────────────────────────────────────────────────────────
router.post("/:id/comment",   postController.addComment);
router.delete("/:id/comment/:commentId", postController.deleteComment);

// ── Partage ───────────────────────────────────────────────────────────────
router.post("/:id/share", postController.sharePost);

module.exports = router;