const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const verifyToken = require('../middlewares/authMiddleware');
const bcrypt = require('bcrypt');
const Group = require('../models/Group');

const router = express.Router();

router.get('/profile/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        // this route is public, so no need for token verification
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const user = await User.findOne({ _id: userId }).select('friends');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const userProfile = await UserProfile.findOne({ userId: userId })
            .select('displayName bio'); // only include wanted fields
        if (!userProfile) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ ...userProfile._doc, friends: user.friends });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/profile/:userId/groups', async (req, res) => {
    try {
        const userId = req.params.userId;
        // this route is public, so no need for token verification
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const user = await User.findOne({ _id: userId }).select('friends');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const groups = await Group.find({ "members.member": userId })
            .select('_id groupName theme');
        res.status(200).json({ groups });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// this route is protected by the verifyToken middleware
router.put('/update', verifyToken, async (req, res) => {
    try {
        // an authenticated user can only update their own profile
        const userId = req.userId;
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

router.delete('/delete', verifyToken, async (req, res) => {
    try {
        // an authenticated user can only delete their own account
        const userId = req.userId;
        const { password } = req.body; // password to be verified again before deletion
        if (!userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const user = await User.findById(userId);
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(403).json({ error: 'Incorrect password' });
        }

        const userProfile = await UserProfile.findOneAndDelete({ userId });
        if (!userProfile) {
            return res.status(404).json({ error: 'User not found' });
        }
        await User.findByIdAndDelete(userId);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;