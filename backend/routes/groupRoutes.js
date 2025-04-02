const express = require('express');
const mongoose = require('mongoose');
const Group = require('../models/Group');
const User = require('../models/User');
const verifyToken = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/:groupId', async (req, res) => {
    try {
        const groupId = req.params.groupId;
        if (!groupId) {
            return res.status(400).json({ error: 'Group ID is required' });
        }
        const group = await Group.findById(groupId)
            // banned users and join requests might be sensitive info
            .select('-_id -__v -createdAt -updatedAt -joinRequests -bannedUsers');
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        return res.status(200).json({ group });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', verifyToken, async (req, res) => {
    try {
        // user needs to be logged in to create a group
        const userId = req.userId;
        if (!userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { groupName, theme, description, tags, everyoneCanJoin, lat, long } = req.body;
        if (!groupName || !theme || !description) {
            return res.status(400).json({ error: 'Group name, theme, and description are required' });
        }

        const group = new Group({
            groupName,
            theme,
            description,
            tags,
            everyoneCanJoin,
            location: { lat, long },
            members: [{ member: userId, permission: 3 }] // owner has permission level 3
        });
        await group.save();
        res.status(201).json({ group });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// updating everything but group icon and location
router.put('/:groupId/general', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const groupId = req.params.groupId;
        if (!groupId) {
            return res.status(400).json({ error: 'Group ID is required' });
        }
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        
        // user needs to be part of the group they're editing
        // and also an admin or owner
        const hasPermission = group.members.some(member => member.member.equals(userId) && member.permission >= 2);
        if (!hasPermission) {
            return res.status(403).json({ error: 'Not allowed' });
        }

        // preferably frontend should return these fields with the correct datatypes
        const { groupName, theme, description, tags, everyoneCanJoin } = req.body;
        group.groupName = groupName;
        group.theme = theme;
        group.description = description;
        group.tags = tags;
        group.everyoneCanJoin = everyoneCanJoin;
        await group.save();
        res.status(200).json({ group });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// route to be called on a separate frontend screen from general info edits
router.put('/:groupId/location', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const groupId = req.params.groupId;
        if (!groupId) {
            return res.status(400).json({ error: 'Group ID is required' });
        }
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        
        // user needs to be part of the group they're editing
        // and also an admin or owner
        const hasPermission = group.members.some(member => member.member.equals(userId) && member.permission >= 2);
        if (!hasPermission) {
            return res.status(403).json({ error: 'Not allowed' });
        }

        const { lat, long } = req.body;
        group.location.lat = lat;
        group.location.long = long;
        await group.save();
        res.status(200).json({ group });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:groupId', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const groupId = req.params.groupId;
        if (!groupId) {
            return res.status(400).json({ error: 'Group ID is required' });
        }
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        
        // user needs to be owner to delete group
        const hasPermission = group.members.some(member => member.member.equals(userId) && member.permission === 3);
        if (!hasPermission) {
            return res.status(403).json({ error: 'Not allowed' });
        }

        await Group.findByIdAndDelete(groupId);
        res.status(200).json({ message: 'Group deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;