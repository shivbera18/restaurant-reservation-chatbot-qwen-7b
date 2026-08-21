import type { ChatApiResponse, Reservation, Restaurant, SystemConfig } from './types';

const API_BASE = '/api';

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
    headers: { 'Content-Type': 'application/json' },
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
  const res = await fetch(`${API_BASE}/reservations`);
  if (!res.ok) {
    throw new Error(`Failed to fetch reservations: ${res.statusText}`);
  }
  return res.json();
}

export async function cancelReservation(confirmationCode: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/reservations/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmation_code: confirmationCode }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Cancellation failed');
  }
  return true;
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
