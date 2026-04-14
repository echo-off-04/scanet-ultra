# Documentation des Fonctionnalités de la Plateforme eBiz

**Date de mise à jour :** 29 janvier 2026  
**Version :** 1.0

---

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Authentification et Sécurité](#authentification-et-sécurité)
3. [Gestion des Contacts](#gestion-des-contacts)
4. [Gestion des Événements](#gestion-des-événements)
5. [Gestion d'Entreprise](#gestion-dentreprise)
6. [Gestion des Offres et Packs](#gestion-des-offres-et-packs)
7. [Dashboard et Statistiques](#dashboard-et-statistiques)
8. [Opportunités Commerciales](#opportunités-commerciales)
9. [Communication et Automatisation](#communication-et-automatisation)
10. [Personnalisation et Paramètres](#personnalisation-et-paramètres)
11. [Fonctionnalités à Venir](#fonctionnalités-à-venir)

---

## Vue d'ensemble

**eBiz** est une plateforme web de réseautage professionnel conçue pour transformer les rencontres physiques en opportunités d'affaires concrètes. Elle permet aux commerciaux et professionnels de centraliser, organiser et suivre leurs contacts établis lors d'événements.

### Objectifs principaux

- Centraliser tous les contacts professionnels
- Ne plus perdre de vue les prospects après une rencontre
- Automatiser les suivis et relances
- Mesurer et optimiser la conversion des opportunités
- Gérer une entreprise avec équipes et objectifs

---

## Authentification et Sécurité

### ✅ Fonctionnalités implémentées

#### Authentification utilisateur

- **Inscription** : Création de compte avec email et mot de passe
- **Connexion** : Authentification sécurisée via Supabase Auth
- **Déconnexion** : Sortie sécurisée de l'application
- **Profils utilisateurs** : Chaque utilisateur a un profil avec préférences

#### Sécurité des données

- **RLS (Row Level Security)** : Actuellement désactivé pour le développement
- **Isolation des données** : Chaque utilisateur n'accède qu'à ses propres données
- **Backend sécurisé** : Hébergé sur Supabase avec PostgreSQL

---

## Gestion des Contacts

### ✅ Fonctionnalités implémentées

#### Enregistrement des contacts

- **Ajout manuel** : Formulaire complet pour saisir les informations
- **Photo de profil** : Upload et stockage de la photo (avatar_url)
- **Lien avec événements** : Association automatique avec un événement lors de la création

#### Informations du contact

- **Identité**
  - Nom complet
  - Email
  - Téléphone (avec formatage international)
  - Photo de profil / Avatar

- **Informations professionnelles**
  - Nom de l'entreprise
  - Poste / Fonction
  - Secteur d'activité (liste prédéfinie)
  - Taille de l'entreprise (auto-entrepreneur, 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+)

- **Localisation**
  - Ville
  - Région (liste dynamique selon le pays)
  - Pays (avec drapeaux)

- **Catégorisation**
  - Statut (Lead, Prospect, Client, Partenaire, Collaborateur, Ami)
  - Source (Événement, Recommandation, Prospection)
  - Type de relation (Collègue, Client, Fournisseur, Partenaire, Ami, Autre)
  - Tags personnalisés
  - **Membre d'entreprise** : Case à cocher pour identifier les membres de son entreprise

- **Évaluation et Opportunités**
  - Système de notation 1-5 étoiles
  - Montant d'opportunité en euros
  - Notes personnelles

#### Consultation des contacts

- **Modes d'affichage**
  - Vue en liste (tableau détaillé)
  - Vue en grille/cartes
  - Vue photos (galerie)

- **Barre de recherche** : Recherche en temps réel
- **Filtres multiples**
  - Par nom, email, entreprise
  - Par statut (lead, prospect, client, etc.)
  - Par source de contact
  - Par événement
  - Par tags
  - **Par membres** : Filtrer les membres de l'entreprise

- **Tri des contacts**
  - Par nom (A-Z)
  - Par date de création
  - Par note d'évaluation
  - Par montant d'opportunité

#### Profil détaillé du contact

- **En-tête du profil**
  - Grande photo de profil
  - Nom et fonction
  - Badges de statut
  - Boutons d'action rapide

- **Actions rapides**
  - Appel téléphonique (lien tel:)
  - Envoyer un email (lien mailto:)
  - Contacter sur WhatsApp
  - Profil LinkedIn
  - Bouton de partage

- **Sections d'information**
  - Coordonnées complètes
  - Informations professionnelles
  - Événements associés (liste horizontale scrollable)
  - Historique d'activité
  - Notes et observations

- **Modification du profil**
  - Mode édition avec boutons Annuler/Enregistrer
  - Mise à jour de la photo séparément
  - Modification de tous les champs

#### Groupes de contacts

- **Création de groupes** : Organiser les contacts en groupes personnalisés
- **Nom et description** : Personnaliser chaque groupe
- **Couleur** : Attribuer une couleur pour identification visuelle
- **Gestion des membres** : Ajouter/retirer des contacts des groupes
- **Utilisation pour envois** : Envoyer des offres à un groupe entier

---

## Gestion des Événements

### ✅ Fonctionnalités implémentées

#### Création d'événements

- **Informations de base**
  - Nom de l'événement
  - Date et heure
  - Lieu (ville, pays)
  - Description

- **Type d'événement**
  - Présentiel
  - Distanciel (en ligne)
  - Hybride

- **Catégories**
  - Salon professionnel
  - Conférence
  - Networking
  - Rendez-vous commercial
  - Webinaire
  - Formation
  - Autre

- **Objectifs de l'événement**
  - Définir des objectifs quantifiables
  - Suivre les métriques (contacts, CA potentiel, etc.)

#### Gestion des événements

- **Liste complète** : Visualisation de tous les événements
- **Photos d'événements** : Upload d'images via Supabase Storage
- **Lien avec contacts** : Chaque contact est associé à un ou plusieurs événements
- **Statistiques** : Nombre de contacts par événement

#### Profil d'événement

- **Détails complets** : Toutes les informations de l'événement
- **Liste des contacts** : Contacts rencontrés lors de cet événement
- **Objectifs et résultats** : Suivi de la performance
- **Photos** : Galerie de photos de l'événement

---

## Gestion d'Entreprise

### ✅ Fonctionnalités implémentées

#### Module Entreprise (Enterprise)

- **Création d'entreprise**
  - Nom et description
  - Logo
  - Secteur d'activité
  - Taille (startup, PME, ETI, grande entreprise)
  - Vision et mission

#### Structure organisationnelle

##### Équipes (Teams)

- **Hiérarchie multi-niveaux**
  - Création d'équipes et sous-équipes
  - Manager attribué à chaque équipe
  - Niveau hiérarchique automatique

- **Gestion des membres**
  - Ajout de contacts en tant que membres
  - Rôle dans l'équipe (manager, lead, member, intern)
  - Consultation des membres par équipe

- **Visualisation**
  - Vue en arborescence des équipes
  - Expand/collapse des sous-équipes
  - Compteur de membres par équipe

##### Groupes personnalisés (Custom Groups)

- **Groupes transverses** : Créer des groupes qui traversent la hiérarchie
- **Thématiques** : Définir le type de groupe (project, department, interest, location)
- **Gestion flexible** : Ajouter/retirer des membres librement

##### Onglet Membres

- **Liste des membres** : Tous les contacts marqués comme membres
- **Recherche de membres** : Filtrer par nom, email, fonction
- **Ajout de membres** : Marquer des contacts existants comme membres
- **Retrait de membres** : Retirer le statut membre
- **Vue en cartes** : Affichage visuel avec photos et informations

#### Objectifs d'entreprise

- **Objectifs globaux** : Pour toute l'entreprise
- **Objectifs d'équipe** : Spécifiques à chaque équipe
- **Métriques suivies**
  - Nombre (contacts, événements)
  - Montant (chiffre d'affaires)
  - Pourcentage
  - Devise (avec conversion)

- **Suivi de progression**
  - Valeur actuelle vs objectif
  - Barre de progression visuelle
  - Statut (non démarré, en cours, terminé, annulé)
  - Priorité (low, medium, high, critical)

#### Dashboard Entreprise

- **KPIs principaux**
  - Nombre total d'équipes
  - Nombre total de membres
  - Nombre de groupes
  - Objectifs complétés/total

- **Vue d'ensemble**
  - Dernières équipes créées
  - Derniers groupes créés
  - Objectifs prioritaires

#### Optimisations de performance

- **Chargement parallèle** : Requêtes simultanées pour les données
- **Cache local** : Réduction des appels API répétés
- **Lazy loading** : Chargement progressif des données

---

## Gestion des Offres et Packs

### ✅ Fonctionnalités implémentées

#### Offres commerciales

- **Création d'offres**
  - Titre et description
  - Prix et devise (EUR, USD, GBP, XOF, XAF)
  - Durée (ponctuel, mensuel, annuel)
  - Catégorie personnalisée
  - Liste de fonctionnalités
  - **Image de l'offre** : URL de l'image avec prévisualisation

- **Statut des offres**
  - Active : Visible et disponible
  - Inactive : Masquée

- **Gestion des offres**
  - Modification
  - Suppression
  - Duplication (à venir)
  - **Envoi à des contacts/groupes**

#### Packs d'offres

- **Création de packs**
  - Nom et description
  - Sélection de plusieurs offres
  - **Prix du pack** : Prix arbitraire indépendant des offres
  - Pourcentage de réduction (affiché)
  - **Image du pack** : Représentation visuelle
  - Statut (actif/inactif)

- **Composition**
  - Ajout/retrait d'offres du pack
  - Vue détaillée des offres incluses
  - Calcul automatique du prix total (si souhaité)

#### Consultation

- **Modes d'affichage**
  - Onglet Offres individuelles
  - Onglet Packs

- **Filtrage avancé**
  - **Par statut** : Toutes, Actives, Inactives
  - Par recherche textuelle
  - Par catégorie

- **Statistiques**
  - Nombre total d'offres
  - Nombre d'offres actives
  - Nombre de packs
  - Nombre de packs actifs

#### Envoi d'offres

- **Modal d'envoi**
  - Sélection de destinataires (contacts individuels)
  - Sélection de groupes de contacts
  - Message personnalisé optionnel
  - Recherche de destinataires

- **Suivi des envois**
  - Table `offer_sends` pour historique
  - Date d'envoi
  - Statut (envoyé, vu, accepté, refusé)
  - Destinataires multiples (contacts et groupes)

#### Actions sur les offres/packs

- **Menu d'actions**
  - Modifier
  - **Envoyer** : Nouveau bouton d'envoi
  - Supprimer

---

## Dashboard et Statistiques

### ✅ Fonctionnalités implémentées

#### Page d'accueil (Dashboard)

- **KPIs principaux**
  - Nombre total de contacts
  - Nombre d'événements à venir
  - Chiffre d'affaires potentiel
  - Taux de conversion

- **Derniers contacts ajoutés** : Vue des contacts récents
- **Derniers événements** : Scroll horizontal des événements
- **Groupes de contacts** : Accès rapide aux groupes

#### Statistiques de performance

- **Analyse des contacts**
  - Répartition par statut
  - Répartition par source
  - Contacts par événement
  - Évolution mensuelle

- **Opportunités**
  - CA potentiel total
  - CA par statut
  - CA par événement
  - Pipeline des opportunités

---

## Opportunités Commerciales

### ✅ Fonctionnalités implémentées

#### Page Opportunités

- **Liste des opportunités**
  - Contacts avec montant d'opportunité
  - Tri par montant décroissant
  - Filtrage par statut
  - Recherche

- **Notation automatique**
  - Système de notation 1-5 étoiles
  - Attribution automatique selon le statut
  - Modification manuelle possible

- **Statuts d'opportunité**
  - Lead (1 étoile)
  - Prospect (2 étoiles)
  - Client qualifié (3 étoiles)
  - Client actif (4 étoiles)
  - Partenaire stratégique (5 étoiles)
  - Lost : Automatiquement 0 étoile

- **Montants**
  - Saisie du montant potentiel
  - Devise configurable
  - Conversion automatique
  - Consolidation par période

#### Suivi des opportunités

- **Pipeline visuel** : Vue en colonnes par statut (à venir)
- **Historique** : Évolution du statut dans le temps
- **Prévisions** : Estimations de CA selon les taux de conversion

---

## Communication et Automatisation

### ✅ Fonctionnalités partiellement implémentées

#### Communication directe

- **Email** : Liens mailto dans les profils
- **Téléphone** : Liens tel: pour appel direct
- **WhatsApp** : Liens WhatsApp avec numéro pré-rempli
- **LinkedIn** : Accès au profil LinkedIn

#### Envoi de catalogues et offres

- **Envoi d'offres individuelles** : Vers contacts ou groupes
- **Envoi de packs** : Offres groupées
- **Message personnalisé** : Accompagner l'envoi d'un message

### 🔄 Fonctionnalités à développer

#### Automatisation des emails

- **Intégration Resend** : Service d'envoi d'emails
- **Templates d'emails** : Modèles personnalisables
- **Workflows de relance**
  - Séquences automatisées (J+1, J+3, J+5, etc.)
  - Personnalisation des délais
  - Conditions de déclenchement
  - Arrêt automatique si réponse

#### Accès Invité

- **Landing page personnalisée**
  - Style "Linktree"
  - Sans compte requis
  - Informations commerciales
  - Liens réseaux sociaux
  - Catalogue des offres
  - Plaquette de l'entreprise

---

## Personnalisation et Paramètres

### ✅ Fonctionnalités implémentées

#### Paramètres utilisateur

- **Devise par défaut**
  - Sélection de la devise principale
  - EUR, USD, GBP, XOF, XAF
  - Application sur toute la plateforme

- **Conversion de devises**
  - API Frankfurter pour taux de change en temps réel
  - Conversion automatique des montants
  - Cache des taux pour performance

#### Personnalisation de l'interface

- **Thème** : Couleurs de la plateforme (actuellement fixe)
- **Logo** : Logo d'entreprise dans l'en-tête
- **Sidebar rétractable** : Pour maximiser l'espace

---

## Fonctionnalités à Venir

### 🔮 Enregistrement des contacts avancé

#### Modes d'ajout supplémentaires

- **Lien ou QR Code**
  - Génération d'un QR code personnel
  - Page de saisie pour le contact
  - Auto-enregistrement dans la base

- **Scan de carte de visite**
  - OCR pour extraction automatique
  - Détection des champs (nom, email, téléphone, etc.)
  - Prévisualisation avant validation
  - Photo de la carte stockée en référence

- **Import en masse**
  - Import CSV/Excel
  - Mapping des colonnes
  - Validation des données
  - Dédoublonnage

### 🔮 Recherche avancée

#### Recherche par photo

- **Reconnaissance visuelle**
  - Upload d'une photo
  - Métadonnées (nom + événement + date)
  - Recherche par similarité visuelle
  - SEO-friendly pour indexation

#### Recherche intelligente

- **Autocomplétion** : Suggestions pendant la saisie
- **Recherche floue** : Tolérance aux fautes de frappe
- **Recherche multi-critères** : Combinaison de filtres complexes
- **Recherche sémantique** : Compréhension du contexte

### 🔮 Workflows et Automatisation

#### Workflows de vente

- **Séquences d'actions**
  - Déclencheurs personnalisables
  - Actions automatiques (email, tâche, notification)
  - Conditions et branchements
  - Tracking des performances

#### Relances automatiques

- **Emails de suivi**
  - Modèles personnalisables
  - Variables dynamiques (nom, entreprise, etc.)
  - A/B testing
  - Statistiques d'ouverture et clic

- **Rappels de tâches**
  - Notifications pour les suivis
  - Agenda intégré
  - Synchronisation calendrier externe

### 🔮 Analytics et Reporting

#### Rapports détaillés

- **Rapport de performance**
  - Taux de conversion par source
  - ROI par événement
  - Évolution du pipeline
  - Prévisions de CA

- **Rapport d'activité**
  - Nombre de contacts par période
  - Interactions par contact
  - Efficacité des relances
  - Temps moyen de conversion

#### Exports

- **Export PDF** : Rapports imprimables
- **Export Excel** : Données brutes pour analyse
- **API** : Intégration avec outils tiers

### 🔮 Collaboration et Partage

#### Travail d'équipe

- **Partage de contacts** : Entre membres de l'équipe
- **Notes partagées** : Commentaires collaboratifs
- **Historique d'activité** : Qui a fait quoi et quand
- **Permissions** : Contrôle d'accès par rôle

#### Intégrations

- **CRM externes** : Salesforce, HubSpot, Pipedrive
- **Outils de communication** : Slack, Teams
- **Calendriers** : Google Calendar, Outlook
- **Signature électronique** : DocuSign, HelloSign

### 🔮 Mobile

#### Application mobile native

- **iOS et Android** : Apps natives
- **Scan de cartes** : Utilisation de la caméra
- **Mode hors-ligne** : Synchronisation automatique
- **Notifications push** : Rappels et alertes
- **Géolocalisation** : Check-in aux événements

#### Progressive Web App (PWA)

- **Installation sur mobile** : Comme une app native
- **Fonctionnement hors-ligne** : Service workers
- **Notifications** : Push notifications web

### 🔮 Intelligence Artificielle

#### IA pour l'analyse

- **Scoring automatique** : Notation des prospects par IA
- **Prédiction de conversion** : Probabilité de closing
- **Recommandations** : Prochaines actions suggérées
- **Analyse de sentiment** : Dans les emails et notes

#### IA pour la productivité

- **Auto-complétion** : Suggestions de texte
- **Résumés automatiques** : Des interactions longues
- **Transcription** : Appels et réunions
- **Chatbot** : Assistant virtuel dans l'app

---

## Récapitulatif par Statut

### ✅ Fonctionnalités Complètes (Implémentées)

1. **Authentification** : Inscription, connexion, déconnexion
2. **Gestion contacts** : CRUD complet, profils détaillés, groupes
3. **Gestion événements** : Création, suivi, photos, objectifs
4. **Module Entreprise** : Équipes, groupes, membres, objectifs
5. **Offres & Packs** : Création, modification, filtrage, images, prix, envoi
6. **Dashboard** : KPIs, statistiques, vue d'ensemble
7. **Opportunités** : Suivi, notation, montants, conversion
8. **Paramètres** : Devises, conversions
9. **Search & Filter** : Recherche texte, filtres multiples
10. **Vues multiples** : Liste, cartes, photos

### 🔄 Fonctionnalités Partielles (En développement)

1. **Communication** : Envoi d'offres OK, workflows à faire
2. **Automatisation** : Structure en place, séquences à développer
3. **Analytics** : Dashboard de base OK, rapports avancés à faire

### 🔮 Fonctionnalités Planifiées (À venir)

1. **Scan de cartes** : OCR et détection automatique
2. **QR Code** : Génération et auto-enregistrement
3. **Workflows avancés** : Séquences complexes
4. **Landing pages** : Accès invité personnalisé
5. **Recherche par photo** : Reconnaissance visuelle
6. **Application mobile** : iOS et Android
7. **Intégrations** : CRM, calendriers, communication
8. **IA** : Scoring, prédictions, recommandations
9. **Collaboration** : Partage, permissions, équipes
10. **Rapports avancés** : Exports, analytics poussés

---

## Technologies Utilisées

### Frontend

- **React** : Framework JavaScript
- **TypeScript** : Typage statique
- **Tailwind CSS** : Styling
- **Lucide React** : Icônes
- **Vite** : Build tool

### Backend

- **Supabase** : Backend-as-a-Service
  - PostgreSQL : Base de données
  - Auth : Authentification
  - Storage : Stockage de fichiers
  - Realtime : Mises à jour en temps réel

### APIs Externes

- **Frankfurter API** : Conversion de devises
- **Resend** : Envoi d'emails (à intégrer)

### DevOps

- **Git** : Contrôle de version
- **GitHub** : Hébergement du code
- **ESLint** : Linting
- **Prettier** : Formatage du code

---

**Document maintenu par :** Équipe eBiz Dev  
**Dernière révision :** 29 janvier 2026
