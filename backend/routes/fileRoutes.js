const express = require('express');
const path = require('path');
const fs = require('fs');
const { upload, uploadDirectory } = require('../middlewares/multerStorage');

const router = express.Router();

// route to get file from filename
router.get('/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDirectory, filename);
  
    fs.readFile(filePath, (err, data) => {
        if (err) {
            return res.status(404).send('File not found.');
        }
        res.set('Content-Type', 'image');
        res.send(data);
    });
});

module.exports = router;