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
    },
    /*
    the reason why I'm storing groups in each user document
    as well as storing users in each group document
    is because both of the following queries will be executed
    pretty frequently:
    1) get groups that user is in - for users to access messages
        in each group that they're in in the frontend
    2) get users that are in group - to see (short) list of members
        before joining group, and also checking group members in
        frontend screen

    obviously this is not efficient when it comes to document size
    and update operations, but queries should be way more efficient
    this way
    */
    groups: {
        type: [mongoose.Types.ObjectId], // array of group _ids
        ref: 'Group',
        default: []
    },
    friends: {
        type: [mongoose.Types.ObjectId], // array of user _ids
        default: []
    },
    // when user deletes their account it's actually marked as deleted
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { 
    timestamps: true, 
    // passing virtual fields to user objects and JSONs
    toObject: { virtuals: true }, 
    toJSON: { virtuals: true },
});

// creating a virtual userProfile field
// that is a reference to the corresponding
// userProfile of a user
userSchema.virtual('userProfile', {
    ref: 'UserProfile',
    localField: '_id',
    foreignField: 'userId',
    justOne: true
});

// creates an index on email to assure uniqueness of emails
// for not deleted users
// (so if user is marked as deleted then uniqueness is not checked)
userSchema.index(
    { email: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } }
);

const User = mongoose.model('User', userSchema);
module.exports = User;