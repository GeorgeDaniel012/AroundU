import axios from 'axios';
import { CONNECTION } from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { latestAccessToken, setAccessTokenExternal } from '../contexts/AuthContext';

const axiosInstance = axios.create({
    baseURL: `${CONNECTION}`,
    withCredentials: true,
    // timeout: 2000
});

axiosInstance.interceptors.request.use(
    async (req) => {
        // console.log('[Axios Interceptor] Request:', req);
        req.headers['Authorization'] = `Bearer ${latestAccessToken}`;
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
        console.log(`${res.config._retry ? 'after refresh' : 'before refresh'} ${res.config.headers}`);
        // console.log('[Axios Interceptor] Response:', res);
        if (res.status === 401 && !res.config._retry) {
            console.log('aaaa?')
            try {
                const refreshToken = await AsyncStorage.getItem('refreshToken');
                if (refreshToken !== null) {
                    const refreshRes = await axiosInstance.post('/refresh', {}, {
                        headers: {
                            Cookie: `refreshToken=${refreshToken}`
                        },
                        validateStatus: status => status < 500, // throw error if status is at least 500);
                    });

                    if (refreshRes.status >= 400) {
                        const errorMessage = refreshRes.data.error;
                        console.log(errorMessage);
                        // Alert.alert('Error', errorMessage);
                    }
                    
                    if (refreshRes.status === 200) {
                        // console.log(res.data.token);
                        setAccessTokenExternal(refreshRes.data.token);
                        console.log('aaaaa??!?!??!')

                        // setting a retry flag to mark that it was retried once
                        res.config._retry = true;
                        // setting authorization header to new access token
                        res.config.headers['Authorization'] = `Bearer ${refreshRes.data.token}`;

                        // wait a bit to avoid possible race condition
                        await new Promise(resolve => setTimeout(resolve, 500));
                        // resend request, now with new access token
                        return axiosInstance(res.config);
                    }
                }
            } catch (err) {
                console.log(err);
            }

        }
        return res;
    },
    async (err) => {
        console.error('[Axios Interceptor] Response Error:', err);
        return Promise.reject(err);
    }
);

export default axiosInstance;