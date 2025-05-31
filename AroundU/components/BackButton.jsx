import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import { scaleSize } from "../utils/helpers";

const BackButton = ({ navigation, ...props }) => {
    const { onPress } = props;

    return (
        <TouchableOpacity style={styles.backButton} onPress={
            // if onPress prop is defined then it uses the specified
            // onPress function, else it just goes back through the navigation
            onPress ?
            onPress :
            () => navigation.goBack()
        }>
            <Icon name="chevron-left" size={scaleSize(30)} color="grey"/>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    backButton: {
        position: 'absolute',
        top: scaleSize(15),
        left: scaleSize(15)
    }
});

export default BackButton;