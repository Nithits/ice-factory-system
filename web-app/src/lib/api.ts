import axios from 'axios';
import type {
  AuthUser,
  Delivery,
  IceProduct,
  Trip,
  Vehicle,
  VehicleWithLocation,
} from '@/types';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

const TOKEN_KEY = 'accessToken';
const USER_KEY = 'authUser';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function clearAuth() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Token หมดอายุ/ใช้ไม่ได้แล้ว -> เคลียร์ session แล้วเด้งไปหน้า login
// แทนที่จะปล่อยให้หน้าจอ crash ด้วย unhandled 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      clearAuth();

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export interface LoginResult {
  accessToken: string;
  user: AuthUser;
}

export const authApi = {
  login: (username: string, password: string) =>
    api
      .post<LoginResult>('/auth/login', { username, password })
      .then((res) => res.data),
};

export const tripsApi = {
  list: () => api.get<Trip[]>('/trips').then((res) => res.data),
  get: (id: number) => api.get<Trip>(`/trips/${id}`).then((res) => res.data),
};

export const deliveriesApi = {
  list: () => api.get<Delivery[]>('/deliveries').then((res) => res.data),
};

export const vehiclesApi = {
  list: () => api.get<Vehicle[]>('/vehicles').then((res) => res.data),
};

export const iceProductsApi = {
  list: () =>
    api.get<IceProduct[]>('/ice-products').then((res) => res.data),
};

export const trackingApi = {
  latestVehicles: () =>
    api
      .get<VehicleWithLocation[]>('/tracking/vehicles')
      .then((res) => res.data),
};
