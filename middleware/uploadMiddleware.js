const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'pawcare_assets',
    allowed_formats: ['jpg', 'png', 'jpeg'], // Need to use allowed_formats as per cloudinary storage library standard
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
