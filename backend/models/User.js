const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // username =/= display name
    username: {
        type: String,
        required: true,
        unique: true,
    },
    // password to be hashed at user creation
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;