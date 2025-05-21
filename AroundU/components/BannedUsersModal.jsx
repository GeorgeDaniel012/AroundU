import React, { useEffect, useState } from 'react';
import { Modal, View, ScrollView, StyleSheet, Text, Image, TouchableOpacity, Alert } from 'react-native';
import BackButton from './BackButton';
import Icon from "react-native-vector-icons/FontAwesome5";
import globalStyles from '../styles/globalStyles';
import { scaleSize } from '../utils/helpers';
import axiosInstance from '../utils/axiosInstance';
import { CONNECTION } from '../config/config';

const BannedUser = ({navigation, ...props}) => {
    const { bannedUser, closeModal, groupId, accessToken, currentBannedUsers, setCurrentBannedUsers } = props;
    const [imageError, setImageError] = useState(false);

    const handleUnban = async () => {
        try {
            const res = await axiosInstance.put(`/group/${groupId}/unban/${bannedUser._id}`, {}, {
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
                Alert.alert('Success', 'User unbanned successfully.');
                // excluding the current user from the banned users list
                const filteredBannedUsers = currentBannedUsers.filter(user => user.user._id !== bannedUser._id);
                setCurrentBannedUsers(filteredBannedUsers);
            }
        } catch (err) {
            console.error('Error unbanning user:', err);
            Alert.alert('Error', 'Failed to unban user');
        }
    }
    
    return (
        <TouchableOpacity
            style={styles.user}
            onPress={() => navigation.navigate("ProfileScreen", { userId: bannedUser._id })}
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
                        source={{ uri: `${CONNECTION}/static/${bannedUser.userProfile.userIcon}`, cache: 'reload' }}
                        style={{ width: scaleSize(30), height: scaleSize(30), borderRadius: 50 }}
                        resizeMode="contain"
                        onError={({nativeEvent: {error}}) => {
                            console.log("err", error);
                            setImageError(true);
                        }}
                    />
                }
                <Text style={{...globalStyles.unselectedThemeText}}>{bannedUser.userProfile.displayName}</Text>
            </View>
            <View style={styles.acceptOrReject}>
                <TouchableOpacity onPress={() => handleUnban()}>
                    <Icon name="times" size={32} color="red"/>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

const BannedUsersModal = ({navigation, ...props}) => {
    const { isVisible, closeModal, groupId, accessToken } = props;
    const [currentBannedUsers, setCurrentBannedUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchBannedUsers = async () => {
        try {
            const res = await axiosInstance.get(`/group/${groupId}/ban`, {
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
                console.log('bannedUsers:', res.data.bannedUsers);
                setCurrentBannedUsers(res.data.bannedUsers);
            }

            setIsLoading(false);
        } catch (err) {
            console.error('Error fetching group info:', err);
            Alert.alert('Error', 'Failed to fetch group info');
        }
    }

    useEffect(() => {
        if (isVisible) fetchBannedUsers();
    }, [isVisible]);

    return (
        <Modal
            visible={isVisible}
            onRequestClose={closeModal}
            transparent={false}
            animationType='slide'
        >
            <BackButton onPress={closeModal}/>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ alignItems: 'center' }}>
                    <Text style={{...globalStyles.unselectedThemeText, marginBottom: 20}}>Banned users:</Text>
                    <ScrollView style={{ maxHeight: 400, minWidth: '80%' }} contentContainerStyle={styles.bannedUsersContainer}>
                        {isLoading ?
                            <Text>Loading</Text> :
                            currentBannedUsers.length !== 0 ?
                                currentBannedUsers.map((user, index) =>
                                    <BannedUser
                                        key={`${user.user._id}-${index}`}
                                        bannedUser={user.user}
                                        navigation={navigation}
                                        closeModal={closeModal}
                                        groupId={groupId}
                                        accessToken={accessToken}
                                        currentBannedUsers={currentBannedUsers}
                                        setCurrentBannedUsers={setCurrentBannedUsers}
                                    />
                                ) :
                                <Text style={{...globalStyles.unselectedThemeText, padding: 20}}>No banned users</Text>
                        }
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    user: {
        width: scaleSize(270),
        height: scaleSize(50),
        maxHeight: scaleSize(50),
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        // borderRadius: 5,
        // borderWidth: 1,
    },
    bannedUsersContainer: {
        borderRadius: 5,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    acceptOrReject: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: scaleSize(40),
        marginRight: scaleSize(10)
    },
});

export default BannedUsersModal;