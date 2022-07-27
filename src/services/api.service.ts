import axiosRoot, { AxiosInstance } from 'axios';
import { API_BASE_URL } from '../constants/constants';

class Api {
    private axios: AxiosInstance;

    constructor() {
        this.axios = axiosRoot.create({
            baseURL: API_BASE_URL,
        });
        // Set Authorization Token Here
        this.axios.interceptors.response.use((response) => {
            if (response.status < 300) {
                return response.data;
            }
            return response;
        });
    }

    /**
     * Set Bearer Token manually
     * @param data
     */
    setToken(token: string) {
        this.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }





}

export const ApiService = new Api();