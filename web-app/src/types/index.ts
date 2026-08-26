export type UserRole = 'ADMIN' | 'STAFF' | 'DRIVER';
export type VehicleStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type TripStatus = 'LOADING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID';
export type TripCrewRole = 'DRIVER' | 'HELPER';
export type ShiftStatus = 'ACTIVE' | 'ON_BREAK' | 'ENDED';
export type ProblemCategory = 'VEHICLE' | 'CUSTOMER' | 'STOCK' | 'OTHER';
export type ProblemStatus = 'OPEN' | 'RESOLVED';
export type TankStatus = 'NORMAL' | 'NEEDS_REPLACEMENT';
export type TripStopStatus = 'PENDING' | 'DONE';

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
  customerId: number | null;
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

export interface TripCrewMember {
  tripId: number;
  userId: number;
  roleOnTrip: TripCrewRole;
  user: TripDriver;
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
  crew: TripCrewMember[];
  items: TripItem[];
  deliveries?: Delivery[];
}

export interface Zone {
  id: number;
  name: string;
  _count?: { villages: number };
}

export interface Village {
  id: number;
  zoneId: number;
  name: string;
  zone: Zone;
  _count?: { customers: number };
}

export interface Customer {
  id: number;
  villageId: number;
  name: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  note: string | null;
  village: Village;
  iceTanks?: IceTank[];
  _count?: { iceTanks: number };
}

export interface IceTank {
  id: number;
  customerId: number;
  size: string;
  quantity: number;
  status: TankStatus;
}

export interface Shift {
  id: number;
  tripId: number;
  userId: number;
  status: ShiftStatus;
  startedAt: string;
  endedAt: string | null;
  user: TripDriver;
  trip: { id: number; vehicleId: number; driverId: number; vehicle: Vehicle };
}

export interface ProblemReport {
  id: number;
  tripId: number;
  userId: number;
  category: ProblemCategory;
  description: string;
  status: ProblemStatus;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  user: TripDriver;
  trip: { id: number; vehicleId: number; driverId: number; vehicle: Vehicle };
}

export interface TripStop {
  id: number;
  tripId: number;
  customerId: number;
  note: string | null;
  status: TripStopStatus;
  createdById: number;
  createdAt: string;
  customer: Customer;
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
