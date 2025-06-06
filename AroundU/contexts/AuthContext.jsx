import { createContext, useContext, useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

// we need to call setAccessToken in the axios response interceptor
// so to do that we will make a "copy" of it
let setAccessTokenExt = () => {};

export let latestAccessToken = null;

// context to store access token in app memory
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [accessToken, setAccessToken] = useState(null);

    // copying setAccessToken
    useEffect(() => {
        setAccessTokenExt = setAccessToken;
        latestAccessToken = accessToken;
    }, [accessToken]);

    // useEffect(() => {
    //     console.log('new access token:', accessToken);
    // }, [accessToken]);

    const getCookie = (res, cookieName) => {
        var match = res.headers['set-cookie'][0]
            .match(new RegExp("(^| )" + cookieName + "=([^;]+)"));
        return match ? match[2] : "";
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

            console.log('res:', res);

            if (res.status >= 400 ) {
                const errorMessage = res.data.error;
                console.log(errorMessage);
                Alert.alert('Error', errorMessage);
                return false;
            }
            
            if (res.status === 200) {
                Alert.alert('Success', 'You are now logged in!');
                console.log('cookie', getCookie(res, 'refreshToken'));
                setAccessToken(res.data.token);
                await AsyncStorage.setItem('refreshToken', getCookie(res, 'refreshToken'));
                await AsyncStorage.setItem('currentUserId', getCookie(res, 'currentUserId'));
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
        AsyncStorage.removeItem('currentUserId');
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

                if (res.status >= 400) {
                    const errorMessage = res.data.error;
                    console.log(errorMessage);
                    Alert.alert('Error', errorMessage);
                    return false;
                }
                
                if (res.status === 200) {
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

export const setAccessTokenExternal = (token) => {
    console.log(setAccessTokenExt);
    setAccessTokenExt(token);
}