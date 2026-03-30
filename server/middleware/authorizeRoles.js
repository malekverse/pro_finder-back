const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.roles)
      return res.status(403).json({ message: "Accès refusé" });

    // Autoriser si l'utilisateur a un des rôles autorisés
    const hasRole = req.roles.some(role =>
      allowedRoles.includes(role)
    );

    // Autoriser aussi si c'est un membre d'équipe et que le rôle 'team_member' est permis
    const isTeamMember = allowedRoles.includes("team_member") && req.companyId;

    if (!hasRole && !isTeamMember)
      return res.status(403).json({ message: "Accès interdit" });

    next();
  };
};

module.exports = authorizeRoles;