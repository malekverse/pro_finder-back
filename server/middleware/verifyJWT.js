const jwt = require("jsonwebtoken");

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    // Si pas de token, on laisse passer mais sans req.user (pour le mode visiteur)
    if (!authHeader?.startsWith("Bearer ")) {
        req.user = null;
        req.roles = ["visitor"];
        return next();
    }

    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "token is invalid" });
        }
        if (decoded.UserInfo) {
            req.user = decoded.UserInfo.id;
            req.roles = decoded.UserInfo.roles;
            req.permissions = decoded.UserInfo.permissions || [];
            req.companyId = decoded.UserInfo.companyId;
        } 
        else if (decoded.AccountInfo) {
            req.user = decoded.AccountInfo.id;
            req.roles = decoded.AccountInfo.roles;
            req.permissions = decoded.AccountInfo.permissions || [];
            req.companyId = decoded.AccountInfo.companyId;
        } 
        else {
            return res.status(401).json({ message: "Token structure invalid" });
        }

        next();
    });
}
module.exports=verifyJWT;
