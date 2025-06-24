import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, Button, StyleSheet, StatusBar, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, FlatList, Image, Linking, Alert, Keyboard } from "react-native";
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
import MessageManageModal from "../components/MessageManageModal";
import { io } from "socket.io-client";

const socket = io(CONNECTION, {
    transports: ['websocket']
});

// const AttachmentPreviewComponent = (props) => {
//     const {  } = props;
// }

// wrapping entire component in memo so that messages don't get re-rendered
const MessageComponent = React.memo(({navigation, ...props}) => {
    const { message, currentUserId, setSelectedMessage, setModalVisible, } = props;
    const [imageError, setImageError] = useState(false);
    const [imageVideoSize, setImageVideoSize] = useState({ width: scaleSize(220), height: scaleSize(220) });
    const [hasLoaded, setHasLoaded] = useState(false);

    const formattedTimestamp = new Intl.DateTimeFormat('en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    }).format(new Date(message.createdAt));

    const currentUserIsSender = currentUserId === message.sender._id;
    const videoRef = useRef(null);

    const onLoadImage = (e) => {
        if (hasLoaded) return;
        const { width, height } = e.nativeEvent.source;

        const maxDim = scaleSize(220);
        const scale = Math.min(maxDim / width, maxDim / height);
        setImageVideoSize({ width: width*scale, height: height*scale });
        setHasLoaded(true);
    }

    const onLoadVideo = (e) => {
        if (hasLoaded) return;
        const { width, height } = e.naturalSize;

        const maxDim = scaleSize(220);
        const scale = Math.min(maxDim / width, maxDim / height);
        setImageVideoSize({ width: width*scale, height: height*scale });
        setHasLoaded(true);
    }

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
                                source={{ uri: `${CONNECTION}/static/${message.sender.userProfile.userIcon}` }}
                                style={{ width: scaleSize(30), height: scaleSize(30), borderRadius: 50 }}
                                resizeMode="contain"
                                onError={({nativeEvent: {error}}) => {
                                    setImageError(true);
                                }}
                            />
                        }
                    </TouchableOpacity>
                }
                <TouchableOpacity
                    style={currentUserIsSender ? styles.messageSent : styles.messageReceived}
                    onLongPress={() =>{ setSelectedMessage(message); setModalVisible(true); }}
                >
                    {!currentUserIsSender &&
                        <Text style={styles.senderDisplayName}>{message.sender.userProfile.displayName}</Text>
                    }
                    {message.attachment && 
                        (message.attachmentType.startsWith('image') ?
                            <Image
                                source={{ uri: `${CONNECTION}/static/${message.attachment}`, cache: 'reload' }}
                                style={{ width: imageVideoSize.width, height: imageVideoSize.height }}
                                resizeMode="contain"
                                onLoad={onLoadImage}
                            /> : 
                            message.attachmentType.startsWith('video') ?
                                <TouchableOpacity onPress={() => { videoRef.current.setFullScreen(true); videoRef.current.resume(); }}>
                                    <Video
                                        ref={videoRef}
                                        source={{ uri: `${CONNECTION}/static/${message.attachment}`, cache: 'reload' }}
                                        style={{ width: imageVideoSize.width, height: imageVideoSize.height, justifyContent: 'center', alignItems: 'center' }}
                                        resizeMode="contain"
                                        paused
                                        onFullscreenPlayerDidDismiss={() => videoRef.current.pause()}
                                        onLoad={onLoadVideo}
                                    />
                                    <View 
                                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: 10, borderRadius: 50, 
                                            position: 'absolute', top: imageVideoSize.height / 2 - scaleSize(24) - 5, left: imageVideoSize.width / 2 - scaleSize(24) - 5 }}
                                    >
                                        <Icon name="play-circle" size={scaleSize(48)} color="black"/>
                                    </View>
                                </TouchableOpacity> :
                                // this is any other file
                                <TouchableOpacity onPress={() => Linking.openURL(`${CONNECTION}/static/${message.attachment}`)}>
                                    <View style={{ paddingVertical: scaleSize(5), flexDirection: 'row', gap: scaleSize(10), alignItems: 'center' }}>
                                        <Icon name="file-download" size={scaleSize(16)} color="black"/>
                                        <Text 
                                            style={{ fontSize: scaleSize(16), textDecorationLine: 'underline', maxWidth: scaleSize(220) }}
                                        >{message.attachmentFilename}</Text>
                                    </View>
                                </TouchableOpacity>
                        )
                    }

                    {message.content.length !== 0 && 
                        <Text style={{...styles.messageContent, paddingTop: 2}}>{message.content}</Text>
                    }
                </TouchableOpacity>

                {message.reacts.length !== 0 &&
                    // <View style={currentUserIsSender ?
                    //     {...styles.reactionsBubble, left: -30} :
                    //     {...styles.reactionsBubble, right: -30}
                    // }>
                    <View style={styles.reactionsBubble}>
                        {
                            Object.entries(
                                message.reacts.reduce((acc, react) => {
                                    acc[react.reaction] = (acc[react.reaction] || 0) + 1;
                                    return acc;
                                }, {})
                            ).map(([reaction, count]) => (
                                <View
                                    key={`reaction-${message._id}-${reaction}`}
                                    style={{ flexDirection: 'row' }}
                                >
                                    {/* currently supporting only likes and dislikes */}
                                    <Text style={{ fontSize: scaleSize(16) }}>{reaction === 'like' ? '👍' : reaction === 'dislike' ? '👎' : '❓'}</Text>
                                    <Text style={{ fontSize: scaleSize(16) }}>{count}</Text>
                                </View>
                            ))
                        }
                    </View>
                }
            </View>

            
            
            <Text style={{...(currentUserIsSender ? styles.timestampSent : styles.timestampReceived), 
                marginTop: (message.reacts.length !== 0 ? 20 : 1)
            }}>
                {formattedTimestamp}
            </Text>
        </View>
    );
})

const MessagesScreen = ({ navigation, ...props }) => {
    const { groupInfo, permissionLevel } = props.route.params; // whole groups object
    const { _id: groupId, groupName } = groupInfo; // needing just id and name
    const [messageField, setMessageField] = useState('');
    const [messagesList, setMessagesList] = useState([]);
    const [attachment, setAttachment] = useState(null);
    const [isModalVisible, setModalVisible] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [selectedMessageCurrentUserIsSender, setSelectedMessageCurrentUserIsSender] = useState(false);

    const [textInputHeight, setTextInputHeight] = useState(scaleSize(44));
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    const [currentPermissionLevel, setCurrentPermissionLevel] = useState(permissionLevel);
    const currentUserId = useRef('');
    const { accessToken } = useContext(AuthContext);

    // api level for Android or os version for iOS
    const osVersion = Platform.constants.Version || Platform.constants.osVersion;

    const insets = useSafeAreaInsets();
    const listRef = useRef(null);

    const getCurrentId = async () => {
        const userId = await AsyncStorage.getItem('currentUserId');
        currentUserId.current = userId;
    }

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
                setMessagesList(res.data.reverse());
                //listRef.current.scrollToEnd({ animated: false });
            }
        } catch (err) {
            console.error('Error fetching messages:', err);
            Alert.alert('Error', 'Failed to fetch messages');
        }
    }

    useEffect(() => {
        console.log('os version:', osVersion);
        getCurrentId();
        fetchMessages();

        // once connected to socket, request to join the group's room
        // the websocket connection should be made at app startup
        if (socket.connected) {
            socket.emit('joinRoom', groupId);
            console.log('joined room', groupId);
        } else {
            socket.on('connect', () => {
                console.log('has connected!');
                socket.emit('joinRoom', groupId);
                console.log('joined room', groupId);
            });
        }

        socket.on('newMessage', (message) => {
            console.log('received new message:', `${message?.content} + ${message?.attachment}`);
            setMessagesList(prevMessagesList => [message, ...prevMessagesList]);
        });

        socket.on('deleteMessage', (messageId) => {
            console.log('deleted message with id', messageId);
            setMessagesList(prevMessagesList => prevMessagesList.filter((message) => message._id !== messageId));
        });

        socket.on('changePermissions', ({ memberId, permissionLevel }) => {
            console.log('permissions change', { memberId, permissionLevel });
            console.log('current id', currentUserId.current);
            if (currentUserId.current === memberId) {
                console.log(`current permissions changed from ${currentPermissionLevel} to ${permissionLevel}`);
                setCurrentPermissionLevel(permissionLevel);
            }
        });

        socket.on('userKickOrBan', (memberId) => {
            if (currentUserId.current === memberId)
                navigation.goBack();
        });

        socket.on('reaction', ({ messageId, userWhoReacted, reaction }) => {
            console.log('received reaction:', { messageId, userWhoReacted, reaction });
            setMessagesList(prevMessagesList => prevMessagesList.map((message) => {
                // for every message that is not the message referenced in the socket message
                if (message._id !== messageId) return message;

                // for the correct message we remove the existing reaction from userWhoReacted
                const filteredReacts = message.reacts.filter(react => react.userWhoReacted.toString() !== userWhoReacted.toString());
                // if the reaction is not !remove! then we add a new reaction to the list
                if (reaction !== '!remove!') {
                    filteredReacts.push({ userWhoReacted: userWhoReacted, reaction: reaction });
                }
                return { ...message, reacts: filteredReacts };
            }));
        });

        return () => {
            // disabling socket event listeners
            socket.off('newMessage');
            socket.off('deleteMessage');
            socket.off('changePermissions');
            socket.off('userKickOrBan');
            socket.off('reaction');
        }
    }, []);

    useEffect(() => {
        if (osVersion >= 33) {
            const onShow = (e) => setKeyboardHeight(e.endCoordinates.height);
            const onHide = (e) => setKeyboardHeight(0);

            const showEvent = Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow';
            const hideEvent = Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide';

            const showListener = Keyboard.addListener(showEvent, onShow);
            const hideListener = Keyboard.addListener(hideEvent, onHide);

            return () => {
                // removing keyboard event listeners
                showListener.remove();
                hideListener.remove();
            }
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messagesList]);

    const scrollToBottom = () => {
        if (listRef.current && messagesList.length > 0) {
            // using setTimeout to delay the scroll until after rendering
            setTimeout(() => {
                listRef.current.scrollToIndex({ index: 0, animated: false });
                //listRef.current.scrollTo({ y: 0 });
            }, 100);
        }
    }

    // have the text input's height change when content height changes
    const onTextInputSizeChange = (e) => {
        // have the input height be between scaleSize(44) and scaleSize(120)
        const maxHeight = Math.min(e.nativeEvent.contentSize.height, scaleSize(120));
        setTextInputHeight(Math.max(maxHeight, scaleSize(44)));
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
            console.log('Error at picking file:', err.message);
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
                content: messageField.trim(),
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
                setTextInputHeight(scaleSize(44));
                // scrollToBottom();

                // emit send message through socket here!
            }
        } catch (err) {
            console.error('Error sending message:', err);
            Alert.alert('Error', 'Failed to send message');
        }
    }

    const handleDeleteMessage = async (messageId) => {
        try {
            const res = await axiosInstance.delete(`message/${messageId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                validateStatus: status => status < 500,
            });

            if (res.status >= 400) {
                const errorMessage = res.data.error;
                console.log(errorMessage);
                Alert.alert('Error', errorMessage);
            }

            if (res.status === 200) {
                // const filteredList = messagesList.filter((message) => message._id !== messageId);
                // setMessagesList(filteredList);
                setModalVisible(false);
            }
        } catch (err) {
            console.error('Error deleting message:', err);
            Alert.alert('Error', 'Failed to delete message');
        }
    }

    const handleReact = async (messageId, reaction) => {
        try {
            const res = await axiosInstance.put(`message/react/${messageId}`, {
                reaction: reaction,
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                validateStatus: status => status < 500,
            });

            if (res.status >= 400) {
                const errorMessage = res.data.error;
                console.log(errorMessage);
                Alert.alert('Error', errorMessage);
            }

            if (res.status === 200) {
                setModalVisible(false);
            }
        } catch (err) {
            console.error('Error reacting to message:', err);
            Alert.alert('Error', 'Failed to react to message');
        }
    }

    return (
        <View behavior={undefined} keyboardVerticalOffset={0} style={{ flex: 1, alignItems: 'center', paddingBottom: keyboardHeight }}>
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
                        currentUserId={currentUserId.current}
                        navigation={navigation}
                        setSelectedMessage={setSelectedMessage}
                        setModalVisible={setModalVisible}
                    />
                }
                keyExtractor={(item, index) => `${item._id}-${index}`}
                contentContainerStyle={styles.messagesContainer}
                getItemLayout={(data, index) => ({
                    length: 250,
                    offset: 100 * index,
                    index,
                })}
                initialNumToRender={10}
                windowSize={10}
                keyboardShouldPersistTaps="handled"
                // checking if list is scrolled to (near) bottom
                // onScroll={onScroll}
                //onContentSizeChange={() => scrollToBottom()}
                // making flatlist inverted so that scrolling to bottom is easier lol
                // and apparently more smooth
                inverted
            />

            {attachment &&
                <View style={styles.attachmentContainer}>
                    <TouchableOpacity onPress={() => setAttachment(null)}>
                        <Icon name="times-circle" size={scaleSize(20)} color="black"/>
                    </TouchableOpacity>
                    <Text style={{ maxWidth: scaleSize(300) }}>{attachment?.name}</Text>
                </View>
            }

            <View style={styles.inputContainer}>
                <TouchableOpacity style={styles.attachmentIcon} onPress={handlePickAttachment}>
                    <Icon name="paperclip" size={scaleSize(26)} color="black"/>
                </TouchableOpacity>
                <TextInput
                    style={{...styles.messageInput, height: textInputHeight}}
                    value={messageField}
                    onChangeText={setMessageField}
                    onContentSizeChange={onTextInputSizeChange}
                    placeholder="Type a message..."
                    placeholderTextColor="grey"
                    multiline
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                    <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
            </View>

            <MessageManageModal
                message={selectedMessage}
                isVisible={isModalVisible}
                handleDeleteMessage={handleDeleteMessage}
                closeModal={() => {setModalVisible(false); setSelectedMessage(null)}}
                permissionLevel={currentPermissionLevel}
                currentUserId={currentUserId.current}
                handleReact={handleReact}
                navigation={navigation}
            />
        </View>
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
        maxWidth: scaleSize(260),
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
        //marginRight: 6
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
        minHeight: getScreenHeight(1/13),
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderColor: 'grey',
        flexGrow: 1,
    },
    messageInput: {
        ...globalStyles.input,
        flexGrow: 1,
        flexShrink: 1,

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
    },
    reactionsBubble: {
        flexDirection: 'row',
        borderRadius: 10,
        padding: scaleSize(6),
        backgroundColor: 'ghostwhite',
        alignSelf: 'flex-end',
        flexGrow: 0,
        position: 'absolute',
        bottom: -25,
        right: 5,
    }
});

export default MessagesScreen;