const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * Assure que le dossier existe, sinon le crée récursivement.
 */
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/';

    // Détermination du sous-dossier selon le fieldname
    if (['logo', 'cover'].includes(file.fieldname)) {
      folder = 'uploads/companies';
    } else if (file.fieldname === 'avatar') {
      folder = 'uploads/profiles';
    } else if (file.fieldname === 'imagesPost') {
      folder = 'uploads/posts';
    } else if (file.fieldname === 'imagesProduct') {
      folder = 'uploads/products';
    } else if (file.fieldname === 'imagesServices') {
      folder = 'uploads/services';
    }

    ensureDir(folder);
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    // Génère un nom de fichier unique avec son extension d'origine
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier non supporté. Utilisez JPG, PNG, WEBP ou GIF.'), false);
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // Limite à 10 Mo
});
