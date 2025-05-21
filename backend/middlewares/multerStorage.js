const multer = require('multer');
const crypto = require('node:crypto');
const fs = require('fs');
const path = require('path');

// directory where uploads (i.e. images) are stored
const uploadDirectory = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory);
}
 
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },
    // filename is a random uuid (which should be url-safe and hopefully safe from collisions!)
    filename: (req, file, cb) => {
        cb(null, crypto.randomUUID() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

module.exports = {upload, uploadDirectory};