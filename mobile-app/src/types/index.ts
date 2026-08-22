export type UserRole = 'ADMIN' | 'STAFF' | 'DRIVER';
export type VehicleStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type TripStatus = 'LOADING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID';

export interface AuthUser {
  id: number;
  name: string;
  username: string;
  phone: string | null;
  role: UserRole;
}

export interface Vehicle {
  id: number;
  name: string;
  plate: string;
  status: VehicleStatus;
}

export interface IceProduct {
  id: number;
  name: string;
  unit: string;
  price: string;
  isActive: boolean;
}

export interface TripItem {
  id: number;
  tripId: number;
  iceProductId: number;
  loadedQuantity: number;
  deliveredQuantity: number;
  remainingQuantity: number;
  iceProduct: IceProduct;
}

export interface DeliveryItem {
  id: number;
  deliveryId: number;
  iceProductId: number;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  iceProduct: IceProduct;
}

export interface Delivery {
  id: number;
  tripId: number;
  customerName: string | null;
  village: string | null;
  latitude: number | null;
  longitude: number | null;
  totalAmount: string;
  paymentStatus: PaymentStatus;
  deliveredAt: string;
  items: DeliveryItem[];
}

export interface TripDriver {
  id: number;
  name: string;
  username: string;
  role: UserRole;
}

export interface Trip {
  id: number;
  vehicleId: number;
  driverId: number;
  status: TripStatus;
  startTime: string | null;
  endTime: string | null;
  totalAmount: string;
  createdAt: string;
  vehicle: Vehicle;
  driver: TripDriver;
  items: TripItem[];
  deliveries?: Delivery[];
}

export interface GpsLog {
  id: number;
  vehicleId: number;
  tripId: number | null;
  latitude: number;
  longitude: number;
  speed: number | null;
  accuracy: number | null;
  heading: number | null;
  recordedAt: string;
}

export interface VehicleWithLocation extends Vehicle {
  location: GpsLog | null;
}
