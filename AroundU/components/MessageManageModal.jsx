import React from "react";
import { Modal, View, Text, TouchableWithoutFeedback, TouchableOpacity, StyleSheet } from "react-native";
import { scaleSize } from "../utils/helpers";
import globalStyles from "../styles/globalStyles";

const MessageManageModal = ({ navigation, ...props }) => {
    const { handleDeleteMessage, message, isVisible, closeModal, permissionLevel } = props;

    const handleProfileView = () => {
        closeModal();
        navigation.navigate("ProfileScreen", { userId: message.sender._id });
    }

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
                                <Text style={globalStyles.unselectedThemeText}>View {message?.sender.userProfile.displayName}'s profile</Text>
                            </TouchableOpacity>

                            {permissionLevel >= 1 &&
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