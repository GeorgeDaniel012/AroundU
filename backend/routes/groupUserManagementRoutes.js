const express = require('express');
const mongoose = require('mongoose');
const Group = require('../models/Group');
const User = require('../models/User');
const verifyToken = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/:groupId/ban', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const groupId = req.params.groupId;
        if (!groupId) {
            return res.status(400).json({ error: 'Group ID is required' });
        }
        const group = await Group.findById(groupId)
            .select('members bannedUsers')
            // getting username for each user
            .populate({ 
                path: 'bannedUsers.user', 
                select: 'username',
                // and their userIcon through the userProfile virtual field
                populate: {
                    path: 'userProfile',
                    select: '-userId -_id userIcon displayName'
                }
            });
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // user needs to be admin or owner to see banned users
        const hasPermission = group.members.some(member => member.member.equals(userId) && member.permission >= 2);
        if (!hasPermission) {
            return res.status(403).json({ error: 'Not allowed' });
        }

        return res.status(200).json({ bannedUsers: group.bannedUsers });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:groupId/requests', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const groupId = req.params.groupId;
        if (!groupId) {
            return res.status(400).json({ error: 'Group ID is required' });
        }
        const group = await Group.findById(groupId)
            .select('members joinRequests')
            // getting username for each user
            .populate({ 
                path: 'joinRequests.user', 
                select: 'username',
                // and their userIcon through the userProfile virtual field
                populate: {
                    path: 'userProfile',
                    select: '-userId -_id userIcon displayName'
                }
            });
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // user needs to be admin or owner to see join requests
        const hasPermission = group.members.some(member => member.member.equals(userId) && member.permission >= 2);
        if (!hasPermission) {
            return res.status(403).json({ error: 'Not allowed' });
        }

        return res.status(200).json({ joinRequests: group.joinRequests });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// accepting/rejecting user join requests
router.put('/:groupId/requests/:requestingUserId', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const groupId = req.params.groupId;
        if (!groupId) {
            return res.status(400).json({ error: 'Group ID is required' });
        }
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const requestingUserId = req.params.requestingUserId;
        if (!requestingUserId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        const requestingUser = await User.findById(requestingUserId);
        if (!requestingUser) {
            return res.status(404).json({ error: 'Requesting user not found' });
        }
        
        // authenticated user needs to be part of the group whose requests they're accepting/rejecting
        // and also an admin or owner
        const hasPermission = group.members.some(member => member.member.equals(userId) && member.permission >= 2);
        if (!hasPermission) {
            return res.status(403).json({ error: 'Not allowed' });
        }

        // the user whose request you're accepting needs to have sent a request in the first place
        const requestingUserSentRequest = group.joinRequests.some(user => user.user.equals(requestingUserId));
        if (!requestingUserSentRequest) {
            return res.status(404).json({ error: 'User hasn\'t sent request' });
        }

        const { isAccepted } = req.body;
        if (isAccepted === true){
            group.members.push({ member: requestingUserId, permission: 0 });

            requestingUser.groups.push(group._id);
            await requestingUser.save();
        }

        // delete the join request no matter if it's accepted or not
        group.joinRequests = group.joinRequests.filter(request => !request.user.equals(requestingUserId));
        await group.save();
        res.status(200).json({ message: `Join request successfully ${isAccepted ? "accepted" : "rejected"}` });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

router.put('/join/:groupId', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const groupId = req.params.groupId;
        if (!groupId) {
            return res.status(400).json({ error: 'Group ID is required' });
        }
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // ofc, a user needs to not be in a group to be able to join that group
        const userInGroup = group.members.some(member => member.member.equals(userId));
        if (userInGroup) {
            return res.status(400).json({ error: 'Already in group' });
        }

        const userIsBanned = group.bannedUsers.some(user => user.user.equals(userId));
        if (userIsBanned) {
            return res.status(400).json({ error: 'Banned from group' });
        }

        // group needs to be freely joinable for user to join directly
        // else the user sends a join request
        if (!group.everyoneCanJoin) {
            // user needs to not have sent an existing request before
            const userSentRequest = group.joinRequests.some(user => user.user.equals(userId));
            if (userSentRequest) {
                return res.status(400).json({ error: 'Already sent join request' });
            }

            group.joinRequests.push({ user: userId }); // manually putting requestedAt to Date.now errors out
                                                         // so I'm gonna let it be added by default
            await group.save();
            return res.status(200).json({ message: 'Group join request sent successfully' });
        }

        // if everyone can join then the user is added to the members list
        group.members.push({ member: userId, permission: 0 }); // manually putting joinedAt to Date.now errors out
                                                               // so I'm gonna let it be added by default
        await group.save();

        user.groups.push(group._id);
        await user.save();
        res.status(200).json({ message: 'Group joined successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

router.put('/leave/:groupId', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const groupId = req.params.groupId;
        if (!groupId) {
            return res.status(400).json({ error: 'Group ID is required' });
        }
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // ofc, a user needs to be in a group to be able to leave that group
        const userInGroup = group.members.find(member => member.member.equals(userId));
        if (!userInGroup) {
            return res.status(400).json({ error: 'User not in group' });
        }
        // if user is group owner they cannot leave before transferring ownership
        if (userInGroup.permission === 3) {
            return res.status(400).json({ error: 'User is owner of group' });
        }

        // user is removed from member list
        group.members = group.members.filter(member => !member.member.equals(userId));
        await group.save();

        user.groups = user.groups.filter(group => !group.equals(groupId));
        await user.save();

        res.status(200).json({ message: 'Group left successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:groupId/ban/:bannedUserId', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const groupId = req.params.groupId;
        if (!groupId) {
            return res.status(400).json({ error: 'Group ID is required' });
        }
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const bannedUserId = req.params.bannedUserId;
        if (!bannedUserId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        const bannedUser = await User.findById(bannedUserId);
        if (!bannedUser) {
            return res.status(404).json({ error: 'User to be banned not found' });
        }
        
        // authenticated user needs to be admin or owner to ban users
        const permittedUser = group.members.find(member => member.member.equals(userId) && member.permission >= 2);
        const toBeBannedUser = group.members.find(member => member.member.equals(bannedUserId));
        // so if no user with that userId and also sufficient permissions exists
        // or if a user like that exists but is trying to ban someone with higher permissions
        if (!permittedUser || !toBeBannedUser || (permittedUser.permission <= toBeBannedUser.permission)) { 
            return res.status(403).json({ error: 'Not allowed' });
        }

        // if user is in group they are removed
        group.members = group.members.filter(member => !member.member.equals(bannedUserId));
        // they are then added to banned user list
        group.bannedUsers.push({ user: bannedUserId });
        await group.save();

        // if user is in group the group is removed from their list
        bannedUser.groups = bannedUser.groups.filter(group => !group.equals(groupId));
        await bannedUser.save();

        const io = req.io;
        io.to(groupId).emit('userKickOrBan', kickedUserId);
        
        res.status(200).json({ message: 'User banned successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:groupId/unban/:unbannedUserId', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const groupId = req.params.groupId;
        if (!groupId) {
            return res.status(400).json({ error: 'Group ID is required' });
        }
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const unbannedUserId = req.params.unbannedUserId;
        if (!unbannedUserId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        const unbannedUser = await User.findById(unbannedUserId);
        if (!unbannedUser) {
            return res.status(404).json({ error: 'User to be unbanned not found' });
        }
        
        // authenticated user needs to be admin or owner to unban users
        const permittedUser = group.members.find(member => member.member.equals(userId) && member.permission >= 2);
        const toBeUnbannedUser = group.bannedUsers.find(user => user.user.equals(unbannedUserId));
        // so if no user that was previously banned with this id exists
        // or user is not permitted to unban
        if (!permittedUser || !toBeUnbannedUser) {
            return res.status(403).json({ error: 'Not allowed' });
        }

        // user is removed from ban list
        group.bannedUsers = group.bannedUsers.filter(user => !user.user.equals(unbannedUserId));
        await group.save();
        res.status(200).json({ message: 'User unbanned successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:groupId/kick/:kickedUserId', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const groupId = req.params.groupId;
        if (!groupId) {
            return res.status(400).json({ error: 'Group ID is required' });
        }
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const kickedUserId = req.params.kickedUserId;
        if (!kickedUserId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        const kickedUser = await User.findById(kickedUserId);
        if (!kickedUser) {
            return res.status(404).json({ error: 'User to be kicked not found' });
        }
        
        // authenticated user needs to be moderator or higher to kick users
        const permittedUser = group.members.find(member => member.member.equals(userId) && member.permission >= 1);
        const toBeKickedUser = group.members.find(member => member.member.equals(kickedUserId));
        // so if no user with that userId and also sufficient permissions exists
        // or if a user like that exists but is trying to kick someone with higher permissions
        if (!permittedUser || !toBeKickedUser || (permittedUser.permission <= toBeKickedUser.permission)) { 
            return res.status(403).json({ error: 'Not allowed' });
        }

        // user is removed from group
        group.members = group.members.filter(member => !member.member.equals(kickedUserId));
        await group.save();

        // group is removed from user's list
        kickedUser.groups = kickedUser.groups.filter(group => !group.equals(groupId));
        await kickedUser.save();

        const io = req.io;
        io.to(groupId).emit('userKickOrBan', kickedUserId);

        res.status(200).json({ message: 'User kicked successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// give permission levels 0-2 to other members
router.put('/:groupId/permissions/:groupMemberId', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const groupId = req.params.groupId;
        if (!groupId) {
            return res.status(400).json({ error: 'Group ID is required' });
        }
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const groupMemberId = req.params.groupMemberId;
        if (!groupMemberId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        const groupMember = await User.findById(groupMemberId);
        if (!groupMember) {
            return res.status(404).json({ error: 'User to be granted permissions not found' });
        }

        const { permissionLevel } = req.body; // is a number between 0-2 preferably!
        if (permissionLevel > 3 || permissionLevel < 0) {
            return res.status(400).json({ error: 'Invalid permission level' });
        }
        
        // authenticated user can grant permissions only as high as a level below their own
        const permittedUser = group.members.find(member => member.member.equals(userId));
        const toBeGrantedPermissionsUser = group.members.find(member => member.member.equals(groupMemberId));
        // so if no user with that userId and also sufficient permissions exists
        // or if a user like that exists but is trying to grant someone with higher permissions
        // or the permissions they're granting are equal to or higher than their own
        if (!permittedUser || !toBeGrantedPermissionsUser
            || (permittedUser.permission <= toBeGrantedPermissionsUser.permission)
            || (permittedUser.permission <= permissionLevel)) { 
            return res.status(403).json({ error: 'Not allowed' });
        }

        group.members.map(member => {
            // for the user whose permissions we're changing
            if (member.member.equals(groupMemberId)) {
                member.permission = permissionLevel;
            }
            return member;
        });
        await group.save();

        // updating permissions in real time for group members
        // so that an ex-mod+ cannot attempt to delete messages
        const io = req.io;
        io.to(groupId).emit('changePermissions', { memberId: groupMemberId, permissionLevel: permissionLevel });
        console.log('updated permissions?');

        res.status(200).json({ message: 'User granted permissions successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// transfer ownership to another person as owner
// i.e. give them level 3
// the previous owner becomes admin instead (level 2)
router.put('/:groupId/transfer/:groupMemberId', verifyToken, async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const groupId = req.params.groupId;
        if (!groupId) {
            return res.status(400).json({ error: 'Group ID is required' });
        }
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const groupMemberId = req.params.groupMemberId;
        if (!groupMemberId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        const groupMember = await User.findById(groupMemberId);
        if (!groupMember) {
            return res.status(404).json({ error: 'User to be granted permissions not found' });
        }
        
        // only owner can transfer ownership
        const permittedUser = group.members.find(member => member.member.equals(userId) && member.permission === 3);
        const toBeGrantedPermissionsUser = group.members.find(member => member.member.equals(groupMemberId));
        // so if no user with that userId and also sufficient permissions exists
        if (!permittedUser || !toBeGrantedPermissionsUser) { 
            return res.status(403).json({ error: 'Not allowed' });
        }

        group.members.map(member => {
            // for the user who is becoming new owner
            if (member.member.equals(groupMemberId)) {
                member.permission = 3;
            }

            // for the previous owner
            if (member.member.equals(userId)) {
                member.permission = 2;
            }
            return member;
        });
        await group.save();
        res.status(200).json({ message: 'Transferred ownership to user successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;