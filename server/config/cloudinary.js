const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: "dhhv41nup",
  api_key:    "761237758244347",
  api_secret: "Hk0A_AJyo5Bipd380PA2MNqJLn4",
});

// Détermine le dossier Cloudinary selon le fieldname
const getFolder = (fieldname) => {
  if (["logo", "cover"].includes(fieldname)) return "pro_finder/companies";
  if (fieldname === "images")  return "pro_finder/posts";
  if (fieldname === "avatar")  return "pro_finder/profiles";
  return "pro_finder/misc";
};

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder:         getFolder(file.fieldname),
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  }),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = { upload, cloudinary };