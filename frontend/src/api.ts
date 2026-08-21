import type { AuthResponse, ChatApiResponse, Reservation, Restaurant, SystemConfig, User } from './types';

const API_BASE = '/api';
const TOKEN_KEY = 'goodfoods_auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function registerUser(data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Registration failed');
  }
  const result: AuthResponse = await res.json();
  setAuthToken(result.token);
  return result;
}

export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Login failed');
  }
  const result: AuthResponse = await res.json();
  setAuthToken(result.token);
  return result;
}

export async function fetchCurrentUser(): Promise<User | null> {
  const token = getAuthToken();
  if (!token) return null;

  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    setAuthToken(null);
    return null;
  }
  const data = await res.json();
  return data.user;
}

export async function logoutUser(): Promise<void> {
  const token = getAuthToken();
  if (token) {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
  setAuthToken(null);
}

export async function fetchConfig(): Promise<SystemConfig> {
  const res = await fetch(`${API_BASE}/config`);
  if (!res.ok) {
    throw new Error(`Failed to load config: ${res.statusText}`);
  }
  return res.json();
}

export async function sendChatMessage(
  message: string,
  provider?: string,
  model?: string,
  useMock?: boolean
): Promise<ChatApiResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      message,
      provider,
      model,
      use_mock: useMock,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export async function fetchRestaurants(params?: {
  cuisine?: string;
  neighborhood?: string;
  search?: string;
}): Promise<Restaurant[]> {
  const query = new URLSearchParams();
  if (params?.cuisine) query.set('cuisine', params.cuisine);
  if (params?.neighborhood) query.set('neighborhood', params.neighborhood);
  if (params?.search) query.set('search', params.search);

  const res = await fetch(`${API_BASE}/restaurants?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch restaurants: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchReservations(): Promise<Reservation[]> {
  const res = await fetch(`${API_BASE}/reservations`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch reservations: ${res.statusText}`);
  }
  return res.json();
}

export async function cancelReservation(confirmationCode: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/reservations/cancel`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ confirmation_code: confirmationCode }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Cancellation failed');
  }
  return true;
}

export async function modifyReservation(params: {
  confirmation_code: string;
  new_date?: string;
  new_time?: string;
  new_party_size?: number;
  new_special_requests?: string;
}): Promise<Reservation> {
  const res = await fetch(`${API_BASE}/reservations/modify`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Modification failed');
  }
  const data = await res.json();
  return data.reservation;
}
export async function resetConversation(): Promise<void> {
  const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
  if (!res.ok) {
    throw new Error(`Failed to reset chat: ${res.statusText}`);
  }
}

export async function switchProviderModel(
  provider: string,
  model: string,
  useMock = false
): Promise<{ ready: boolean; status: string }> {
  const res = await fetch(`${API_BASE}/config/provider`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, model, use_mock: useMock }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Switching backend failed');
  }
  return res.json();
}
