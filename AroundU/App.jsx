import React from "react";
import Tabs from "./navigation/BottomTabNavigator";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";

function App() {
    return (
        <NavigationContainer>
        <Tabs />
        </NavigationContainer>
    );
}

export default App;
