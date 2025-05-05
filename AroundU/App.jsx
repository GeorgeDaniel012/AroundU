import React from "react";
import Tabs from "./navigation/BottomTabNavigator";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "./screens/ProfileScreen";
import LoginScreen from "./screens/LoginScreen";
import { AuthProvider } from "./contexts/AuthContext";
import SplashScreen from "./screens/SplashScreen";
import GroupInfo from "./screens/GroupInfo";
import CreateGroupScreen from "./screens/CreateGroupScreen";

const Stack = createNativeStackNavigator();

function App() {
    return (
        <AuthProvider>
            <NavigationContainer>
                <Stack.Navigator>
                    <Stack.Screen name="SplashScreen" component={SplashScreen} options={{ headerShown: false }}/>
                    <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ headerShown: false }}/>
                    <Stack.Screen name="MainBottomTabs" component={Tabs} options={{ headerShown: false }}/>
                    <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: false }}/>
                    <Stack.Screen name="GroupInfo" component={GroupInfo} options={{ headerShown: false }}/>
                    <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ headerShown: false }}/>
                    {/* options={{ title: 'Create Group' }} /> */}
                </Stack.Navigator>
            </NavigationContainer>
        </AuthProvider>
    );
}

export default App;
