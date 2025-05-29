import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ScrollView, Alert, Button, Modal, TouchableWithoutFeedback, Dimensions, Pressable, Image } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import { getScreenHeight, removeLastScreenFromNavigationStack, scaleSize, themeList } from "../utils/helpers";
import { Checkbox } from "react-native-paper";
import MapView, { Callout, Marker } from 'react-native-maps';
import axiosInstance from "../utils/axiosInstance";
import { AuthContext } from "../contexts/AuthContext";
import BackButton from "../components/BackButton";
import ImageCropPicker from "react-native-image-crop-picker";
import globalStyles from "../styles/globalStyles";
import { CONNECTION } from "../config/config";
import BannedUsersModal from "../components/BannedUsersModal";

const MapModal = (props) => {
    const { closeModal, isVisible, markerLocation, setMarkerLocation, setLocationChanged } = props;
    const [region, setRegion] = useState({
        latitude: 45.434169,
        longitude: 28.019074,
        latitudeDelta: 0.022115,
        longitudeDelta: 0.015298,
    });
    const [latitudeText, setLatitudeText] = useState('');
    const [longitudeText, setLongitudeText] = useState('');

    const markerRef = useRef(null);

    const onRegionChange = (region) => {
        setRegion(region);
    }

    // for outputting coordinates to e.g. 6 decimals floats
    const truncateFloat = (num, pow) => {
        const powerOf10 = Math.pow(10, pow);
        return Math.trunc(num * powerOf10) / powerOf10;
    }

    // this DOES NOT work properly on markers right now
    // according to a random person on github issues
    // BUT the event does fire on the mapview
    // and it still returns the new coordinate
    // so for now this will stay on the mapview
    const onDragEnd = (e) => {
        setMarkerLocation(e.nativeEvent.coordinate);
    }

    const handleSetMarker = () => {
        if (!latitudeText || !longitudeText) {
            console.log('Marker input not valid');
            Alert.alert('Error', 'Please fill out both fields');
            return;
        }

        const lat = parseFloat(latitudeText);
        const lon = parseFloat(longitudeText);

        if (isNaN(lat) || isNaN(lon)) {
            console.log('Marker input not valid');
            Alert.alert('Error', 'Please use only numbers');
            return;
        }

        if (lat < -90 || lat > 90) {
            console.log('Latitude must be between -90 and 90');
            Alert.alert('Error', 'Latitude must be between -90 and 90');
            return;
        }
        if (lon < -180 || lon > 180) {
            console.log('Longitude must be between -180 and 180');
            Alert.alert('Error', 'Longitude must be between -180 and 180');
            return;
        }

        setMarkerLocation({
            latitude: parseFloat(latitudeText),
            longitude: parseFloat(longitudeText)
        });
    }

    return (
        <Modal
            visible={isVisible}
            onRequestClose={closeModal}
            animationType='slide'
        >
            <View style={styles.modalContent}>
                <MapView
                    key={isVisible ? 'map-visible' : 'map-hidden'}
                    style={styles.map}
                    initialRegion={{
                        latitude: markerLocation.latitude,
                        longitude: markerLocation.longitude,
                        latitudeDelta: 0.022115,
                        longitudeDelta: 0.015298,
                    }}
                    onRegionChangeComplete={onRegionChange}
                    toolbarEnabled={false}
                    onMarkerDragEnd={onDragEnd}
                >
                    <Marker
                        ref={markerRef}
                        coordinate={markerLocation}
                        draggable
                    />
                </MapView>

                <View style={styles.locationInputView}>
                    <TextInput
                        style={{...globalStyles.input, width: 260, marginRight: 10}}
                        onChangeText={setLatitudeText}
                        value={markerLocation.latitude}
                        placeholder={`Latitude: ${truncateFloat(markerLocation.latitude, 6)}`}
                        placeholderTextColor="grey"
                        keyboardType="numeric"
                    />
                    <TextInput
                        style={{...globalStyles.input, width: 260, marginRight: 10}}
                        onChangeText={setLongitudeText}
                        value={markerLocation.longitude}
                        placeholder={`Longitude: ${truncateFloat(markerLocation.longitude, 6)}`}
                        placeholderTextColor="grey"
                        keyboardType="numeric"
                    />
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity style={globalStyles.buttons} onPress={handleSetMarker}>
                            <Text style={{...globalStyles.buttonText, textAlign: 'center'}}>Set Coords</Text>
                            <Icon name="edit" size={scaleSize(21)} color="white" style={{marginLeft: 10}}/>
                        </TouchableOpacity>
                        <TouchableOpacity style={globalStyles.buttons} onPress={() => { closeModal(); setLocationChanged(); }}>
                            <Text style={{...globalStyles.buttonText, textAlign: 'center'}}>Save Marker</Text>
                            <Icon name="save" size={scaleSize(21)} color="white" style={{marginLeft: 10}}/>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const TagModal = (props) => {
    const { closeModal, isVisible, tags, setTags, handleAddTag, tagText, setTagText } = props;

    return (
        <Modal
            visible={isVisible}
            onRequestClose={closeModal}
            animationType='slide'
        >
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', maxHeight: 50, width: 300, margin: 15 }}>
                    <TextInput
                        style={{...globalStyles.input, width: 260, marginRight: 10}}
                        onChangeText={setTagText}
                        value={tagText}
                        placeholder="Tag"
                        maxLength={20}
                        placeholderTextColor="grey"
                    />
                    <TouchableOpacity onPress={handleAddTag}>
                        <Icon name="plus" size={32} color="black"/>
                    </TouchableOpacity>
                </View>

                <Text>{tags.length}/20</Text>
                <View style={{ maxHeight: 300 }}>
                    <ScrollView
                        nestedScrollEnabled={true} 
                        horizontal={false}
                    >
                        {/* this pressable child is needed,
                            otherwise the user can only scroll
                            when they're pressing the tag buttons
                        */}
                        <Pressable style={{ flexWrap: 'wrap', maxWidth: 300, flexDirection: 'row' }}>
                            {tags.map((tag, index) => (
                                <TagComponent
                                    key={index}
                                    tagName={tag}
                                    removeTag={() => {
                                        // tags that are different from tag that's being pressed
                                        const tagsWithoutPressed = tags.filter(t => t !== tag);
                                        setTags(tagsWithoutPressed);
                                    }}
                                />
                            ))}
                        </Pressable>
                    </ScrollView>
                </View>
                <TouchableOpacity style={globalStyles.buttons} onPress={closeModal}>
                    <Text style={{...globalStyles.buttonText, marginRight: 0}}>Save Tags</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

const ThemeComponent = (props) => {
    const { themeName, iconName, theme, handleSetTheme } = props;

    return (
        <>
            {
                theme === themeName ?
                <TouchableOpacity style={globalStyles.selectedTheme} onPress={handleSetTheme}>
                    <Text style={{...globalStyles.selectedThemeText, marginRight: scaleSize(16)}}>{themeName}</Text>
                    <Icon name={iconName} size={scaleSize(21)} color={'red'}/>
                </TouchableOpacity> :

                <TouchableOpacity style={globalStyles.unselectedTheme} onPress={handleSetTheme}>
                    <Text style={{...globalStyles.unselectedThemeText, marginRight: scaleSize(16)}}>{themeName}</Text>
                    <Icon name={iconName} size={scaleSize(21)} color={'black'}/>
                </TouchableOpacity>
            }
        </>
    );
}

const TagComponent = (props) => {
    const { tagName, removeTag } = props;

    return (
        <TouchableOpacity style={styles.tag} onPress={removeTag}>
            <Text style={{...globalStyles.selectedThemeText, marginRight: scaleSize(16)}}>{tagName}</Text>
            <Icon name="minus" size={scaleSize(20)} color="red"/>
        </TouchableOpacity>
    );
}

const EditGroupScreen = ({ navigation, ...props }) => {
    const { groupInfo } = props.route.params;
    const [groupIcon, setGroupIcon] = useState( `${CONNECTION}/static/${groupInfo.groupIcon}`);
    const [imageError, setImageError] = useState(false);
    const [groupName, setGroupName] = useState(groupInfo.groupName);
    const [theme, setTheme] = useState(groupInfo.theme);
    const [description, setDescription] = useState(groupInfo.description);
    const [requestToJoin, setRequestToJoin] = useState(!groupInfo.everyoneCanJoin);
    const [tags, setTags] = useState(groupInfo.tags);
    const [tagText, setTagText] = useState('');
    const [location, setLocation] = useState({
        latitude: groupInfo.location.coordinates[1],
        longitude: groupInfo.location.coordinates[0],
    });
    const [isMapModalVisible, setMapModalVisible] = useState(false);
    const [isTagModalVisible, setTagModalVisible] = useState(false);
    const [isBannedUsersModalVisible, setBannedUsersModalVisible] = useState(false);

    const [hasLocationChanged, setLocationChanged] = useState(false);
    const [hasIconChanged, setIconChanged] = useState(false);

    const { accessToken } = useContext(AuthContext);

    const pickImage = async () => {
        const result = await ImageCropPicker.openPicker({
            mediaType: 'photo',
            cropping: true,
            width: 400,
            height: 400
        });

        if (result) {
            setGroupIcon(result.path);
            setIconChanged(true);
            setImageError(false);
        } 
    }

    const handleAddTag = () => {
        if (!tagText) return;
        if (tags.length === 20) {
            console.log('Too many tags');
            Alert.alert('Error', 'You can only set 20 tags to a group');
            return;
        }
        if (tags.find(tag => tag === tagText)) {
            console.log('Tag already in list');
            Alert.alert('Error', 'This tag is already in the tag list');
            return;
        }

        const updatedTags = tags.concat([tagText]);
        setTags(updatedTags);
        setTagText('');
    }

    const handleSaveGroupEdits = async () => {
        try {
            if (!groupName || !theme || !description) {
                console.log('Not all required fields are filled out');
                Alert.alert('Error', 'Not all required fields are filled out');
                return;
            }

            const resGeneral = await axiosInstance.put(`/group/${groupInfo._id}/general`, {
                groupName: groupName,
                theme: theme,
                description: description,
                tags: tags,
                // user requests to join, so not everyone can join automatically
                everyoneCanJoin: !requestToJoin,
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                validateStatus: status => status < 500, // throw error if status is at least 500
            });

            if (resGeneral.status >= 400 ) {
                const errorMessage = resGeneral.data.error;
                console.log(errorMessage);
                Alert.alert('Error', errorMessage);
                return;
            }

            if (resGeneral.status === 200) {
                console.log('Group updated');
                Alert.alert('Success', 'Updated group successfully');
            }

            if (hasLocationChanged) {
                const resLocation = await axiosInstance.put(`/group/${groupInfo._id}/location`, {
                    lat: location.latitude,
                    lon: location.longitude
                }, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    },
                    validateStatus: status => status < 500, // throw error if status is at least 500
                });

                if (resLocation.status >= 400 ) {
                    const errorMessage = resLocation.data.error;
                    console.log(errorMessage);
                    Alert.alert('Error', errorMessage);
                    return;
                }

                if (resLocation.status === 200) {
                    console.log('Location updated');
                    //Alert.alert('Success', 'Group edited');
                }
            }

            if (hasIconChanged) {
                const form = new FormData();
                form.append('groupIcon', {
                    uri: groupIcon,
                    name: `icon.jpg`,
                    type: 'image/jpeg'
                });

                const resPic = await axiosInstance.putForm(`/group/${groupInfo._id}/pic`, form, {
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
                    return;
                }

                if (resPic.status === 200) {
                    console.log('Pic updated');
                    // Alert.alert('Success', 'Updated group icon successfully!');
                }
            }

            // navigation.dispatch(
            //     CommonActions.reset({
            //         index: 1,
            //         routes: [
            //             { name: 'MainBottomTabs', state: { routes: [{ name: 'Discover' }] } },
            //             { name: 'GroupInfo', params: { group: groupInfo } },
            //         ],
            //     })
            // );

            removeLastScreenFromNavigationStack(navigation);
        } catch (err) {
            console.error('Error updating group:', err);
            Alert.alert('Error', 'Failed to update group');
        }
    }

    useEffect(() => console.log(groupInfo), []);

    return (
        <ScrollView contentContainerStyle={{ justifyContent: 'center', alignItems: 'center' }}>
            <BackButton navigation={navigation}/>

            <TouchableOpacity style={styles.bannedUsersButton} onPress={() => setBannedUsersModalVisible(true)}>
                <Icon size={35} name="user-slash" color="white"/>
            </TouchableOpacity>

            <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
                <TouchableOpacity onPress={pickImage} style={{ justifyContent: 'center', alignItems: 'center' }}>
                    {
                        imageError ?
                        <Image
                            source={ require('../assets/images/missing_group_icon.png') }
                            style={{ width: scaleSize(140), height: scaleSize(140), borderRadius: 100 }}
                            resizeMode="contain"
                        /> :
                        <Image
                            source={{ uri: groupIcon, cache: 'reload' }}
                            style={{ width: scaleSize(140), height: scaleSize(140), borderRadius: 100 }}
                            resizeMode="contain"
                            onError={({nativeEvent: {error}}) => {
                                console.log("err", error);
                                setImageError(true);
                            }}
                        />
                    }
                </TouchableOpacity>

                <TextInput
                    style={globalStyles.input}
                    onChangeText={setGroupName}
                    value={groupName}
                    placeholder="Group name (required)"
                    placeholderTextColor="grey"
                />
                <TextInput
                    style={{...globalStyles.input, height: scaleSize(150)}}
                    onChangeText={setDescription}
                    value={description}
                    placeholder="Description (required)"
                    placeholderTextColor="grey"
                    multiline
                />
                <View>
                    <Text style={{ fontSize: scaleSize(16) }}>Group theme (required):</Text>
                    <View
                        style={{ flexWrap: 'wrap', maxWidth: 300, flexDirection: 'row' }}
                    >
                        {themeList.map((item, index) => (
                            <ThemeComponent
                                key={index}
                                themeName={item.filterName}
                                iconName={item.iconName}
                                theme={theme}
                                handleSetTheme={() => setTheme(item.filterName)}
                            />
                        ))}
                    </View>
                </View>

                <View style={styles.checkbox}>
                    <Checkbox
                        status={requestToJoin ? 'checked' : 'unchecked'}
                        onPress={() => setRequestToJoin(!requestToJoin)}
                        color="black"
                    />
                    <Text style={{ fontSize: scaleSize(18) }}>New members need to request access</Text>
                </View>

                <TouchableOpacity style={globalStyles.buttons} onPress={() => setMapModalVisible(true)}>
                    <Text style={{...globalStyles.buttonText, marginRight: scaleSize(10)}}>Set Location</Text>
                    <Icon name="map-marker" size={scaleSize(21)} color="white"/>
                </TouchableOpacity>

                <TouchableOpacity style={globalStyles.buttons} onPress={() => setTagModalVisible(true)}>
                    <Text style={{...globalStyles.buttonText, marginRight: scaleSize(10)}}>Set Tags</Text>
                    <Icon name="tag" size={scaleSize(21)} color="white"/>
                </TouchableOpacity>

                <TouchableOpacity style={globalStyles.buttons} onPress={handleSaveGroupEdits}>
                    <Text style={{...globalStyles.buttonText, fontSize: scaleSize(22), marginRight: scaleSize(10)}}>Save Group Edits</Text>
                    <Icon name="save" size={scaleSize(21)} color="white"/>
                </TouchableOpacity>
            </View>

            <MapModal
                isVisible={isMapModalVisible}
                closeModal={() => setMapModalVisible(false)}
                markerLocation={location}
                setMarkerLocation={setLocation}
                setLocationChanged={() => setLocationChanged(true)}
            />

            <TagModal
                isVisible={isTagModalVisible}
                closeModal={() => setTagModalVisible(false)}
                tags={tags}
                setTags={setTags}
                handleAddTag={handleAddTag}
                tagText={tagText}
                setTagText={setTagText}
            />

            <BannedUsersModal
                isVisible={isBannedUsersModalVisible}
                closeModal={() => setBannedUsersModalVisible(false)}
                navigation={navigation}
                accessToken={accessToken}
                groupId={groupInfo._id}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tag: {
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'white', 
        padding: 10,
        borderWidth: 1, 
        borderColor: 'red',
        borderRadius: 10,
        maxHeight: 50,
        maxWidth: 300,
        flexDirection: 'row',
        margin: 5
    },
    checkbox: {
        flexDirection: 'row',
        height: scaleSize(20),
        alignItems: 'center',
        justifyContent: 'center',
        margin: scaleSize(12)
    },
    map: { // keep in mind that MapView has to have a height and width specified
           // otherwise it's not gonna render
        ...StyleSheet.absoluteFillObject,
    },
    modalContent: {
        flex: 1,
    },
    locationInputView: {
        position: 'absolute',
        paddingTop: 10,
        bottom: 0,
        width: '100%',
        //left: 10,
        backgroundColor: 'white',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        //borderRadius: 10
    },
    bannedUsersButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'black',
        borderRadius: 10,
        padding: 3
    }
});

export default EditGroupScreen;