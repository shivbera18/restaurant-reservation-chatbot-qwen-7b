export interface Restaurant {
  id: string;
  name: string;
  address?: string;
  city?: string;
  neighborhood?: string;
  phone?: string;
  cuisine_types?: string[];
  cuisines?: string[];
  price_range?: string;
  ambiance?: string[];
  rating?: number;
  total_reviews?: number;
  seating_capacity?: number;
  has_private_dining?: boolean;
  has_outdoor_seating?: boolean;
  has_bar?: boolean;
  wheelchair_accessible?: boolean;
  parking_available?: boolean;
  accepts_walkins?: boolean;
  open_time?: string;
  close_time?: string;
  description?: string;
  popular_dishes?: string[];
  dietary_options?: string[];
  features?: string[];
}

export interface Reservation {
  id?: string;
  confirmation_code: string;
  restaurant_id?: string;
  restaurant_name: string;
  customer_name: string;
  customer_phone?: string;
  party_size: number;
  date?: string;
  time?: string;
  reservation_date?: string;
  reservation_time?: string;
  special_requests?: string;
  occasion?: string;
  status: "confirmed" | "modified" | "cancelled" | "completed" | "no_show" | string;
  created_at?: string;
}

export interface ToolResult {
  tool_name: string;
  success: boolean;
  data: unknown;
  error?: unknown;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  tool_results?: ToolResult[];
  selected_restaurant?: Restaurant | null;
  created_reservation?: Reservation | null;
  suggested_actions?: string[];
}

export interface SystemConfig {
  app_version: string;
  providers: string[];
  provider_labels: Record<string, string>;
  available_models: Record<string, string[]>;
  default_models: Record<string, string>;
  active_provider: string;
  active_model: string;
  use_mock: boolean;
  status: {
    ready: boolean;
    reason: string;
    backend: string;
  };
  stats: {
    restaurants_count: number;
    neighborhoods: string[];
    cuisines: string[];
    active_reservations_count: number;
  };
}

export interface ChatApiResponse {
  response: string;
  provider: string;
  model: string;
  tool_results: ToolResult[];
  selected_restaurant: Restaurant | null;
  active_reservations: Reservation[];
}
