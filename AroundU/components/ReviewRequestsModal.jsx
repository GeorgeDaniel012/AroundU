import React, { useEffect, useState } from 'react';
import { Modal, View, ScrollView, StyleSheet, Text, Image, TouchableOpacity, Alert } from 'react-native';
import BackButton from './BackButton';
import Icon from "react-native-vector-icons/FontAwesome5";
import globalStyles from '../styles/globalStyles';
import { scaleSize } from '../utils/helpers';
import axiosInstance from '../utils/axiosInstance';
import { CONNECTION } from '../config/config';

const Request = ({navigation, ...props}) => {
    const { user, closeModal, groupId, accessToken, fetchInfo, currentRequests, setCurrentRequests } = props;
    const [imageError, setImageError] = useState(false);

    const handleRequest = async (isAccepted) => {
        try {
            const res = await axiosInstance.put(`/group/${groupId}/requests/${user._id}`, {
                isAccepted: isAccepted
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
                Alert.alert('Success',
                    isAccepted ? 
                    'Request accepted successfully!' :
                    'Request rejected successfully.'
                );
                // excluding the current request from the requests list
                const filteredRequests = currentRequests.filter(request => request.user._id !== user._id);
                setCurrentRequests(filteredRequests);
                fetchInfo();
            }
        } catch (err) {
            console.error('Error handling request:', err);
            Alert.alert('Error', 
                isAccepted ? 
                'Failed to accept request' :
                'Failed to reject request'
            );
        }
    }
    
    return (
        <TouchableOpacity
            style={styles.user}
            onPress={() => navigation.navigate("ProfileScreen", { userId: user._id })}
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
                        source={{ uri: `${CONNECTION}/static/${user.userProfile.userIcon}`, cache: 'reload' }}
                        style={{ width: scaleSize(30), height: scaleSize(30), borderRadius: 50 }}
                        resizeMode="contain"
                        onError={({nativeEvent: {error}}) => {
                            setImageError(true);
                        }}
                    />
                }
                <Text style={{...globalStyles.unselectedThemeText}}>{user.userProfile.displayName}</Text>
            </View>
            <View style={styles.acceptOrReject}>
                <TouchableOpacity onPress={() => handleRequest(true)}>
                    <Icon name="check" size={32} color="green"/>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRequest(false)}>
                    <Icon name="times" size={32} color="red"/>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

const ReviewRequestsModal = ({navigation, ...props}) => {
    const { isVisible, closeModal, groupId, memberList, setMemberList, accessToken, currentUserId, fetchInfo } = props;
    const [currentRequests, setCurrentRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            const res = await axiosInstance.get(`/group/${groupId}/requests`, {
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
                setCurrentRequests(res.data.joinRequests);
            }

            setIsLoading(false);
            fetchInfo();
        } catch (err) {
            console.error('Error fetching group info:', err);
            Alert.alert('Error', 'Failed to fetch group info');
        }
    }

    useEffect(() => {
        if (isVisible) fetchRequests();
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
                    <Text style={{...globalStyles.unselectedThemeText, marginBottom: 20}}>Join requests:</Text>
                    <ScrollView style={{ maxHeight: 400, minWidth: '80%' }} contentContainerStyle={styles.requestsContainer}>
                        {isLoading ?
                            <Text>Loading</Text> :
                            currentRequests.length !== 0 ?
                                currentRequests.map((request, index) =>
                                    <Request
                                        key={`${request.user._id}-${index}`}
                                        user={request.user}
                                        navigation={navigation}
                                        closeModal={closeModal}
                                        groupId={groupId}
                                        accessToken={accessToken}
                                        fetchInfo={fetchInfo}
                                        currentRequests={currentRequests}
                                        setCurrentRequests={setCurrentRequests}
                                    />
                                ) :
                                <Text style={{...globalStyles.unselectedThemeText, padding: 20}}>No requests</Text>
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
        // borderRadius: 10,
        // borderWidth: 1,
    },
    requestsContainer: {
        borderRadius: 10,
        borderWidth: 1,
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

export default ReviewRequestsModal;