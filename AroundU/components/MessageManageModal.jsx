import React, { useEffect } from "react";
import { Modal, View, Text, TouchableWithoutFeedback, TouchableOpacity, StyleSheet } from "react-native";
import { scaleSize } from "../utils/helpers";
import globalStyles from "../styles/globalStyles";

const MessageManageModal = ({ navigation, ...props }) => {
    const { handleDeleteMessage, message, isVisible, closeModal, permissionLevel, handleReact, currentUserId } = props;

    const handleProfileView = () => {
        closeModal();
        navigation.navigate("ProfileScreen", { userId: message.sender._id });
    }

    //useEffect(() => console.log(message), [message]);

    return (
        <Modal
            visible={isVisible}
            onRequestClose={closeModal}
            transparent={true}
            animationType='fade'
        >
            <TouchableWithoutFeedback onPress={closeModal}>
                <View style={styles.modalContainer}>
                    {/* making an inner touchable without propagation
                        so that it doesn't close after pressing anywhere on the modal
                        but rather "outside" it
                    */}
                    <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
                        <View style={styles.modalContent}>
                            <TouchableOpacity onPress={handleProfileView} style={styles.modalOptions}>
                                <Text style={{...globalStyles.unselectedThemeText, textAlign: 'center'}}>View {message?.sender.userProfile.displayName}'s profile</Text>
                            </TouchableOpacity>

                            {/* if current user didn't like message */}
                            {!message?.reacts.some(react => react.userWhoReacted === currentUserId && react.reaction === 'like') &&
                                <TouchableOpacity onPress={() => handleReact(message?._id, 'like')} style={styles.modalOptions}>
                                    <Text style={globalStyles.unselectedThemeText}>Like message</Text>
                                </TouchableOpacity>
                            }

                            {/* if current user didn't dislike message */}
                            {!message?.reacts.some(react => react.userWhoReacted === currentUserId && react.reaction === 'dislike') &&
                                <TouchableOpacity onPress={() => handleReact(message?._id, 'dislike')} style={styles.modalOptions}>
                                    <Text style={globalStyles.unselectedThemeText}>Dislike message</Text>
                                </TouchableOpacity>
                            }
                            
                            {/* if current user did react to message */}
                            {message?.reacts.some(react => react.userWhoReacted === currentUserId) &&
                                <TouchableOpacity onPress={() => handleReact(message?._id, '!remove!')} style={styles.modalOptions}>
                                    <Text style={globalStyles.unselectedThemeText}>Remove reaction</Text>
                                </TouchableOpacity>
                            }

                            {(permissionLevel >= 1 || message?.sender._id === currentUserId) &&
                                <TouchableOpacity onPress={() => handleDeleteMessage(message?._id)} style={styles.modalOptions}>
                                    <Text style={globalStyles.unselectedThemeText}>Delete message</Text>
                                </TouchableOpacity>
                            }
                        </View>
                    </TouchableWithoutFeedback>
                </View>
                {/* <BackButton onPress={closeModal}/> */}
                
            </TouchableWithoutFeedback>
        </Modal>
    )
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: scaleSize(250),
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    modalOptions: {
        margin: 10
    },
});

export default MessageManageModal;