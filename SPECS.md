# Spécifications Fonctionnelles - GPoker MVP

## 1. Authentification

### 1.1 Inscription / Connexion
**User Stories**
- En tant qu'utilisateur, je veux créer un compte avec email/password
- En tant qu'utilisateur, je veux me connecter avec Google/Apple Sign-In
- En tant qu'utilisateur, je veux réinitialiser mon mot de passe

**Règles métier**
- Email unique requis
- Mot de passe minimum 8 caractères
- Validation email obligatoire
- Session persistante

### 1.2 Profil utilisateur
**Champs**
- Nom/Pseudo
- Photo de profil
- Email
- Type de compte (Free/Pro/Club)
- Date d'inscription

---

## 2. Gestion des Tournois (70% de la valeur MVP)

### 2.1 Création de tournoi

**User Story**
En tant qu'organisateur, je veux créer un tournoi personnalisé pour gérer ma partie.

**Paramètres de tournoi**
- Nom du tournoi
- Date et heure
- Buy-in (montant)
- Stack de départ
- Durée des niveaux (minutes)
- Nombre de rebuys autorisés
- Nombre d'add-ons autorisés
- Late registration (durée en niveaux)

**Structure des blinds**
- Création automatique ou personnalisée
- Templates pré-définis : Turbo (5 min), Normal (10 min), Deep (15 min)
- Possibilité de modifier niveau par niveau :
  - Small blind
  - Big blind
  - Ante (optionnel)

**Règles métier**
- Buy-in minimum : 0€ (tournoi gratuit possible)
- Stack minimum : 1000 jetons
- Durée niveau : 3-60 minutes
- Maximum 50 niveaux de blinds

### 2.2 Timer de tournoi

**User Story**
En tant qu'organisateur, je veux un timer visuel pour gérer la progression des blinds.

**Fonctionnalités**
- Affichage du temps restant pour le niveau actuel
- Affichage des blinds actuelles (SB/BB/Ante)
- Affichage du prochain niveau
- Boutons : Play, Pause, Niveau suivant, Niveau précédent
- Annonce vocale optionnelle des changements de niveau
- Notification sonore 1 minute avant fin de niveau

**Interface**
```
┌─────────────────────────────┐
│  NIVEAU 4                   │
│  Blinds: 100/200 (25)       │
│                             │
│         08:34               │
│  (temps restant)            │
│                             │
│  Prochain: 150/300 (50)     │
│                             │
│  [Pause] [Suivant]          │
└─────────────────────────────┘
```

**Règles métier**
- Timer continue même si l'app est en arrière-plan
- Sauvegarde automatique de l'état
- Possibilité de reprendre un tournoi interrompu

### 2.3 Gestion des joueurs

**User Story**
En tant qu'organisateur, je veux enregistrer les joueurs et gérer leurs buy-ins.

**Fonctionnalités**
- Ajouter un joueur (nom + buy-in)
- Liste des joueurs inscrits avec statut
- Gérer les rebuys pour chaque joueur
- Gérer les add-ons
- Marquer les joueurs éliminés avec position de fin
- Total des entrées (buy-ins + rebuys + add-ons)

**Champs joueur**
- Nom
- Buy-ins (nombre)
- Rebuys (nombre)
- Add-ons (nombre)
- Statut : En jeu / Éliminé
- Position finale (si éliminé)

**Règles métier**
- Minimum 2 joueurs pour démarrer
- Rebuys possibles uniquement pendant la période autorisée
- Add-ons disponibles uniquement à la pause définie
- Montant total = (buy-ins + rebuys + add-ons) × montant buy-in

### 2.4 Calcul des prizes

**User Story**
En tant qu'organisateur, je veux calculer automatiquement les gains selon une structure de payout.

**Structures de payout**
- **2-5 joueurs** : Winner takes all
- **6-10 joueurs** : Top 2 (70% / 30%)
- **11-20 joueurs** : Top 3 (50% / 30% / 20%)
- **21+ joueurs** : Top 4+ (structure standard poker)

**Personnalisation**
- Possibilité de modifier les pourcentages
- Arrondi au 0.50€ près

**Règles métier**
- Prize pool = Total des entrées - rake éventuel (défini par organisateur)
- Somme des pourcentages doit faire 100%
- Minimum 1 payé, maximum 50% du field

**Exemple de calcul**
```
Tournoi : 15 joueurs, buy-in 20€, 2 rebuys
Total entrees : 15 × 20€ + 10 × 20€ = 500€
Prize pool : 500€

Structure Top 3 :
1er : 250€ (50%)
2ème : 150€ (30%)
3ème : 100€ (20%)
```

### 2.5 Historique des tournois

**User Story**
En tant qu'organisateur, je veux consulter l'historique de mes tournois passés.

**Informations affichées**
- Liste chronologique des tournois
- Nom, date, nombre de joueurs
- Prize pool total
- Top 3 joueurs
- Accès aux détails complets

**Règles métier**
- Gratuit : 3 derniers tournois visibles
- Pro/Club : Historique illimité

---

## 3. Gestion des Cash Games (25% de la valeur MVP)

### 3.1 Création de session cash game

**User Story**
En tant qu'organisateur, je veux créer une session de cash game pour tracker les buy-ins/cash-outs.

**Paramètres**
- Nom de la session
- Date et heure de début
- Blinds (SB/BB)
- Type : NLH, PLO, Mixed, etc.

### 3.2 Gestion des buy-ins et cash-outs

**User Story**
En tant qu'organisateur, je veux enregistrer les buy-ins et cash-outs de chaque joueur.

**Fonctionnalités**
- Ajouter un joueur
- Enregistrer buy-in (avec heure)
- Enregistrer cash-out (avec heure)
- Multiples buy-ins possibles par joueur
- Affichage du stack actuel de chaque joueur

**Interface liste joueurs**
```
┌──────────────────────────────┐
│ Jean                        │
│ Buy-in: 200€ | Stack: 350€  │
│ +150€                       │
├──────────────────────────────┤
│ Marc                        │
│ Buy-in: 200€ | Stack: 120€  │
│ -80€                        │
└──────────────────────────────┘
```

**Règles métier**
- Buy-in minimum configurable
- Cash-out ne peut pas être fait avant buy-in
- Montants arrondis à 0.50€

### 3.3 Calcul automatique des settlements

**User Story**
En tant qu'organisateur, je veux voir automatiquement qui doit payer qui à la fin de la session.

**Algorithme de settlement**
1. Calculer le résultat net de chaque joueur
2. Identifier gagnants (résultat positif) et perdants (résultat négatif)
3. Optimiser les transferts pour minimiser le nombre de transactions

**Exemple**
```
Résultats nets :
- Jean : +150€
- Marc : -80€
- Pierre : +50€
- Luc : -120€

Settlements optimisés :
- Marc paie 80€ à Jean
- Luc paie 120€ à Jean (qui redistribue 50€ à Pierre)

Simplifié :
- Marc paie 80€ à Jean
- Luc paie 70€ à Jean
- Luc paie 50€ à Pierre
```

**Règles métier**
- Total des gains = Total des pertes (équilibre parfait)
- Minimiser le nombre de transactions
- Bouton "Partager settlements" (copie texte ou screenshot)

### 3.4 Historique cash games

**User Story**
En tant qu'utilisateur, je veux voir mes statistiques de cash game.

**Stats affichées**
- Nombre de sessions
- Total buy-ins
- Total cash-outs
- Résultat net
- Winrate par session
- Graphique d'évolution

**Règles métier**
- Gratuit : 3 dernières sessions
- Pro/Club : Historique illimité + stats avancées

---

## 4. Gestion des Clubs (5% de la valeur MVP)

### 4.1 Création de club

**User Story**
En tant qu'organisateur, je veux créer un club pour centraliser mes parties et membres.

**Paramètres**
- Nom du club
- Description
- Logo (optionnel)
- Code d'invitation unique
- Visibilité : Privé / Public

**Règles métier**
- Réservé aux comptes Pro et Club
- Code d'invitation auto-généré (6 caractères alphanumériques)
- Maximum 1 club pour compte Pro, illimité pour Club

### 4.2 Gestion des membres

**User Story**
En tant qu'admin de club, je veux inviter et gérer les membres.

**Fonctionnalités**
- Inviter par code ou email
- Liste des membres avec rôles
- Rôles : Admin, Organisateur, Membre
- Retirer un membre
- Voir les stats des membres

**Permissions**
- **Admin** : Tous les droits
- **Organisateur** : Créer parties, gérer joueurs
- **Membre** : Voir historique, participer aux parties

### 4.3 Historique du club

**User Story**
En tant que membre, je veux voir toutes les parties organisées par le club.

**Affichage**
- Liste chronologique des tournois et cash games
- Filtres : Type, Date, Organisateur
- Statistiques globales du club

**Stats club**
- Nombre total de parties
- Nombre de membres actifs
- Prize pool total distribué
- Top joueurs du club

---

## 5. Abonnements et Paywall

### 5.1 Limites Free

**Restrictions**
- Maximum 3 parties/mois (tournois + cash games confondus)
- Historique limité aux 3 dernières parties
- Pas de clubs
- Pas de stats avancées

**Expérience**
- Message clair quand limite atteinte
- CTA vers upgrade

### 5.2 Upgrade Pro (9.99€/mois)

**Avantages**
- Parties illimitées
- Historique complet
- Stats avancées (graphiques, winrate)
- 1 club privé
- Support prioritaire

### 5.3 Upgrade Club (29€/mois)

**Avantages**
- Tout de Pro +
- Clubs illimités
- Multi-organisateurs
- Branding personnalisé
- Export données (CSV)
- Système de rake configuré

**Flow d'achat**
1. User clique sur "Upgrade"
2. Choix du plan (Pro/Club)
3. Payment Stripe (carte bancaire)
4. Confirmation et activation immédiate
5. Reçu par email

---

## 6. Notifications

### 6.1 Notifications push

**Cas d'usage**
- Rappel 30 min avant tournoi programmé
- Changement de niveau dans tournoi (si activé)
- Invitation à un club
- Expiration période d'essai

### 6.2 Notifications in-app

**Cas d'usage**
- Limite Free atteinte
- Nouveau membre dans le club
- Partie terminée

---

## 7. Règles métier transverses

### 7.1 Gestion des montants
- Devise : EUR (€)
- Précision : 2 décimales
- Arrondi : 0.50€ près pour settlements

### 7.2 Gestion du temps
- Timezone : Locale de l'utilisateur
- Format date : DD/MM/YYYY
- Format heure : HH:MM (24h)

### 7.3 Offline-first
- Création de partie possible hors ligne
- Synchronisation auto à la reconnexion
- Indication visuelle du statut sync

### 7.4 Partage
- Export PDF des résultats
- Partage via WhatsApp, Email, etc.
- Screenshot optimisé pour réseaux sociaux

---

## 8. User Flows principaux

### Flow 1 : Créer et gérer un tournoi
1. Tap "Nouveau tournoi"
2. Remplir paramètres (nom, buy-in, structure)
3. Ajouter joueurs
4. Démarrer timer
5. Gérer rebuys pendant partie
6. Enregistrer éliminations
7. Calculer prizes
8. Partager résultats

### Flow 2 : Gérer un cash game
1. Tap "Nouveau cash game"
2. Remplir paramètres (blinds, type)
3. Ajouter joueurs avec buy-ins
4. Enregistrer cash-outs en temps réel
5. Fin de session
6. Voir settlements optimisés
7. Partager qui paie qui

### Flow 3 : Créer un club
1. Upgrade vers Pro/Club
2. Tap "Créer un club"
3. Remplir infos club
4. Partager code d'invitation
5. Approuver membres
6. Organiser parties sous le club
7. Consulter stats du club

---

## 9. Critères d'acceptation MVP

### Must Have (Bloquant pour launch)
- ✅ Authentification complète
- ✅ Création tournoi avec timer fonctionnel
- ✅ Gestion joueurs et calcul prizes
- ✅ Création cash game avec settlements
- ✅ Système d'abonnement Stripe
- ✅ Historique parties (avec limites Free)
- ✅ Clubs basiques (création + membres)

### Should Have (Important mais pas bloquant)
- Notifications push
- Partage résultats
- Templates de structures de blinds
- Stats de base

### Could Have (Nice to have V2)
- Mode offline complet
- Export PDF
- Graphiques avancés
- Multi-langues

---

## 10. KPIs de succès MVP

### Acquisition
- 500 téléchargements M1
- 1000 téléchargements M3

### Activation
- 60% créent une première partie dans les 48h
- 40% créent une 2ème partie dans les 7 jours

### Rétention
- 30% reviennent après 7 jours
- 20% reviennent après 30 jours

### Monétisation
- 5% conversion Free → Pro à M1
- 10% conversion Free → Pro à M3
- 50 utilisateurs payants à M3 (500€ MRR)

### Engagement
- 3 parties/mois en moyenne par utilisateur actif
- 8 joueurs en moyenne par partie
