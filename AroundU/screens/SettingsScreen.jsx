import React, { useContext, useState } from "react";
import { View, Text, Button, Modal, TouchableOpacity, Alert, TextInput } from "react-native";
import { AuthContext } from "../contexts/AuthContext";
import { passwordStrengthRegexp, resetNavigationStack } from "../utils/helpers";
import axiosInstance from "../utils/axiosInstance";
import globalStyles from "../styles/globalStyles";
import BackButton from "../components/BackButton";

const ChangePasswordModal = (props) => {
    const [oldPasswordField, setOldPasswordField] = useState('');
    const [newPasswordField, setNewPasswordField] = useState('');
    const { closeModal, isVisible, } = props;
    const { accessToken } = useContext(AuthContext);

    const handleChangePassword = async () => {
        if (!oldPasswordField || !newPasswordField) {
            Alert.alert('Error', 'Please fill out all fields');
            return;
        }

        if (!newPasswordField.match(passwordStrengthRegexp)) {
            Alert.alert('Error', 'New password is not secure enough.\n' +
                'Make sure your password satisfies the following conditions:\n' +
                '- is at least 8 characters long;\n' +
                '- has at least one lowercase and one uppercase letter;\n' +
                '- has at least one digit and one special character (#?!@$%^&*-).\n'
            );
            return;
        }

        try {
            const res = await axiosInstance.put('/user/update/changePassword', {
                password: oldPasswordField,
                newPassword: newPasswordField
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                validateStatus: status => status < 500, // throw error if status is at least 500
            });

            if (res.status >= 400) {
                const errorMessage = res.data.error;
                console.log(errorMessage);
                Alert.alert('Error', errorMessage);
            }
            
            if (res.status === 200) {
                Alert.alert('Success', 'You have changed your password!');
            }
        } catch (err) {
            console.error('Error changing password:', err);
        }
    }

    return (
        <Modal
            visible={isVisible}
            onRequestClose={closeModal}
            animationType='slide'
        >
            <BackButton onPress={closeModal}/>
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <TextInput
                    style={globalStyles.input}
                    value={oldPasswordField}
                    onChangeText={setOldPasswordField}
                    placeholder="Current Password"
                    placeholderTextColor="grey"
                    secureTextEntry
                />
                <TextInput
                    style={globalStyles.input}
                    value={newPasswordField}
                    onChangeText={setNewPasswordField}
                    placeholder="New Password"
                    placeholderTextColor="grey"
                    secureTextEntry
                />
                <TouchableOpacity style={globalStyles.redButtons} onPress={handleChangePassword}>
                    <Text style={globalStyles.buttonText}>Change Password</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

const DeleteAccountModal = (props) => {
    const [passwordField, setPasswordField] = useState('');
    const { closeModal, isVisible, navigation } = props;
    const { accessToken, logout } = useContext(AuthContext);

    const handleDeleteAccount = async () => {
        if (!passwordField) {
            Alert.alert('Error', 'Please fill out password field');
            return;
        }
        
        try {
            const res = await axiosInstance.put('/user/delete', {
                password: passwordField,
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                validateStatus: status => status < 500, // throw error if status is at least 500
            });

            if (res.status >= 400) {
                const errorMessage = res.data.error;
                console.log(errorMessage);
                Alert.alert('Error', errorMessage);
            }
            
            if (res.status === 200) {
                Alert.alert('Success', 'You have deleted your account.');
                logout();
                resetNavigationStack(navigation, 'LoginScreen');
            }
        } catch (err) {
            console.error('Error deleting account:', err);
        }
    }

    return (
        <Modal
            visible={isVisible}
            onRequestClose={closeModal}
            animationType='slide'
        >
            <BackButton onPress={closeModal}/>
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <TextInput
                    style={globalStyles.input}
                    value={passwordField}
                    onChangeText={setPasswordField}
                    placeholder="Current Password"
                    placeholderTextColor="grey"
                    secureTextEntry
                />
                <TouchableOpacity style={globalStyles.redButtons} onPress={handleDeleteAccount}>
                    <Text style={globalStyles.buttonText}>Delete Account</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

const SettingsScreen = ({ navigation }) => {
    const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false);
    const [isDeleteAccountModalVisible, setIsDeleteAccountModalVisible] = useState(false);
    const {logout} = useContext(AuthContext);

    const logoutCallback = async () => {
        logout();
        resetNavigationStack(navigation, 'LoginScreen');
    }

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <TouchableOpacity style={globalStyles.buttons} onPress={logoutCallback}>
                <Text style={globalStyles.buttonText}>Logout</Text>
            </TouchableOpacity>

            <TouchableOpacity style={globalStyles.redButtons} onPress={() => setIsChangePasswordModalVisible(true)}>
                <Text style={globalStyles.buttonText}>Change Password</Text>
            </TouchableOpacity>
            <ChangePasswordModal
                isVisible={isChangePasswordModalVisible}
                closeModal={() => setIsChangePasswordModalVisible(false)}
            />

            <TouchableOpacity style={globalStyles.redButtons} onPress={() => setIsDeleteAccountModalVisible(true)}>
                <Text style={globalStyles.buttonText}>Delete Account</Text>
            </TouchableOpacity>
            <DeleteAccountModal
                isVisible={isDeleteAccountModalVisible}
                closeModal={() => setIsDeleteAccountModalVisible(false)}
                navigation={navigation}
            />
        </View>
    );
}

export default SettingsScreen;