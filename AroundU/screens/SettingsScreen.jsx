import React, { useContext } from "react";
import { View, Text, Button } from "react-native";
import { AuthContext } from "../contexts/AuthContext";
import { resetNavigationStack } from "../utils/helpers";

const SettingsScreen = ({ navigation }) => {
    const {logout} = useContext(AuthContext);

    const logoutCallback = async () => {
        logout();
        resetNavigationStack(navigation, 'LoginScreen');
    }

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Button title="Logout" onPress={logoutCallback}/>
        </View>
    );
}

export default SettingsScreen;