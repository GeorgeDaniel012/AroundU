import React, { useContext, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image, Dimensions } from "react-native";
import axiosInstance from "../utils/axiosInstance";
import { AuthContext } from "../contexts/AuthContext";
import { CONNECTION } from '../config/config';
import BackButton from "../components/BackButton";
import globalStyles from "../styles/globalStyles";
import { scaleSize } from "../utils/helpers";
import Icon from "react-native-vector-icons/FontAwesome5";

const ProfileScreen = ({ navigation, ...props }) => {
    const { userId } = props.route.params;
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [userIconPath, setUserIconPath] = useState('');
    const [groups, setGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    const { accessToken } = useContext(AuthContext);

    const fetchUser = async () => {
        try {
            const resUserProfile = await axiosInstance.get(`/user/profile/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
            });

            const user = await resUserProfile.data;
            setUsername(user.username);
            setDisplayName(user.displayName);
            setBio(user?.bio);
            setUserIconPath(user?.userIcon);
            
            const resUserGroups = await axiosInstance.get(`/user/profile/groups/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
            });

            const groups = await resUserGroups.data;
            setGroups(groups);

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
                            style={{ width: scaleSize(140), height: scaleSize(140), borderRadius: 60 }}
                            resizeMode="contain"
                        /> :
                        <Image
                            source={{ uri: `${CONNECTION}/static/${userIconPath}` }}
                            style={{ width: scaleSize(140), height: scaleSize(140), borderRadius: 60 }}
                            resizeMode="contain"
                            onError={({nativeEvent: {error}}) => {
                                console.log("err", error);
                                setImageError(true);
                            }}
                        />
                    }
                    </View>
                    <View style={{ flex: 3, alignItems: 'center' }}>
                        <Text style={globalStyles.nameText}>{displayName}</Text>
                        <Text style={globalStyles.unselectedThemeText}>@{username}</Text>
                        <Text style={globalStyles.unselectedThemeText}>{bio}</Text>
                    </View>
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        {
                            userId.length === 0 &&
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