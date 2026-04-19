import { API_BASE_URL, AUTH_STORAGE_KEY, USER_STORAGE_KEY } from '../config';

export interface User {
  id: number;
  email: string;
  department?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_STORAGE_KEY);
};

export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userData = localStorage.getItem(USER_STORAGE_KEY);
  return userData ? JSON.parse(userData) : null;
};

export const setAuthToken = (token: string, user: User): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_STORAGE_KEY, token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const clearAuth = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Login failed');
  }

  const data = await response.json();
  setAuthToken(data.token, data.user);
  return data;
};

export const logout = (): void => {
  clearAuth();
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

export const getHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};
