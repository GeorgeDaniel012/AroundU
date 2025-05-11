import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { scaleSize } from "../utils/helpers";
import { CONNECTION } from "../config/config";
import BackButton from "../components/BackButton";
import { launchImageLibrary } from "react-native-image-picker";

const EditProfile = ({ navigation, ...props }) => {
    const { username, displayName, bio, userIconPath } = props.route.params;
    const [userIcon, setUserIcon] = useState( `${CONNECTION}/static/${userIconPath}`);
    const [imageError, setImageError] = useState(false);

    // useEffect(() => {
    //     setUserIcon()
    // }, []);

    const pickImage = async () => {
        const result = launchImageLibrary({
            mediaType: 'photo',
            quality: 1,
        });
    }

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <BackButton navigation={navigation}/>
            {
                imageError ?
                <Image
                    source={ require('../assets/images/missing_user_icon.png') }
                    style={{ width: scaleSize(140), height: scaleSize(140), borderRadius: 60 }}
                    resizeMode="contain"
                /> :
                <Image
                    source={{ uri: userIcon }}
                    style={{ width: scaleSize(140), height: scaleSize(140), borderRadius: 60 }}
                    resizeMode="contain"
                    onError={({nativeEvent: {error}}) => {
                        console.log("err", error);
                        setImageError(true);
                    }}
                />
            }
        </View>
    );
}

export default EditProfile;