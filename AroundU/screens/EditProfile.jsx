import { useNavigation, CommonActions } from "@react-navigation/native";
import React, { useContext, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image, TextInput, Alert } from "react-native";
import { scaleSize } from "../utils/helpers";
import { CONNECTION } from "../config/config";
import BackButton from "../components/BackButton";
import ImageCropPicker from "react-native-image-crop-picker";
import globalStyles from "../styles/globalStyles";
import axiosInstance from "../utils/axiosInstance";
import { AuthContext } from "../contexts/AuthContext";

const EditProfile = ({ navigation, ...props }) => {
    const { username, displayName, bio, userIconPath } = props.route.params;
    const [userIcon, setUserIcon] = useState( `${CONNECTION}/static/${userIconPath}`);
    const [userIconExt, setUserIconExt] = useState('');
    const [imageError, setImageError] = useState(false);
    const [displayNameField, setDisplayNameField] = useState(displayName);
    const [bioField, setBioField] = useState(bio);
    const [hasIconChanged, setIconChanged] = useState(false);
    const {accessToken} = useContext(AuthContext);

    const pickImage = async () => {
        const result = await ImageCropPicker.openPicker({
            mediaType: 'photo',
            cropping: true,
            width: 400,
            height: 400
        });

        if (result) {
            setUserIcon(result.path);
            setIconChanged(true);
            setImageError(false);
        } 
    }

    const handleSaveChanges = async () => {
        if (!displayNameField) {
            Alert.alert('Error', 'Display name cannot be empty');
            return;
        }

        try {
            const resText = await axiosInstance.put('/user/update', {
                displayName: displayNameField,
                bio: bioField
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                validateStatus: status => status < 500, // throw error if status is at least 500
            });

            if (resText.status >= 400) {
                const errorMessage = resText.data.error;
                console.log(errorMessage);
                Alert.alert('Error', errorMessage);
            }

            if (resText.status === 200) {
                Alert.alert('Success', 'Updated user profile successfully!');
            }

            if (hasIconChanged) {
                const form = new FormData();
                form.append('userIcon', {
                    uri: userIcon,
                    name: `icon.jpg`,
                    type: 'image/jpeg'
                });

                const resPic = await axiosInstance.putForm('/user/update/pic', form, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'multipart/form-data'
                    },
                    validateStatus: status => status < 500, // throw error if status is at least 500
                });

                if (resPic.status >= 400) {
                    const errorMessage = resPic.data.error;
                    console.log(errorMessage);
                    Alert.alert('Error', errorMessage);
                }

                if (resPic.status === 200) {
                    console.log('aafaf');
                    // Alert.alert('Success', 'Updated user profile successfully!');
                }
            }

            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [
                        { name: 'MainBottomTabs' },
                        { name: 'ProfileScreen', params: { userId: '' } },
                    ],
                })
            );
        } catch (err) {
            console.error('Error saving user profile changes:', err);
            Alert.alert('Error', 'Failed to save changes to user profile');
        }
    }

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <BackButton navigation={navigation}/>
            <TouchableOpacity onPress={pickImage} style={{ flex: 2, justifyContent: 'center', alignItems: 'center' }}>
                {
                    imageError ?
                    <Image
                        source={ require('../assets/images/missing_user_icon.png') }
                        style={{ width: scaleSize(140), height: scaleSize(140), borderRadius: 100 }}
                        resizeMode="contain"
                    /> :
                    <Image
                        source={{ uri: userIcon, cache: 'reload' }}
                        style={{ width: scaleSize(140), height: scaleSize(140), borderRadius: 100 }}
                        resizeMode="contain"
                        onError={({nativeEvent: {error}}) => {
                            console.log("err", error);
                            setImageError(true);
                        }}
                    />
                }
            </TouchableOpacity>
            <View style={{ flex: 3, alignItems: 'center' }}>
                <TextInput
                    style={globalStyles.input}
                    onChangeText={setDisplayNameField}
                    value={displayNameField}
                    placeholder="Display name"
                    placeholderTextColor="grey"
                />
                <TextInput
                    style={{...globalStyles.input, flex: 1, textAlignVertical: 'top'}}
                    onChangeText={setBioField}
                    value={bioField}
                    placeholder="Bio"
                    placeholderTextColor="grey"
                    multiline
                />
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <TouchableOpacity style={globalStyles.buttons} onPress={handleSaveChanges}>
                    <Text style={{...globalStyles.buttonText, fontSize: scaleSize(22)}}>Save Changes</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default EditProfile;