# Architecture Technique - GPoker

## Stack Technique

### Frontend
- **Framework** : React Native (Expo SDK 51+)
- **Langage** : TypeScript
- **Navigation** : React Navigation v6
- **State Management** : Zustand + React Query
- **UI Library** : React Native Paper + Custom components
- **Styling** : StyleSheet + Theme system

### Backend
- **BaaS** : Supabase
  - PostgreSQL database
  - Authentication
  - Real-time subscriptions
  - Storage (images, exports)
  - Edge Functions (calculs complexes)

### Paiements
- **Stripe** : Abonnements récurrents
- **RevenueCat** : Alternative pour gestion IAP mobile (à considérer)

### Services externes
- **Notifications** : Expo Notifications
- **Analytics** : Mixpanel ou PostHog
- **Crash reporting** : Sentry
- **CI/CD** : GitHub Actions + EAS Build

---

## Modèle de Données (Supabase PostgreSQL)

### Table: `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  subscription_tier VARCHAR(20) DEFAULT 'free', -- 'free', 'pro', 'club'
  subscription_status VARCHAR(20), -- 'active', 'canceled', 'expired'
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe ON users(stripe_customer_id);
```

### Table: `clubs`
```sql
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  logo_url TEXT,
  invite_code VARCHAR(6) UNIQUE NOT NULL,
  visibility VARCHAR(10) DEFAULT 'private', -- 'private', 'public'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clubs_owner ON clubs(owner_id);
CREATE INDEX idx_clubs_invite_code ON clubs(invite_code);
```

### Table: `club_members`
```sql
CREATE TABLE club_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- 'admin', 'organizer', 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(club_id, user_id)
);

CREATE INDEX idx_club_members_club ON club_members(club_id);
CREATE INDEX idx_club_members_user ON club_members(user_id);
```

### Table: `tournaments`
```sql
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,

  -- Infos générales
  name VARCHAR(200) NOT NULL,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'running', 'paused', 'completed'

  -- Paramètres
  buy_in_amount DECIMAL(10,2) DEFAULT 0,
  starting_stack INTEGER NOT NULL,
  level_duration INTEGER NOT NULL, -- minutes
  max_rebuys INTEGER DEFAULT 0,
  max_addons INTEGER DEFAULT 0,
  late_registration_levels INTEGER DEFAULT 0,

  -- État du timer
  current_level INTEGER DEFAULT 1,
  level_started_at TIMESTAMPTZ,
  remaining_seconds INTEGER,

  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tournaments_organizer ON tournaments(organizer_id);
CREATE INDEX idx_tournaments_club ON tournaments(club_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_scheduled ON tournaments(scheduled_at);
```

### Table: `blind_levels`
```sql
CREATE TABLE blind_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  level_number INTEGER NOT NULL,
  small_blind INTEGER NOT NULL,
  big_blind INTEGER NOT NULL,
  ante INTEGER DEFAULT 0,

  UNIQUE(tournament_id, level_number)
);

CREATE INDEX idx_blind_levels_tournament ON blind_levels(tournament_id);
```

### Table: `tournament_players`
```sql
CREATE TABLE tournament_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  player_name VARCHAR(100) NOT NULL,

  -- Entrées
  buy_ins INTEGER DEFAULT 1,
  rebuys INTEGER DEFAULT 0,
  addons INTEGER DEFAULT 0,
  total_invested DECIMAL(10,2), -- calculé

  -- Position
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'eliminated'
  finish_position INTEGER,
  prize_amount DECIMAL(10,2),
  eliminated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tournament_players_tournament ON tournament_players(tournament_id);
CREATE INDEX idx_tournament_players_status ON tournament_players(status);
```

### Table: `cash_games`
```sql
CREATE TABLE cash_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,

  -- Infos
  name VARCHAR(200),
  game_type VARCHAR(50) DEFAULT 'NLH', -- 'NLH', 'PLO', 'Mixed', etc.
  small_blind DECIMAL(10,2),
  big_blind DECIMAL(10,2),

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cash_games_organizer ON cash_games(organizer_id);
CREATE INDEX idx_cash_games_club ON cash_games(club_id);
CREATE INDEX idx_cash_games_status ON cash_games(status);
```

### Table: `cash_game_players`
```sql
CREATE TABLE cash_game_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cash_game_id UUID REFERENCES cash_games(id) ON DELETE CASCADE,
  player_name VARCHAR(100) NOT NULL,

  -- Montants
  total_buy_in DECIMAL(10,2) DEFAULT 0,
  total_cash_out DECIMAL(10,2) DEFAULT 0,
  net_result DECIMAL(10,2) DEFAULT 0,

  joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cash_game_players_game ON cash_game_players(cash_game_id);
```

### Table: `cash_game_transactions`
```sql
CREATE TABLE cash_game_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cash_game_player_id UUID REFERENCES cash_game_players(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL, -- 'buy_in', 'cash_out'
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_player ON cash_game_transactions(cash_game_player_id);
CREATE INDEX idx_transactions_type ON cash_game_transactions(type);
```

### Table: `subscriptions`
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  stripe_subscription_id VARCHAR(255) UNIQUE,
  tier VARCHAR(20) NOT NULL, -- 'pro', 'club'
  status VARCHAR(20) NOT NULL, -- 'active', 'canceled', 'past_due', 'expired'

  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
```

### Table: `usage_tracking`
```sql
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  month DATE NOT NULL, -- Premier jour du mois (ex: 2024-01-01)
  tournaments_created INTEGER DEFAULT 0,
  cash_games_created INTEGER DEFAULT 0,
  total_games INTEGER DEFAULT 0,

  UNIQUE(user_id, month)
);

CREATE INDEX idx_usage_user_month ON usage_tracking(user_id, month);
```

---

## Row Level Security (RLS)

### Politique de sécurité Supabase

```sql
-- Users : Lecture publique, modification par soi-même uniquement
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Clubs : Les membres peuvent voir, les admins peuvent modifier
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club members can view" ON clubs
  FOR SELECT USING (
    id IN (
      SELECT club_id FROM club_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Club owners can update" ON clubs
  FOR UPDATE USING (owner_id = auth.uid());

-- Tournaments : Organisateur peut tout faire, membres du club peuvent voir
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizer can manage tournaments" ON tournaments
  FOR ALL USING (organizer_id = auth.uid());

CREATE POLICY "Club members can view tournaments" ON tournaments
  FOR SELECT USING (
    club_id IN (
      SELECT club_id FROM club_members WHERE user_id = auth.uid()
    )
  );

-- Cash games : Même logique que tournaments
ALTER TABLE cash_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizer can manage cash games" ON cash_games
  FOR ALL USING (organizer_id = auth.uid());

CREATE POLICY "Club members can view cash games" ON cash_games
  FOR SELECT USING (
    club_id IN (
      SELECT club_id FROM club_members WHERE user_id = auth.uid()
    )
  );
```

---

## Architecture Frontend (React Native)

### Structure des dossiers
```
src/
├── components/          # Composants réutilisables
│   ├── common/         # Boutons, inputs, cards
│   ├── tournament/     # Timer, PlayerList, BlindStructure
│   └── cashgame/       # BuyInForm, SettlementView
├── screens/            # Écrans de l'app
│   ├── auth/           # Login, Signup
│   ├── tournaments/    # TournamentList, TournamentDetail, CreateTournament
│   ├── cashgames/      # CashGameList, CashGameDetail
│   ├── clubs/          # ClubList, ClubDetail
│   └── settings/       # Profile, Subscription
├── navigation/         # Configuration React Navigation
├── stores/             # Zustand stores
│   ├── authStore.ts
│   ├── tournamentStore.ts
│   └── cashGameStore.ts
├── hooks/              # Custom hooks
│   ├── useTournamentTimer.ts
│   ├── useSubscription.ts
│   └── useSupabase.ts
├── services/           # Services externes
│   ├── supabase.ts
│   ├── stripe.ts
│   └── notifications.ts
├── utils/              # Fonctions utilitaires
│   ├── prizeCalculator.ts
│   ├── settlementOptimizer.ts
│   └── formatters.ts
├── types/              # Types TypeScript
├── constants/          # Constantes
└── theme/              # Theme et styles
```

### State Management

**Zustand** pour état global
```typescript
// stores/tournamentStore.ts
interface TournamentStore {
  currentTournament: Tournament | null;
  isTimerRunning: boolean;
  currentLevel: number;
  remainingSeconds: number;

  startTimer: () => void;
  pauseTimer: () => void;
  nextLevel: () => void;
  addPlayer: (player: Player) => void;
}
```

**React Query** pour data fetching
```typescript
// hooks/useTournaments.ts
export const useTournaments = (clubId?: string) => {
  return useQuery({
    queryKey: ['tournaments', clubId],
    queryFn: () => fetchTournaments(clubId),
  });
};
```

---

## Services

### Service de timer de tournoi
```typescript
// services/tournamentTimer.ts
class TournamentTimer {
  private intervalId: NodeJS.Timeout | null = null;

  start(onTick: (remaining: number) => void) {
    this.intervalId = setInterval(() => {
      // Logique de décompte
      onTick(this.remainingSeconds--);
    }, 1000);
  }

  pause() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  // Continue en background avec BackgroundFetch
}
```

### Service de calcul de prizes
```typescript
// utils/prizeCalculator.ts
export const calculatePrizes = (
  totalPrizePool: number,
  playerCount: number,
  customStructure?: number[]
): Prize[] => {
  const structure = customStructure || getDefaultStructure(playerCount);

  return structure.map((percentage, index) => ({
    position: index + 1,
    amount: roundToHalf(totalPrizePool * percentage / 100),
    percentage,
  }));
};

const getDefaultStructure = (playerCount: number): number[] => {
  if (playerCount <= 5) return [100];
  if (playerCount <= 10) return [70, 30];
  if (playerCount <= 20) return [50, 30, 20];
  // Structure plus complexe pour 21+
  return [40, 25, 15, 10, 6, 4];
};
```

### Service d'optimisation des settlements
```typescript
// utils/settlementOptimizer.ts
export const optimizeSettlements = (
  players: CashGamePlayer[]
): Settlement[] => {
  const winners = players.filter(p => p.netResult > 0);
  const losers = players.filter(p => p.netResult < 0);

  const settlements: Settlement[] = [];

  let winnerIdx = 0;
  let loserIdx = 0;

  while (winnerIdx < winners.length && loserIdx < losers.length) {
    const winner = winners[winnerIdx];
    const loser = losers[loserIdx];

    const amount = Math.min(
      Math.abs(winner.netResult),
      Math.abs(loser.netResult)
    );

    settlements.push({
      from: loser.name,
      to: winner.name,
      amount: roundToHalf(amount),
    });

    winner.netResult -= amount;
    loser.netResult += amount;

    if (winner.netResult === 0) winnerIdx++;
    if (loser.netResult === 0) loserIdx++;
  }

  return settlements;
};
```

---

## Intégration Stripe

### Flow d'abonnement
1. User clique "Upgrade to Pro"
2. App appelle Edge Function Supabase
3. Edge Function crée Checkout Session Stripe
4. App ouvre Stripe Checkout (WebView ou SDK)
5. User paie
6. Webhook Stripe → Edge Function
7. Edge Function met à jour `users.subscription_tier`
8. App reçoit mise à jour via Real-time Supabase

### Edge Function: `create-checkout-session`
```typescript
// supabase/functions/create-checkout-session/index.ts
import Stripe from 'stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);

Deno.serve(async (req) => {
  const { userId, priceId } = await req.json();

  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: 'gpoker://subscription/success',
    cancel_url: 'gpoker://subscription/cancel',
    metadata: { userId },
  });

  return new Response(JSON.stringify({ url: session.url }));
});
```

### Webhook Handler
```typescript
// supabase/functions/stripe-webhook/index.ts
Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature')!;
  const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      await updateUserSubscription(session.metadata.userId, 'active');
      break;

    case 'customer.subscription.deleted':
      await updateUserSubscription(userId, 'expired');
      break;
  }

  return new Response('OK');
});
```

---

## Real-time Features

### Timer sync entre devices
```typescript
// hooks/useTournamentRealtime.ts
export const useTournamentRealtime = (tournamentId: string) => {
  const supabase = useSupabase();

  useEffect(() => {
    const channel = supabase
      .channel(`tournament:${tournamentId}`)
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tournaments',
          filter: `id=eq.${tournamentId}`
        },
        (payload) => {
          // Mettre à jour le state local
          updateTournament(payload.new);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [tournamentId]);
};
```

---

## Performance & Optimisations

### Offline-first avec React Query
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24h
      staleTime: 1000 * 60 * 5, // 5 min
      retry: 2,
    },
  },
});
```

### Optimistic updates
```typescript
const { mutate: addPlayer } = useMutation({
  mutationFn: (player: Player) => supabase.from('tournament_players').insert(player),
  onMutate: async (newPlayer) => {
    // Annuler requêtes en cours
    await queryClient.cancelQueries(['tournament', tournamentId]);

    // Sauvegarder état actuel
    const previous = queryClient.getQueryData(['tournament', tournamentId]);

    // Update optimiste
    queryClient.setQueryData(['tournament', tournamentId], (old) => ({
      ...old,
      players: [...old.players, newPlayer],
    }));

    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback si erreur
    queryClient.setQueryData(['tournament', tournamentId], context.previous);
  },
});
```

---

## Tests

### Tests unitaires (Jest + Testing Library)
```typescript
// __tests__/prizeCalculator.test.ts
describe('Prize Calculator', () => {
  it('should calculate winner takes all for 5 players', () => {
    const prizes = calculatePrizes(500, 5);
    expect(prizes).toEqual([{ position: 1, amount: 500, percentage: 100 }]);
  });

  it('should calculate top 3 for 15 players', () => {
    const prizes = calculatePrizes(1000, 15);
    expect(prizes[0].amount).toBe(500); // 50%
    expect(prizes[1].amount).toBe(300); // 30%
    expect(prizes[2].amount).toBe(200); // 20%
  });
});
```

### Tests E2E (Detox)
```typescript
describe('Tournament Creation', () => {
  it('should create a tournament and start timer', async () => {
    await element(by.id('create-tournament-btn')).tap();
    await element(by.id('tournament-name')).typeText('Sunday Poker');
    await element(by.id('buy-in')).typeText('20');
    await element(by.id('submit-btn')).tap();

    await expect(element(by.id('timer'))).toBeVisible();
  });
});
```

---

## Déploiement

### EAS Build (Expo Application Services)
```json
// eas.json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "autoIncrement": true
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "jean@example.com",
        "ascAppId": "123456789"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-key.json"
      }
    }
  }
}
```

### CI/CD GitHub Actions
```yaml
# .github/workflows/build.yml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test
      - run: npx eas-cli build --platform all --non-interactive
```

---

## Sécurité

### Best Practices
- ✅ RLS activé sur toutes les tables Supabase
- ✅ Validation côté serveur (Edge Functions) pour opérations critiques
- ✅ Pas de clés API dans le code (env variables)
- ✅ HTTPS only
- ✅ Rate limiting sur Edge Functions
- ✅ Sanitization des inputs utilisateur
- ✅ Gestion sécurisée des tokens Stripe

### Variables d'environnement
```env
# .env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
EXPO_PUBLIC_API_URL=https://api.gpoker.app
```

---

## Monitoring

### Analytics Events
```typescript
// Tracking des événements clés
track('tournament_created', { buyIn, playerCount });
track('subscription_upgraded', { tier: 'pro' });
track('cash_game_completed', { duration, settlementCount });
```

### Crash Reporting (Sentry)
```typescript
Sentry.init({
  dsn: 'https://xxx@sentry.io/xxx',
  enableInExpoDevelopment: false,
  debug: __DEV__,
});
```

---

## Scalabilité

### Prévisions
- **M3** : 500 users → ~50 req/min
- **M6** : 2000 users → ~200 req/min
- **M12** : 5000 users → ~500 req/min

### Infrastructure
- Supabase Free Tier : Jusqu'à 500 MB BDD, 2GB bandwidth
- Upgrade Supabase Pro ($25/mo) si > 1000 users actifs
- Stripe : Pas de limite, frais 1.4% + 0.25€ par transaction

### Optimisations futures
- CDN pour assets statiques
- Redis pour cache (si nécessaire)
- Sharding BDD si > 100k users
