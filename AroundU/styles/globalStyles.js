import { StyleSheet } from "react-native";
import { scaleSize } from "../utils/helpers";

export default StyleSheet.create({
    input: {
        borderWidth: 1,
        padding: 10,
        width: 300,
        margin: scaleSize(12),
        height: scaleSize(44),
        borderRadius: 10,
        fontSize: scaleSize(16),
        color: 'black'
    },
    selectedTheme: {
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'white', 
        padding: 10,
        borderWidth: 1, 
        borderColor: 'red',
        borderRadius: 10,
        maxHeight: 50,
        maxWidth: 300,
        flexDirection: 'row',
        margin: 5
    },
    selectedThemeText: { 
        color: 'red', 
        fontSize: scaleSize(16),
    },
    unselectedTheme: {
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'white', 
        padding: 10,
        borderWidth: 1, 
        borderRadius: 10,
        maxHeight: 50,
        maxWidth: 300,
        flexDirection: 'row',
        margin: 5
    },
    unselectedThemeText: { 
        color: 'black', 
        fontSize: scaleSize(16),
    },
    buttons: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'black',
        borderRadius: 10,
        margin: scaleSize(12),
    },
    redButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: 'red',
        borderRadius: 10,
        margin: scaleSize(12),
    },
    buttonText: {
        color: 'white',
        fontSize: scaleSize(20),
        //marginRight: scaleSize(18),
    },
    nameText: {
        color: 'black', 
        fontSize: scaleSize(30),
    }
});