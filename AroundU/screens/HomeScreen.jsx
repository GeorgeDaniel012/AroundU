import { useNavigation } from "@react-navigation/native";
import React from "react";
import { View, Text, Button } from "react-native";

const HomeScreen = () => {
    const navigation = useNavigation();

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Home Screen</Text>
            <Button title="Profile Screen" onPress={() => navigation.navigate("ProfileScreen")}/>
        </View>
    );
}

export default HomeScreen;