import { api } from './api';
import type {
  AuthUser,
  Delivery,
  IceProduct,
  Trip,
  UserRole,
  Vehicle,
  VehicleWithLocation,
} from '../types';

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

export const vehiclesApi = {
  list: () => api.get<Vehicle[]>('/vehicles').then((res) => res.data),
};

export const iceProductsApi = {
  list: () =>
    api.get<IceProduct[]>('/ice-products').then((res) => res.data),
};

export interface CreateTripItemPayload {
  iceProductId: number;
  loadedQuantity: number;
}

export interface CreateTripPayload {
  vehicleId: number;
  driverId: number;
  items: CreateTripItemPayload[];
}

export const tripsApi = {
  list: () => api.get<Trip[]>('/trips').then((res) => res.data),
  get: (id: number) => api.get<Trip>(`/trips/${id}`).then((res) => res.data),
  create: (payload: CreateTripPayload) =>
    api.post<Trip>('/trips', payload).then((res) => res.data),
  start: (id: number) =>
    api.patch<Trip>(`/trips/${id}/start`).then((res) => res.data),
  complete: (id: number) =>
    api.patch<Trip>(`/trips/${id}/complete`).then((res) => res.data),
};

export interface CreateDeliveryItemPayload {
  iceProductId: number;
  quantity: number;
  unitPrice: number;
}

export interface CreateDeliveryPayload {
  tripId: number;
  customerName: string;
  village?: string;
  latitude?: number;
  longitude?: number;
  items: CreateDeliveryItemPayload[];
}

export const deliveriesApi = {
  list: () => api.get<Delivery[]>('/deliveries').then((res) => res.data),
  get: (id: number) =>
    api.get<Delivery>(`/deliveries/${id}`).then((res) => res.data),
  create: (payload: CreateDeliveryPayload) =>
    api.post<Delivery>('/deliveries', payload).then((res) => res.data),
};

export interface SendLocationPayload {
  vehicleId: number;
  tripId?: number;
  latitude: number;
  longitude: number;
  speed?: number;
  accuracy?: number;
  heading?: number;
}

export const trackingApi = {
  sendLocation: (payload: SendLocationPayload) =>
    api.post('/tracking/location', payload).then((res) => res.data),
  latestVehicles: () =>
    api
      .get<VehicleWithLocation[]>('/tracking/vehicles')
      .then((res) => res.data),
};
