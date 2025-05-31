import { useNavigation } from "@react-navigation/native";
import React, { useContext, useEffect, useState } from "react";
import { View, Text, Button, StyleSheet, StatusBar, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import BackButton from "../components/BackButton";
import { getScreenHeight, scaleSize } from "../utils/helpers";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import globalStyles from "../styles/globalStyles";
import axiosInstance from "../utils/axiosInstance";
import { AuthContext } from "../contexts/AuthContext";

const MessageComponent = (props) => {
    const { message } = props;

    return (
        <View style={styles.message}>
            <Text>{message.content}</Text>
        </View>
    );
}

const MessagesScreen = ({ navigation, ...props }) => {
    const { groupInfo } = props.route.params; // whole groups object
    const { _id: groupId, groupName } = groupInfo; // needing just id and name
    const [messageField, setMessageField] = useState('');
    const [messagesList, setMessagesList] = useState([]);
    const { accessToken } = useContext(AuthContext);

    const fetchMessages = async () => {
        try {
            const res = await axiosInstance.get(`message/${groupId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                validateStatus: status => status < 500,
            });

            if (res.status >= 400) {
                const errorMessage = res.data.error;
                console.log(errorMessage);
                Alert.alert('Error', errorMessage);
            }

            if (res.status === 200) {
                setMessagesList(res.data);
            }
        } catch (err) {
            console.error('Error fetching messages:', err);
            Alert.alert('Error', 'Failed to fetch messages');
        }
    }

    useEffect(() => {
        fetchMessages();

        console.log(messagesList);
    }, []);

    const insets = useSafeAreaInsets();

    return (
        <KeyboardAvoidingView behavior={'height'} keyboardVerticalOffset={-insets.bottom + 20} style={{ flex: 1, alignItems: 'center' }}>
            <View style={styles.header}>
                <View style={{width:scaleSize(60)}}></View>
                {/* kind of stupid fix but if the back button is not rendered after the view
                    then the user won't be able to press it */}
                <BackButton navigation={navigation}/>
                {/* we want only the first 24 characters of the name, the rest will be cut off */}

                {/* below is code for being able to navigate to GroupInfo by pressing header text */}
                {/* <TouchableOpacity style={{minWidth:scaleSize(250)}}>
                    <Text style={{fontSize: scaleSize(28), color: 'white'}}>{groupName.substring(0, 21)}{groupName.length > 21 && "..."}</Text>
                </TouchableOpacity> */}

                <Text style={{fontSize: scaleSize(28), color: 'white', paddingTop: scaleSize(6)}}>
                    {groupName.substring(0, 21)}
                    {groupName.length > 21 && "..."}
                </Text>
            </View>

            <ScrollView contentContainerStyle={styles.messagesContainer}>
                {messagesList.map((message, index) =>
                    <MessageComponent
                        key={`${message._id}-${index}`}
                        message={message}
                    />
                )}
            </ScrollView>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.messageInput}
                    value={messageField}
                    onChangeText={setMessageField}
                    placeholder="Type a message..."
                    placeholderTextColor="grey"
                />
                <TouchableOpacity style={styles.sendButton}>
                    <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    header: {
        minHeight: getScreenHeight(1/13),
        justifyContent: 'flex-start',
        alignItems: 'center',
        flexDirection: 'row',
        width: scaleSize(375),
        borderWidth: 1,
        backgroundColor: 'black',
        paddingBottom: 6
    },
    messagesContainer: {
        minHeight: getScreenHeight(11/13),
        justifyContent: 'center',
        gap: 20
    },
    message: {
        height: scaleSize(50),
        width: 150,
        backgroundColor: 'tomato',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputContainer: {
        minHeight: getScreenHeight(1/13),
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        position: 'absolute',
        bottom: 0
    },
    messageInput: {
        ...globalStyles.input,
        width: scaleSize(280)
    },
    sendButton: {
        width: scaleSize(60),
        backgroundColor: 'tomato',
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        marginRight: scaleSize(12),
        height: scaleSize(44),
        fontSize: scaleSize(16),
        fontWeight: 'bold'
    },
    sendButtonText: {
        fontSize: scaleSize(16),
        fontWeight: 'bold'
    }
});

export default MessagesScreen;