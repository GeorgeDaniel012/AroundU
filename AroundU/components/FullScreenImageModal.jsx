import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, Image } from 'react-native';
import Icon from "react-native-vector-icons/FontAwesome5";

const FullScreenImageModal = ({navigation, ...props}) => {
    const { image, closeModal, isVisible } = props;

    return (
        <Modal
            visible={isVisible}
            onRequestClose={closeModal}
            animationType='fade'
        >
            <View style={styles.modalContainer}>
                <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                    <Icon name="times" size={scaleSize(30)} color="white"/>
                </TouchableOpacity>
                <Image
                    source={{ uri: image.uri, cache: 'default' }}
                    style={{ width: image.width, height: image.height }}
                    resizeMode="contain"
                />
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 1)',
    },
    closeButton: {
        position: 'absolute',
        top: scaleSize(15),
        left: scaleSize(15)
    }
});

export default FullScreenImageModal;