import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/FontAwesome5";

const Tab = createBottomTabNavigator();

import HomeScreen from "../screens/HomeScreen";
import DiscoverScreen from "../screens/DiscoverScreen";
import GroupsScreen from "../screens/GroupsScreen";

const Tabs = () => {
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
                    }
                    
                    return <Icon name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: "tomato",
                tabBarInactiveTintColor: "gray",
            })}
        >
            <Tab.Screen name="Discover" component={DiscoverScreen} />
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Groups" component={GroupsScreen} />
        </Tab.Navigator>
    );
}

export default Tabs;