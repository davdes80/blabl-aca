import Constants from 'expo-constants';

const API_URL =
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl || 'http://localhost:3000';

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  carModel: string;
  isAdmin: boolean;
};

export type Passenger = {
  booking_id: number;
  status: string;
  user_id: number;
  name: string;
  phone: string;
};

export type Comment = {
  id: number;
  body: string;
  created_at: string;
  author_id: number;
  author_name: string;
};

export type Trip = {
  id: number;
  driverId: number;
  driverName: string;
  driverPhone: string;
  driverCar: string;
  fromCity: string;
  toCity: string;
  date: string;
  time: string;
  seats: number;
  seatsLeft: number | null;
  notes: string;
  status: string;
  passengers?: Passenger[];
  comments?: Comment[];
};

let authToken: string | null = null;

export function setToken(token: string | null) {
  authToken = token;
}

export async function api<T = any>(path: string, options: { method?: string; body?: any } = {}): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data as T;
}
