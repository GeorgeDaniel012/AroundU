import React, { useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, Button, Alert, TouchableOpacity } from "react-native";
import { AuthContext } from "../contexts/AuthContext";
import axiosInstance from "../utils/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { resetNavigationStack } from "../utils/helpers";

const LoginContainer = ({ usernameField, passwordField, setUsernameField, setPasswordField,
    handleAuthentication }) => {
    return (
        <>
            <TextInput
                style={styles.input}
                value={usernameField}
                onChangeText={setUsernameField}
                placeholder="Username"
            />
            <TextInput
                style={styles.input}
                value={passwordField}
                onChangeText={setPasswordField}
                placeholder="Password"
                secureTextEntry
            />
            <Button title="Login" onPress={handleAuthentication}/>
        </>
    );
}

const RegisterContainer = ({ emailField, setEmailField, usernameField, passwordField,
    setUsernameField, setPasswordField, handleRegister }) => {
    return (
        <>
            <TextInput
                style={styles.input}
                value={emailField}
                onChangeText={setEmailField}
                placeholder="Email"
            />
            <TextInput
                style={styles.input}
                value={usernameField}
                onChangeText={setUsernameField}
                placeholder="Username"
            />
            <TextInput
                style={styles.input}
                value={passwordField}
                onChangeText={setPasswordField}
                placeholder="Password"
                secureTextEntry
            />
            <Button title="Register" onPress={handleRegister}/>
        </>
    );
}

const LoginScreen = ({ navigation }) => {
    const {login} = useContext(AuthContext);
    const [usernameField, setUsernameField] = useState('');
    const [passwordField, setPasswordField] = useState('');
    const [emailField, setEmailField] = useState('');
    const [isLogin, setIsLogin] = useState(true);

    const handleAuthentication = async () => {
        const canNavigate = await login(usernameField, passwordField);
        if (canNavigate) {
            // the user logged in and so
            // the app resets the stack to the main tabs
            resetNavigationStack(navigation, 'MainBottomTabs');
        }
    }

    const handleRegister = async () => {
        try {
            const response = await axiosInstance.post('/register', {
                username: usernameField,
                password: passwordField,
                email: emailField
            }/* , {
                validateStatus: status => status < 500, // throw error if status is at least 500
            } */); 

            console.log('response', response);

            if (response.status >= 400 ) {
                const errorMessage = response.data.error;
                console.log(errorMessage);
                Alert.alert('Error', errorMessage);
            }
            
            if (response.status === 201) {
                Alert.alert('Success', 'You have created a new account!');
            }
        } catch (err) {
            console.error('Error creating account:', err);
        }
    }

    const isLoginSwitch = () => {
        setEmailField('');
        setPasswordField('');
        setUsernameField('');
        setIsLogin(!isLogin);
    }

    return (
        <View style={styles.container}>
            {isLogin ?
                <LoginContainer
                    usernameField={usernameField}
                    passwordField={passwordField}
                    setUsernameField={setUsernameField}
                    setPasswordField={setPasswordField}
                    handleAuthentication={handleAuthentication}
                /> :
                <RegisterContainer
                    emailField={emailField}
                    usernameField={usernameField}
                    passwordField={passwordField}
                    setEmailField={setEmailField}
                    setUsernameField={setUsernameField}
                    setPasswordField={setPasswordField}
                    handleRegister={handleRegister}
                />
            }
            <TouchableOpacity onPress={isLoginSwitch}>
                <Text>{isLogin ? "Make an account instead" : "Log in using existing account instead"}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: '#eee',
		borderWidth: 4,
		marginBottom: 16,
		padding: 8,
		borderRadius: 8,
    },
    input: {
		//height: 40,
        width: "70%",
		borderColor: '#ddd',
		borderWidth: 1,
		marginBottom: 16,
		padding: 8,
		borderRadius: 4,
	},
});

export default LoginScreen;