// User types
export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  subscription_tier: 'free' | 'pro' | 'club';
  subscription_status: 'active' | 'canceled' | 'expired' | null;
  created_at: string;
}

// Tournament types
export interface Tournament {
  id: string;
  organizer_id: string;
  club_id?: string;
  name: string;
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  status: 'scheduled' | 'running' | 'paused' | 'completed';
  buy_in_amount: number;
  starting_stack: number;
  level_duration: number; // minutes
  max_rebuys: number;
  max_addons: number;
  late_registration_levels: number;
  current_level: number;
  level_started_at?: string;
  remaining_seconds?: number;
  created_at: string;
}

export interface BlindLevel {
  id: string;
  tournament_id: string;
  level_number: number;
  small_blind: number;
  big_blind: number;
  ante: number;
}

export interface TournamentPlayer {
  id: string;
  tournament_id: string;
  player_name: string;
  buy_ins: number;
  rebuys: number;
  addons: number;
  total_invested: number;
  status: 'active' | 'eliminated';
  finish_position?: number;
  prize_amount?: number;
  eliminated_at?: string;
  created_at: string;
}

// Cash Game types
export interface CashGame {
  id: string;
  organizer_id: string;
  club_id?: string;
  name: string;
  game_type: string;
  small_blind: number;
  big_blind: number;
  started_at: string;
  ended_at?: string;
  status: 'active' | 'completed';
  created_at: string;
}

export interface CashGamePlayer {
  id: string;
  cash_game_id: string;
  player_name: string;
  total_buy_in: number;
  total_cash_out: number;
  net_result: number;
  joined_at: string;
}

export interface CashGameTransaction {
  id: string;
  cash_game_player_id: string;
  type: 'buy_in' | 'cash_out';
  amount: number;
  created_at: string;
}

// Club types
export interface Club {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  logo_url?: string;
  invite_code: string;
  visibility: 'private' | 'public';
  created_at: string;
}

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  role: 'admin' | 'organizer' | 'member';
  joined_at: string;
}

// Settlement type for cash games
export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

// Prize structure
export interface Prize {
  position: number;
  amount: number;
  percentage: number;
}
