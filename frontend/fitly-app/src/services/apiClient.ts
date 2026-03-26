import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Prefer full URL from env; fallback to host-based URL for local LAN dev.
const API_HOST = process.env.EXPO_PUBLIC_API_HOST || '192.168.1.5';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${API_HOST}:5062/api`;

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increase to 15s for WiFi stability
});

type UnauthorizedHandler = (() => Promise<void> | void) | null;

let unauthorizedHandler: UnauthorizedHandler = null;
let isHandlingUnauthorized = false;

export const registerUnauthorizedHandler = (handler: UnauthorizedHandler) => {
  unauthorizedHandler = handler;
};

// Interceptor: Automatically attach JWT token to requests
client.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.error('[API] Error retrieving token:', e);
  }
  return config;
});

// Interceptor: Handle expired token globally
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401 && unauthorizedHandler && !isHandlingUnauthorized) {
      isHandlingUnauthorized = true;
      try {
        await unauthorizedHandler();
      } finally {
        setTimeout(() => {
          isHandlingUnauthorized = false;
        }, 1000);
      }
    }

    return Promise.reject(error);
  }
);

export default client;