import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const getBaseUrl = () => {
  // 1. Ưu tiên dùng biến môi trường nếu có (Dành cho Production/Specific IP)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Tự động lấy IP của máy tính đang chạy Metro Bundler
  // debuggerHost thường có dạng "172.17.8.212:8081"
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.experienceUrl || '';
  
  const ipAddress = debuggerHost.split(':')[0];

  if (!ipAddress || ipAddress === 'localhost') {
    // Nếu chạy máy ảo Android trên PC thì dùng 10.0.2.2
    // Nếu vẫn không thấy thì dùng IP cứng của ông làm fallback
    console.warn('[API] Không dò được IP, dùng IP cứng 172.17.8.212');
    return 'http://172.17.8.212:5062/api';
  }

  return `http://${ipAddress}:5062/api`;
};

const client = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000, // Tăng lên 15s vì mạng Wifi đôi khi chậm
});

// Interceptor: Tự động đính Token vào mỗi Request
client.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.error('[API] Lỗi lấy token:', e);
  }
  return config;
});

export default client;