const checkIfOwner = (req, res, next) => {
    if (!req.roles || !req.roles.includes('owner')) {
        return res.status(403).json({ message: "Accès refusé : Rôle 'owner' requis pour cette action." });
    }
    next();
};

module.exports = checkIfOwner;