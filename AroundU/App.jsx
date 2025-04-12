import React from "react";
import Tabs from "./navigation/BottomTabNavigator";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "./screens/ProfileScreen";

const Stack = createNativeStackNavigator();

function App() {
    return (
        <NavigationContainer>
            {/* <Tabs /> */}
            <Stack.Navigator>
                <Stack.Screen name = "MainBottomTags" component={Tabs} options={{ headerShown: false }}/>
                <Stack.Screen name = "ProfileScreen" component={ProfileScreen} options={{ headerShown: false }}/>
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default App;
