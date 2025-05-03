import React, { useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ScrollView, Alert, Button, Modal, TouchableWithoutFeedback, Dimensions, Pressable } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import { scaleSize, themeList } from "../utils/helpers";
import { Checkbox } from "react-native-paper";
import MapView, { Callout, Marker } from 'react-native-maps';
import axiosInstance from "../utils/axiosInstance";
import { AuthContext } from "../contexts/AuthContext";

const MapModal = (props) => {
    const { closeModal, isVisible, markerLocation, setMarkerLocation } = props;
    const [region, setRegion] = useState({
        latitude: 45.434169,
        longitude: 28.019074,
        latitudeDelta: 0.066345,
        longitudeDelta: 0.045896,
    });
    const [latitudeText, setLatitudeText] = useState('');
    const [longitudeText, setLongitudeText] = useState('');


    const onRegionChange = (region) => {
        setRegion(region);
    }

    const onDragEnd = (e) => {
        console.log('lcoation', e.nativeEvent.coordinate);
        //setMarkerLocation(location);
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
                        latitudeDelta: 0.066345,
                        longitudeDelta: 0.045896,
                    }}
                    onRegionChangeComplete={onRegionChange}
                    toolbarEnabled={false}
                >
                    <Marker
                        coordinate={markerLocation}
                        draggable
                        onDragStart={() => {console.log("c2f")}}
                        onDragEnd={() => {console.log("cf")}}
                        onDrag={() => console.log('ddddddad')}
                    />
                </MapView>

                <View style={styles.locationInputView}>
                    <TextInput
                        style={{...styles.input, width: 260, marginRight: 10}}
                        onChangeText={setLatitudeText}
                        value={markerLocation.latitude}
                        placeholder="Latitude"
                        placeholderTextColor="grey"
                        keyboardType="numeric"
                    />
                    <TextInput
                        style={{...styles.input, width: 260, marginRight: 10}}
                        onChangeText={setLongitudeText}
                        value={markerLocation.longitude}
                        placeholder="Longitude"
                        placeholderTextColor="grey"
                        keyboardType="numeric"
                    />
                    <TouchableOpacity style={styles.buttons} onPress={handleSetMarker}>
                        <Text style={{...styles.buttonText, marginRight: 0}}>Set Marker</Text>
                    </TouchableOpacity>
                </View>
                
                <TouchableOpacity style={{...styles.buttons, position: 'absolute', right: 5, top: 5}} onPress={closeModal}>
                    <Text style={{...styles.buttonText, marginRight: 0, textAlign: 'center'}}>Apply</Text>
                </TouchableOpacity>
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
                        style={{...styles.input, width: 260, marginRight: 10}}
                        onChangeText={setTagText}
                        value={tagText}
                        placeholder="Tag"
                        maxLength={20}
                        placeholderTextColor="grey"
                    />
                    <TouchableOpacity onPress={handleAddTag}>
                        <Icon name="plus" size={32} color="grey"/>
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
                <TouchableOpacity style={styles.buttons} onPress={closeModal}>
                    <Text style={{...styles.buttonText, marginRight: 0}}>Apply</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

const TagComponent = (props) => {
    const { tagName, removeTag } = props;

    return (
        <TouchableOpacity style={styles.tag} onPress={removeTag}>
            <Text style={styles.selectedThemeText}>{tagName}</Text>
            <Icon name="minus" size={scaleSize(20)} color="white"/>
        </TouchableOpacity>
    );
}

const ThemeComponent = (props) => {
    const { themeName, iconName, theme, handleSetTheme } = props;

    return (
        <>
            {
                theme === themeName ?
                <TouchableOpacity style={styles.selectedTheme} onPress={handleSetTheme}>
                    <Text style={styles.selectedThemeText}>{themeName}</Text>
                    <Icon name={iconName} size={scaleSize(24)} color={'white'}/>
                </TouchableOpacity> :

                <TouchableOpacity style={styles.unselectedTheme} onPress={handleSetTheme}>
                    <Text style={styles.unselectedThemeText}>{themeName}</Text>
                    <Icon name={iconName} size={scaleSize(24)} color={'black'}/>
                </TouchableOpacity>
            }
        </>
    );
}

const CreateGroupScreen = ({ navigation }) => {
    const [groupName, setGroupName] = useState('');
    const [theme, setTheme] = useState('');
    const [description, setDescription] = useState('');
    const [requestToJoin, setRequestToJoin] = useState(true);
    const [tags, setTags] = useState([]);
    const [tagText, setTagText] = useState('');
    const [location, setLocation] = useState({
        latitude: 45.434169,
        longitude: 28.019074,
    });
    const [isMapModalVisible, setMapModalVisible] = useState(false);
    const [isTagModalVisible, setTagModalVisible] = useState(false);
    const { accessToken } = useContext(AuthContext);

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

    const handleCreateGroup = async () => {
        try {
            if (!groupName || !theme || !description) {
                console.log('Not all required fields are filled out');
                Alert.alert('Error', 'Not all required fields are filled out');
                return;
            }

            const res = await axiosInstance.post('/group', {
                groupName: groupName,
                theme: theme,
                description: description,
                tags: tags,
                // user requests to join, so not everyone can join automatically
                everyoneCanJoin: !requestToJoin,
                lat: location.latitude,
                lon: location.longitude
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                validateStatus: status => status < 600, // throw error if status is at least 500
            });

            console.log(res);

            if (res.status >= 400 ) {
                const errorMessage = res.data.error;
                console.log(errorMessage);
                Alert.alert('Error', errorMessage);
            }

            if (res.status === 201) {
                console.log('Group created');
                Alert.alert('Success', 'Group created');
                navigation.goBack();
            }
        } catch (err) {
            console.log(err);
        }
    }

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <TextInput
                style={styles.input}
                onChangeText={setGroupName}
                value={groupName}
                placeholder="Group name (required)"
                placeholderTextColor="grey"
            />
            <TextInput
                style={{...styles.input, height: scaleSize(70)}}
                onChangeText={setDescription}
                value={description}
                placeholder="Description (required)"
                placeholderTextColor="grey"
                multiline
            />
            <View style={{ maxHeight: 200 }}>
                <Text style={{ fontSize: scaleSize(16) }}>Group theme (required):</Text>
                <ScrollView
                    contentContainerStyle={{ flexWrap: 'wrap', maxWidth: 300, flexDirection: 'row' }}
                    nestedScrollEnabled={true} 
                    horizontal={false}
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
                </ScrollView>
            </View>

            <View style={styles.checkbox}>
                <Checkbox
                    status={requestToJoin ? 'checked' : 'unchecked'}
                    onPress={() => setRequestToJoin(!requestToJoin)}
                    color="black"
                />
                <Text style={{ fontSize: scaleSize(20) }}>New members need to request access</Text>
            </View>

            <TouchableOpacity style={styles.buttons} onPress={() => setMapModalVisible(true)}>
                <Text style={styles.buttonText}>Set Location</Text>
                <Icon name="map-marker" size={scaleSize(30)} color="white"/>
            </TouchableOpacity>
            <MapModal
                isVisible={isMapModalVisible}
                closeModal={() => setMapModalVisible(false)}
                markerLocation={location}
                setMarkerLocation={setLocation}
            />

            <TouchableOpacity style={styles.buttons} onPress={() => setTagModalVisible(true)}>
                <Text style={styles.buttonText}>Set Tags</Text>
                <Icon name="tag" size={scaleSize(30)} color="white"/>
            </TouchableOpacity>
            <TagModal
                isVisible={isTagModalVisible}
                closeModal={() => setTagModalVisible(false)}
                tags={tags}
                setTags={setTags}
                handleAddTag={handleAddTag}
                tagText={tagText}
                setTagText={setTagText}
            />

            <TouchableOpacity style={styles.buttons} onPress={handleCreateGroup}>
                <Text style={{...styles.buttonText, marginRight: 0}}>Create Group</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    input: {
        borderWidth: 1,
        padding: 10,
        width: 300,
        margin: scaleSize(12),
        height: scaleSize(44),
        borderRadius: 10,
        fontSize: scaleSize(16),
        color: 'black'
    },
    buttons: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'black',
        borderWidth: 1,
        borderRadius: 10,
        margin: scaleSize(12),
    },
    buttonText: {
        color: "white",
        fontSize: scaleSize(20),
        marginRight: scaleSize(18),
    },
    tag: {
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'black', 
        padding: 10,
        borderWidth: 1, 
        borderRadius: 10,
        maxHeight: 50,
        maxWidth: 300,
        flexDirection: 'row',
        margin: 5
    },
    selectedTheme: {
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'black', 
        padding: 10,
        borderWidth: 1, 
        borderRadius: 10,
        maxHeight: 50,
        maxWidth: 300,
        flexDirection: 'row',
        margin: 5
    },
    selectedThemeText: { 
        color: 'white', 
        fontSize: scaleSize(18), 
        marginRight: scaleSize(18),
    },
    unselectedTheme: {
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'white', 
        padding: 10,
        borderWidth: 1, 
        borderRadius: 10,
        maxHeight: 50,
        maxWidth: 300,
        flexDirection: 'row',
        margin: 5
    },
    unselectedThemeText: { 
        color: 'black', 
        fontSize: scaleSize(18), 
        marginRight: 20 
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
        bottom: 0,
        width: '100%',
        //left: 10,
        backgroundColor: 'rgb(255, 255, 255)',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        //borderRadius: 20
    }
});

export default CreateGroupScreen;