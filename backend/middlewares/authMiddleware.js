require('dotenv').config();

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

function verifyToken(req, res, next) {
    // authorization header is a bearer token =>
    // => it starts with "Bearer "
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        // this verifies the token with the secret key
        const decodedToken = jwt.verify(token, `${JWT_SECRET}`);
        // does this set the userId field in the request?
        req.userId = decodedToken.userId;
        console.log(decodedToken);
        next();
    } catch(err) {
        return res.status(500).json({ error: err.message });
    }
}

module.exports = verifyToken;