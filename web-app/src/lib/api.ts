import axios from 'axios';
import type {
  AuthUser,
  Customer,
  Delivery,
  IceProduct,
  IceTank,
  ProblemReport,
  ProblemStatus,
  Shift,
  TankStatus,
  Trip,
  UserRole,
  Vehicle,
  VehicleStatus,
  VehicleWithLocation,
  Village,
  Zone,
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

export function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const message = err.response?.data?.message;
    if (typeof message === 'string') return message;
  }
  return fallback;
}

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

export interface CreateVehiclePayload {
  name: string;
  plate: string;
  status?: VehicleStatus;
}

export const vehiclesApi = {
  list: () => api.get<Vehicle[]>('/vehicles').then((res) => res.data),
  create: (payload: CreateVehiclePayload) =>
    api.post<Vehicle>('/vehicles', payload).then((res) => res.data),
  update: (id: number, payload: Partial<CreateVehiclePayload>) =>
    api.patch<Vehicle>(`/vehicles/${id}`, payload).then((res) => res.data),
  remove: (id: number) =>
    api.delete(`/vehicles/${id}`).then((res) => res.data),
};

export interface CreateIceProductPayload {
  name: string;
  unit?: string;
  price: number;
  isActive?: boolean;
}

export const iceProductsApi = {
  list: () =>
    api.get<IceProduct[]>('/ice-products').then((res) => res.data),
  create: (payload: CreateIceProductPayload) =>
    api.post<IceProduct>('/ice-products', payload).then((res) => res.data),
  update: (id: number, payload: Partial<CreateIceProductPayload>) =>
    api
      .patch<IceProduct>(`/ice-products/${id}`, payload)
      .then((res) => res.data),
  remove: (id: number) =>
    api.delete(`/ice-products/${id}`).then((res) => res.data),
};

export const trackingApi = {
  latestVehicles: () =>
    api
      .get<VehicleWithLocation[]>('/tracking/vehicles')
      .then((res) => res.data),
};

export interface CreateUserPayload {
  name: string;
  username: string;
  password: string;
  phone?: string;
  role?: UserRole;
}

export const usersApi = {
  list: () => api.get<AuthUser[]>('/users').then((res) => res.data),
  create: (payload: CreateUserPayload) =>
    api.post<AuthUser>('/users', payload).then((res) => res.data),
};

export const zonesApi = {
  list: () => api.get<Zone[]>('/zones').then((res) => res.data),
  create: (name: string) =>
    api.post<Zone>('/zones', { name }).then((res) => res.data),
  remove: (id: number) => api.delete(`/zones/${id}`).then((res) => res.data),
};

export const villagesApi = {
  list: () => api.get<Village[]>('/villages').then((res) => res.data),
  create: (payload: { zoneId: number; name: string }) =>
    api.post<Village>('/villages', payload).then((res) => res.data),
  remove: (id: number) =>
    api.delete(`/villages/${id}`).then((res) => res.data),
};

export interface CreateCustomerPayload {
  villageId: number;
  name: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  note?: string;
}

export const customersApi = {
  list: () => api.get<Customer[]>('/customers').then((res) => res.data),
  get: (id: number) =>
    api.get<Customer>(`/customers/${id}`).then((res) => res.data),
  create: (payload: CreateCustomerPayload) =>
    api.post<Customer>('/customers', payload).then((res) => res.data),
  remove: (id: number) =>
    api.delete(`/customers/${id}`).then((res) => res.data),
};

export const iceTanksApi = {
  create: (payload: {
    customerId: number;
    size: string;
    quantity?: number;
    status?: TankStatus;
  }) => api.post<IceTank>('/ice-tanks', payload).then((res) => res.data),
  update: (id: number, status: TankStatus) =>
    api
      .patch<IceTank>(`/ice-tanks/${id}`, { status })
      .then((res) => res.data),
  remove: (id: number) =>
    api.delete(`/ice-tanks/${id}`).then((res) => res.data),
};

export const shiftsApi = {
  findActive: () => api.get<Shift[]>('/shifts/active').then((res) => res.data),
};

export const problemReportsApi = {
  list: (status?: ProblemStatus) =>
    api
      .get<ProblemReport[]>('/problem-reports', { params: { status } })
      .then((res) => res.data),
  resolve: (id: number) =>
    api
      .patch<ProblemReport>(`/problem-reports/${id}/resolve`)
      .then((res) => res.data),
};
