const express = require('express');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const verifyToken = require('../middlewares/authMiddleware');
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

// route to upload file
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (!req.file || !req.file.fieldname === 'file') {
            return res.status(400).json({ error: 'Did not receive file' });
        }

        const filenameOfAttachment = req.file.filename;
        res.status(201).json( filenameOfAttachment );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;