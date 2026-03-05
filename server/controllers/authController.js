const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Company = require("../models/company");


// ================= REGISTER =================
const register = async (req, res) => {
  try {
    const {email,password,fullName,companyName,phone, avatarUrl,website,logoUrl,description,roles} = req.body;

    if (!email || !password || !roles) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!roles.includes("user") && !roles.includes("company")) {
      return res.status(400).json({ message: "Invalid account type" });
    }

    const Model = roles.includes("user") ? User : Company;

    const duplicate = await Model.findOne({ email }).lean();
    if (duplicate) {
      return res.status(409).json({ message: "Account already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let newAccount;

    if (roles.includes("user")) {
      if (!fullName || !email)
        return res.status(400).json({ message: "Full name and email are required" });

      newAccount = await User.create({
        email,
        password: hashedPassword,
        fullName,
        phone,
        avatarUrl,
        roles: ["user"]
      });
    }

    if (roles.includes("company")) {
      if (!companyName || !email ||!website)
        return res.status(400).json({ message: "Company name, email and website are required" });

      newAccount = await Company.create({
        email,
        password: hashedPassword,
        companyName,
        phone,
        website,
        logoUrl,
        description,
        roles: ["company"]
      });
    }

    // ACCESS TOKEN
    const accessToken = jwt.sign(
      {
        AccountInfo: {
          id: newAccount._id,
          roles: newAccount.roles
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    // REFRESH TOKEN
    const refreshToken = jwt.sign(
      { id: newAccount._id,
       roles: newAccount.roles },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    newAccount.refreshToken = refreshToken;
    await newAccount.save();

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      accessToken,
      account: {
        id: newAccount._id,
        email: newAccount.email,
        roles: newAccount.roles
      },
    });

  } catch (err) {
    res.status(500).json({ message: "Register error" });
  }
};

// ================= LOGIN =================
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Chercher l'utilisateur ou la company par email
  let account = await User.findOne({ email });
  let accountType = "user";

  if (!account) {
    account = await Company.findOne({ email });
    accountType = "company";
  }

  if (!account) {
    return res.status(400).json({ message: "Account not found" });
  }

  // Vérifier le mot de passe
  const match = await bcrypt.compare(password, account.password);
  if (!match) {
    return res.status(400).json({ message: "Invalid password" });
  }

  // Générer accessToken
  const accessToken = jwt.sign(
    {
      UserInfo: {
        id: account._id,
        roles: account.roles || [accountType], // si pas de roles pour Company
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  // Générer refreshToken
  const refreshToken = jwt.sign(
    { id: account._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  // Mettre le cookie
  res.cookie("jwt", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // Retourner la réponse
  res.json({
    accessToken,
    account: {
      id: account._id,
      email: account.email,
      fullName: account.fullName || account.name,
      roles: account.roles || [accountType]
    },
  });
};


// ================= REFRESH =================
const refresh = async (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const refreshToken = cookies.jwt;

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ message: "Token is invalid or expired" });

    // Chercher l'utilisateur ou la company par ID
    let account = await User.findById(decoded.id).exec();
    let accountType = "user";

    if (!account) {
      account = await Company.findById(decoded.id).exec();
      accountType = "company";
    }

    if (!account) return res.status(401).json({ message: "Account not found" });

    // Générer un nouvel accessToken
    const accessToken = jwt.sign(
      {
        UserInfo: {
          id: account._id,
          roles: account.roles || [accountType],
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    res.json({
      accessToken,
      account: {
        id: account._id,
        email: account.email,
        fullName: account.fullName || account.name,
        roles: account.roles || [accountType],
        type: accountType,
      },
    });
  });
};

// ================= LOGOUT =================
const logout = async (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) return res.sendStatus(204);

  res.clearCookie("jwt", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
  });

  res.json({ message: "Logout successful" });
};


module.exports = {
  register,
  login,
  refresh,
  logout
};
