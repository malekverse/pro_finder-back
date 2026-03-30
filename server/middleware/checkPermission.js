const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.permissions) {
      return res.status(403).json({ message: "Accès refusé - Aucune permission trouvée" });
    }

    const hasPermission = req.permissions.includes(requiredPermission) || req.permissions.includes("all_access");

    if (!hasPermission) {
      return res.status(403).json({ message: `Accès interdit - Permission '${requiredPermission}' requise` });
    }

    next();
  };
};

module.exports = checkPermission;
