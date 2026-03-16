import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getBaseUrl = () => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  
  if (!apiUrl || apiUrl.trim() === '') {
    const errorMessage = '[API] EXPO_PUBLIC_API_URL is not configured in .env file';
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  
  console.log(`[API] Using API URL: ${apiUrl}`);
  return apiUrl;
};

const client = axios.create({
  baseURL: getBaseUrl(),
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