import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, Platform, PermissionsAndroid, Button, TouchableOpacity, Image, Alert, Modal, TouchableWithoutFeedback, FlatList } from 'react-native';
import { Checkbox } from 'react-native-paper';
import MapView, { Callout, Marker } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import axiosInstance from '../utils/axiosInstance';
import Icon from "react-native-vector-icons/FontAwesome5";
import { distanceBetweenPoints, scaleSize, themeList, getIconForTheme } from '../utils/helpers';
import { CONNECTION } from '../config/config';
import globalStyles from '../styles/globalStyles';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MarkerIcon = (props) => {
    const { group } = props;
    const [imageError, setImageError] = useState(false);

    return (
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            {/* <Text style={{ fontSize: 20 }}>{group.groupName}</Text> */}
            {/* <Image
                //source={{ uri: 'https://d1nhio0ox7pgb.cloudfront.net/_img/o_collection_png/green_dark_grey/256x256/plain/check.png' }}
                source={{ uri: imageError ? 'https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg' : `${CONNECTION}/static/${group._id}` }}
                style={{ width: 38, height: 38 }}
                resizeMode="contain"
                onError={({nativeEvent: {error}}) => {
                    console.log("err", error);
                    setImageError(true);
                }}
            /> */}
            {/* {
                imageError ?
                <Icon
                    name={getIconForTheme(group.theme)}
                    size={28}
                    color="black"
                /> :
                <Image
                    source={{ uri: `${CONNECTION}/static/${group.groupIcon}` }}
                    style={{ width: 38, height: 38 }}
                    resizeMode="contain"
                    onError={({nativeEvent: {error}}) => {
                        setImageError(true);
                    }}
                />
            } */}
            <Icon
                name={getIconForTheme(group.theme)}
                size={28}
                color="black"
            />
        </View>
    );
}

const ThemeComponent = (props) => {
    const { themeName, iconName, themeFilter, handleSetTheme } = props;

    return (
        <>
            {
                themeFilter.includes(themeName) ?
                <TouchableOpacity style={globalStyles.selectedTheme} onPress={handleSetTheme}>
                    <Text style={globalStyles.selectedThemeText}>{themeName}</Text>
                    <Icon name={iconName} size={scaleSize(21)} color={'red'} style={{marginLeft: 10}}/>
                </TouchableOpacity> :

                <TouchableOpacity style={globalStyles.unselectedTheme} onPress={handleSetTheme}>
                    <Text style={globalStyles.unselectedThemeText}>{themeName}</Text>
                    <Icon name={iconName} size={scaleSize(21)} color={'black'} style={{marginLeft: 10}}/>
                </TouchableOpacity>
            }
        </>
    );
}

const FilterModal = (props) => {
    const { radius, setRadius, themeFilter, setThemeFilter, isVisible, closeModal } = props;

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

    const handleSetTheme = (filter) => {
        const updatedFilter = themeFilter.includes(filter)
            ? themeFilter.filter(status => status !== filter)
            : [...themeFilter, filter];
        setThemeFilter(updatedFilter);
    }

    return (
        <Modal
            visible={isVisible}
            onRequestClose={closeModal}
            //transparent={true}
            animationType='slide'
        >
            <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                    <Text style={styles.bigText}>Filter by theme:</Text>
                    <FlatList
                        numColumns={2}
                        data={themeList}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View style={{flexDirection: 'row', gap: 5, justifyContent: 'center', alignItems: 'center'}}>
                                <ThemeComponent
                                    themeName={item.filterName}
                                    iconName={item.iconName}
                                    themeFilter={themeFilter}
                                    handleSetTheme={() => handleSetTheme(item.filterName)}
                                />
                            </View>
                        )}
                        style={{ flexGrow: 0, marginVertical: 10 }}
                    />

                    <Text style={styles.bigText}>Maximum distance:</Text>
                    <FlatList
                        numColumns={3}
                        data={radiusSet}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View style={{flexDirection: 'row', gap: 5, justifyContent: 'center', alignItems: 'center'}}>
                                {
                                    radius === item.radius * 1000 ?
                                    <TouchableOpacity style={globalStyles.selectedTheme} onPress={() => setRadius(item.radius * 1000)}>
                                        <Text style={{...globalStyles.selectedThemeText}}>{item.radius}km</Text>
                                    </TouchableOpacity> :
                                    <TouchableOpacity style={globalStyles.unselectedTheme} onPress={() => setRadius(item.radius * 1000)}>
                                        <Text style={{...globalStyles.unselectedThemeText}}>{item.radius}km</Text>
                                    </TouchableOpacity>
                                }
                            </View>
                        )}
                        style={{ flexGrow: 0, marginVertical: 10 }}
                    />
                    <TouchableOpacity style={{...globalStyles.buttons}} onPress={closeModal}>
                        <Text style={{...globalStyles.buttonText, marginRight: 0, textAlign: 'center'}}>Apply</Text>
                    </TouchableOpacity>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    )
}

const DiscoverScreen = ({ navigation }) => {
    const [locationGranted, setLocationGranted] = useState(null); // for location permission
    const [currentLocation, setCurrentLocation] = useState({
        //latitude: 45.434169,
        //longitude: 28.019074,
        latitude: 44.42695,
        longitude: 26.10234
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

    const insets = useSafeAreaInsets();

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

    // fetching groups every time this screen is in focus
    useFocusEffect(
        useCallback(() => {
            if (hasObtainedCurrentLocation.current) fetchGroups();
        }, [])
    );

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
                                anchor={{ x: 0.5, y: 0.5 }}
                                coordinate={{
                                    longitude: marker.location.coordinates[0],
                                    latitude: marker.location.coordinates[1],
                                }}
                                //title={marker.groupName}
                                pinColor='#FFFFFF'
                                onPress={() => handlePressOnGroup(marker)}
                                tracksViewChanges={false}
                            >
                                {/* <Callout onPress={() => handlePressOnGroup(marker)}>
                                    <MarkerIconCallout groupName={marker.groupName}/>
                                </Callout> */}
                                <MarkerIcon group={marker}/>
                            </Marker>
                        );
                    })
                }
                {   // current location circle
                    locationGranted &&
                    <Marker anchor={{ x: 0.5, y: 0.5 }} coordinate={currentLocation} tracksViewChanges={false}>
                        <Icon name="dot-circle" size={30} color="blue"/>
                    </Marker>
                }
                
            </MapView>
            {   // buttons for refreshing groups, filtering and current location;
                // having them show up without location permissions
                // doesn't make sense
                locationGranted && 
                <>
                    <TouchableOpacity style={styles.locationButton} onPress={goToCurrentLocation}>
                        <Icon name="compass" size={scaleSize(30)} color="grey"/>
                    </TouchableOpacity>
                    <TouchableOpacity style={{...styles.filterButton, top: insets.top + 20}} onPress={() => setModalVisible(true)}>
                        <Icon name="sliders-h" size={scaleSize(30)} color="grey"/>
                    </TouchableOpacity>
                    <TouchableOpacity style={{...styles.refreshButton, top: insets.top + 20}} onPress={fetchGroups}>
                        <Icon name="sync" size={scaleSize(30)} color="grey"/>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate("CreateGroup", { currentLocation: currentLocation })}>
                        <Icon name="plus" size={scaleSize(30)} color="grey"/>
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
        borderRadius: 70,
    },
    locationButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: 15,
        borderRadius: 70,
    },
    filterButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: 15,
        borderRadius: 70,
    },
    refreshButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: 15,
        borderRadius: 70,
    },
    createButton: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: 15,
        borderRadius: 70,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        //backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        flex: 1,
        //width: 300,
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    bigText: {
        color: 'black',
        fontSize: scaleSize(20),
        marginVertical: 10
    },
});

export default DiscoverScreen;
