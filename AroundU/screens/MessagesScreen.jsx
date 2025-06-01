import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, Button, StyleSheet, StatusBar, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, FlatList, Image, Linking, Alert } from "react-native";
import BackButton from "../components/BackButton";
import { getScreenHeight, scaleSize } from "../utils/helpers";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import globalStyles from "../styles/globalStyles";
import axiosInstance from "../utils/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../contexts/AuthContext";
import { CONNECTION } from '../config/config';
import Video from "react-native-video";
import Icon from "react-native-vector-icons/FontAwesome5";
import { pick } from "@react-native-documents/picker";

// const AttachmentPreviewComponent = (props) => {
//     const {  } = props;
// }

const MessageComponent = ({navigation, ...props}) => {
    const { message, currentUserId } = props;
    const [imageError, setImageError] = useState(false);

    const formattedTimestamp = new Intl.DateTimeFormat('en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    }).format(new Date(message.createdAt));

    const currentUserIsSender = currentUserId === message.sender._id;

    return (
        <View>
            <View style={{ flex: 1, flexDirection: 'row', gap: 10, alignItems: 'center',
                alignSelf: currentUserIsSender ? 'flex-end' : 'flex-start'
            }}>
                {!currentUserIsSender &&
                    <TouchableOpacity
                        style={{ alignSelf: 'flex-end', paddingBottom: scaleSize(6) }}
                        onPress={() => navigation.navigate("ProfileScreen", { userId: message.sender._id })}
                    >
                        {imageError ?
                            <Image
                                source={ require('../assets/images/missing_user_icon.png') }
                                style={{ width: scaleSize(30), height: scaleSize(30), borderRadius: 50 }}
                                resizeMode="contain"
                            /> :
                            <Image
                                source={{ uri: `${CONNECTION}/static/${message.sender.userProfile.userIcon}`, cache: 'reload' }}
                                style={{ width: scaleSize(30), height: scaleSize(30), borderRadius: 50 }}
                                resizeMode="contain"
                                onError={({nativeEvent: {error}}) => {
                                    setImageError(true);
                                }}
                            />
                        }
                    </TouchableOpacity>
                }
                <TouchableOpacity style={currentUserIsSender ? styles.messageSent : styles.messageReceived}>
                    {!currentUserIsSender &&
                        <Text style={styles.senderDisplayName}>{message.sender.userProfile.displayName}</Text>
                    }
                    {message.attachment && 
                        (message.attachmentType.startsWith('image') ?
                            <Image
                                source={{ uri: `${CONNECTION}/static/${message.attachment}`, cache: 'reload' }}
                                style={{ width: scaleSize(200), height: scaleSize(200) }}
                                resizeMode="contain"
                            /> : 
                            message.attachmentType.startsWith('video') ?
                            <Video
                                source={{ uri: `${CONNECTION}/static/${message.attachment}`, cache: 'reload' }}
                                style={{ width: scaleSize(200), height: scaleSize(200) }}
                                controls
                                resizeMode="contain"
                                paused
                            /> :
                            // this is any other file
                            <TouchableOpacity onPress={() => Linking.openURL(`${CONNECTION}/static/${message.attachment}`)}>
                                <View style={{ paddingVertical: scaleSize(5), flexDirection: 'row', gap: scaleSize(10) }}>
                                    <Icon name="file-download" size={scaleSize(16)} color="black"/>
                                    <Text style={{ fontSize: scaleSize(16), textDecorationLine: 'underline' }}>{message.attachmentFilename}</Text>
                                </View>
                            </TouchableOpacity>
                        )
                    }

                    {message.content.length !== 0 && <Text style={styles.messageContent}>{message.content}</Text>}
                </TouchableOpacity>
            </View>

            <Text style={currentUserIsSender ? styles.timestampSent : styles.timestampReceived}>
                {formattedTimestamp}
            </Text>
        </View>
    );
}

const MessagesScreen = ({ navigation, ...props }) => {
    const { groupInfo } = props.route.params; // whole groups object
    const { _id: groupId, groupName } = groupInfo; // needing just id and name
    const [messageField, setMessageField] = useState('');
    const [messagesList, setMessagesList] = useState([]);
    const [attachment, setAttachment] = useState(null);

    const [currentUserId, setCurrentUserId] = useState('');
    const { accessToken } = useContext(AuthContext);

    const insets = useSafeAreaInsets();
    const listRef = useRef(null);

    const fetchMessages = async () => {
        try {
            const userId = await AsyncStorage.getItem('currentUserId');
            setCurrentUserId(userId);

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
                //listRef.current.scrollToEnd({ animated: false });
                scrollToBottom();

                // emit message through socket here!
            }
        } catch (err) {
            console.error('Error fetching messages:', err);
            Alert.alert('Error', 'Failed to fetch messages');
        }
    }

    useEffect(() => {
        fetchMessages();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messagesList]);

    const scrollToBottom = () => {
        if (listRef.current && messagesList.length > 0) {
            // using setTimeout to delay the scroll until after rendering
            setTimeout(() => {
                listRef.current.scrollToIndex({ index: messagesList.length - 1, animated: false });
            }, 100);
        }
    }

    // const onScroll = (e) => {
    //     const { contentOffset } = e.nativeEvent;

    //     if (contentOffset.y )
    // }

    const handlePickAttachment = async () => {
        try {
            const [pickResult] = await pick();

            const { name, uri, type } = pickResult;

            scrollToBottom();
            setAttachment({ name, uri, type });
            console.log(pickResult);
        } catch (err) {
            console.log('error at picking file', err.message);
        }
    }

    const handleSendMessage = async () => {
        try {
            if (!messageField && !attachment) {
                return;
            }

            let attachmentUrl;
            if (attachment) {
                const form = new FormData();
                form.append('file', {
                    uri: attachment.uri,
                    name: attachment.name || 'attachment',
                    type: attachment.type
                });

                const resFile = await axiosInstance.postForm(`/file/upload`, form, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'multipart/form-data'
                    },
                    validateStatus: status => status < 500, // throw error if status is at least 500
                });

                if (resFile.status >= 400) {
                    const errorMessage = resFile.data.error;
                    console.log(errorMessage);
                    Alert.alert('Error', errorMessage);
                    return;
                }

                if (resFile.status === 201) {
                    console.log('File uploaded!');
                    attachmentUrl = resFile.data;
                }
            }

            const resMessage = await axiosInstance.post(`/message/${groupId}`, {
                content: messageField,
                attachment: attachmentUrl,
                attachmentType: attachment?.type,
                attachmentFilename: attachment?.name
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                validateStatus: status => status < 500, // throw error if status is at least 500
            });

            if (resMessage.status >= 400 ) {
                const errorMessage = resMessage.data.error;
                console.log(errorMessage);
                Alert.alert('Error', errorMessage);
            }

            if (resMessage.status === 201) {
                setMessageField('');
                setAttachment(null);
                setTimeout(() => {
                    listRef.current.scrollToIndex({ index: messagesList.length - 1, animated: false });
                }, 100);
            }
        } catch (err) {
            console.error('Error sending message:', err);
            Alert.alert('Error', 'Failed to send message');
        }
    }

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

                <Text style={{fontSize: scaleSize(28), paddingTop: scaleSize(6)}}>
                    {groupName.substring(0, 21)}
                    {groupName.length > 21 && "..."}
                </Text>
            </View>

            {/* <ScrollView contentContainerStyle={styles.messagesContainer}>
                {messagesList.map((message, index) =>
                    <MessageComponent
                        key={`${message._id}-${index}`}
                        message={message}
                    />
                )}
            </ScrollView> */}

            <FlatList
                ref={listRef}
                data={messagesList}
                renderItem={(item) => 
                    <MessageComponent
                        message={item.item}
                        currentUserId={currentUserId}
                        navigation={navigation}
                    />
                }
                keyExtractor={(item, index) => `${item._id}-${index}`}
                contentContainerStyle={styles.messagesContainer}
                getItemLayout={(data, index) => ({
                    length: 100,
                    offset: 100 * index,
                    index,
                })}
                initialNumToRender={10}
                windowSize={10}
                // checking if list is scrolled to (near) bottom
                // onScroll={onScroll}
            />

            {attachment &&
                <View style={styles.attachmentContainer}>
                    <TouchableOpacity onPress={() => setAttachment(null)}>
                        <Icon name="times-circle" size={scaleSize(20)} color="black"/>
                    </TouchableOpacity>
                    <Text style={{  }}>{attachment?.name} / {attachment?.type}</Text>
                </View>
            }

            <View style={styles.inputContainer}>

                <TouchableOpacity style={styles.attachmentIcon} onPress={handlePickAttachment}>
                    <Icon name="paperclip" size={scaleSize(26)} color="black"/>
                </TouchableOpacity>
                <TextInput
                    style={styles.messageInput}
                    value={messageField}
                    onChangeText={setMessageField}
                    placeholder="Type a message..."
                    placeholderTextColor="grey"
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                    <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    header: {
        height: getScreenHeight(1/13),
        justifyContent: 'flex-start',
        alignItems: 'center',
        flexDirection: 'row',
        width: '100%',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderColor: 'grey',
        paddingBottom: 6
    },
    messagesContainer: {
        // maxHeight: getScreenHeight(11/13),
        justifyContent: 'flex-end',
        width: scaleSize(365),
        padding: scaleSize(10),
        gap: 10,
        flexGrow: 1,
    },
    senderDisplayName: {
        fontWeight: 'bold',
        fontSize: scaleSize(15)
    },
    messageReceived: {
        minHeight: scaleSize(50),
        //minWidth: scaleSize(50),
        maxWidth: scaleSize(300),
        backgroundColor: 'tomato',
        borderRadius: 10,
        padding: scaleSize(10),
        justifyContent: 'center',
        alignItems: 'flex-start',
        alignSelf: 'flex-start',
        // shadowColor: "#000",
        // shadowOffset: {
        //     width: 0,
        //     height: 4,
        // },
        // shadowOpacity: 0.32,
        // shadowRadius: 10,
        // elevation: 4,
    },
    messageSent: {
        minHeight: scaleSize(40),
        //minWidth: scaleSize(50),
        maxWidth: scaleSize(350),
        backgroundColor: 'dodgerblue',
        borderRadius: 10,
        padding: scaleSize(10),
        justifyContent: 'center',
        alignItems: 'flex-start',
        alignSelf: 'flex-end',
        // shadowColor: "#000",
        // shadowOffset: {
        //     width: 0,
        //     height: 2,
        // },
        // shadowOpacity: 0.25,
        // shadowRadius: 3.84,
        // elevation: 4,
    },
    messageContent: {
        fontSize: scaleSize(16),
    },
    timestampReceived: {
        alignSelf: 'flex-start',
        fontSize: scaleSize(12),
        color: 'grey',
        fontStyle: 'italic',
    },
    timestampSent: {
        alignSelf: 'flex-end',
        fontSize: scaleSize(12),
        color: 'grey',
        fontStyle: 'italic',
    },
    attachmentContainer: {
        height: scaleSize(40),
        width: '100%',
        backgroundColor: 'lightgrey',
        borderTopWidth: 1,
        borderColor: 'grey',
        alignItems: 'center',
        flexDirection: 'row',
        gap: scaleSize(16),
        paddingLeft: scaleSize(16),
    },
    inputContainer: {
        height: getScreenHeight(1/13),
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderColor: 'grey',
    },
    messageInput: {
        ...globalStyles.input,
        flexGrow: 1,
        flexShrink: 1
    },
    attachmentIcon: {
        borderRadius: 10,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: scaleSize(44),
        width: scaleSize(44),
        marginLeft: scaleSize(12),
    },
    sendButton: {
        width: scaleSize(60),
        backgroundColor: 'dodgerblue',
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        marginRight: scaleSize(12),
        height: scaleSize(44),
        fontSize: scaleSize(16),
        fontWeight: 'bold',
    },
    sendButtonText: {
        fontSize: scaleSize(16),
        fontWeight: 'bold'
    }
});

export default MessagesScreen;