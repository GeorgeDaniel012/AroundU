import axios from 'axios';
import { CONNECTION } from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const axiosInstance = axios.create({
    baseURL: `${CONNECTION}`,
    withCredentials: true,
    //timeout: 2000
});

// axiosInstance.interceptors.request.use(config => {
//     console.log(config);
//     return config;
// });

// in case the user is unauthorized to perform the request (code 401)
// the app tries to refresh the token and tries the request again
axiosInstance.interceptors.response.use(
    async (res) => res,
    async (err) => {
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

                    if (res.status >= 400 ) {
                        const errorMessage = res.data.error;
                        console.log(errorMessage);
                        Alert.alert('Error', errorMessage);
                    }
                    
                    if (res.status === 200) {
                        console.log(res.data.token);
                        setAccessToken(res.data.token);
                    }

                    return axiosInstance(res);
                }
            } catch (err) {
                console.log(err);
            }

            return err;
        }
    }
);

export default axiosInstance;