# Supabase Setup pour GPoker

## Étapes pour initialiser Supabase

### 1. Créer un projet Supabase

1. Va sur [supabase.com](https://supabase.com)
2. Créé un nouveau projet
3. Note les credentials suivants :
   - **Project URL** : `https://xxx.supabase.co`
   - **Anon Key** : `eyJxxx...`

### 2. Exécuter les migrations

#### Option A : Via Dashboard Supabase (Recommandé)

1. Va dans ton projet Supabase
2. Clique sur **SQL Editor** dans la sidebar
3. Copie-colle le contenu de `migrations/20241214_initial_schema.sql`
4. Exécute la migration avec **Run**

#### Option B : Via Supabase CLI

```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter
supabase login

# Lier le projet
supabase link --project-ref ton-project-ref

# Appliquer les migrations
supabase db push
```

### 3. Configurer Authentication

1. Va dans **Authentication** > **Providers**
2. Active les providers souhaités :
   - ✅ **Email** (déjà activé par défaut)
   - ⚙️ **Google** (optionnel pour MVP)
   - ⚙️ **Apple** (optionnel pour MVP)

#### Configuration Email

1. **Authentication** > **Settings** > **Auth Settings**
2. Configure :
   - **Site URL** : `http://localhost:3000` (dev) ou `https://gpoker.app` (prod)
   - **Redirect URLs** :
     - `http://localhost:3000/auth/callback`
     - `https://gpoker.app/auth/callback` (si prod)

#### Configuration Google (Optionnel)

1. Créé un projet sur [Google Cloud Console](https://console.cloud.google.com)
2. Active l'API Google+
3. Crée des credentials OAuth 2.0
4. Copie **Client ID** et **Client Secret**
5. Dans Supabase > **Authentication** > **Providers** > **Google** :
   - Colle Client ID et Secret
   - Active le provider

### 4. Configurer les variables d'environnement

Copie `.env.example` vers `.env.local` :

```bash
cp .env.example .env.local
```

Puis remplis les valeurs :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

### 5. Tester la connexion

Lance l'app et vérifie que ça fonctionne :

```bash
npm run dev
```

Vérifie dans la console qu'il n'y a pas d'erreur Supabase.

## Structure de la base de données

### Tables créées

- ✅ **users** : Profils utilisateurs (extends auth.users)
- ✅ **clubs** : Clubs de poker
- ✅ **club_members** : Membres des clubs
- ✅ **tournaments** : Tournois
- ✅ **blind_levels** : Niveaux de blinds
- ✅ **tournament_players** : Joueurs inscrits
- ✅ **cash_games** : Parties de cash game
- ✅ **cash_game_players** : Joueurs de cash game
- ✅ **cash_game_transactions** : Buy-ins et cash-outs
- ✅ **subscriptions** : Abonnements Stripe
- ✅ **usage_tracking** : Suivi de l'utilisation

### Row Level Security (RLS)

Toutes les tables ont RLS activé avec des policies :
- Les users peuvent voir/modifier leurs propres données
- Les organisateurs peuvent gérer leurs tournois/cash games
- Les membres de club peuvent voir les données du club
- Sécurité par défaut : aucune donnée accessible sans permission

### Triggers

- ✅ **Auto-update `updated_at`** : Timestamp automatique
- ✅ **Auto-create user profile** : Profil créé automatiquement à l'inscription

## Commandes SQL utiles

### Voir tous les users

```sql
SELECT * FROM public.users;
```

### Voir les tournois d'un user

```sql
SELECT * FROM public.tournaments
WHERE organizer_id = 'user-uuid';
```

### Vérifier les policies RLS

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

### Reset la BDD (⚠️ ATTENTION)

```sql
-- Supprimer toutes les données
TRUNCATE public.users, public.clubs, public.tournaments, public.cash_games CASCADE;
```

## Problèmes courants

### Erreur "relation does not exist"

→ La migration n'a pas été exécutée correctement. Ré-exécute le SQL.

### Erreur "permission denied for schema public"

→ Les policies RLS bloquent l'accès. Vérifie que tu es bien connecté avec un user authentifié.

### Erreur "Could not create user profile"

→ Le trigger `on_auth_user_created` a échoué. Vérifie les logs Supabase.

## Next Steps

Une fois Supabase configuré :

1. ✅ Teste l'inscription d'un user
2. ✅ Vérifie que le profil est créé automatiquement
3. ✅ Teste la création d'un tournoi
4. ✅ Commence à développer les features !
