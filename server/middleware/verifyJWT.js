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
        if (decoded.UserInfo) {
            req.user = decoded.UserInfo.id;
            req.roles = decoded.UserInfo.roles;
        } 
        else if (decoded.AccountInfo) {
            req.user = decoded.AccountInfo.id;
            req.roles = decoded.AccountInfo.roles;
        } 
        else {
            return res.status(401).json({ message: "Token structure invalid" });
        }

        next();
    });
}
module.exports=verifyJWT;
