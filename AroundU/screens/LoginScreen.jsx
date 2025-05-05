import React, { useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, Button, Alert, TouchableOpacity, Image } from "react-native";
import { AuthContext } from "../contexts/AuthContext";
import axiosInstance from "../utils/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { passwordStrengthRegexp, resetNavigationStack, scaleSize } from "../utils/helpers";
import globalStyles from "../styles/globalStyles";

const LoginContainer = ({ usernameField, passwordField, setUsernameField, setPasswordField,
    handleAuthentication }) => {
    return (
        <>
            <TextInput
                style={globalStyles.input}
                value={usernameField}
                onChangeText={setUsernameField}
                placeholder="Username"
                placeholderTextColor="grey"
            />
            <TextInput
                style={globalStyles.input}
                value={passwordField}
                onChangeText={setPasswordField}
                placeholder="Password"
                placeholderTextColor="grey"
                secureTextEntry
            />
            <TouchableOpacity style={globalStyles.buttons} onPress={handleAuthentication}>
                <Text style={globalStyles.buttonText}>Login</Text>
            </TouchableOpacity>
        </>
    );
}

const RegisterContainer = ({ emailField, setEmailField, usernameField, passwordField,
    setUsernameField, setPasswordField, handleRegister }) => {
    return (
        <>
            <TextInput
                style={globalStyles.input}
                value={emailField}
                onChangeText={setEmailField}
                placeholder="Email"
                placeholderTextColor="grey"
            />
            <TextInput
                style={globalStyles.input}
                value={usernameField}
                onChangeText={setUsernameField}
                placeholder="Username"
                placeholderTextColor="grey"
            />
            <TextInput
                style={globalStyles.input}
                value={passwordField}
                onChangeText={setPasswordField}
                placeholder="Password"
                placeholderTextColor="grey"
                secureTextEntry
            />
            <TouchableOpacity style={globalStyles.buttons} onPress={handleRegister}>
                <Text style={globalStyles.buttonText}>Register</Text>
            </TouchableOpacity>
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
        if (!usernameField || !passwordField) {
            Alert.alert('Error', 'Please fill out all fields');
            return;
        }

        const canNavigate = await login(usernameField, passwordField);
        if (canNavigate) {
            // the user logged in and so
            // the app resets the stack to the main tabs
            resetNavigationStack(navigation, 'MainBottomTabs');
        } else {

        }
    }

    const handleRegister = async () => {
        if (!usernameField || !passwordField || !emailField) {
            Alert.alert('Error', 'Please fill out all fields');
            return;
        }

        if (!passwordField.match(passwordStrengthRegexp)) {
            Alert.alert('Error', 'Password is not secure enough.\n' +
                'Make sure your password satisfies the following conditions:\n' +
                '- is at least 8 characters long;\n' +
                '- has at least one lowercase and one uppercase letter;\n' +
                '- has at least one digit and one special character (#?!@$%^&*-).\n'
            );
            return;
        }

        try {
            const response = await axiosInstance.post('/register', {
                username: usernameField,
                password: passwordField,
                email: emailField
            }, {
                validateStatus: status => status < 500, // throw error if status is at least 500
            }); 

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
            <Image style={styles.logo} source={require('../assets/images/AroundU-Icon.png')}/>
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
                <Text style={{ fontSize: scaleSize(18), textDecorationLine: 'underline' }}>{isLogin ? "Make an account instead?" : "Log in using existing account instead?"}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    logo: {
        height: scaleSize(100),
        width: scaleSize(100),
        margin: scaleSize(10)
    },
    container: {
        flex: 1,
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: '#eee',
		borderWidth: 4,
		marginBottom: scaleSize(10),
		padding: 8,
		borderRadius: 8,
    },
    input: {
		//height: 40,
        width: "70%",
		borderColor: '#ddd',
		borderWidth: 1,
		marginBottom: scaleSize(10),
		padding: 8,
		borderRadius: 4,
	},
});

export default LoginScreen;