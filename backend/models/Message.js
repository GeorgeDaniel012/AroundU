const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    // obviously, a message is sent by a user
    sender: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    // in a group
    group: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'Group'
    },
    content: String, // as in text content
    attachmentType: String, // photo, video or other
    attachment: String, // uri of attachment
    attachmentFilename: String, // name of file
    reacts: {
        type: [{
            userWhoReacted: {
                type: mongoose.Types.ObjectId,
                required: true,
                ref: 'User'
            },
            reaction: {
                type: String, // might make it work like discord
                              // if possible and easy enough
                required: true
            },
            _id: false // we don't want every single
                       // reaction to have its own id
        }],
        default: [],
    }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;