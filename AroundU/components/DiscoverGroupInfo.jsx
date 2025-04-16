import React from "react";
import { View, Text } from "react-native";

const DiscoverGroupInfo = ( props ) => {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', borderWidth: 5, borderColor: 'red' }}>
            <Text>{props.object.groupName}</Text>
            <Text>{props.object.theme}</Text>
            <Text>{props.object.description}</Text>
            <Text>{props.object.location.coordinates}</Text>
        </View>
    );
}

export default DiscoverGroupInfo;