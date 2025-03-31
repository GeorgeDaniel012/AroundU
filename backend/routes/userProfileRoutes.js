const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const verifyToken = require('../middlewares/authMiddleware');

const router = express.Router();

// this route is protected by the verifyToken middleware
router.put('/update', verifyToken, async (req, res) => {
    try {
        // an authenticated user can only update their own profile
        const userId = req.userId;
        console.log(req.userId)
        if (!userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const { displayName, bio } = req.body;
        const userProfile = await UserProfile.findOne({ userId });
        if (!userProfile) {
            return res.status(404).json({ error: 'User not found' });
        }
        userProfile.displayName = displayName;
        userProfile.bio = bio;
        await userProfile.save();
        res.status(200).json({ userProfile });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;