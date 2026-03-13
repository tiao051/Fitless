import client from './apiClient';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

export const AuthService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await client.post('/users/login', {
      email,
      password,
    });
    return response.data;
  },

  register: async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<AuthResponse> => {
    const response = await client.post('/users/register', {
      email,
      password,
      firstName,
      lastName,
    });
    return response.data;
  },

  getUser: async (userId: number): Promise<User> => {
    const response = await client.get(`/users/${userId}`);
    return response.data;
  },
};
