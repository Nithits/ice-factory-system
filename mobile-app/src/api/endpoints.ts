import { api } from './api';
import type {
  AuthUser,
  Customer,
  Delivery,
  IceProduct,
  ProblemCategory,
  ProblemReport,
  Shift,
  Trip,
  UserRole,
  Vehicle,
  VehicleWithLocation,
  Village,
  Zone,
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
  helperIds?: number[];
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
  customerId?: number;
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

export const zonesApi = {
  list: () => api.get<Zone[]>('/zones').then((res) => res.data),
};

export const villagesApi = {
  list: (zoneId?: number) =>
    api
      .get<Village[]>('/villages', { params: { zoneId } })
      .then((res) => res.data),
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
  list: (villageId?: number) =>
    api
      .get<Customer[]>('/customers', { params: { villageId } })
      .then((res) => res.data),
  create: (payload: CreateCustomerPayload) =>
    api.post<Customer>('/customers', payload).then((res) => res.data),
};

export interface StartShiftPayload {
  tripId: number;
}

export const shiftsApi = {
  start: (payload: StartShiftPayload) =>
    api.post<Shift>('/shifts', payload).then((res) => res.data),
  listByTrip: (tripId: number) =>
    api.get<Shift[]>('/shifts', { params: { tripId } }).then((res) => res.data),
  takeBreak: (id: number) =>
    api.patch<Shift>(`/shifts/${id}/break`).then((res) => res.data),
  resume: (id: number) =>
    api.patch<Shift>(`/shifts/${id}/resume`).then((res) => res.data),
  end: (id: number) =>
    api.patch<Shift>(`/shifts/${id}/end`).then((res) => res.data),
};

export interface CreateProblemReportPayload {
  tripId: number;
  category?: ProblemCategory;
  description: string;
  latitude?: number;
  longitude?: number;
}

export const problemReportsApi = {
  create: (payload: CreateProblemReportPayload) =>
    api
      .post<ProblemReport>('/problem-reports', payload)
      .then((res) => res.data),
};
