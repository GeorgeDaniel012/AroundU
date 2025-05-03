const fs = require('fs');
const path = require('path');

const uploadDirectory = path.join(__dirname, '../uploads');

const removeFileFromUploads = async (filename) => {
    fs.rm(`${uploadDirectory}/${filename}`, (err) => {
        console.error(err?.message);
    });
}

module.exports = {removeFileFromUploads}