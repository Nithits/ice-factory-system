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
