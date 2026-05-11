const mongoose = require("mongoose");

const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentification requise" });
    }

    if (!req.permissions) {
      req.permissions = [];
    }

    // 1. Vérification classique via le token (statique) ou rôle admin
    const isAdmin = req.roles && req.roles.includes("admin");
    const hasPermission = isAdmin || req.permissions.includes(requiredPermission) || req.permissions.includes("all_access");
    if (hasPermission) return next();

    // 2. Vérification dynamique via la relation de suivi (Follow / Role)
    try {
      const Post = mongoose.model("Post");
      const Follow = mongoose.model("Follow");
      const Role = mongoose.model("Role");

      // Rechercher l'ID de l'entreprise ou du professionnel concerné
      let companyIdToCheck = req.params.companyId || req.body.companyId || req.query.companyId || req.query._c || req.companyId;
      let professionalIdToCheck = req.params.professionalId || req.body.professionalId || req.query.professionalId || req.query._p || req.professionalId;

      // Si l'action concerne un post, on récupère l'auteur
      if (!companyIdToCheck && !professionalIdToCheck && (req.params.id || req.params.postId)) {
        const post = await Post.findById(req.params.id || req.params.postId);
        if (post) {
          if (post.authorType === "Company") companyIdToCheck = post.author_id;
          else if (post.authorType === "Professional") professionalIdToCheck = post.author_id;
          else if (post.authorType === "User") {
            if (requiredPermission === "like_post" || requiredPermission === "comment_post") return next();
          }
        }
      }

      if (companyIdToCheck || professionalIdToCheck) {
        const query = { user_id: req.user, is_blocked: { $ne: true } };
        if (companyIdToCheck) query.company_id = companyIdToCheck;
        else query.professional_id = professionalIdToCheck;

        const follow = await Follow.findOne(query).populate("role_id");

        if (follow) {
          if (requiredPermission === "like_post" || requiredPermission === "comment_post") return next();

          if (follow.role_id && follow.role_id.permissions) {
            const rolePermissions = follow.role_id.permissions;
            if (rolePermissions.includes(requiredPermission) || rolePermissions.includes("all_access")) {
              // ✅ Injecter l'ID dans la requête pour le contrôleur
              if (companyIdToCheck) {
                req.companyId = companyIdToCheck;
                if (!req.roles.includes("company")) req.roles.push("company");
              } else {
                req.professionalId = professionalIdToCheck;
                if (!req.roles.includes("professional")) req.roles.push("professional");
              }
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
