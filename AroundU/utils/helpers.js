import { useNavigation, CommonActions } from "@react-navigation/native";
import { Dimensions } from "react-native";

// resets navigation stack to one screen only
export const resetNavigationStack = (navigation, screen) => {
    navigation.dispatch(
        CommonActions.reset({
            index: 0,
            routes: [
                { name: screen }
            ],
        })
    );
}

// distance between 2 points, calculated using the haversine formula
// code adapted from https://www.movable-type.co.uk/scripts/latlong.html
export const distanceBetweenPoints = (userLocation, groupLocation) => {
    // getting individual coords from point objects
    const lat1 = userLocation[1];
    const lon1 = userLocation[0];
    const lat2 = groupLocation.latitude;
    const lon2 = groupLocation.longitude;

    const radius = 6371e3; // earth's radius in meters
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const dist = radius * c; // in meters

    return dist;
}

export const themeList = [
    {
        "id": 1,
        "filterName": "Arts",
        "iconName": "palette"
    },
    {
        "id": 2,
        "filterName": "Sports",
        "iconName": "volleyball-ball"
    },
    {
        "id": 3,
        "filterName": "Board Games",
        "iconName": "chess-board"
    },
    {
        "id": 4,
        "filterName": "Social",
        "iconName": "users"
    },
    {
        "id": 5,
        "filterName": "Travel",
        "iconName": "plane"
    },
    {
        "id": 6,
        "filterName": "Video Games",
        "iconName": "gamepad"
    },
    {
        "id": 7,
        "filterName": "Politics",
        "iconName": "landmark"
    },
    {
        "id": 8,
        "filterName": "Tech",
        "iconName": "microchip"
    },
    {
        "id": 9,
        "filterName": "Music",
        "iconName": "music"
    },
    {
        "id": 10,
        "filterName": "Education",
        "iconName": "book"
    },
    {
        "id": 11,
        "filterName": "Other",
        "iconName": "question"
    },
];

export const scaleSize = (size) => {
    const baseWidth = 375; // baseline width
    return size * (Dimensions.get('screen').width / baseWidth);
};

export const passwordStrengthRegexp = new RegExp("^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$");