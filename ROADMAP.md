# Roadmap de Développement - GPoker

## Vue d'ensemble

Développement du MVP en **4-6 semaines**, puis itérations basées sur feedback utilisateurs.

---

## Phase 0 : Setup (Semaine 1)

### Infrastructure
- [ ] Initialiser projet React Native (Expo)
- [ ] Configurer TypeScript + ESLint + Prettier
- [ ] Setup Supabase projet
- [ ] Créer schéma de BDD initial
- [ ] Configurer RLS policies
- [ ] Setup Stripe account (mode test)
- [ ] Créer repository GitHub + CI/CD basique
- [ ] Setup Sentry pour error tracking

### Navigation & Structure
- [ ] Installer React Navigation
- [ ] Créer structure de dossiers
- [ ] Setup theme system (dark mode supporté)
- [ ] Créer composants de base (Button, Input, Card)

**Livrable** : Squelette de l'app avec écrans vides naviguables

---

## Phase 1 : Authentification (Semaine 1-2)

### Features
- [ ] Écran de login
- [ ] Écran de signup
- [ ] Intégration Supabase Auth
- [ ] Google Sign-In
- [ ] Apple Sign-In (iOS)
- [ ] Forgot password flow
- [ ] Écran de profil (basique)
- [ ] Persistence de session

### Tests
- [ ] Tests unitaires auth service
- [ ] Tests E2E login/signup

**Livrable** : Authentification complète fonctionnelle

---

## Phase 2 : Tournois - Core Features (Semaine 2-3)

### 2.1 Création de tournoi
- [ ] Écran "Create Tournament"
- [ ] Formulaire paramètres (nom, buy-in, stack, durée)
- [ ] Sélection structure de blinds
- [ ] Templates pré-définis (Turbo, Normal, Deep)
- [ ] Personnalisation blinds niveau par niveau
- [ ] Sauvegarde dans Supabase

### 2.2 Timer de tournoi
- [ ] Écran "Tournament Timer"
- [ ] Logique de décompte (custom hook)
- [ ] Affichage temps restant + blinds actuelles
- [ ] Boutons Play/Pause/Next/Previous
- [ ] Notification sonore 1 min avant fin niveau
- [ ] Background timer (continue si app en arrière-plan)
- [ ] Sauvegarde état en temps réel

### 2.3 Gestion joueurs
- [ ] Liste des joueurs dans tournoi
- [ ] Ajouter joueur avec buy-in
- [ ] Gérer rebuys/add-ons
- [ ] Marquer joueurs éliminés avec position
- [ ] Calcul automatique total prize pool

### 2.4 Calcul prizes
- [ ] Service de calcul selon nombre de joueurs
- [ ] Structures par défaut (Top 1, 2, 3, etc.)
- [ ] Personnalisation des pourcentages
- [ ] Écran de résumé final avec prizes
- [ ] Bouton "Partager résultats"

**Livrable** : Tournoi complet de A à Z fonctionnel

---

## Phase 3 : Cash Games (Semaine 3-4)

### 3.1 Création cash game
- [ ] Écran "Create Cash Game"
- [ ] Formulaire (nom, blinds, type de jeu)
- [ ] Sauvegarde dans Supabase

### 3.2 Gestion buy-ins/cash-outs
- [ ] Liste des joueurs
- [ ] Ajouter joueur avec buy-in initial
- [ ] Enregistrer buy-ins additionnels
- [ ] Enregistrer cash-outs
- [ ] Calcul net en temps réel

### 3.3 Settlements
- [ ] Service d'optimisation des settlements
- [ ] Écran "Settlements" avec qui paie qui
- [ ] Bouton "Partager settlements"
- [ ] Marquer session comme terminée

**Livrable** : Cash game complet fonctionnel

---

## Phase 4 : Clubs (Semaine 4)

### 4.1 Création de club
- [ ] Écran "Create Club"
- [ ] Formulaire (nom, description, logo)
- [ ] Génération code d'invitation unique
- [ ] Sauvegarde dans Supabase

### 4.2 Gestion membres
- [ ] Écran "Club Members"
- [ ] Inviter par code
- [ ] Liste des membres avec rôles
- [ ] Modifier rôles (Admin, Organizer, Member)
- [ ] Retirer membre

### 4.3 Association parties à club
- [ ] Sélection club lors création tournoi/cash game
- [ ] Filtrage parties par club
- [ ] Statistiques basiques du club

**Livrable** : Clubs fonctionnels avec gestion membres

---

## Phase 5 : Historique & Stats (Semaine 4-5)

### 5.1 Historique tournois
- [ ] Liste des tournois passés
- [ ] Filtres (date, club)
- [ ] Détail d'un tournoi passé
- [ ] Limitation Free vs Pro (3 derniers seulement pour Free)

### 5.2 Historique cash games
- [ ] Liste des cash games passés
- [ ] Détail d'une session passée
- [ ] Stats basiques (net total, nb sessions)

### 5.3 Stats personnelles
- [ ] Écran "My Stats" (pour Pro/Club)
- [ ] Graphique évolution winrate
- [ ] Total parties jouées
- [ ] Parties organisées

**Livrable** : Historique complet avec stats de base

---

## Phase 6 : Abonnements & Paywall (Semaine 5)

### 6.1 Stripe Integration
- [ ] Setup Stripe products (Pro, Club)
- [ ] Edge Function "create-checkout-session"
- [ ] Webhook handler pour events Stripe
- [ ] Mise à jour subscription_tier dans users

### 6.2 Paywall
- [ ] Hook de vérification limites Free
- [ ] Écran "Upgrade" avec pricing
- [ ] Flow de paiement (WebView Stripe Checkout)
- [ ] Confirmation et activation

### 6.3 Gestion abonnement
- [ ] Écran "Manage Subscription"
- [ ] Voir détails abonnement actuel
- [ ] Bouton "Cancel Subscription"
- [ ] Reçus par email

**Livrable** : Monétisation complète fonctionnelle

---

## Phase 7 : Polish & Launch (Semaine 6)

### 7.1 UX/UI Polish
- [ ] Révision design de tous les écrans
- [ ] Animations et transitions
- [ ] États de loading partout
- [ ] Gestion erreurs avec messages clairs
- [ ] Mode offline gracieux

### 7.2 Notifications
- [ ] Setup Expo Notifications
- [ ] Notification rappel avant tournoi programmé
- [ ] Notification changement de niveau (optionnel)
- [ ] Notification invitation club

### 7.3 Partage
- [ ] Export PDF résultats tournoi
- [ ] Share via WhatsApp/Email
- [ ] Screenshot optimisé pour réseaux sociaux

### 7.4 Onboarding
- [ ] Écran de bienvenue (première utilisation)
- [ ] Tutoriel rapide (optionnel, skippable)
- [ ] Exemple de tournoi pré-rempli

### 7.5 QA & Tests
- [ ] Tests E2E complets (Detox)
- [ ] Tests sur devices réels (iOS + Android)
- [ ] Beta testing avec 10-20 utilisateurs
- [ ] Fix des bugs critiques

### 7.6 App Store Preparation
- [ ] Screenshots App Store + Google Play
- [ ] Description et keywords
- [ ] Privacy Policy & Terms of Service
- [ ] App icon final
- [ ] Splash screen

### 7.7 Launch
- [ ] Soumission App Store
- [ ] Soumission Google Play
- [ ] Landing page (optionnel)
- [ ] Analytics setup (Mixpanel/PostHog)

**Livrable** : App en production sur les stores 🚀

---

## Post-MVP : Itérations (Semaines 7+)

### Priorities basées sur feedback

#### V1.1 - Améliorations Quick Wins
- [ ] Templates de tournois sauvegardés (réutilisables)
- [ ] Export CSV historique parties
- [ ] Multi-tables pour clubs (plusieurs tournois simultanés)
- [ ] Système de rake configurable pour clubs
- [ ] Dark mode (si pas déjà fait)

#### V1.2 - Features avancées
- [ ] Stats avancées par joueur
- [ ] Leaderboard du club
- [ ] Système de points de fidélité
- [ ] Intégration paiements entre joueurs (Stripe Connect)
- [ ] Mode "satellite" pour tournois qualificatifs

#### V1.3 - Social & Community
- [ ] Profils publics de joueurs
- [ ] Commentaires sur parties
- [ ] Feed d'activité du club
- [ ] Challenges et badges

#### V2.0 - Enterprise Features
- [ ] Tableau de bord admin avancé
- [ ] Exports comptables automatisés
- [ ] API pour intégrations tierces
- [ ] White-label pour grandes salles
- [ ] Support multi-devises

---

## Métriques de Succès par Phase

### Phase Launch (M0-M1)
- 500 téléchargements
- 200 utilisateurs actifs
- 50 tournois créés
- 5 conversions payantes

### Phase Growth (M1-M3)
- 1000 téléchargements
- 400 utilisateurs actifs
- 50 utilisateurs Pro/Club
- 500€ MRR

### Phase Scale (M3-M6)
- 3000 téléchargements
- 1000 utilisateurs actifs
- 200 utilisateurs payants
- 2000€ MRR

### Phase Mature (M6-M12)
- 10000 téléchargements
- 3000 utilisateurs actifs
- 500 utilisateurs payants
- 5000€ MRR

---

## Stack de Dev & Outils

### Développement
- **IDE** : VSCode avec extensions React Native
- **Version control** : Git + GitHub
- **Project management** : GitHub Projects ou Linear
- **Design** : Figma (mockups si besoin)

### Collaboration
- **Communication** : Slack ou Discord (si équipe)
- **Documentation** : Notion ou README avancé

### Monitoring Post-Launch
- **Analytics** : Mixpanel ou PostHog
- **Crash reporting** : Sentry
- **User feedback** : Canny ou Typeform
- **Customer support** : Intercom (si budget) ou Email

---

## Risques & Mitigation

### Risques techniques
| Risque | Impact | Mitigation |
|--------|--------|------------|
| Timer background iOS | 🔴 High | Utiliser Background Fetch, tester extensivement |
| Performance avec 100+ joueurs | 🟡 Medium | Pagination, virtualisation listes |
| Sync real-time Supabase | 🟡 Medium | Fallback polling si WebSocket échoue |
| Stripe compliance | 🔴 High | Suivre guidelines Stripe, legal review |

### Risques business
| Risque | Impact | Mitigation |
|--------|--------|------------|
| Faible adoption | 🔴 High | Beta testing, early access communauté poker |
| Faible conversion Free→Pro | 🟡 Medium | A/B testing pricing, optimiser onboarding |
| Compétition (Poker Timer apps) | 🟡 Medium | Focus sur clubs et cash games (différenciation) |
| Coûts Supabase/Stripe | 🟢 Low | Monitoring usage, upgrade uniquement si nécessaire |

---

## Checklist Pre-Launch

### Technique
- [ ] Tests E2E passent sur iOS et Android
- [ ] Pas de crashs bloquants
- [ ] Performance acceptable (< 2s chargement écrans)
- [ ] Offline mode fonctionne pour créer parties
- [ ] Stripe en mode production configuré

### Legal & Compliance
- [ ] Privacy Policy rédigée et publiée
- [ ] Terms of Service rédigés
- [ ] GDPR compliance (si utilisateurs EU)
- [ ] Stripe ToS acceptés
- [ ] App Store Guidelines respectées

### Marketing
- [ ] Landing page prête (optionnel mais recommandé)
- [ ] Screenshots finaux
- [ ] Description App Store optimisée (ASO)
- [ ] Communauté cible identifiée (clubs locaux, forums poker)

### Support
- [ ] Email support configuré (support@gpoker.app)
- [ ] FAQ basique préparée
- [ ] Process de remboursement défini

---

## Budget Prévisionnel

### Coûts de développement (si solo)
- **Temps** : 4-6 semaines full-time (pas de coût monétaire)

### Coûts mensuels
| Service | Coût/mois | Note |
|---------|-----------|------|
| Supabase Free | 0€ | Jusqu'à 500 users |
| Stripe | 0€ fixe | 1.4% + 0.25€ par transaction |
| Expo EAS Build | 0€ | Plan gratuit limité |
| Apple Developer | 99$/an | ~8€/mois |
| Google Play | 25$ one-time | ~2€/mois amorti |
| Domain (optionnel) | 10€/an | Si landing page |
| **TOTAL M0-M3** | **~15€/mois** | Très lean |

### Coûts si scale (M6+)
- Supabase Pro : 25$/mois (si > 1000 users actifs)
- EAS Build : 29$/mois (builds illimités)
- Sentry : 26$/mois (error tracking)
- **Total scale** : ~80€/mois

---

## Next Steps Immédiats

1. **Valider le plan** : Review de cette roadmap
2. **Setup environnement** : Installer outils, créer comptes services
3. **Démarrer Phase 0** : Initialiser le projet
4. **Premier commit** : Pousser le squelette sur GitHub

Prêt à démarrer ? 🚀
