require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET_ACCESS = process.env.JWT_SECRET_ACCESS;
const JWT_EXPIRY_ACCESS = process.env.JWT_EXPIRY_ACCESS || '1h';
const JWT_SECRET_REFRESH = process.env.JWT_SECRET_REFRESH;
const JWT_EXPIRY_REFRESH = process.env.JWT_EXPIRY_REFRESH || '2w';

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;
        if (!username || !password || !email) {
            return res.status(400).json({ error: 'Username, password and email are required' });
        }

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ error: 'Another user already has this username' });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ error: 'Another account already uses this email' });
        }

        const emailInRightFormat = /^[^@]+@[^@]+\.[^@]+$/.test(email);
        if (!emailInRightFormat) {
            return res.status(400).json({ error: 'Email is not in correct format' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword, email, });
        const userProfile = new UserProfile({ userId: user._id, displayName: username });
        await user.save();
        await userProfile.save();

        // maybe this works??
        // this should remove the password field from the user object
        // in app memory, not from db!
        delete user.password;
        res.status(201).json( user );
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
        const accessToken = jwt.sign({ userId: user._id }, `${JWT_SECRET_ACCESS}`, {
            expiresIn: `${JWT_EXPIRY_ACCESS}`,
        });
        const refreshToken = jwt.sign({ userId: user._id }, `${JWT_SECRET_REFRESH}`, {
            expiresIn: `${JWT_EXPIRY_REFRESH}`,
        });

        console.log(user._id);

        res.status(200)
            // refresh token goes into cookie
            .cookie('refreshToken', refreshToken, {
                httpOnly: true,
                sameSite: 'strict'
            })
            // same thing for this user's id
            .cookie('currentUserId', user._id.toString() , {
                httpOnly: true,
                sameSite: 'strict'
            })
            // access token goes into auth header
            .header('Authorization', accessToken)
            .json({ token: accessToken });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// for refreshing the access token
router.post('/refresh', (req, res) => {
    const refreshToken = req.cookies['refreshToken'];
    if (!refreshToken) {
        return res.status(401).json({ error: 'No refresh token' });
    }

    try {
        const decodedRefreshToken = jwt.verify(refreshToken, JWT_SECRET_REFRESH);
        const accessToken = jwt.sign({ userId: decodedRefreshToken.userId }, `${JWT_SECRET_ACCESS}`, {
            expiresIn: `${JWT_EXPIRY_ACCESS}`,
        });

        res.header('Authorization', accessToken)
            .json({ token: accessToken });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
});

module.exports = router;