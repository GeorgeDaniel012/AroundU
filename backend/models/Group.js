const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    groupName: {
        type: String,
        required: true,
    },
    groupIcon: String, // url or path to group icon, I'll see :p
    theme: { // such as "sports", "art", "social"
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
    location: {
        type: {
            // lat: mongoose.Types.Decimal128,
            // lon: mongoose.Types.Decimal128
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number], // will be actually [longitude, latitude]
            required: true
        },
        //required: true, // groups should have defined location,
                        // don't know how remote groups would work
        _id: false // otherwise location object will have its own id, which is useless
    },
    members: { // array of users in group, with their _id and permission level
        type: [
            {
                member: { type: mongoose.Types.ObjectId, ref: 'User' },
                permission: {
                    type: Number,
                    default: 0 // default permission level is member
                },
                joinedAt: {
                    type: Date,
                    default: Date.now // time when user joins group
                },
                _id: false // otherwise each member object will have its own id in the members array
            }
        ],
        required: true,
        default: []
    },
    /*
    permission levels:
    0 = member -> can view and post messages
    1 = moderator -> can kick members and manage messages
    2 = admin -> can ban users and manage group settings
    3 = owner -> owns the group, can give/take permissions and delete group

    members can grant permissions to others as high as a level below their own:
    - admin makes member a moderator or normal member
    - owner makes member a moderator, admin or normal member
    - normal members and moderators can't change permissions for anyone ;-;
    */
    joinRequests: { // array of users that requested to join group, with their _id and request time
        type: [
            {
                user: { type: mongoose.Types.ObjectId, ref: 'User' },
                requestedAt: {
                    type: Date,
                    default: Date.now // time when user requests to join group
                },
                _id: false // otherwise each joinRequests object will have its own id in the joinRequests array
            }
        ],
        required: false,
        default: []
    },
    // join requests may be optional in case everyone can freely join the group
    bannedUsers: { // array of users that were banned from group, with their _id and ban time
        type: [
            {
                user: { type: mongoose.Types.ObjectId, ref: 'User' },
                bannedAt: {
                    type: Date,
                    default: Date.now // time when user is banned from group
                },
                _id: false // otherwise each bannedUsers object will have its own id in the bannedUsers array
            }
        ],
        required: false,
        default: []
   }
}, { timestamps: true });

/*
the reason why group members, join requests and banned users are stored in arrays inside a group document
instead of a separate document is that it requires less queries ("joins"/populates) and it also doesn't take
up as much valuable space inside the db

this will most likely change if backend db is changed to rdbms
*/

// creates index on location so that geospatial queries can be made
groupSchema.index({ location: '2dsphere' });
// index for members so queries are optimized
groupSchema.index({ "members.member": 1 });


const Group = mongoose.model('Group', groupSchema);
module.exports = Group;