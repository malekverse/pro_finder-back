const mongoose = require("mongoose");

const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentification requise" });
    }

    if (!req.permissions) {
      req.permissions = [];
    }

    // 1. Vérification classique via le token (statique)
    const hasPermission = req.permissions.includes(requiredPermission) || req.permissions.includes("all_access");
    if (hasPermission) return next();

    // 2. Vérification dynamique via la relation de suivi (Follow / Role)
    try {
      const Post = mongoose.model("Post");
      const Follow = mongoose.model("Follow");
      const Role = mongoose.model("Role");

      // Rechercher l'ID de l'entreprise concernée par l'action
      let companyIdToCheck = req.params.companyId || req.body.companyId || req.query.companyId || req.companyId;

      // Si l'action concerne un post, on récupère l'entreprise auteur du post
      if (!companyIdToCheck && (req.params.id || req.params.postId)) {
        const post = await Post.findById(req.params.id || req.params.postId);
        if (post && post.authorType === "Company") {
          companyIdToCheck = post.author_id;
        } else if (post && post.authorType === "User") {
          // Si c'est un post d'un utilisateur, on autorise like/comment par défaut
          if (requiredPermission === "like_post" || requiredPermission === "comment_post") {
            return next();
          }
        }
      }

      if (companyIdToCheck) {
        // Chercher la relation de suivi
        const follow = await Follow.findOne({ 
          user_id: req.user, 
          company_id: companyIdToCheck,
          is_blocked: { $ne: true }
        }).populate("role_id");

        if (follow) {
          // Si c'est juste un like/comment, le simple fait de suivre suffit (selon la demande utilisateur)
          if (requiredPermission === "like_post" || requiredPermission === "comment_post") {
            return next();
          }

          // Sinon, on vérifie les permissions du rôle associé
          if (follow.role_id && follow.role_id.permissions) {
            const rolePermissions = follow.role_id.permissions;
            if (rolePermissions.includes(requiredPermission) || rolePermissions.includes("all_access")) {
              return next();
            }
          }
        }
      }
    } catch (err) {
      console.error("[checkPermission Dynamic Check Error]:", err);
    }

    return res.status(403).json({ message: `Accès interdit - Permission '${requiredPermission}' requise` });
  };
};

module.exports = checkPermission;
