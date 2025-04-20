import React, { useEffect, useState } from "react";
import { View, Text, Alert, ScrollView } from "react-native";
import { CONNECTION } from "../config/config";
import DiscoverGroupInfo from "../components/DiscoverGroupInfo";

const DiscoverScreen = () => {
    const [groups, setGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const response = await fetch(CONNECTION + '/group/search', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ lon: -152.989521, lat: -87, radius: 120000000 })
                });
                if (!response.ok) {
                    throw new Error(`Response status: ${response.status}`);
                }
                
                const groups = await response.json();
                setGroups(groups);
                setIsLoading(false);
            } catch (err) {
                console.error('Error fetching groups:', err);
                Alert.alert('Error', 'Failed to fetch groups');
            }
        }

        fetchGroups();
    }, []);

    return (
        <>
            {
                isLoading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Text>Loading...</Text>
                    </View>
                ) : (
                    <ScrollView>
                        {
                            groups.map((obj, index) =>
                                <DiscoverGroupInfo object={obj} key={index}/>
                            )
                        }
                    </ScrollView>
                )
            }
        </>
    );
}

export default DiscoverScreen;