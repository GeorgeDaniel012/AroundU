import React, { useState, useRef, useEffect } from "react";
import { Modal, Text, View, TouchableOpacity, TextInput, StyleSheet, Alert } from "react-native";
import MapView, { Callout, Marker } from "react-native-maps";
import Icon from "react-native-vector-icons/FontAwesome5";
import globalStyles from "../styles/globalStyles";
import { getScreenHeight, scaleSize } from "../utils/helpers";
import axiosInstance from "../utils/axiosInstance";
import { MAPS_API_KEY } from "../config/config";

const SearchPlaces = (props) => {
    const { setMarkerLocation, mapRef } = props;
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = async () => {
        if (!searchQuery) return;

        try {
            const res = await axiosInstance.post('https://places.googleapis.com/v1/places:searchText', {
                textQuery: searchQuery
            }, {
                headers: {
                    'X-Goog-FieldMask': 'places.location',
                    'X-Goog-Api-Key': MAPS_API_KEY
                }
            });

            if (res.status === 200) {
                // if there are no results
                // normally should return empty object {} but you never know
                if (res.data.places && res.data.places.length === 0) {
                    Alert.alert('Error', 'Search returned no results');
                    return;
                }

                const newLocation = res.data.places[0].location;

                setMarkerLocation(newLocation);
                setSearchQuery('');
                if (mapRef.current) {
                    mapRef.current.animateToRegion({
                        latitude: newLocation.latitude,
                        longitude: newLocation.longitude,
                        latitudeDelta: 0.066345,
                        longitudeDelta: 0.045896,
                    }, 1000);
                }
            }
        } catch (err) {
            console.error('Error while searching:', err);
            Alert.alert('Error', 'Search failed');
        }
    }

    return (
        <View style={styles.searchContainer}>
            <TextInput
                style={{...globalStyles.input}}
                onChangeText={setSearchQuery}
                value={searchQuery}
                placeholder="Type the name of a location..."
                placeholderTextColor="grey"
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                <Icon name="search" size={scaleSize(28)} color="black"/>
            </TouchableOpacity>
        </View>
    )
}


const MapModal = (props) => {
    const { closeModal, isVisible, markerLocation, setMarkerLocation, setLocationChanged } = props;
    const [region, setRegion] = useState({
        latitude: markerLocation.latitude,
        longitude: markerLocation.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
    });
    const [latitudeText, setLatitudeText] = useState('');
    const [longitudeText, setLongitudeText] = useState('');

    const markerRef = useRef(null);
    const mapRef = useRef(null);

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
                    ref={mapRef}
                    key={isVisible ? 'map-visible' : 'map-hidden'}
                    style={styles.map}
                    //initialRegion={region}
                    userInterfaceStyle='light'
                    region={region}
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

                <SearchPlaces
                    setMarkerLocation={setMarkerLocation}
                    mapRef={mapRef}
                />

                <View style={styles.locationInputView}>
                    {/* <TextInput
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
                    /> */}
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        {/* <TouchableOpacity style={globalStyles.buttons} onPress={handleSetMarker}>
                            <Text style={{...globalStyles.buttonText, textAlign: 'center'}}>Set Coords</Text>
                            <Icon name="edit" size={scaleSize(21)} color="white" style={{marginLeft: 10}}/>
                        </TouchableOpacity> */}
                        <TouchableOpacity
                            style={globalStyles.buttons}
                            onPress={() => { 
                                closeModal();
                                if (setLocationChanged) setLocationChanged();
                            }}
                        >
                            <Text style={{color: 'white', fontSize: scaleSize(24), textAlign: 'center'}}>Save Marker</Text>
                            <Icon name="save" size={scaleSize(30)} color="white" style={{marginLeft: 10}}/>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    map: { // keep in mind that MapView has to have a height and width specified
           // otherwise it's not gonna render
        //...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%'
    },
    modalContent: {
        flex: 1,
    },
    locationInputView: {
        position: 'absolute',
        //paddingTop: 10,
        bottom: 0,
        width: '100%',
        //left: 10,
        //backgroundColor: 'white',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        //borderRadius: 10
    },
    searchContainer: {
        position: 'absolute',
        paddingBottom: 10,
        width: '100%',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row'
    },
    searchButton: {
        borderRadius: 10,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: scaleSize(44),
        width: scaleSize(44),
        marginRight: scaleSize(12),
        backgroundColor: 'white'
    }
});

export default MapModal;