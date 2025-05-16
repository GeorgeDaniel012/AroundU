import React, { useEffect, useState } from 'react';
import { View, Text, Linking, Button, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import axiosInstance from '../utils/axiosInstance';
import BackButton from '../components/BackButton';
import Icon from "react-native-vector-icons/FontAwesome5";
import globalStyles from '../styles/globalStyles';
import { getIconForTheme, scaleSize } from "../utils/helpers";
import { CONNECTION } from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const permissionLevelsList = [
    {
        id: 0,
        levelName: '',
        color: 'white'
    },
    {
        id: 1,
        levelName: 'Moderator',
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
    const { member, permission, joinedAt } = props;
    const { _id, username, userProfile } = member;
    const [currentPermission, setCurrentPermission] = useState(permission);
    const [permissionLevel, setPermissionLevel] = useState(getPermissionLevel(permission));
    const [imageError, setImageError] = useState(false);
    
    useEffect(() => {
        setPermissionLevel(getPermissionLevel(currentPermission));
    }, [currentPermission]);

    return (
        <TouchableOpacity
            style={styles.member}
            onPress={() => navigation.navigate("ProfileScreen", { userId: _id })}
        >
            <View style={{ flex: 1, flexDirection: 'row', gap: 20, alignItems: 'center' }}>
                {
                    imageError ?
                    <Image
                        source={ require('../assets/images/missing_user_icon.png') }
                        style={{ width: scaleSize(30), height: scaleSize(30), borderRadius: 10 }}
                        resizeMode="contain"
                    /> :
                    <Image
                        source={{ uri: `${CONNECTION}/static/${userProfile.userIcon}`, cache: 'reload' }}
                        style={{ width: scaleSize(30), height: scaleSize(30), borderRadius: 10 }}
                        resizeMode="contain"
                        onError={({nativeEvent: {error}}) => {
                            console.log("err", error);
                            setImageError(true);
                        }}
                    />
                }
                <Text style={{...globalStyles.unselectedThemeText}}>{username}</Text>
            </View>
            <View style={{...styles.permissionLevelTag, borderColor: permissionLevel.color}}>
                <Text style={{...styles.permissionLevelTagText, color: permissionLevel.color}}>{permissionLevel.levelName}</Text>
            </View>
        </TouchableOpacity>
    )
}

// props = groupinfo that is fetched by discover/search screen
const GroupInfo = ({ navigation, ...props }) => {
    const { group } = props.route.params;
    const groupId = group._id;
    const [groupInfo, setGroupInfo] = useState({});
    const [permissionLevel, setPermissionLevel] = useState(0);
    const [userInGroup, setUserInGroup] = useState(false);
    const [memberList, setMemberList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    const fetchInfo = async () => {
        try {
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

            console.log(resMembers.data);

            // checking if logged in user is a member of the group
            // to determine if moderation options should be shown
            const userId = await AsyncStorage.getItem('currentUserId');
            const userInMemberList = resMembers.data
                .find(member => member.member._id === userId);
            if (userInMemberList) {
                console.log("faf")
                setPermissionLevel(userInMemberList.permission);
                setUserInGroup(true);
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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <BackButton navigation={navigation}/>
            {
                isLoading ?
                <Text>Loading</Text> :
                // <ScrollView
                //     contentContainerStyle={{ flexWrap: 'wrap', maxWidth: 300, justifyContent: 'center', alignItems: 'center' }}
                //     nestedScrollEnabled={true} 
                //     horizontal={false}
                // >
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ flex: 2, justifyContent: 'center', alignItems: 'center' }}>
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
                                    console.log("err", error);
                                    setImageError(true);
                                }}
                            />
                        }
                    </View>

                    <View style={{ flex: 1, alignItems: 'center', maxWidth: scaleSize(300), }}>
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

                    {/* <View style={{ flex: 1, alignItems: 'center', width: scaleSize(300), borderRadius: 5, borderWidth: 2 }}>
                        {memberList.map((item, index) => (
                            <MemberInfo
                                key={index}
                                member={item.member}
                                permission={item.permission}
                                joinedAt={item.joinedAt}
                            />
                        ))}
                    </View> */}

                    <ScrollView
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
                    </ScrollView>

                    <View style={{ flex: 2, justifyContent: 'center', alignItems: 'center' }}>
                        <TouchableOpacity 
                            style={globalStyles.buttons} 
                            onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${groupInfo.location.coordinates[1]}%2C${groupInfo.location.coordinates[0]}`)}
                        >
                            <Text style={{...globalStyles.buttonText, fontSize: scaleSize(22)}}>See on Google Maps</Text>
                            <Icon name="map-marker" size={scaleSize(21)} color='white' style={{marginLeft: 10}}/>
                        </TouchableOpacity>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {   
                                // only admins and the owner can edit the group
                                permissionLevel >= 2 && 
                                <TouchableOpacity 
                                    style={globalStyles.buttons} 
                                    onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${groupInfo.location.coordinates[1]}%2C${groupInfo.location.coordinates[0]}`)}
                                >
                                    <Text style={{...globalStyles.buttonText, fontSize: scaleSize(22)}}>Edit</Text>
                                    <Icon name="edit" size={scaleSize(21)} color='white' style={{marginLeft: 10}}/>
                                </TouchableOpacity>
                            }

                            {
                                userInGroup ?
                                <TouchableOpacity 
                                    style={globalStyles.buttons} 
                                    onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${groupInfo.location.coordinates[1]}%2C${groupInfo.location.coordinates[0]}`)}
                                >
                                    <Text style={{...globalStyles.buttonText, fontSize: scaleSize(22)}}>Leave Group</Text>
                                    <Icon name="door-open" size={scaleSize(21)} color='white' style={{marginLeft: 10}}/>
                                </TouchableOpacity> :
                                <TouchableOpacity 
                                    style={globalStyles.buttons} 
                                    onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${groupInfo.location.coordinates[1]}%2C${groupInfo.location.coordinates[0]}`)}
                                >
                                    <Text style={{...globalStyles.buttonText, fontSize: scaleSize(22)}}>Join Group</Text>
                                    <Icon name="door-closed" size={scaleSize(21)} color='white' style={{marginLeft: 10}}/>
                                </TouchableOpacity>
                            }
                        </View>
                    </View>
                </View>
                // </ScrollView>
            }
        </View>
    )
}

const styles = StyleSheet.create({
    membersContainer: {
        width: scaleSize(300),
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
        borderWidth: 2
    },
    member: {
        width: scaleSize(270),
        height: scaleSize(50),
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        // borderRadius: 5,
        // borderWidth: 1,
    },
    permissionLevelTag: {
        flex: 1,
        maxWidth: scaleSize(70),
        padding: scaleSize(6),
        borderRadius: 5,
        borderWidth: 2,
    },
    permissionLevelTagText: {
        textAlign: 'center',
        color: 'black',
        fontSize: scaleSize(16)
    },
});

export default GroupInfo;