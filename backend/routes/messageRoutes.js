const express = require('express');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const Group = require('../models/Group');
const User = require('../models/User');
const verifyToken = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/multerStorage');
const { removeFileFromUploads } = require('../utils/storageHelpers');

const router = express.Router();

// get all messages for a group
router.get('/:groupId', verifyToken, async (req, res) => {
    try {
        // user needs to be logged in to send a message
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

        // a user needs to be in a group to be able to read messages from that group
        const userInGroup = group.members.find(member => member.member.equals(userId));
        if (!userInGroup) {
            return res.status(400).json({ error: 'User not in group' });
        }
        
        const messages = await Message.find({ group: groupId });
        return res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// send message
router.post('/:groupId', verifyToken, async (req, res) => {
    try {
        // user needs to be logged in to send a message
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

        // ofc, a user needs to be in a group to be able to send a message in that group
        const userInGroup = group.members.find(member => member.member.equals(userId));
        if (!userInGroup) {
            return res.status(400).json({ error: 'User not in group' });
        }

        const { content, attachmentType, attachment, attachmentFilename } = req.body;
        if (attachment && (!attachmentFilename || !attachmentType)) {
            return res.status(400).json({ error: 'Attachment filename and type are required' });
        }
        if (!content && !attachment) {
            return res.status(400).json({ error: 'Message is empty' });
        }

        const message = new Message({
            sender: userId,
            group: groupId,
            content,
            attachmentType,
            attachment,
            attachmentFilename
        });
        await message.save();

        res.status(201).json( message );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:messageId', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const messageId = req.params.messageId;
        if (!messageId) {
            return res.status(400).json({ error: 'Message ID is required' });
        }
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        const groupId = message.group;
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        
        // user needs to be moderator or higher to delete messages
        const isModOrHigher = group.members.some(member => member.member.equals(userId) && member.permission >= 1);
        // or needs to have sent the message
        const hasPermission = isModOrHigher || message.sender === userId;
        if (!hasPermission) {
            return res.status(403).json({ error: 'Not allowed' });
        }

        // also remove attachment from uploads
        // if it exists
        if (message.attachment) {
            removeFileFromUploads(message.attachment);
        }

        await Message.findByIdAndDelete(messageId);
        res.status(200).json({ message: 'Message deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;