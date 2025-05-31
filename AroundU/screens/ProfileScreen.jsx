import React, { useContext, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image, Dimensions, ScrollView } from "react-native";
import axiosInstance from "../utils/axiosInstance";
import { AuthContext } from "../contexts/AuthContext";
import { CONNECTION } from '../config/config';
import BackButton from "../components/BackButton";
import globalStyles from "../styles/globalStyles";
import { scaleSize } from "../utils/helpers";
import Icon from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = ({ navigation, ...props }) => {
    const { userId } = props.route.params;
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [userIconPath, setUserIconPath] = useState('');
    const [groups, setGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const [isCurrentUsersProfile, setIsCurrentUsersProfile] = useState(false);

    const { accessToken } = useContext(AuthContext);

    const fetchUser = async () => {
        try {
            const resUserProfile = await axiosInstance.get(`/user/profile/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
            });

            if (resUserProfile.status >= 400) {
                const errorMessage = resUserProfile.data.error;
                console.log(errorMessage);
                Alert.alert('Error', errorMessage);
            }

            if (resUserProfile.status === 200) {
                const user = await resUserProfile.data;
                setUsername(user.username);
                setDisplayName(user.displayName);
                setBio(user?.bio);
                setUserIconPath(user?.userIcon);
                console.log(user?.userIcon)
            }
            
            const resUserGroups = await axiosInstance.get(`/user/profile/groups/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
            });

            if (resUserGroups.status >= 400) {
                const errorMessage = resUserGroups.data.error;
                console.log(errorMessage);
                Alert.alert('Error', errorMessage);
            }

            if (resUserGroups.status === 200) {
                const groups = await resUserGroups.data;
                setGroups(groups);
            }

            const currentUserId = await AsyncStorage.getItem('currentUserId');
            // if there isn't a userId provided by the route
            // or there is and it's the current user's id
            if (userId.length === 0 || currentUserId === userId) {
                setIsCurrentUsersProfile(true);
            }

            setIsLoading(false);
        } catch (err) {
            console.error('Error fetching user profile:', err);
            Alert.alert('Error', 'Failed to fetch user profile');
        }
    }

    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <BackButton navigation={navigation}/>
            {
                isLoading ?
                <Text>Loading</Text> :
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ flex: 2, justifyContent: 'center', alignItems: 'center' }}>
                    {
                        imageError ?
                        <Image
                            source={ require('../assets/images/missing_user_icon.png') }
                            style={{ width: scaleSize(140), height: scaleSize(140), borderRadius: 100 }}
                            resizeMode="contain"
                        /> :
                        <Image
                            source={{ uri: `${CONNECTION}/static/${userIconPath}`, cache: 'reload' }}
                            style={{ width: scaleSize(140), height: scaleSize(140), borderRadius: 100 }}
                            resizeMode="contain"
                            onError={({nativeEvent: {error}}) => {
                                setImageError(true);
                            }}
                        />
                    }
                    </View>
                    <View style={{ flex: 3, alignItems: 'center', maxWidth: scaleSize(300) }}>
                        <Text style={{...globalStyles.nameText, marginBottom: scaleSize(10)}}>{displayName}</Text>
                        <Text style={{...globalStyles.unselectedThemeText, marginBottom: scaleSize(20)}}>@{username}</Text>
                        <ScrollView>
                            <Text style={globalStyles.unselectedThemeText}>{bio}</Text>
                        </ScrollView>
                    </View>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        {
                            isCurrentUsersProfile &&
                            <TouchableOpacity 
                                style={globalStyles.buttons} 
                                onPress={() => {navigation.navigate('EditProfile', { // passing user info as props/params
                                                                                     // for default values
                                    username, displayName, bio, userIconPath
                            })}}>
                                <Text style={{...globalStyles.buttonText, fontSize: scaleSize(22)}}>Edit Profile</Text>
                                <Icon name="edit" size={scaleSize(21)} color='white' style={{marginLeft: 10}}/>
                            </TouchableOpacity>
                        }
                    </View>
                </View>
            }
        </View>
    );
}

export default ProfileScreen;