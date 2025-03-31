require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword, email, });
        const userProfile = new UserProfile({ userId: user._id, displayName: username });
        await user.save();
        await userProfile.save();
        res.status(201).json({ user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        // don't think you need both username and email for login?
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        // why can you not just use the environment variable directly??
        const token = jwt.sign({ userId: user._id }, `${JWT_SECRET}`, {
            expiresIn: '1h',
        });
        res.status(200).json({ token });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;