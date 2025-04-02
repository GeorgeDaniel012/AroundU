const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        required: true,
        unique: true,
    },
    displayName: {
        type: String,
        required: true,
    },
    bio: String,
    userIcon: String, // url or path to group icon, I'll see :p
    friends: {
        type: [mongoose.Types.ObjectId], // array of user _ids
        default: []
    }
}, { timestamps: true });

const UserProfile = mongoose.model('UserProfile', userProfileSchema);
module.exports = UserProfile;