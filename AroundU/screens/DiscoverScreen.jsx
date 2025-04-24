import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, Platform, PermissionsAndroid, Button, TouchableOpacity, Image, Alert } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import axiosInstance from '../utils/axiosInstance';

const MarkerIcon = (props) => {
    const { groupName } = props;

    return (
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 5 }}>
            <Text style={{ fontSize: 20 }}>{groupName}</Text>
            <Image
                source={{ uri: 'https://d1nhio0ox7pgb.cloudfront.net/_img/o_collection_png/green_dark_grey/256x256/plain/check.png' }}
                style={{ width: 40, height: 40 }}
                resizeMode="contain"
            />
        </View>
    );
}

// @refresh reset
const DiscoverScreen = ({ navigation }) => {
    const [locationGranted, setLocationGranted] = useState(null); // for location permission
    const [currentLocation, setCurrentLocation] = useState({
        latitude: 45.434169,
        longitude: 28.019074,
    });
    const [region, setRegion] = useState({
        latitude: 45.434169,
        longitude: 28.019074,
        latitudeDelta: 0.066345,
        longitudeDelta: 0.045896,
    });
    const [markerList, setMarkerList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [mapKey, setMapKey] = useState(0);

    const mapRef = useRef(null); // reference to MapView to access methods like animateToRegion
    const hasRequestedPermission = useRef(false);

    const requestLocationPermission = async () => {
        if(Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, // requesting location access
                {
                    title: 'Location Permission',
                    message: 'This feature requires location permissions.',
                    buttonNeutral: 'Ask me later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK'
                }
            );

            console.log("permission granted", granted === PermissionsAndroid.RESULTS.GRANTED);
            setLocationGranted(granted === PermissionsAndroid.RESULTS.GRANTED);
            hasRequestedPermission.current = true;
        } // else setLocationGranted(true);
          // because who needs consent on iOS!
    }

    const fetchGroups = async () => {
        try {
            const response = await axiosInstance.post('/group/search',
                { lon: -152.989521, lat: -87, radius: 120000000 },
                {
                    headers: {
                        'Content-Type': 'application/json'
                },
            });
            
            const groups = await response.data;
            setMarkerList(groups);
            setIsLoading(false);
        } catch (err) {
            console.error('Error fetching groups:', err);
            Alert.alert('Error', 'Failed to fetch groups');
        }
    }

    useEffect(() => {
        requestLocationPermission();
    }, []);

    useEffect(() => {
        console.log("state", locationGranted);
        if (!hasRequestedPermission.current) {
            return;
        }

        if (locationGranted) {
            getCurrentLocation();
            fetchGroups();
            console.log('doing good');
        } else {
            console.log('Location permission not granted');
            Alert.alert('Error', 'Location permission was not granted.\n' + 
                'This means you cannot use the Discover feature unless you ' + 
                'allow AroundU to use location services in the device\'s settings.');
        }
        setMapKey(prev => prev + 1);
    }, [locationGranted]);

    const getCurrentLocation = async () => {
        try {
            Geolocation.getCurrentPosition(
                position => {
                    console.log(position);
                    const { latitude, longitude } = position.coords;                    
                    setCurrentLocation({
                        latitude,
                        longitude,
                    });
                },
                error => {
                    console.log(error.code, error.message);
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
            );
        } catch (error) {
            console.error("Error fetching location:", error);
        }
    };
    
    const onRegionChange = (region) => {
        setRegion(region);
    }

    const handlePressOnGroup = (group) => {
        navigation.navigate('GroupInfo', { group: group });
    }

    return (
        <View style={styles.container}>
            <MapView
                key={`mapview-${markerList.length}`}
                style={styles.map}
                ref={mapRef}
                initialRegion={{
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    latitudeDelta: 0.066345,
                    longitudeDelta: 0.045896,
                }}
                onRegionChangeComplete={onRegionChange}
                showsUserLocation={true}
                showsMyLocationButton={true}
            >
                {
                    !isLoading &&
                    // list of markers/groups
                    markerList.map((marker, index) => {
                        //console.log(marker, index);
                        return (
                            <Marker
                                key={index}
                                coordinate={{
                                    longitude: marker.location.coordinates[0],
                                    latitude: marker.location.coordinates[1],
                                }}
                                title={marker.groupName}
                                pinColor='#FFFFFF'
                                onPress={() => handlePressOnGroup(marker)}
                            >
                                {/* <Callout onPress={() => handlePressOnGroup(marker)}>
                                    <MarkerIconCallout groupName={marker.groupName}/>
                                </Callout> */}
                                <MarkerIcon groupName={marker.groupName}/>
                            </Marker>
                        );
                    })
                }
                
            </MapView>
            {/* Display current region */}
            <View style={styles.info}>
                <Text>Latitude: {currentLocation.latitude.toFixed(6)}</Text>
                <Text>Longitude: {currentLocation.longitude.toFixed(6)}</Text>
                <Text>Latitude delta: {region.latitudeDelta.toFixed(6)}</Text>
                <Text>Longitude delta: {region.longitudeDelta.toFixed(6)}</Text>
                <Text>{String(locationGranted)}</Text>
            </View>
            {/* { 
                locationGranted && 
                <TouchableOpacity style={styles.button} onPress={getCurrentLocation}>
                    <Text>Get Current Location</Text>
                </TouchableOpacity>
            } */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: { // keep in mind that MapView has to have a height and width specified
           // otherwise it's not gonna render
        ...StyleSheet.absoluteFillObject,
    },
    info: {
        position: 'absolute',
        bottom: 20,
        left: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: 10,
        borderRadius: 5,
    },
    button: {
        position: 'absolute',
        bottom: 20,
        right: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: 10,
        borderRadius: 10,
    },
});

export default DiscoverScreen;
