import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, Platform, PermissionsAndroid, Button, TouchableOpacity, Image, Alert, Modal, TouchableWithoutFeedback, FlatList } from 'react-native';
import { Checkbox } from 'react-native-paper';
import MapView, { Callout, Marker } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import axiosInstance from '../utils/axiosInstance';
import Icon from "react-native-vector-icons/FontAwesome5";
import { distanceBetweenPoints } from '../utils/helpers';

const MarkerIcon = (props) => {
    const { groupName } = props;

    return (
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 20 }}>{groupName}</Text>
            <Image
                source={{ uri: 'https://d1nhio0ox7pgb.cloudfront.net/_img/o_collection_png/green_dark_grey/256x256/plain/check.png' }}
                style={{ width: 40, height: 40 }}
                resizeMode="contain"
            />
        </View>
    );
}

const FilterModal = (props) => {
    const { radius, setRadius, themeFilter, setThemeFilter, isVisible, closeModal } = props;

    const themeFilterBy = [
        {
            "id": 1,
            "filterName": "Arts"
        },
        {
            "id": 2,
            "filterName": "Sports"
        },
        {
            "id": 3,
            "filterName": "Board Games"
        },
        {
            "id": 4,
            "filterName": "Video Games"
        },
        {
            "id": 5,
            "filterName": "Tech"
        },
        {
            "id": 6,
            "filterName": "Music"
        },
        {
            "id": 7,
            "filterName": "Education"
        },
        {
            "id": 8,
            "filterName": "Other"
        },
    ];

    const radiusSet = [
        {
            "id": 1,
            "radius": 2
        },
        {
            "id": 2,
            "radius": 5
        },
        {
            "id": 3,
            "radius": 10
        },
        {
            "id": 4,
            "radius": 25
        },
        {
            "id": 5,
            "radius": 50
        },
        {
            "id": 6,
            "radius": 100
        },
        {
            "id": 7,
            "radius": 200
        },
    ];

    return (
        <Modal
            visible={isVisible}
            onRequestClose={closeModal}
            //transparent={true}
            animationType='slide'
        >
            <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                    <Text>Filter by theme:</Text>
                    <FlatList
                        data={themeFilterBy}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View style={{flex: 1, flexDirection: 'row', gap: 5, justifyContent: 'center', alignItems: 'center'}}>
                                {/* <Checkbox
                                    status={themeFilter.includes(item.filterName) ? 'checked' : 'unchecked'}
                                    onPress={() => {
                                        const updatedFilter = themeFilter.includes(item.filterName)
                                            ? themeFilter.filter(status => status !== item.filterName)
                                            : [...themeFilter, item.filterName];
                                        setThemeFilter(updatedFilter);
                                    }}
                                />
                                <Text style={styles.modalItem}>{item.filterName}</Text> */}
                                <TouchableOpacity
                                    style={
                                        themeFilter.includes(item.filterName) ?
                                        { backgroundColor: 'green' } :
                                        { backgroundColor: 'red' }
                                    }
                                    onPress={() => {
                                        const updatedFilter = themeFilter.includes(item.filterName)
                                            ? themeFilter.filter(status => status !== item.filterName)
                                            : [...themeFilter, item.filterName];
                                        setThemeFilter(updatedFilter);
                                    }}
                                >
                                    <Text style={styles.modalItem}>{item.filterName}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    />

                    <Text>Maximum distance:</Text>
                    <FlatList
                        data={radiusSet}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View style={{flex: 1, flexDirection: 'row', gap: 5, justifyContent: 'center', alignItems: 'center'}}>
                                <TouchableOpacity onPress={() => setRadius(item.radius * 1000)}>
                                    <Text style={styles.modalItem}>{item.radius} {radius === item.radius * 1000 && '✔️'}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                    <Button title="Apply" onPress={closeModal}/>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    )
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
    const [groups, setGroups] = useState([]);
    const [markerList, setMarkerList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [radius, setRadius] = useState(100000); // = 100 km
    const [themeFilter, setThemeFilter] = useState([]);
    const [mapKey, setMapKey] = useState(0);
    const [isModalVisible, setModalVisible] = useState(false);

    const mapRef = useRef(null); // reference to MapView to access methods like animateToRegion
    const hasRequestedPermission = useRef(false);
    const hasObtainedCurrentLocation = useRef(false);

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
                {
                    lon: currentLocation.longitude,
                    lat: currentLocation.latitude,
                    radius: 200000 // = 200km, unlikely to want groups beyond that
                }, 
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                }
            );
            
            const groups = await response.data;
            setGroups(groups);
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
        // console.log("state", locationGranted);
        if (!hasRequestedPermission.current) {
            return;
        }

        if (locationGranted) {
            getCurrentLocation();
            // fetchGroups();
            console.log('doing good');
        } else {
            console.log('Location permission not granted');
            Alert.alert('Error', 'Location permission was not granted.\n' + 
                'This means you cannot use the Discover feature unless you ' + 
                'allow AroundU to use location services in the device\'s settings.');
        }
        setMapKey(prev => prev + 1);
    }, [locationGranted]);

    useEffect(() => {
        if (hasObtainedCurrentLocation.current) fetchGroups();
        else hasObtainedCurrentLocation.current = true;
    }, [currentLocation]);

    const getCurrentLocation = async () => {
        try {
            Geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;                    
                    setCurrentLocation({
                        latitude,
                        longitude,
                    });
                    // animating to new location
                    if (mapRef.current) {
                        mapRef.current.animateToRegion({
                            latitude,
                            longitude,
                            latitudeDelta: 0.066345,
                            longitudeDelta: 0.045896,
                        }, 1000);
                    }
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

    // to animate to current location of user
    const goToCurrentLocation = () => {
        if (mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.066345,
                longitudeDelta: 0.045896,
            }, 1000);
        }
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
                toolbarEnabled={false}
                // googleRenderer='LEGACY'
                // showsUserLocation={true}
                // showsMyLocationButton={true}
            >
                {
                    !isLoading &&
                    // list of markers/groups
                    markerList
                        // we need to filter the list first
                        // based on the desired group themes
                        // and distance from user's current location
                        .filter(marker => {
                            const distance = distanceBetweenPoints(marker.location.coordinates, currentLocation);
                            const withinDistance = distance <= radius;
                            // if filter list is empty then every group should get past this filter
                            const isInThemes = themeFilter.length === 0 || themeFilter.includes(marker.theme);

                            return withinDistance && isInThemes
                        })
                        // getting map marker for each desired group
                        .map((marker, index) => {
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
                                tracksViewChanges={false}
                            >
                                {/* <Callout onPress={() => handlePressOnGroup(marker)}>
                                    <MarkerIconCallout groupName={marker.groupName}/>
                                </Callout> */}
                                <MarkerIcon groupName={marker.groupName}/>
                            </Marker>
                        );
                    })
                }
                {   // current location circle
                    locationGranted &&
                    <Marker coordinate={currentLocation} tracksViewChanges={false}>
                        <Icon name="dot-circle" size={32} color="blue"/>
                    </Marker>
                }
                
            </MapView>
            {   // buttons for refreshing groups, filtering and current location;
                // having them show up without location permissions
                // doesn't make sense
                locationGranted && 
                <>
                    <TouchableOpacity style={styles.locationButton} onPress={goToCurrentLocation}>
                        <Icon name="compass" size={40} color="grey"/>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.filterButton} onPress={() => setModalVisible(true)}>
                        <Icon name="sliders-h" size={40} color="grey"/>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.refreshButton} onPress={fetchGroups}>
                        <Icon name="sync" size={40} color="grey"/>
                    </TouchableOpacity>
                </>
            }

            <FilterModal
                isVisible={isModalVisible}
                radius={radius}
                setRadius={setRadius}
                themeFilter={themeFilter}
                setThemeFilter={setThemeFilter}
                closeModal={() => setModalVisible(false)}
            />
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
        left: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: 10,
        borderRadius: 5,
    },
    locationButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: 15,
        borderRadius: 50,
    },
    filterButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: 15,
        borderRadius: 50,
    },
    refreshButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: 15,
        borderRadius: 50,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        //backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        //width: 300,
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
});

export default DiscoverScreen;
