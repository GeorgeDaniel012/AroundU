import axios from 'axios';
import { CONNECTION } from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAccessTokenExternal } from '../contexts/AuthContext';

const axiosInstance = axios.create({
    baseURL: `${CONNECTION}`,
    withCredentials: true,
    // timeout: 2000
});

axiosInstance.interceptors.request.use(
    async (req) => {
        // console.log('[Axios Interceptor] Request:', req);
        return req;
    },
    async (err) => {
        console.log('[Axios Interceptor] Request Error:', err);
        return err;
    },
);

// in case the user is unauthorized to perform the request (code 401)
// the app tries to refresh the token and tries the request again
axiosInstance.interceptors.response.use(
    async (res) => {
        // console.log('[Axios Interceptor] Response:', res);
        return res;
    },
    async (err) => {
        console.error('[Axios Interceptor] Response Error:', err);
        if (err.response?.status === 401) {
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
                        // Alert.alert('Error', errorMessage);
                    }
                    
                    if (res.status === 200) {
                        // console.log(res.data.token);
                        setAccessTokenExternal(res.data.token);
                    }

                    return axiosInstance(res);
                }
            } catch (err) {
                console.log(err);
            }

        }
        
        return Promise.reject(err);
    }
);

export default axiosInstance;