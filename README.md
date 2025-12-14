# GPoker - Application de Gestion de Poker

## Vision

GPoker est une application mobile complète de gestion de poker couvrant trois cas d'usage principaux :
- **Tournois** : Organisation et gestion de tournois avec timer, blinds, prizes
- **Cash Games** : Suivi des buy-ins/cash-outs et calcul automatique des settlements
- **Clubs de Poker** : Gestion professionnelle pour clubs avec statistiques, membres, et historique

## Proposition de valeur

Les clubs de poker et organisateurs utilisent actuellement des outils archaïques (Excel, papier, apps basiques). GPoker offre une solution moderne, intuitive et complète pour professionnaliser la gestion de parties de poker.

## Marché cible

### MVP (Phase 1)
- Groupes d'amis organisant des parties régulières
- Petits clubs de poker locaux
- Organisateurs de tournois occasionnels

### Post-MVP
- Clubs de poker établis
- Casinos et salles de poker
- Associations et fédérations

## Modèle économique

### Tiers de pricing
- **Gratuit** : Jusqu'à 3 parties/mois (validation du besoin)
- **Pro** : 9.99€/mois - Parties illimitées + historique complet
- **Club** : 29€/mois - Multi-organisateurs + branding + stats avancées

### Objectifs revenus
- Mois 3 : 50 utilisateurs payants (500€ MRR)
- Mois 6 : 200 utilisateurs payants (2000€ MRR)
- Mois 12 : 500 utilisateurs payants (5000€ MRR)

## Stack technique

- **Frontend** : React Native (Expo) - iOS + Android
- **Backend** : Supabase (BDD + Auth + Real-time)
- **Paiements** : Stripe (abonnements)
- **Déploiement** : App Store + Google Play

## Documents de référence

- [SPECS.md](./SPECS.md) - Spécifications fonctionnelles détaillées
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture technique et modèle de données
- [ROADMAP.md](./ROADMAP.md) - Plan de développement

## Démarrage rapide

```bash
# Installation
npm install

# Développement
npm start

# iOS
npm run ios

# Android
npm run android
```

## Contribuer

Ce projet est développé par Jean Sebastien.

## Licence

Propriétaire - Tous droits réservés
