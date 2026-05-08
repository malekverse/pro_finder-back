const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Company = require("../models/company");
const Professional = require("../models/Professional");
const Follow = require("../models/follow");
const Role = require("../models/Role");


// ================= REGISTER =================
const register = async (req, res) => {
  try {
    const {email,password,fullName,companyName,phone, avatarUrl,website,logoUrl,description,roles} = req.body;

    if (!email || !password || !roles) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!roles.includes("user") && !roles.includes("company") && !roles.includes("professional")) {
      return res.status(400).json({ message: "Invalid account type" });
    }

    const Model = roles.includes("user") ? User : roles.includes("company") ? Company : Professional;

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
      console.log("Creating company with payload:", {
        email,
        companyName,
        phone,
        country: req.body.country,
        region: req.body.region,
        city: req.body.city,
        servicesCount: req.body.services?.length
      });
    
      if (!companyName || !email || !phone || !req.body.country || !req.body.region || !req.body.city) {
        return res.status(400).json({ 
          message: "Tous les champs obligatoires doivent être remplis (Nom, Email, Téléphone, Pays, Région, Ville)" 
        });
      }

      // 2. Création avec TOUS les champs du schéma
      newAccount = await Company.create({
        email,
        password: hashedPassword,
        companyName,
        phone,
        website: req.body.website || '',
        logoUrl: req.body.logoUrl || null,
        coverUrl: req.body.coverUrl || null,
        description: req.body.description || '',
        country: req.body.country, 
        region: req.body.region,
        city: req.body.city,
        services: req.body.services || [],
        roles: ["company"]
      });
    }

    if (roles.includes("professional")) {
      const { fullName, email, phone, description, website } = req.body;

      if (!fullName || !email || !phone || !req.body.country || !req.body.region || !req.body.city) {
        return res.status(400).json({
          message: "Tous les champs obligatoires doivent être remplis (Nom, Email, Téléphone, Pays, Région, Ville)"
        });
      }

      newAccount = await Professional.create({
        email,
        password: hashedPassword,
        fullName,
        phone,
        website: req.body.website || '',
        description: req.body.description || '',
        photoProfessional: req.body.photoProfessional || null,
        country: req.body.country,
        region: req.body.region,
        city: req.body.city,
        services: req.body.services || [],
        roles: ["professional"]
      });
    }

    if (roles.includes("company") || roles.includes("professional")) {
      return res.status(201).json({
        message: "Merci pour votre inscription , votre compte est en attente de validation par un administrateur."
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
      { expiresIn: "7d" }
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
    console.error("[register]", err);
    res.status(500).json({ message: "Register error: " + err.message });
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
    account = await Professional.findOne({ email });
    accountType = "professional";
  }

  if (!account) {
    return res.status(400).json({ message: "Identifiants invalides, veuillez vérifier votre email et mot de passe" });
  } 
  if ((accountType === "company" || accountType === "professional") && account.Status === "pending") {
    return res.status(403).json({ 
      message: "Votre compte est en attente de validation par un administrateur." 
    });
  } 
  if ((accountType === "company" || accountType === "professional") && account.Status === "rejected") {
    return res.status(403).json({ 
      message: `Votre compte a été suspendu pour cette raison : ${account.rejectionReason || "Motif non spécifié"}. Veuillez nous contacter pour plus d'informations.` 
    });
  } 

  // Vérifier le mot de passe
  const match = await bcrypt.compare(password, account.password);
  if (!match) {
    return res.status(400).json({ message: "Identifiants invalides, veuillez vérifier votre email et mot de passe" });
  }

  // Initialisation des rôles et companyId
  let roles = account.roles || [accountType];
  let companyId = accountType === "company" ? account._id : null;
  let permissions = [];

  // 1. Permissions de base pour tous les utilisateurs (liker/commenter/partager)
  if (accountType === "user") {
    permissions = ["like_post", "comment_post"];
  }

  // 2. Si c'est un utilisateur, vérifier s'il a un rôle RBAC dans une compagnie (uniquement s'il n'est pas bloqué)
  if (accountType === "user") {
    const allFollows = await Follow.find({ user_id: account._id, role_id: { $ne: null }, is_blocked: { $ne: true } })
      .populate("role_id")
      .populate("company_id")
      .sort({ updatedAt: -1 })
      .lean();
        
    if (allFollows.length > 0) {
      const ownerFollow = allFollows.find(f => f.role_id && f.role_id.name.toLowerCase() === 'owner');
      const finalTeamMember = ownerFollow || allFollows[0];
      
      if (finalTeamMember && finalTeamMember.role_id) {
        roles.push(finalTeamMember.role_id.name);
        companyId = finalTeamMember.company_id._id || finalTeamMember.company_id;
        // Fusionner les permissions RBAC avec les permissions de base
        const rbacPermissions = finalTeamMember.role_id.permissions || [];
        permissions = [...new Set([...permissions, ...rbacPermissions])];
      }
    }
  } else if (accountType === "company" || accountType === "professional") {
    // Les entreprises et professionnels ont par défaut toutes les permissions
    permissions = ["all_access", "manage_posts", "manage_catalog", "manage_access", "manage_sales", "manage_documents"];
  }


  // Générer accessToken
  const accessToken = jwt.sign(
    {
      UserInfo: {
        id: account._id,
        roles: roles,
        permissions: permissions,
        companyId: companyId,
        status: account.Status || "active" 
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "7d" }
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
      fullName: account.fullName || account.companyName,
      roles: roles,
      permissions: permissions,
      companyId: companyId,
      status: account.Status
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

    if (!account) {
      account = await Professional.findById(decoded.id).exec();
      accountType = "professional";
    }

    if (!account) return res.status(401).json({ message: "Account not found" });

    // Initialisation des rôles et companyId
    let roles = account.roles || [accountType];
    let companyId = accountType === "company" ? account._id : null;
    let permissions = [];

    // 1. Permissions de base pour tous les utilisateurs (liker/commenter/partager)
    if (accountType === "user") {
      permissions = ["like_post", "comment_post"];
    }

    // 2. Si c'est un utilisateur, vérifier s'il a un rôle RBAC dans une compagnie (uniquement s'il n'est pas bloqué)
    if (accountType === "user") {
      const allFollows = await Follow.find({ user_id: account._id, role_id: { $ne: null }, is_blocked: { $ne: true } })
        .populate("role_id")
        .populate("company_id")
        .sort({ updatedAt: -1 })
        .lean();
      
      if (allFollows.length > 0) {
        const ownerFollow = allFollows.find(f => f.role_id && f.role_id.name.toLowerCase() === 'owner');
        const finalTeamMember = ownerFollow || allFollows[0];

        if (finalTeamMember && finalTeamMember.role_id) {
          roles.push(finalTeamMember.role_id.name);
          companyId = finalTeamMember.company_id._id || finalTeamMember.company_id;
          // Fusionner les permissions RBAC avec les permissions de base
          const rbacPermissions = finalTeamMember.role_id.permissions || [];
          permissions = [...new Set([...permissions, ...rbacPermissions])];
        }
      }
    } else if (accountType === "company" || accountType === "professional") {
      permissions = ["all_access", "manage_posts", "manage_catalog", "manage_access", "manage_sales", "manage_documents"];
    }

    if (roles.includes("admin")) {
      permissions = ["all_access", "manage_admin"];
    }

    // Générer un nouvel accessToken
    const accessToken = jwt.sign(
      {
        UserInfo: {
          id: account._id,
          roles: roles,
          permissions: permissions,
          companyId: companyId,
          status: account.Status || "active"
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      accessToken,
      account: {
        id: account._id,
        email: account.email,
        fullName: account.fullName || account.companyName,
        roles: roles,
        permissions: permissions,
        companyId: companyId,
        status: account.Status
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


const switchCompany = async (req, res) => {
  try {
    const { companyId } = req.params; // On l'appelle companyId dans la route, mais ça peut être un professionalId
    const userId = req.user;

    // Vérifier si l'utilisateur a accès à cette entreprise OU ce professionnel
    const follow = await Follow.findOne({ 
      user_id: userId, 
      $or: [ { company_id: companyId }, { professional_id: companyId } ],
      role_id: { $ne: null },
      is_blocked: { $ne: true }
    }).populate("role_id");

    if (!follow) {
      return res.status(403).json({ message: "Accès refusé à cette entité" });
    }

    // Récupérer les permissions du rôle
    const permissions = follow.role_id?.permissions || [];
    
    // Déterminer s'il s'agit d'une company ou d'un pro
    const isCompany = !!follow.company_id;
    const roles = [...req.roles];
    if (isCompany && !roles.includes("company")) roles.push("company");
    if (!isCompany && !roles.includes("professional")) roles.push("professional");

    // Générer un nouveau token
    const accessToken = jwt.sign(
      {
        UserInfo: {
          id: userId,
          email: req.email,
          roles: roles,
          permissions: permissions,
          companyId: isCompany ? companyId : null,
          professionalId: !isCompany ? companyId : null,
          accountType: "user"
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ accessToken });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors du changement d'entreprise" });
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  switchCompany
};