import React from "react";
import Tabs from "./navigation/BottomTabNavigator";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "./screens/ProfileScreen";
import LoginScreen from "./screens/LoginScreen";
import { AuthProvider } from "./contexts/AuthContext";
import SplashScreen from "./screens/SplashScreen";
import GroupInfo from "./screens/GroupInfo";
import CreateGroupScreen from "./screens/CreateGroupScreen";
import EditProfile from "./screens/EditProfile";
import EditGroupScreen from "./screens/EditGroupScreen";
import MessagesScreen from "./screens/MessagesScreen";
import { StatusBar } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const Stack = createNativeStackNavigator();

const wrapInSafeAreaView = (Component) => {
    return function WrappedComponent(props) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
                <Component {...props}/>
            </SafeAreaView>
        )
    }
}

function App() {
    return (
        <AuthProvider>
            <SafeAreaProvider>
                <NavigationContainer>
                    <Stack.Navigator>
                        <Stack.Screen name="SplashScreen" component={SplashScreen} options={{ headerShown: false }}/>
                        <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ headerShown: false }}/>
                        <Stack.Screen name="MainBottomTabs" component={Tabs} options={{ headerShown: false }}/>
                        <Stack.Screen name="ProfileScreen" component={wrapInSafeAreaView(ProfileScreen)} options={{ headerShown: false }}/>
                        <Stack.Screen name="GroupInfo" component={wrapInSafeAreaView(GroupInfo)} options={{ headerShown: false }}/>
                        <Stack.Screen name="CreateGroup" component={wrapInSafeAreaView(CreateGroupScreen)} options={{ headerShown: false }}/>
                        <Stack.Screen name="EditProfile" component={wrapInSafeAreaView(EditProfile)} options={{ headerShown: false }}/>
                        <Stack.Screen name="EditGroup" component={wrapInSafeAreaView(EditGroupScreen)} options={{ headerShown: false }}/>
                        <Stack.Screen name="MessagesScreen" component={wrapInSafeAreaView(MessagesScreen)} options={{ headerShown: false }}/>
                    </Stack.Navigator>
                </NavigationContainer>
            </SafeAreaProvider>
        </AuthProvider>
    );
}

export default App;
