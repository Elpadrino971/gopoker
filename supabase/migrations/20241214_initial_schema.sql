-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE: users (extends Supabase auth.users)
-- =============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'club')),
  subscription_status VARCHAR(20) CHECK (subscription_status IN ('active', 'canceled', 'expired')),
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_stripe ON public.users(stripe_customer_id);

-- =============================================
-- TABLE: clubs
-- =============================================
CREATE TABLE public.clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  logo_url TEXT,
  invite_code VARCHAR(6) UNIQUE NOT NULL,
  visibility VARCHAR(10) DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clubs
CREATE POLICY "Club members can view clubs" ON public.clubs
  FOR SELECT USING (
    id IN (
      SELECT club_id FROM public.club_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Club owners can update clubs" ON public.clubs
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create clubs" ON public.clubs
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Indexes
CREATE INDEX idx_clubs_owner ON public.clubs(owner_id);
CREATE INDEX idx_clubs_invite_code ON public.clubs(invite_code);

-- =============================================
-- TABLE: club_members
-- =============================================
CREATE TABLE public.club_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'organizer', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for club_members
CREATE POLICY "Club members can view members" ON public.club_members
  FOR SELECT USING (
    club_id IN (
      SELECT club_id FROM public.club_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Club admins can manage members" ON public.club_members
  FOR ALL USING (
    club_id IN (
      SELECT club_id FROM public.club_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes
CREATE INDEX idx_club_members_club ON public.club_members(club_id);
CREATE INDEX idx_club_members_user ON public.club_members(user_id);

-- =============================================
-- TABLE: tournaments
-- =============================================
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,

  -- General info
  name VARCHAR(200) NOT NULL,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'running', 'paused', 'completed')),

  -- Parameters
  buy_in_amount DECIMAL(10,2) DEFAULT 0,
  starting_stack INTEGER NOT NULL,
  level_duration INTEGER NOT NULL, -- minutes
  max_rebuys INTEGER DEFAULT 0,
  max_addons INTEGER DEFAULT 0,
  late_registration_levels INTEGER DEFAULT 0,

  -- Timer state
  current_level INTEGER DEFAULT 1,
  level_started_at TIMESTAMPTZ,
  remaining_seconds INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tournaments
CREATE POLICY "Organizer can manage tournaments" ON public.tournaments
  FOR ALL USING (organizer_id = auth.uid());

CREATE POLICY "Club members can view tournaments" ON public.tournaments
  FOR SELECT USING (
    club_id IS NULL OR club_id IN (
      SELECT club_id FROM public.club_members WHERE user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_tournaments_organizer ON public.tournaments(organizer_id);
CREATE INDEX idx_tournaments_club ON public.tournaments(club_id);
CREATE INDEX idx_tournaments_status ON public.tournaments(status);
CREATE INDEX idx_tournaments_scheduled ON public.tournaments(scheduled_at);

-- =============================================
-- TABLE: blind_levels
-- =============================================
CREATE TABLE public.blind_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  level_number INTEGER NOT NULL,
  small_blind INTEGER NOT NULL,
  big_blind INTEGER NOT NULL,
  ante INTEGER DEFAULT 0,
  UNIQUE(tournament_id, level_number)
);

ALTER TABLE public.blind_levels ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Inherit tournament access" ON public.blind_levels
  FOR SELECT USING (
    tournament_id IN (
      SELECT id FROM public.tournaments
      WHERE organizer_id = auth.uid()
      OR club_id IN (SELECT club_id FROM public.club_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Tournament organizer can manage blinds" ON public.blind_levels
  FOR ALL USING (
    tournament_id IN (SELECT id FROM public.tournaments WHERE organizer_id = auth.uid())
  );

CREATE INDEX idx_blind_levels_tournament ON public.blind_levels(tournament_id);

-- =============================================
-- TABLE: tournament_players
-- =============================================
CREATE TABLE public.tournament_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_name VARCHAR(100) NOT NULL,

  -- Entries
  buy_ins INTEGER DEFAULT 1,
  rebuys INTEGER DEFAULT 0,
  addons INTEGER DEFAULT 0,
  total_invested DECIMAL(10,2),

  -- Position
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'eliminated')),
  finish_position INTEGER,
  prize_amount DECIMAL(10,2),
  eliminated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tournament_players ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Inherit tournament access for players" ON public.tournament_players
  FOR SELECT USING (
    tournament_id IN (
      SELECT id FROM public.tournaments
      WHERE organizer_id = auth.uid()
      OR club_id IN (SELECT club_id FROM public.club_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Tournament organizer can manage players" ON public.tournament_players
  FOR ALL USING (
    tournament_id IN (SELECT id FROM public.tournaments WHERE organizer_id = auth.uid())
  );

CREATE INDEX idx_tournament_players_tournament ON public.tournament_players(tournament_id);
CREATE INDEX idx_tournament_players_status ON public.tournament_players(status);

-- =============================================
-- TABLE: cash_games
-- =============================================
CREATE TABLE public.cash_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,

  -- Info
  name VARCHAR(200),
  game_type VARCHAR(50) DEFAULT 'NLH',
  small_blind DECIMAL(10,2),
  big_blind DECIMAL(10,2),

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cash_games ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Organizer can manage cash games" ON public.cash_games
  FOR ALL USING (organizer_id = auth.uid());

CREATE POLICY "Club members can view cash games" ON public.cash_games
  FOR SELECT USING (
    club_id IS NULL OR club_id IN (
      SELECT club_id FROM public.club_members WHERE user_id = auth.uid()
    )
  );

CREATE INDEX idx_cash_games_organizer ON public.cash_games(organizer_id);
CREATE INDEX idx_cash_games_club ON public.cash_games(club_id);
CREATE INDEX idx_cash_games_status ON public.cash_games(status);

-- =============================================
-- TABLE: cash_game_players
-- =============================================
CREATE TABLE public.cash_game_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cash_game_id UUID NOT NULL REFERENCES public.cash_games(id) ON DELETE CASCADE,
  player_name VARCHAR(100) NOT NULL,

  -- Amounts
  total_buy_in DECIMAL(10,2) DEFAULT 0,
  total_cash_out DECIMAL(10,2) DEFAULT 0,
  net_result DECIMAL(10,2) DEFAULT 0,

  joined_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cash_game_players ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Inherit cash game access for players" ON public.cash_game_players
  FOR SELECT USING (
    cash_game_id IN (
      SELECT id FROM public.cash_games
      WHERE organizer_id = auth.uid()
      OR club_id IN (SELECT club_id FROM public.club_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Cash game organizer can manage players" ON public.cash_game_players
  FOR ALL USING (
    cash_game_id IN (SELECT id FROM public.cash_games WHERE organizer_id = auth.uid())
  );

CREATE INDEX idx_cash_game_players_game ON public.cash_game_players(cash_game_id);

-- =============================================
-- TABLE: cash_game_transactions
-- =============================================
CREATE TABLE public.cash_game_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cash_game_player_id UUID NOT NULL REFERENCES public.cash_game_players(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('buy_in', 'cash_out')),
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cash_game_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Inherit cash game player access" ON public.cash_game_transactions
  FOR SELECT USING (
    cash_game_player_id IN (
      SELECT id FROM public.cash_game_players
      WHERE cash_game_id IN (
        SELECT id FROM public.cash_games WHERE organizer_id = auth.uid()
      )
    )
  );

CREATE POLICY "Cash game organizer can manage transactions" ON public.cash_game_transactions
  FOR ALL USING (
    cash_game_player_id IN (
      SELECT id FROM public.cash_game_players
      WHERE cash_game_id IN (
        SELECT id FROM public.cash_games WHERE organizer_id = auth.uid()
      )
    )
  );

CREATE INDEX idx_transactions_player ON public.cash_game_transactions(cash_game_player_id);
CREATE INDEX idx_transactions_type ON public.cash_game_transactions(type);

-- =============================================
-- TABLE: subscriptions
-- =============================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  stripe_subscription_id VARCHAR(255) UNIQUE,
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('pro', 'club')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'expired')),

  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON public.subscriptions(stripe_subscription_id);

-- =============================================
-- TABLE: usage_tracking
-- =============================================
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  month DATE NOT NULL, -- First day of month
  tournaments_created INTEGER DEFAULT 0,
  cash_games_created INTEGER DEFAULT 0,
  total_games INTEGER DEFAULT 0,

  UNIQUE(user_id, month)
);

ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own usage" ON public.usage_tracking
  FOR SELECT USING (user_id = auth.uid());

CREATE INDEX idx_usage_user_month ON public.usage_tracking(user_id, month);

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON public.clubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON public.tournaments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_games_updated_at BEFORE UPDATE ON public.cash_games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS VARCHAR(6) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result VARCHAR(6) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
