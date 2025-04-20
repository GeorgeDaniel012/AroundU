require('dotenv').config();

const jwt = require('jsonwebtoken');

const JWT_SECRET_ACCESS = process.env.JWT_SECRET_ACCESS;
const JWT_EXPIRY_ACCESS = process.env.JWT_EXPIRY_ACCESS || '1h';
const JWT_SECRET_REFRESH = process.env.JWT_SECRET_REFRESH;
const JWT_EXPIRY_REFRESH = process.env.JWT_EXPIRY_REFRESH || '2w';

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const refreshToken = req.cookies['refreshToken'];

    if (!authHeader) { // so if auth header is empty
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // commented code may not be correct anymore
    /*
    // authorization header is a bearer token =>
    // => it starts with "Bearer "
    const token = req.headers.authorization.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    */

    const accessToken = authHeader.split(' ')[1];
    
    try {
        // this verifies the token with the secret key
        const decodedAccessToken = jwt.verify(accessToken, `${JWT_SECRET_ACCESS}`);
        // does this set the userId field in the request?
        req.userId = decodedAccessToken.userId;
        next();
    } catch(err) {
        return res.status(401).json({ error: 'Unauthorized' });
        // commented code refreshes access token if the refresh token is valid
        // but I've decided to make the client refresh the access token manually instead
//         if (!refreshToken) {
//             return res.status(401).json({ error: 'No refresh token' });
//         }

//         // refreshes access token
//         try {
//             const decodedRefreshToken = jwt.verify(refreshToken, JWT_SECRET_REFRESH);
//             const newAccessToken = jwt.sign({ userId: decodedRefreshToken.userId }, `${JWT_SECRET_ACCESS}`, {
//                         expiresIn: `${JWT_EXPIRY_ACCESS}`,
//             });
//             res.setHeader('Authorization', `Bearer ${newAccessToken}`);
//             next();
//         } catch (err) {
//             return res.status(400).json({ error: err.message });
//         }
    }
}

module.exports = verifyToken;