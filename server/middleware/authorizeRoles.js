const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.roles)
      return res.status(403).json({ message: "Accès refusé" });

    const hasRole = req.roles.some(role =>
      allowedRoles.includes(role)
    );

    if (!hasRole)
      return res.status(403).json({ message: "Accès interdit" });

    next();
  };
};

module.exports = authorizeRoles;