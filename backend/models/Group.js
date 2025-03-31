const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    groupName: {
        type: String,
        required: true,
    },
    theme: { // such as "sports", "music", "art"
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    tags: { // for example "beginners", "competitive"
        type: [String], 
        default: []
    },
    everyoneCanJoin: { // if true, anyone can join the group without approval
        type: Boolean,
        default: false
    },
    members: { // array of users in group, with their _id and permission level
        type: [
            {
                member: mongoose.Types.ObjectId,
                permission: {
                    type: Number,
                    default: 0 // default permission level is member
                }
            }
        ],
        default: []
    }
    /*
    permission levels:
    0 = member -> can view and post messages
    1 = moderator -> can manage members and messages
    2 = admin -> can manage group settings
    3 = owner -> owns the group, can give/take permissions and delete group
    */
}, { timestamps: true });

const Group = mongoose.model('Group', groupSchema);
module.exports = Group;