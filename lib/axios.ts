import axios from 'axios';

const api = axios.create({
    // Asegúrate de que esta URL sea la de tu IP de AWS
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://13.58.196.224:8081/api',
});

// INTERCEPTOR PARA INYECTAR EL TOKEN
api.interceptors.request.use(
    (config) => {
        // 1. Buscamos el token tal cual lo guardaste en el login
        const token = typeof window !== 'undefined' ? localStorage.getItem('jwtToken') : null;

        if (token) {
            // 2. IMPORTANTE: El formato debe ser "Bearer TOKEN"
            config.headers.Authorization = `Bearer ${token}`;
            console.log("Token inyectado correctamente"); // Esto te ayudará a ver en consola si funciona
        } else {
            console.warn("No se encontró jwtToken en localStorage");
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;