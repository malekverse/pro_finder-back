const jwt = require("jsonwebtoken");

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token ,authorization failed" });
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "token is invalid" });
        }
       req.user = {
            id: decoded.UserInfo.id,
            roles: decoded.UserInfo.roles
        };
        req.company = {
            id: decoded.CompanyInfo.id,
            roles: decoded.CompanyInfo.roles
        };
        next(); 
    });
}
module.exports=verifyJWT;
