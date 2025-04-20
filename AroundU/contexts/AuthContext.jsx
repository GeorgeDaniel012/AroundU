import { createContext, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

// context to store access token in app memory
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [accessToken, setAccessToken] = useState(null);

    const getRefreshTokenCookie = (res) => {
        const cookie = (res.headers['set-cookie'])
            .find(cookie => cookie.includes('refreshToken'))
            ?.match(new RegExp(`^refreshToken=(.+?);`))
            ?.[1];
        return cookie;
    }

    // this function actually returns a bool
    // that specifies if the login is successful,
    // and thus the app can navigate to the tabs
    const login = async (username, password) => {
        try {
            const res = await axiosInstance.post('/login', {
                username, password
            }, {
                validateStatus: status => status < 500, // throw error if status is at least 500
            }); 

            console.log(res);

            if (res.status >= 400 ) {
                const errorMessage = res.data.error;
                console.log(errorMessage);
                Alert.alert('Error', errorMessage);
                return false;
            }
            
            if (res.status === 200) {
                console.log(res.data.token);
                Alert.alert('Success', 'You are now logged in!');
                setAccessToken(res.data.token);
                await AsyncStorage.setItem('refreshToken', getRefreshTokenCookie(res));
            }
            return true;
        } catch (err) {
            console.error('Error authenticating user:', err);
            return false;
        }
    }

    const logout = async () => {
        setAccessToken(null);
        AsyncStorage.removeItem('refreshToken');
    }

    const refresh = async () => {
        try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            if (refreshToken !== null) {
                const res = await axiosInstance.post('/refresh', {}, {
                    headers: {
                        Cookie: `refreshToken=${refreshToken}`
                    },
                    validateStatus: status => status < 500, // throw error if status is at least 500);
                });

                if (res.status >= 400 ) {
                    const errorMessage = res.data.error;
                    console.log(errorMessage);
                    Alert.alert('Error', errorMessage);
                    return false;
                }
                
                if (res.status === 200) {
                    console.log(res.data.token);
                    setAccessToken(res.data.token);
                    return true;
                }
            }
            return false;
        } catch (err) {
            console.log(err);
            return false;
        }
    }

    return (
        <AuthContext.Provider value={{ accessToken, login, logout, refresh }}>
            {children}
        </AuthContext.Provider>
    )
}