import React, { useCallback, useContext, useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { scaleSize } from "../utils/helpers";
import globalStyles from "../styles/globalStyles";
import { CONNECTION } from "../config/config";
import { AuthContext } from "../contexts/AuthContext";
import axiosInstance from "../utils/axiosInstance";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const GroupComponent = ({ navigation, ...props }) => {
    const [imageError, setImageError] = useState(false);
    const { group } = props;

    return (
        <TouchableOpacity
            style={styles.group}
            onPress={() => navigation.navigate("GroupInfo", { group: group })}
        >
            <View style={{ flex: 1, flexDirection: 'row', gap: 20, alignItems: 'center' }}>
                {
                    imageError ?
                    <Image
                        source={ require('../assets/images/missing_group_icon.png') }
                        style={{ width: scaleSize(50), height: scaleSize(50), borderRadius: 50 }}
                        resizeMode="contain"
                    /> :
                    <Image
                        source={{ uri: `${CONNECTION}/static/${group.groupIcon}`, cache: 'reload' }}
                        style={{ width: scaleSize(50), height: scaleSize(50), borderRadius: 50 }}
                        resizeMode="contain"
                        onError={({nativeEvent: {error}}) => {
                            setImageError(true);
                        }}
                    />
                }
                <View style={{flex: 1}}>
                    <Text style={styles.groupName}>{group.groupName}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const GroupsScreen = ({ navigation }) => {
    const [groupsList, setGroupsList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const { accessToken } = useContext(AuthContext);

    const insets = useSafeAreaInsets();

    const fetchGroups = async () => {
        try {
            console.log('access token:', accessToken);
            const res = await axiosInstance.get(`/user/profile/groups`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                validateStatus: status => status < 500, // throw error if status is at least 500
            });

            if (res.status >= 400) {
                const errorMessage = res.data.error;
                console.log(errorMessage);
                Alert.alert('Error', errorMessage);
            }

            if (res.status === 200) {
                setGroupsList(res.data);
            }

            setIsLoading(false);
        } catch (err) {
            console.error('Error fetching groups:', err);
            Alert.alert('Error', 'Failed to fetch groups');
        }
    }

    // useEffect(() => {
    //     fetchGroups();
    // }, []);

    // fetching groups every time this screen is in focus
    useFocusEffect(
        useCallback(() => {
            fetchGroups();
        }, [accessToken]),
    );

    return (
        isLoading ?
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
            <Text>Loading</Text>
        </View> :

        <>
            {groupsList.length === 0 ?
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
                    <Text style={{ fontSize: scaleSize(26), textAlign: 'center', width: scaleSize(340) }}>You are not in any groups. In order to join a group navigate to the Discover tab.</Text>
                </View> :
                <ScrollView contentContainerStyle={{ justifyContent: 'center', alignItems: 'center', flexGrow: 1, backgroundColor: 'white' }}>
                    <View style={{ alignItems: 'center', width: scaleSize(300), gap: 20, paddingVertical: insets.top + scaleSize(20) }}>
                        <Text style={{ fontSize: scaleSize(16) }}>Your groups:</Text>
                        {groupsList.map((item, index) => (
                            <GroupComponent
                                key={`${index}-${item._id}`}
                                group={item}
                                navigation={navigation}
                            />
                        ))}
                    </View>
                </ScrollView>
            }
        </>
        
    );
}

const styles = StyleSheet.create({
    group: {
        width: scaleSize(300),
        height: scaleSize(100),
        padding: 20,
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderRadius: 10,
        borderWidth: 1,
    },
    groupName: {
        color: 'black', 
        fontSize: scaleSize(20),
        flexWrap: 'wrap'
    }
});

export default GroupsScreen;