import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Hardcoded API URL for local development (IP from ipconfig Wi-Fi adapter)
const API_BASE_URL = 'http://172.20.10.3:5062/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increase to 15s for WiFi stability
});

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

export default client;