import React, { useEffect } from 'react';
import { View, Text, Linking, Button } from 'react-native';

// props = groupinfo that is fetched by discover/search screen
const GroupInfo = (props) => {
    const { group } = props.route.params;
    const { description,
        everyoneCanJoin,
        groupName,
        location,
        members,
        tags,
        theme,
        _id } = group;

    useEffect(() => {
        console.log("group info:", group);
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>{groupName}</Text>
            <Text>{everyoneCanJoin}</Text>
            <Text>{description}</Text>
            <Text>{location.coordinates}</Text>
            <Text>{theme}</Text>
            <Text>{_id}</Text>
            <Button
                title="See on Google Maps"
                onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${location.coordinates[1]}%2C${location.coordinates[0]}`)}
            />
        </View>
    )
}

export default GroupInfo;