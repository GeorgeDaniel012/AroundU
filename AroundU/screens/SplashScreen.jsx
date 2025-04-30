import { useEffect, useContext } from "react";
import { View, Text, Alert } from "react-native";
import { resetNavigationStack } from "../utils/helpers";
import { AuthContext } from "../contexts/AuthContext";

const SplashScreen = ({ navigation }) => {
    const {accessToken, login, logout, refresh} = useContext(AuthContext);
    
    const refreshCallback = async () => {
        // if true then access token was refreshed,
        // else false
        const hasRefreshed = await refresh();
        if (hasRefreshed) {
            console.log('Token was refreshed');
            //Alert.alert('Success', 'Token was refreshed');
            resetNavigationStack(navigation, 'MainBottomTabs');
        } else {
            console.log('Token couldn\'t be refreshed');
            //Alert.alert('Failure', 'Token couldn\'t be refreshed');
            resetNavigationStack(navigation, 'LoginScreen');
        }
    }

    useEffect(() => {
        refreshCallback();
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Splash Screen</Text>
        </View>
    )
}

export default SplashScreen;