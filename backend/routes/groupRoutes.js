const express = require('express');
const mongoose = require('mongoose');
const Group = require('../models/Group');
const User = require('../models/User');
const verifyToken = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/multerStorage');
const { removeFileFromUploads } = require('../utils/storageHelpers');

const router = express.Router();

router.get('/:groupId', async (req, res) => {
    try {
        const groupId = req.params.groupId;
        if (!groupId) {
            return res.status(400).json({ error: 'Group ID is required' });
        }
        const group = await Group.findById(groupId)
            // banned users and join requests might be sensitive info
            .select('-__v -createdAt -updatedAt -joinRequests -bannedUsers');
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        return res.status(200).json( group );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:groupId/members', async (req, res) => {
    try {
        const groupId = req.params.groupId;
        if (!groupId) {
            return res.status(400).json({ error: 'Group ID is required' });
        }
        const group = await Group.findById(groupId)
            .select('members')
            // getting username for each member
            .populate({ 
                path: 'members.member', 
                select: 'username',
                // and their userIcon through the userProfile virtual field
                populate: {
                    path: 'userProfile',
                    select: '-userId -_id userIcon displayName'
                }
            });
            //.populate('members.member', 'username userProfile')
            //.populate('userProfile', 'userIcon');
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // return only not deleted users
        const memberList = group.members.filter(member => !member.isDeleted);

        return res.status(200).json( memberList );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// get all routes within a certain radius from a point (which is to be user's location)
router.post('/search', async (req, res) => {
    try {
        const { lat, lon, radius } = req.body; // radius in meters

        if (typeof lat === "undefined" || typeof lon === "undefined") {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }
        if (lat < -90 || lat > 90) {
            return res.status(400).json({ error: 'Latitude must be between -90 and 90' });
        }
        if (lon < -180 || lon > 180) {
            return res.status(400).json({ error: 'Longitude must be between -180 and 180' });
        }
        if (typeof radius === "undefined") {
            return res.status(400).json({ error: 'Radius is required' });
        }
        if (radius < 0) {
            return res.status(400).json({ error: 'Radius must be positive' });
        }

        const groups = await Group.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lon, lat]
                    },
                    $maxDistance: radius
                }
            }
        })
            // arbitrary limit, might change 
            .limit(50) 
            // banned users and join requests might be sensitive info
            .select('-__v -createdAt -updatedAt -joinRequests -bannedUsers');
        
        return res.status(200).json( groups );
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
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { groupName, theme, description, tags, everyoneCanJoin, lat, lon } = req.body;
        if (typeof groupName === "undefined" || typeof theme === "undefined" || typeof description === "undefined") {
            return res.status(400).json({ error: 'Group name, theme, and description are required' });
        }
        if (typeof lat === "undefined" || typeof lon === "undefined") {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }
        if (lat < -90 || lat > 90) {
            return res.status(400).json({ error: 'Latitude must be between -90 and 90' });
        }
        if (lon < -180 || lon > 180) {
            return res.status(400).json({ error: 'Longitude must be between -180 and 180' });
        }

        const group = new Group({
            groupName,
            theme,
            description,
            tags,
            everyoneCanJoin,
            location: { 
                type: 'Point',
                coordinates: [lon, lat]
            },
            members: [{ member: userId, permission: 3 }] // owner has permission level 3
        });
        await group.save();

        user.groups.push(group._id);
        await user.save();

        res.status(201).json( group );
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
        if (typeof groupName !== "undefined") group.groupName = groupName;
        if (typeof theme !== "undefined") group.theme = theme;
        if (typeof description !== "undefined") group.description = description;
        if (typeof tags !== "undefined") group.tags = tags;
        if (typeof everyoneCanJoin !== "undefined") group.everyoneCanJoin = everyoneCanJoin;
        if (everyoneCanJoin) group.joinRequests = []; // if everyoneCanJoin is set to true delete all requests
                                                      // like what twitter does with follow requests

        await group.save();
        res.status(200).json( group );
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

        const { lat, lon } = req.body;
        if (!lat || !lon) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }
        if (lat < -90 || lat > 90) {
            return res.status(400).json({ error: 'Latitude must be between -90 and 90' });
        }
        if (lon < -180 || lon > 180) {
            return res.status(400).json({ error: 'Longitude must be between -180 and 180' });
        }

        group.location = { 
            type: 'Point',
            coordinates: [lon, lat]
        };
        await group.save();
        res.status(200).json( group );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// route for setting/uploading group picture
router.put('/:groupId/pic', verifyToken, upload.single('groupIcon'), async (req, res) => {
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

        if (!req.file || !req.file.fieldname === 'groupIcon') {
            return res.status(400).json({ error: 'Did not receive group icon' });
        }
        
        group.groupIcon = req.file.filename;
        await group.save();
        res.status(200).json( group );
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

        // also remove group icon from storage
        storageHelpers.removeFileFromUploads(group.groupIcon);

        await Group.findByIdAndDelete(groupId);
        res.status(200).json({ message: 'Group deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// deleting current group pic
router.delete('/:groupId/pic', verifyToken, async (req, res) => {
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
        
        // also remove group icon from storage
        removeFileFromUploads(group.groupIcon);
        group.groupIcon = undefined;

        await group.save();
        res.status(200).json( group );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;