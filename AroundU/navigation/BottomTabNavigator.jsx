import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/FontAwesome5";

const Tab = createBottomTabNavigator();

import HomeScreen from "../screens/HomeScreen";
import DiscoverScreen from "../screens/DiscoverScreen";
import GroupsScreen from "../screens/GroupsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import { scaleSize } from "../utils/helpers";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Tabs = () => {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            initialRouteName = "Home"
            screenOptions = {({ route }) => ({
                headerShown: false,
                // defines the icon for each tab screen
                tabBarIcon: ({ color, size }) => {
                    let iconName;

                    if (route.name === "Home") {
                        iconName = "home";
                    } else if (route.name === "Discover") {
                        iconName = "search";
                    } else if (route.name === "Groups") {
                        iconName = "users";
                    } else if (route.name === "Settings") {
                        iconName = "cog";
                    }
                    
                    return <Icon name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: "tomato",
                tabBarInactiveTintColor: "gray",
                tabBarLabelStyle: { fontSize: scaleSize(16) },
                tabBarStyle: { height: scaleSize(60) + insets.bottom, paddingBottom: insets.bottom, paddingTop: scaleSize(3) } // base height = 80 (scale(73))
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Discover" component={DiscoverScreen} />
            <Tab.Screen name="Groups" component={GroupsScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
    );
}

export default Tabs;