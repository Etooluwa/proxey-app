
export enum UserRole {
  CLIENT = 'CLIENT',
  PROVIDER = 'PROVIDER'
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface ServiceProvider {
  id: string;
  name: string;
  title: string;
  rating: number;
  reviewCount: number;
  avatarUrl: string;
  hourlyRate: number;
  categories: string[];
  location: string;
  isOnline?: boolean;
}

export interface ServiceOffering {
  id: string;
  title: string;
  category: string;
  price: number;
  priceUnit: 'hour' | 'fixed';
  duration: string; 
  description: string;
  active: boolean;
  bookingsCount: number;
}

export interface Booking {
  id: string;
  providerId?: string;
  serviceName: string;
  providerName: string;
  providerAvatar: string;
  date: string;
  time: string;
  status: BookingStatus;
  price: number;
  location: string;
  clientName?: string; // For provider view
  clientAvatar?: string; // For provider view
}

export interface ChartData {
  name: string;
  value: number;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
}

export interface ScheduleDay {
  id: string;
  label: string;
  active: boolean;
  start: string;
  end: string;
}

export interface DateOverride {
  id: number;
  date: string;
  reason: string;
}
