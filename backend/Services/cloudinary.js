const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
   cloud_name: "dxoy1r7v8",
  api_key: "796582541716271",
  api_secret: "L6kVIg9cfkWJA4FN-e8QrItt-40",
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads",
    allowed_formats: ["jpg", "png", "jpeg","webp"],
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
