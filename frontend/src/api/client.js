import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api"

const STORAGE_KEY = "siih_user";

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers:{
        "Content-Type": "application/json",
    }
});

apiClient.interceptors.request.use((config) =>{
    try{
        const savedUser = localStorage.getItem(STORAGE_KEY);

        if (savedUser){
            const { token } = JSON.parse(savedUser);
            if (token){
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
    } catch { /* empty */ }

    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401){
            localStorage.removeItem(STORAGE_KEY);
            if (window.location.pathname !== "/login"){
                window.location.href = "/login";
            } 
        }

        return Promise.reject(error);
    },
);

export default apiClient;