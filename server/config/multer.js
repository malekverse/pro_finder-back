const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * Assure que le dossier existe, sinon le crée de manière récursive.
 */
const ensureDir = (dir) => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
};

/**
 * Configuration du stockage local pour Multer.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads';

    // Détermination du dossier en fonction du nom du champ
    if (['logo', 'cover'].includes(file.fieldname)) {
      folder = 'uploads/companies';
    } else if (file.fieldname === 'images') {
      // Peut être pour les posts ou les produits selon la route
      if (req.baseUrl.includes('posts')) {
        folder = 'uploads/posts';
      } else if (req.baseUrl.includes('products')) {
        folder = 'uploads/products';
      } else {
        folder = 'uploads/services';
      }
    } else if (file.fieldname === 'avatarUrl') {
      folder = 'uploads/profiles';}

   

    ensureDir(folder);
    cb(null, path.join(__dirname, '..', folder));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
  }
});

/**
 * Filtre pour n'accepter que les images.
 */
const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier non autorisé. Utilisez jpg, jpeg, png ou webp.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Limite à 5MB
});

module.exports = upload;
