import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Linking, Button, ScrollView, TouchableOpacity, Image, StyleSheet, Alert, TouchableWithoutFeedback, Modal } from 'react-native';
import axiosInstance from '../utils/axiosInstance';
import BackButton from '../components/BackButton';
import Icon from "react-native-vector-icons/FontAwesome5";
import globalStyles from '../styles/globalStyles';
import { getIconForTheme, getScreenHeight, scaleSize } from "../utils/helpers";
import { CONNECTION } from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import { AuthContext } from '../contexts/AuthContext';
import ReviewRequestsModal from '../components/ReviewRequestsModal';
import { SafeAreaView } from 'react-native-safe-area-context';

const permissionLevelsList = [
    {
        id: 0,
        levelName: '',
        color: 'rgba(0, 0, 0, 0)'
    },
    {
        id: 1,
        levelName: 'Mod',
        color: 'yellow'
    },
    {
        id: 2,
        levelName: 'Admin',
        color: 'orange'
    },
    {
        id: 3,
        levelName: 'Owner',
        color: 'red'
    },
];

const getPermissionLevel = (permission) => {
    const permissionLevel = permissionLevelsList.find(perm => perm.id === permission);
    return permissionLevel;
}

const MemberInfo = ({ navigation, ...props }) => {
    const { member, permission, joinedAt, setSelectedMember, setSelectedMemberPermission, setIsModalVisible,  } = props;
    const { _id, userProfile } = member;
    const [currentPermission, setCurrentPermission] = useState(permission);
    const [permissionLevel, setPermissionLevel] = useState(getPermissionLevel(permission));
    const [imageError, setImageError] = useState(false);
    
    useEffect(() => {
        setPermissionLevel(getPermissionLevel(currentPermission));
    }, [currentPermission]);

    return (
        <TouchableOpacity
            style={styles.member}
            //onPress={() => navigation.navigate("ProfileScreen", { userId: _id })}
            onPress={() => {setSelectedMember(member); setIsModalVisible(true); setSelectedMemberPermission(currentPermission)}}
        >
            <View style={{ flex: 1, flexDirection: 'row', gap: 20, alignItems: 'center' }}>
                {
                    imageError ?
                    <Image
                        source={ require('../assets/images/missing_user_icon.png') }
                        style={{ width: scaleSize(30), height: scaleSize(30), borderRadius: 50 }}
                        resizeMode="contain"
                    /> :
                    <Image
                        source={{ uri: `${CONNECTION}/static/${userProfile.userIcon}`, cache: 'reload' }}
                        style={{ width: scaleSize(30), height: scaleSize(30), borderRadius: 50 }}
                        resizeMode="contain"
                        onError={({nativeEvent: {error}}) => {
                            setImageError(true);
                        }}
                    />
                }
                <Text style={{...globalStyles.unselectedThemeText}}>{userProfile.displayName}</Text>
            </View>
            <View style={{...styles.permissionLevelTag, borderColor: permissionLevel.color}}>
                <Text style={{...styles.permissionLevelTagText, color: permissionLevel.color}}>{permissionLevel.levelName}</Text>
            </View>
        </TouchableOpacity>
    )
}

const MemberManageModal = ({ navigation, ...props }) => {
    const { fetchInfo, groupId, member, memberPermission, isVisible, closeModal, permissionLevel, currentUserId, accessToken } = props;

    const handleProfileView = () => {
        console.log('member.id:', member._id);
        console.log('currentId:', currentUserId);
        console.log('permissionLevel:', permissionLevel);
        console.log('member.permission', memberPermission);
        closeModal();
        navigation.navigate("ProfileScreen", { userId: member?._id });
    }

    const handleKick = async () => {
        try {
            const res = await axiosInstance.put(`/group/${groupId}/kick/${member._id}`, {}, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                validateStatus: status => status < 500, // throw error if status is at least 500
            });

            if (res.status >= 400) {
                const errorMessage = res.data.error;
                console.log(errorMessage);
                Alert.alert('Error', errorMessage);
            }

            if (res.status === 200) {
                Alert.alert('Success', 'Kicked user successfully.');
            }
            
            fetchInfo();
            closeModal();
        } catch (err) {
            console.error('Error kicking user:', err);
            Alert.alert('Error', 'Failed to kick user');
        }
    }

    const handleBan = async () => {
        try {
            const res = await axiosInstance.put(`/group/${groupId}/ban/${member._id}`, {}, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                validateStatus: status => status < 500, // throw error if status is at least 500
            });

            if (res.status >= 400) {
                const errorMessage = res.data.error;
                console.log(errorMessage);
                Alert.alert('Error', errorMessage);
            }

            if (res.status === 200) {
                Alert.alert('Success', 'Banned user successfully.');
            }
            
            fetchInfo();
            closeModal();
        } catch (err) {
            console.error('Error banning user:', err);
            Alert.alert('Error', 'Failed to ban user');
        }
    }

    const handlePermissionChange = async (perm) => {
        try {
            const res = await axiosInstance.put(`/group/${groupId}/permissions/${member._id}`, {
                permissionLevel: perm
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                validateStatus: status => status < 500, // throw error if status is at least 500
            });

            if (res.status >= 400) {
                const errorMessage = res.data.error;
                console.log(errorMessage);
                Alert.alert('Error', errorMessage);
            }

            if (res.status === 200) {
                Alert.alert('Success', 'Changed user permissions successfully.');
            }
            
            fetchInfo();
            closeModal();
        } catch (err) {
            console.error('Error changing user permissions:', err);
            Alert.alert('Error', 'Failed to change user permissions');
        }
    }

    const handleOwnershipTransfer = async () => {
        try {
            const res = await axiosInstance.put(`/group/${groupId}/transfer/${member._id}`, {}, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                validateStatus: status => status < 500, // throw error if status is at least 500
            });

            if (res.status >= 400) {
                const errorMessage = res.data.error;
                console.log(errorMessage);
                Alert.alert('Error', errorMessage);
            }

            if (res.status === 200) {
                Alert.alert('Success', 'Transferred ownership successfully.');
            }
            
            fetchInfo();
            closeModal();
        } catch (err) {
            console.error('Error transferring ownership:', err);
            Alert.alert('Error', 'Failed to transfer ownership');
        }
    }

    return (
        <Modal
            visible={isVisible}
            onRequestClose={closeModal}
            transparent={true}
            animationType='fade'
        >
            <TouchableWithoutFeedback onPress={closeModal}>
                <View style={styles.modalContainer}>
                    {/* making an inner touchable without propagation
                        so that it doesn't close after pressing anywhere on the modal
                        but rather "outside" it
                    */}
                    <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
                        <View style={styles.modalContent}>
                            <TouchableOpacity onPress={handleProfileView} style={styles.modalOptions}>
                                <Text style={globalStyles.unselectedThemeText}>View {member?.userProfile.displayName}'s profile</Text>
                            </TouchableOpacity>

                            {   // user is moderator or higher
                                // and of higher rank than the other user
                                (currentUserId !== member?._id && permissionLevel >= 1 && memberPermission < permissionLevel) &&
                                <TouchableOpacity onPress={handleKick} style={styles.modalOptions}>
                                    <Text style={globalStyles.unselectedThemeText}>Kick {member?.userProfile.displayName}</Text>
                                </TouchableOpacity>
                            }

                            {   // user is admin or higher
                                // and of higher rank than the other user
                                (currentUserId !== member?._id && permissionLevel >= 2 && memberPermission < permissionLevel) &&
                                <TouchableOpacity onPress={handleBan} style={styles.modalOptions}>
                                    <Text style={globalStyles.unselectedThemeText}>Ban {member?.userProfile.displayName}</Text>
                                </TouchableOpacity>
                            }

                            {
                                (currentUserId !== member?._id && permissionLevel >= 2 && memberPermission < permissionLevel) &&
                                permissionLevelsList.map((permission) => {
                                    if (permission.id < permissionLevel && permission.id !== memberPermission) {
                                        return (
                                            <TouchableOpacity key={permission.id} onPress={() => handlePermissionChange(permission.id)} style={styles.modalOptions}>
                                                {
                                                    permission.id !== 0 ?
                                                    <Text style={globalStyles.unselectedThemeText}>Make {member?.userProfile.displayName} {permission.levelName}</Text> :
                                                    <Text style={globalStyles.unselectedThemeText}>Demote {member?.userProfile.displayName}</Text>
                                                }
                                            </TouchableOpacity>
                                        );
                                    }
                                    return null;
                                })
                            }

                            {   // user is owner
                                (currentUserId !== member?._id && permissionLevel === 3) &&
                                <TouchableOpacity onPress={handleOwnershipTransfer} style={styles.modalOptions}>
                                    <Text style={globalStyles.unselectedThemeText}>Transfer ownership to {member?.userProfile.displayName}</Text>
                                </TouchableOpacity>
                            }
                        </View>
                    </TouchableWithoutFeedback>
                </View>
                {/* <BackButton onPress={closeModal}/> */}
                
            </TouchableWithoutFeedback>
        </Modal>
    )
}

// props = groupinfo that is fetched by discover/search screen
const GroupInfo = ({ navigation, ...props }) => {
    const { group } = props.route.params;
    const groupId = group._id;
    const [groupInfo, setGroupInfo] = useState(group);
    const [currentUserId, setCurrentUserId] = useState('');
    const [permissionLevel, setPermissionLevel] = useState(0);
    const [userInGroup, setUserInGroup] = useState(false);
    const [memberList, setMemberList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    const [isModalVisible, setModalVisible] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [selectedMemberPermission, setSelectedMemberPermission] = useState(0);

    const [isRequestsModalVisible, setRequestsModalVisible] = useState(false);

    const { accessToken } = useContext(AuthContext);

    const handleJoinGroup = async () => {
        try {
            const res = await axiosInstance.put(`group/join/${groupId}`, {}, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                validateStatus: status => status < 500, // throw error if status is at least 500
            });

            if (res.status >= 400) {
                const errorMessage = res.data.error;
                console.log('error joining: ', errorMessage);
                Alert.alert('Error', errorMessage);
            }

            if (res.status === 200) {
                Alert.alert('Success', 
                    groupInfo.everyoneCanJoin ? 
                    'Group joined successfully!' :
                    'Join request sent successfully!'
                );
            }

            fetchInfo();
        } catch (err) {
            console.error('Error joining group:', err);
            Alert.alert('Error', 
                groupInfo.everyoneCanJoin ? 
                'Failed to join group' :
                'Failed to send join request'
            );
        }
    }

    const handleLeaveGroup = async () => {
        if (permissionLevel === 3) {
            Alert.alert('Error', 'Owner cannot leave their group unless they transfer ownership.');
            return;
        }

        try {
            const res = await axiosInstance.put(`group/leave/${groupId}`, {}, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                validateStatus: status => status < 500, // throw error if status is at least 500
            });

            if (res.status >= 400) {
                const errorMessage = res.data.error;
                console.log('error leaving: ', errorMessage);
                Alert.alert('Error', errorMessage);
            }

            if (res.status === 200) {
                Alert.alert('Success', 'Group left successfully.');
            }

            fetchInfo();
        } catch (err) {
            console.error('Error leaving group:', err);
            Alert.alert('Error', 'Failed to leave group');
        }
    }

    const fetchInfo = async () => {
        try {
            const userId = await AsyncStorage.getItem('currentUserId');
            setCurrentUserId(userId);

            const resGroup = await axiosInstance.get(`/group/${groupId}`);

            if (resGroup.status >= 400) {
                const errorMessage = resGroup.data.error;
                console.log(errorMessage);
                Alert.alert('Error', errorMessage);
            }

            if (resGroup.status === 200) {
                setGroupInfo(resGroup.data);
            }

            const resMembers = await axiosInstance.get(`/group/${groupId}/members`);

            if (resMembers.status >= 400) {
                const errorMessage = resMembers.data.error;
                console.log(errorMessage);
                Alert.alert('Error', errorMessage);
            }

            if (resMembers.status === 200) {
                setMemberList(resMembers.data);
            }

            // checking if logged in user is a member of the group
            // to determine if moderation options should be shown
            const userInMemberList = resMembers.data
                .find(member => member.member._id === userId);
            if (userInMemberList) {
                setPermissionLevel(userInMemberList.permission);
                setUserInGroup(true);
            } else {
                setPermissionLevel(0);
                setUserInGroup(false);
            }

            setIsLoading(false);
        } catch (err) {
            console.error('Error fetching group info:', err);
            Alert.alert('Error', 'Failed to fetch group info');
        }
    }

    useEffect(() => {
        fetchInfo();
    }, []);

    return (
        <ScrollView contentContainerStyle={{ justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
            <BackButton navigation={navigation}/>
            {
                isLoading ?
                <Text>Loading</Text> :
                // <ScrollView
                //     contentContainerStyle={{ flexWrap: 'wrap', maxWidth: 300, justifyContent: 'center', alignItems: 'center' }}
                //     nestedScrollEnabled={true} 
                //     horizontal={false}
                // >
                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ flex: 1, height: getScreenHeight(2/6), justifyContent: 'center', alignItems: 'center' }}>
                        {
                            imageError ?
                            <Image
                                source={ require('../assets/images/missing_group_icon.png') }
                                style={{ width: scaleSize(140), height: scaleSize(140), borderRadius: 100 }}
                                resizeMode="contain"
                            /> :
                            <Image
                                source={{ uri: `${CONNECTION}/static/${groupInfo.groupIcon}`, cache: 'reload' }}
                                style={{ width: scaleSize(140), height: scaleSize(140), borderRadius: 100 }}
                                resizeMode="contain"
                                onError={({nativeEvent: {error}}) => {
                                    setImageError(true);
                                }}
                            />
                        }
                    </View>

                    <View style={{ flex: 1, minHeight: getScreenHeight(1/6), alignItems: 'center', maxWidth: scaleSize(300), }}>
                        <Text style={{...globalStyles.nameText, marginBottom: scaleSize(10)}}>{groupInfo.groupName}</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: scaleSize(20) }}>
                            <Text style={{...globalStyles.unselectedThemeText}}>{groupInfo.theme}</Text>
                            <Icon
                                name={getIconForTheme(groupInfo.theme)}
                                size={scaleSize(21)}
                                color="black"
                                style={{marginLeft: 10}}
                            />
                        </View>
                        <ScrollView>
                            <Text style={globalStyles.unselectedThemeText}>{groupInfo.description}</Text>
                        </ScrollView>
                        {/* <Text style={globalStyles.unselectedThemeText}>{groupInfo.location.coordinates}</Text> */}
                    </View>

                    <View style={{ flex: 1, minHeight: getScreenHeight(1/6), alignItems: 'center', width: scaleSize(300), borderRadius: 10, borderWidth: 1, marginTop: scaleSize(12) }}>
                        <Text style={{ fontSize: scaleSize(16), marginTop: scaleSize(12) }}>Group members:</Text>
                        {memberList.map((item, index) => (
                            <MemberInfo
                                key={`${index}-${item.member._id}-${item.permission}`}
                                member={item.member}
                                permission={item.permission}
                                joinedAt={item.joinedAt}
                                navigation={navigation}
                                setSelectedMember={setSelectedMember}
                                setSelectedMemberPermission={setSelectedMemberPermission}
                                setIsModalVisible={setModalVisible}
                            />
                        ))}
                    </View>

                    {/* <ScrollView
                        contentContainerStyle={{ ...styles.membersContainer}}
                        nestedScrollEnabled={true} 
                        horizontal={false}
                    >
                        {memberList.map((item, index) => (
                            <MemberInfo
                                key={index}
                                member={item.member}
                                permission={item.permission}
                                joinedAt={item.joinedAt}
                                navigation={navigation}
                            />
                        ))}
                    </ScrollView> */}

                    <View style={{ height: getScreenHeight(2/6), justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: scaleSize(12) }}>{groupInfo.tags.map(tag => `#${tag} `)}</Text>
                        <TouchableOpacity 
                            style={globalStyles.buttons} 
                            onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${groupInfo.location.coordinates[1]}%2C${groupInfo.location.coordinates[0]}`)}
                        >
                            <Text style={{...globalStyles.buttonText, fontSize: scaleSize(22)}}>See on Google Maps</Text>
                            <Icon name="map-marker" size={scaleSize(21)} color='white' style={{marginLeft: 10}}/>
                        </TouchableOpacity>

                        {
                            userInGroup &&
                            <TouchableOpacity 
                                style={globalStyles.buttons} 
                                onPress={() => navigation.navigate('MessagesScreen', { groupInfo: groupInfo })}
                            >
                                <Text style={{...globalStyles.buttonText, fontSize: scaleSize(22)}}>Chat</Text>
                                <Icon name="pen" size={scaleSize(21)} color='white' style={{marginLeft: 10}}/>
                            </TouchableOpacity>
                        }

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {   
                                // only admins and the owner can edit the group
                                permissionLevel >= 2 && 
                                <TouchableOpacity 
                                    style={globalStyles.buttons} 
                                    onPress={() => navigation.navigate('EditGroup', { groupInfo: groupInfo })}
                                >
                                    <Text style={{...globalStyles.buttonText, fontSize: scaleSize(22)}}>Edit</Text>
                                    <Icon name="edit" size={scaleSize(21)} color='white' style={{marginLeft: 10}}/>
                                </TouchableOpacity>
                            }

                            {
                                userInGroup ?
                                <TouchableOpacity 
                                    style={globalStyles.buttons} 
                                    onPress={handleLeaveGroup}
                                >
                                    <Text style={{...globalStyles.buttonText, fontSize: scaleSize(22)}}>Leave Group</Text>
                                    <Icon name="door-open" size={scaleSize(21)} color='white' style={{marginLeft: 10}}/>
                                </TouchableOpacity> :
                                <TouchableOpacity 
                                    style={globalStyles.buttons} 
                                    onPress={handleJoinGroup}
                                >
                                    {groupInfo.everyoneCanJoin ?
                                        <>
                                            <Text style={{...globalStyles.buttonText, fontSize: scaleSize(22)}}>Join Group</Text>
                                            <Icon name="door-closed" size={scaleSize(21)} color='white' style={{marginLeft: 10}}/>
                                        </> :
                                        <>
                                            <Text style={{...globalStyles.buttonText, fontSize: scaleSize(22)}}>Request to join</Text>
                                            <Icon name="envelope-open" size={scaleSize(21)} color='white' style={{marginLeft: 10}}/>
                                        </>
                                    }
                                </TouchableOpacity>
                            }
                        </View>
                    </View>
                </View>
                // </ScrollView>
            }
            <MemberManageModal
                member={selectedMember}
                memberPermission={selectedMemberPermission}
                isVisible={isModalVisible}
                closeModal={() => setModalVisible(false)}
                permissionLevel={permissionLevel}
                navigation={navigation}
                currentUserId={currentUserId}
                accessToken={accessToken}
                groupId={groupId}
                fetchInfo={fetchInfo}
            />

            {(permissionLevel >= 2 && !groupInfo.everyoneCanJoin) &&
                <TouchableOpacity style={styles.requestsButton} onPress={() => setRequestsModalVisible(true)}>
                    <Icon size={scaleSize(30)} name="envelope" color="white"/>
                </TouchableOpacity>
            }

            <ReviewRequestsModal
                isVisible={isRequestsModalVisible}
                closeModal={() => setRequestsModalVisible(false)}
                navigation={navigation}
                currentUserId={currentUserId}
                accessToken={accessToken}
                groupId={groupId}
                fetchInfo={fetchInfo}
            />
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    membersContainer: {
        width: scaleSize(300),
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        borderWidth: 1,
        alignSelf: 'flex-end'
    },
    member: {
        width: scaleSize(270),
        height: scaleSize(50),
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        // borderRadius: 10,
        // borderWidth: 1,
    },
    permissionLevelTag: {
        flex: 1,
        maxWidth: scaleSize(70),
        padding: scaleSize(6),
        borderRadius: 10,
        borderWidth: 1,
    },
    permissionLevelTagText: {
        textAlign: 'center',
        color: 'black',
        fontSize: scaleSize(16)
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: scaleSize(250),
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    modalOptions: {
        margin: 10
    },
    requestsButton: {
        position: 'absolute',
        top: scaleSize(15),
        right: scaleSize(15),
        backgroundColor: 'black',
        borderRadius: 10,
        padding: 3
    }
});

export default GroupInfo;