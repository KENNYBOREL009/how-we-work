# CAHIER DES CHARGES TECHNIQUE
## LOKEBO DRIVE - Plateforme de Transport Urbain Intelligent

---

**Version**: 2.0  
**Date**: Février 2026  
**Statut**: Document de référence  
**Confidentialité**: Interne

---

## TABLE DES MATIÈRES

1. [Présentation du Projet](#1-présentation-du-projet)
2. [Architecture Technique](#2-architecture-technique)
3. [Modules Fonctionnels](#3-modules-fonctionnels)
4. [Spécifications de Sécurité](#4-spécifications-de-sécurité)
5. [Feuille de Route](#5-feuille-de-route)
6. [Annexes Techniques](#6-annexes-techniques)

---

## 1. PRÉSENTATION DU PROJET

### 1.1 Vision

**LOKEBO DRIVE** est une plateforme de transport urbain conçue pour digitaliser l'écosystème des transports informels au Cameroun. Elle suit un modèle "phygital" combinant :

- **Application mobile** : Interface utilisateur principale
- **Boîtiers LED IoT** : Affichage des destinations sur les toits des taxis
- **Smart Stops** : Arrêts géoréférencés avec signalétique intelligente

### 1.2 Objectifs Stratégiques

| Objectif | Description | KPI Cible |
|----------|-------------|-----------|
| Digitalisation | Numériser 80% des taxis jaunes de Douala | 5000 chauffeurs actifs |
| Sécurité | Traçabilité complète des trajets | 100% des courses tracées |
| Accessibilité | Application intuitive pour tous | Note UX > 4.5/5 |
| Économie | Réduire les coûts de transport | -15% vs taxis traditionnels |

### 1.3 Périmètre Géographique

- **Phase 1** : Douala (Zone pilote)
- **Phase 2** : Yaoundé
- **Phase 3** : Bafoussam, Buea, Kribi

---

## 2. ARCHITECTURE TECHNIQUE

### 2.1 Stack Technologique

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Client)                         │
├─────────────────────────────────────────────────────────────┤
│  React 18.3 │ TypeScript │ Vite │ TailwindCSS │ shadcn/ui   │
│  React Router │ TanStack Query │ Mapbox GL JS               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Lovable Cloud)                   │
├─────────────────────────────────────────────────────────────┤
│  Supabase PostgreSQL │ Edge Functions (Deno) │ Realtime     │
│  Row Level Security │ Storage │ Auth                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVICES EXTERNES                         │
├─────────────────────────────────────────────────────────────┤
│  Mapbox (Cartographie) │ MTN MoMo API │ Orange Money API    │
│  Push Notifications │ AI Traffic Intelligence               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Schéma de Base de Données

#### Tables Principales (40+ tables)

| Catégorie | Tables | Description |
|-----------|--------|-------------|
| **Utilisateurs** | `profiles`, `user_roles`, `wallets`, `transport_budgets` | Gestion des comptes |
| **Véhicules** | `vehicles`, `vehicle_positions`, `fleet_vehicles`, `fleet_owners` | Parc automobile |
| **Trajets** | `trips`, `ride_requests`, `scheduled_trips`, `shared_ride_passengers` | Courses et réservations |
| **Bus** | `bus_routes`, `bus_stops`, `bus_schedules`, `route_stops` | Infrastructure bus |
| **IA** | `ai_recommendations`, `demand_predictions`, `city_zones`, `surge_pricing_zones` | Intelligence artificielle |
| **Finance** | `wallet_transactions`, `wallet_holds`, `momo_transactions` | Transactions |
| **Contribution** | `map_contributions`, `contribution_votes`, `rewards`, `reward_redemptions` | Gamification |
| **Chauffeur** | `driver_reliability_scores`, `driver_assignments`, `driver_expenses`, `driver_daily_reports` | Gestion chauffeur |

### 2.3 Edge Functions

| Fonction | Description | Authentification |
|----------|-------------|------------------|
| `get-mapbox-token` | Récupération sécurisée du token Mapbox | JWT requis |
| `ai-traffic-intelligence` | Prédictions IA de trafic et demande | JWT requis |

---

## 3. MODULES FONCTIONNELS

### 3.1 MODULE PASSAGER

#### 3.1.1 Signal (Siffler)
**Description** : Système de hélage digital des taxis jaunes

| Fonctionnalité | Statut | Hook/Component |
|----------------|--------|----------------|
| Émission de signal GPS | ✅ Implémenté | `useClientSignals` |
| Sélection du nombre de passagers | ✅ Implémenté | `PassengerSelector` |
| Recherche de destination | ✅ Implémenté | `DestinationSearch` |
| Animation de recherche chauffeur | ✅ Implémenté | `DriverSearchAnimation` |
| Expiration automatique du signal | ✅ Implémenté | Server-side trigger |

**Flux utilisateur** :
```
Position GPS → Destination → Passagers → Signal émis → Matching → Confirmation
```

#### 3.1.2 Réservation de Siège (E-Hailing)
**Description** : Réservation instantanée avec choix du véhicule

| Fonctionnalité | Statut | Hook/Component |
|----------------|--------|----------------|
| Choix type véhicule (Taxi/Confort/Premium) | ✅ Implémenté | `RideOptions` |
| Options course privée | ✅ Implémenté | `PrivateRideOptions` |
| Estimation tarifaire | ✅ Implémenté | `useSurgePricing` |
| Drawer de réservation siège | ✅ Implémenté | `SeatReservationDrawer` |

#### 3.1.3 Confort Partagé
**Description** : Covoiturage économique avec matching intelligent

| Fonctionnalité | Statut | Hook/Component |
|----------------|--------|----------------|
| Matching par trajet similaire | ✅ Implémenté | `useSharedComfortMatching` |
| Préférence de siège | ✅ Implémenté | `SeatPreferenceSelector` |
| Indicateur zone confort | ✅ Implémenté | `ComfortZoneIndicator` |
| Notification chauffeur | ✅ Implémenté | `ComfortDriverNotification` |
| Fallback VTC | ✅ Implémenté | `VTCFallbackDialog` |

#### 3.1.4 Trajets Programmés
**Description** : Réservation anticipée avec garanties

| Fonctionnalité | Statut | Hook/Component |
|----------------|--------|----------------|
| Sélection date/heure | ✅ Implémenté | `ScheduleTrip` page |
| Dépôt de garantie wallet | ✅ Implémenté | `useWalletHold` |
| Matching automatique chauffeur | ✅ Implémenté | `useScheduledTrips` |
| Système de pénalités | ✅ Implémenté | `PenaltyNotification` |
| Avertissement annulation | ✅ Implémenté | `CancellationWarningDialog` |

#### 3.1.5 Suivi de Trajet
**Description** : Tracking temps réel de la course

| Fonctionnalité | Statut | Hook/Component |
|----------------|--------|----------------|
| Carte temps réel | ✅ Implémenté | `LiveTripMap` |
| Compte à rebours arrivée | ✅ Implémenté | `ArrivalCountdown` |
| Passagers partagés | ✅ Implémenté | `SharedRidePassengers` |
| Chat chauffeur/passager | ✅ Implémenté | `RideChatDrawer`, `useRideMessages` |
| Bouton SOS | ✅ Implémenté | `ActiveTripView` |
| Notation chauffeur | ✅ Implémenté | `RateDriverDialog` |
| Confirmation paiement | ✅ Implémenté | `PaymentConfirmDialog` |

### 3.2 MODULE BUS

#### 3.2.1 Suivi des Bus
**Description** : Tracking temps réel des bus urbains

| Fonctionnalité | Statut | Hook/Component |
|----------------|--------|----------------|
| Carte des bus | ✅ Implémenté | `BusMap` |
| Liste des véhicules | ✅ Implémenté | `VehicleList` |
| Panneau horaires | ✅ Implémenté | `SchedulePanel` |
| Paiement bus | ✅ Implémenté | `BusPaymentDialog` |

#### 3.2.2 Infrastructure Bus
**Description** : Gestion des lignes et arrêts

| Fonctionnalité | Statut | Table DB |
|----------------|--------|----------|
| Lignes de bus | ✅ Implémenté | `bus_routes` |
| Arrêts géolocalisés | ✅ Implémenté | `bus_stops` |
| Association ligne/arrêt | ✅ Implémenté | `route_stops` |
| Horaires de passage | ✅ Implémenté | `bus_schedules` |
| Arrêts favoris | ✅ Implémenté | `favorite_stops` |

### 3.3 MODULE CHAUFFEUR

#### 3.3.1 Interface VTC Premium (Cockpit)
**Description** : Dashboard complet pour chauffeurs VTC

| Fonctionnalité | Statut | Hook/Component |
|----------------|--------|----------------|
| Cockpit principal | ✅ Implémenté | `DriverCockpit` |
| Toggle en ligne/hors ligne | ✅ Implémenté | `useDriverMode` |
| Carte des demandes | ✅ Implémenté | `RideRequestCard`, `RideRequestCardV2` |
| Mode plein écran | ✅ Implémenté | `RideRequestFullScreen` |
| Course active | ✅ Implémenté | `ActiveRideCard` |
| Statistiques temps réel | ✅ Implémenté | `DriverStatsGrid`, `useDriverRealStats` |
| Score de fiabilité | ✅ Implémenté | `ReliabilityScoreCard`, `useDriverReliability` |
| Validation présence GPS | ✅ Implémenté | `PresenceValidation` |
| Notification matching | ✅ Implémenté | `DriverMatchingNotification` |
| Accès rapide (sheet) | ✅ Implémenté | `DriverQuickAccessSheet` |

#### 3.3.2 Mode Taxi Classique
**Description** : Interface simplifiée pour taxis jaunes traditionnels

| Fonctionnalité | Statut | Hook/Component |
|----------------|--------|----------------|
| Contrôles classiques | ✅ Implémenté | `ClassicDriverControls` |
| Sélecteur destination | ✅ Implémenté | `DestinationSelector` |
| Widget capacité sièges | ✅ Implémenté | `SeatCapacityWidget` |
| Alerte réservation | ✅ Implémenté | `SeatBookingAlert` |

#### 3.3.3 Intelligence Artificielle Chauffeur
**Description** : Assistance IA pour optimisation des gains

| Fonctionnalité | Statut | Hook/Component |
|----------------|--------|----------------|
| Carte de chaleur demande | ✅ Implémenté | `DriverHotspotMap`, `SmartHotspotMap` |
| Panneau trafic IA | ✅ Implémenté | `AITrafficPanel` |
| Recommandations zones | ✅ Implémenté | `useTrafficIntelligence` |
| Prédictions demande | ✅ Implémenté | `DemandHeatmap` |
| Sélecteur zone travail | ✅ Implémenté | `DriverWorkZoneSelector` |

#### 3.3.4 Gestion Financière Chauffeur
**Description** : Comptabilité et reporting

| Fonctionnalité | Statut | Hook/Component |
|----------------|--------|----------------|
| Gains journaliers | ✅ Implémenté | `DailyEarningsCard` |
| Gains commission | ✅ Implémenté | `CommissionEarnings` |
| Gains location | ✅ Implémenté | `DailyRentalEarnings` |
| Gains propriétaire | ✅ Implémenté | `OwnerEarnings` |
| Dépenses rapides | ✅ Implémenté | `QuickExpenseButton`, `useDriverExpenses` |
| Rapports journaliers | ✅ Implémenté | `useDriverDailyReports` |
| Analytics avancés | ✅ Implémenté | `DriverAnalytics` page |

#### 3.3.5 Planning & Disponibilité
**Description** : Gestion des créneaux de travail

| Fonctionnalité | Statut | Hook/Component |
|----------------|--------|----------------|
| Créneaux disponibilité | ✅ Implémenté | `useDriverAvailability` |
| Mode opératoire | ✅ Implémenté | `OperatingModeSelector`, `useDriverOperatingMode` |
| Sélecteur niveau interface | ✅ Implémenté | `InterfaceLevelSelector` |
| Services activés | ✅ Implémenté | `ServiceTypeSelector`, `useDriverServices` |
| Planning hebdomadaire | ✅ Implémenté | `DriverPlanning` page |
| Profil chauffeur | ✅ Implémenté | `DriverProfileSetup`, `useDriverProfile` |

### 3.4 MODULE FLOTTE

#### 3.4.1 Gestion Propriétaire
**Description** : Dashboard pour propriétaires de flottes

| Fonctionnalité | Statut | Hook/Component |
|----------------|--------|----------------|
| Profil propriétaire | ✅ Implémenté | `useFleetOwner` |
| Liste véhicules | ✅ Implémenté | `useFleetVehicles` |
| Affectation chauffeurs | ✅ Implémenté | `useDriverAssignments`, `FleetAssignmentCard` |
| Suivi véhicule assigné | ✅ Implémenté | `useFleetAssignment` |

#### 3.4.2 Comptabilité Flotte
**Description** : Suivi financier multi-véhicules

| Fonctionnalité | Statut | Table DB |
|----------------|--------|----------|
| Dépenses véhicule | ✅ Implémenté | `driver_expenses` |
| Rapports consolidés | ✅ Implémenté | `driver_daily_reports` |
| Types de contrat (location/commission) | ✅ Implémenté | `driver_assignments.assignment_type` |

### 3.5 MODULE PORTEFEUILLE

#### 3.5.1 Wallet
**Description** : Portefeuille numérique intégré

| Fonctionnalité | Statut | Hook/Component |
|----------------|--------|----------------|
| Solde et transactions | ✅ Implémenté | `useWallet` |
| Dépôt Mobile Money | ✅ Implémenté | `MomoDepositDialog`, `useMobileMoney` |
| Budget transport mensuel | ✅ Implémenté | `TransportBudgetCard`, `useTransportBudget` |
| Blocage garantie | ✅ Implémenté | `useWalletHold` |

### 3.6 MODULE CONTRIBUTION CARTOGRAPHIQUE

#### 3.6.1 Enrichissement Carte
**Description** : Contribution collaborative à la cartographie

| Fonctionnalité | Statut | Hook/Component |
|----------------|--------|----------------|
| Ajout noms locaux | ✅ Implémenté | `AddLocalNameDialog` |
| Signalement erreurs | ✅ Implémenté | `ReportErrorDialog` |
| Vote communautaire | ✅ Implémenté | `ValidationPrompt` |
| Points contributeur | ✅ Implémenté | `UserPointsCard`, `useMapContributions` |
| Bouton flottant | ✅ Implémenté | `MapContributorFAB` |
| Rappel contribution | ✅ Implémenté | `ContributionPrompt` |

#### 3.6.2 Récompenses
**Description** : Programme de fidélité

| Fonctionnalité | Statut | Hook/Component |
|----------------|--------|----------------|
| Catalogue récompenses | ✅ Implémenté | `RewardsMarketplace` |
| Échange points | ✅ Implémenté | `useRewards` |
| Page dédiée | ✅ Implémenté | `Rewards` page |

### 3.7 MODULE ADMINISTRATION

#### 3.7.1 Dashboard Admin
**Description** : Centre de contrôle plateforme

| Fonctionnalité | Statut | Hook/Component |
|----------------|--------|----------------|
| Statistiques globales | ✅ Implémenté | `AdminStatsCards`, `useAdmin` |
| Gestion utilisateurs | ✅ Implémenté | `AdminUsersTable` |
| Gestion véhicules | ✅ Implémenté | `AdminVehiclesTable` |
| Gestion trajets | ✅ Implémenté | `AdminTripsTable` |
| Gestion flottes | ✅ Implémenté | `AdminFleetTable` |
| Gestion bus | ✅ Implémenté | `AdminBusTable` |
| Gestion zones | ✅ Implémenté | `AdminZonesTable` |
| Modération contributions | ✅ Implémenté | `AdminContributionsTable` |
| Statistiques financières | ✅ Implémenté | `AdminFinanceCard` |
| Trajets programmés | ✅ Implémenté | `AdminScheduledTripsTable` |
| Gestion récompenses | ✅ Implémenté | `AdminRewardsTable` |
| Hooks étendus | ✅ Implémenté | `useAdminExtended` |

### 3.8 MODULE NOTIFICATIONS

| Fonctionnalité | Statut | Hook/Component |
|----------------|--------|----------------|
| Centre notifications | ✅ Implémenté | `Notifications` page, `useNotifications` |
| Push notifications | ✅ Implémenté | `usePushNotifications` |
| Paramètres personnalisés | ✅ Implémenté | `NotificationSettings` page |

### 3.9 MODULE CARTOGRAPHIE

| Fonctionnalité | Statut | Hook/Component |
|----------------|--------|----------------|
| Carte principale | ✅ Implémenté | `MapboxMap`, `HomeMap` |
| Marqueurs véhicules | ✅ Implémenté | `VehicleMarker` |
| Légende véhicules | ✅ Implémenté | `VehicleLegend` |
| Picker destination | ✅ Implémenté | `MapDestinationPicker` |
| Drawer course partagée | ✅ Implémenté | `JoinSharedRideDrawer` |

### 3.10 MODULES TRANSVERSAUX

#### Authentification
| Fonctionnalité | Statut | Hook/Component |
|----------------|--------|----------------|
| Inscription/Connexion | ✅ Implémenté | `Auth` page, `useAuth` |
| Gestion profil | ✅ Implémenté | `Profil` page |
| Adresses favorites | ✅ Implémenté | `AddressManager` |

#### Interface
| Fonctionnalité | Statut | Hook/Component |
|----------------|--------|----------------|
| Thème clair/sombre | ✅ Implémenté | `ThemeProvider`, `ThemeToggle` |
| Onboarding | ✅ Implémenté | `OnboardingGuide`, `NewUserDetector` |
| Layout mobile | ✅ Implémenté | `MobileLayout`, `BottomNav` |
| Logo adaptif | ✅ Implémenté | `Logo` |

#### Tarification Dynamique
| Fonctionnalité | Statut | Hook/Component |
|----------------|--------|----------------|
| Surge pricing | ✅ Implémenté | `useSurgePricing` |
| Badge surge | ✅ Implémenté | `SurgePricingBadge` |
| Notification surge | ✅ Implémenté | `SurgeNotification` |

#### Commande Vocale
| Fonctionnalité | Statut | Hook/Component |
|----------------|--------|----------------|
| Input vocal | ✅ Implémenté | `VoiceInputButton`, `useVoiceInput` |
| Contrôle chauffeur vocal | ✅ Implémenté | `DriverVoiceControl` |

#### Routines Intelligentes
| Fonctionnalité | Statut | Hook/Component |
|----------------|--------|----------------|
| Détection routines | ✅ Implémenté | `RoutineDetectionDialog`, `useSmartRoutine` |

---

## 4. SPÉCIFICATIONS DE SÉCURITÉ

### 4.1 Architecture de Sécurité Multi-Couches

```
┌─────────────────────────────────────────────────────────────┐
│                    COUCHE 1: CLIENT                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ • Validation Zod côté client                         │    │
│  │ • Sanitization des inputs                            │    │
│  │ • Pas de secrets en frontend                         │    │
│  │ • HTTPS obligatoire                                  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    COUCHE 2: API/EDGE FUNCTIONS              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ • Validation JWT (getClaims)                         │    │
│  │ • CORS configuré                                     │    │
│  │ • Rate limiting                                      │    │
│  │ • Secrets en variables d'environnement               │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    COUCHE 3: BASE DE DONNÉES                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ • Row Level Security (RLS) sur toutes les tables     │    │
│  │ • SECURITY DEFINER functions                         │    │
│  │ • Rôles séparés (user_roles table)                   │    │
│  │ • Triggers de validation                             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Système RBAC (Role-Based Access Control)

#### Rôles Définis
```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'driver', 'fleet_owner');
```

#### Table des Rôles
```sql
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);
```

#### Fonctions de Vérification (SECURITY DEFINER)
```sql
-- Vérification admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'admin'
  )
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

-- Vérification rôle générique
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  )
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;
```

### 4.3 Politiques RLS Implémentées

#### Catégories de Politiques

| Catégorie | Tables | Principe |
|-----------|--------|----------|
| **Données personnelles** | `profiles`, `wallets`, `transport_budgets` | Lecture/écriture par propriétaire uniquement |
| **Données publiques** | `bus_stops`, `bus_routes`, `city_zones` | Lecture publique, écriture admin |
| **Données transactionnelles** | `trips`, `ride_requests` | Accès client + chauffeur assigné |
| **Données flotte** | `fleet_vehicles`, `driver_assignments` | Propriétaire flotte + chauffeur assigné |
| **Données admin** | Via RPC functions | Accès admin vérifié server-side |

#### Exemple de Politique Renforcée (WITH CHECK)
```sql
-- Empêche le changement de propriétaire des données
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### 4.4 Sécurisation des Fonctions Admin

Toutes les fonctions administratives utilisent le pattern SECURITY DEFINER avec vérification explicite :

```sql
CREATE OR REPLACE FUNCTION admin_get_users()
RETURNS TABLE(...) AS $$
BEGIN
    -- Vérification obligatoire
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Accès refusé: droits admin requis';
    END IF;
    
    -- Logique métier
    RETURN QUERY SELECT ...;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### 4.5 Validation des Entrées

#### Côté Client (Zod)
```typescript
const signalSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  people_count: z.number().int().min(1).max(10),
  destination: z.string().trim().max(200).optional(),
});
```

#### Côté Serveur (PostgreSQL)
```sql
CREATE OR REPLACE FUNCTION create_client_signal(
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION,
    p_people_count INTEGER,
    p_destination TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_signal_id UUID;
BEGIN
    -- Validation coordonnées (région Douala)
    IF p_latitude < 3.8 OR p_latitude > 4.2 
       OR p_longitude < 9.5 OR p_longitude > 10.0 THEN
        RAISE EXCEPTION 'Coordonnées hors zone de service';
    END IF;
    
    -- Validation groupe
    IF p_people_count < 1 OR p_people_count > 10 THEN
        RAISE EXCEPTION 'Nombre de passagers invalide (1-10)';
    END IF;
    
    -- Rate limiting
    IF EXISTS (
        SELECT 1 FROM client_signals 
        WHERE user_id = auth.uid() 
        AND created_at > NOW() - INTERVAL '1 minute'
    ) THEN
        RAISE EXCEPTION 'Veuillez patienter avant de créer un nouveau signal';
    END IF;
    
    -- Insertion
    INSERT INTO client_signals (user_id, latitude, longitude, people_count, destination)
    VALUES (auth.uid(), p_latitude, p_longitude, p_people_count, p_destination)
    RETURNING id INTO v_signal_id;
    
    RETURN v_signal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.6 Sécurisation des API Keys

#### Token Mapbox (Edge Function)
```typescript
// supabase/functions/get-mapbox-token/index.ts
Deno.serve(async (req) => {
  // Vérification JWT obligatoire
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  
  const { data, error } = await supabase.auth.getClaims(
    authHeader.replace('Bearer ', '')
  );
  
  if (error || !data?.claims) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
  }
  
  // Token valide - retourner le secret Mapbox
  return new Response(
    JSON.stringify({ token: Deno.env.get('MAPBOX_ACCESS_TOKEN') }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

### 4.7 Audit Trail

#### Table d'Audit des Courses
```sql
CREATE TABLE ride_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID REFERENCES trips(id) NOT NULL,
    driver_id UUID NOT NULL,
    action_type TEXT NOT NULL, -- 'ARRIVED', 'TIMER_START', 'MOVED_AWAY', etc.
    driver_lat DOUBLE PRECISION,
    driver_lng DOUBLE PRECISION,
    client_lat DOUBLE PRECISION,
    client_lng DOUBLE PRECISION,
    distance_meters INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.8 Protection Wallet

```sql
-- Interdiction de création directe de wallet
CREATE POLICY "Deny direct wallet creation" 
ON public.wallets 
FOR INSERT 
WITH CHECK (false);

-- Création uniquement par trigger système
CREATE OR REPLACE FUNCTION create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.wallets (user_id, balance)
    VALUES (NEW.id, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.9 Recommandations Sécurité Additionnelles

#### Court Terme (3 mois)
- [ ] Implémenter 2FA pour les comptes admin et chauffeurs
- [ ] Ajouter logging centralisé des actions sensibles
- [ ] Configurer alertes sur tentatives de fraude
- [ ] Audit de sécurité externe

#### Moyen Terme (6 mois)
- [ ] Chiffrement end-to-end pour le chat
- [ ] Signature cryptographique des transactions wallet
- [ ] Détection d'anomalies par ML (fraude)
- [ ] Compliance RGPD renforcée

#### Long Terme (12 mois)
- [ ] Certification PCI-DSS pour paiements
- [ ] SOC 2 Type II
- [ ] Bug bounty program
- [ ] Pen testing trimestriel

---

## 5. FEUILLE DE ROUTE

### 5.1 Fonctionnalités Futures - Phase 2 (Q2-Q3 2026)

#### 🚗 Transport
| Fonctionnalité | Priorité | Complexité | Description |
|----------------|----------|------------|-------------|
| Covoiturage longue distance | Haute | Moyenne | Intercity (Douala-Yaoundé) |
| Livraison colis | Haute | Haute | Intégration moto-coursiers |
| Location véhicule | Moyenne | Haute | Self-drive avec assurance |
| Navettes aéroport | Moyenne | Faible | Shuttle partagé |

#### 💰 Paiements
| Fonctionnalité | Priorité | Complexité | Description |
|----------------|----------|------------|-------------|
| Paiement NFC | Haute | Haute | Carte sans contact |
| Abonnement transport | Haute | Moyenne | Pass mensuel/annuel |
| Crédit transport employeur | Moyenne | Moyenne | B2B corporate |
| Micro-crédit trajet | Basse | Haute | BNPL transport |

#### 🤖 Intelligence Artificielle
| Fonctionnalité | Priorité | Complexité | Description |
|----------------|----------|------------|-------------|
| Chatbot support | Haute | Moyenne | Assistance 24/7 |
| Prédiction retard bus | Haute | Haute | ML temps réel |
| Optimisation itinéraire | Moyenne | Haute | Multi-modal |
| Détection fraude | Haute | Haute | Anomaly detection |

#### 📱 Expérience Utilisateur
| Fonctionnalité | Priorité | Complexité | Description |
|----------------|----------|------------|-------------|
| Mode hors-ligne | Haute | Haute | Cache local |
| Widget home screen | Moyenne | Faible | Quick actions |
| Accessibilité PMR | Haute | Moyenne | Véhicules adaptés |
| Multi-langue | Moyenne | Faible | EN, Pidgin |

### 5.2 Phase 3 - Expansion (Q4 2026+)

#### Infrastructure IoT
- Boîtiers LED toit taxi (affichage destination)
- Capteurs occupation sièges
- Smart Stops avec écrans
- Bornes de recharge véhicules électriques

#### Partenariats
- Intégration SOCATUR/STECY
- API ouverte pour opérateurs tiers
- Programme corporate (grandes entreprises)
- Assurance voyage intégrée

#### Régulation
- Agrément ministère transports
- Licence fintech mobile money
- Certification véhicules

---

## 6. ANNEXES TECHNIQUES

### 6.1 Variables d'Environnement

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `VITE_SUPABASE_URL` | URL du projet Supabase | ✅ |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clé publique Supabase | ✅ |
| `MAPBOX_ACCESS_TOKEN` | Token Mapbox (secret) | ✅ |
| `MTN_MOMO_API_KEY` | Clé API MTN MoMo (secret) | 🔜 |
| `ORANGE_MONEY_API_KEY` | Clé API Orange Money (secret) | 🔜 |

### 6.2 Endpoints API

#### Edge Functions
| Endpoint | Méthode | Auth | Description |
|----------|---------|------|-------------|
| `/functions/v1/get-mapbox-token` | GET | JWT | Récupère token Mapbox |
| `/functions/v1/ai-traffic-intelligence` | POST | JWT | Prédictions trafic IA |

#### RPC Functions (principales)
| Fonction | Description |
|----------|-------------|
| `create_client_signal` | Crée un signal de demande |
| `is_admin` | Vérifie statut admin |
| `has_role` | Vérifie possession d'un rôle |
| `get_fleet_owner_id` | Récupère ID propriétaire flotte |
| `owns_fleet_vehicle` | Vérifie propriété véhicule |
| `admin_get_*` | Fonctions admin (users, vehicles, etc.) |

### 6.3 Schéma de Navigation

```
/                     → Index (Carte principale)
/auth                 → Authentification
/onboarding           → Guide première utilisation
/signal               → Siffler un taxi
/book                 → Réservation siège
/shared-comfort       → Confort partagé
/schedule             → Programmer trajet
/trip                 → Trajet en cours
/bus                  → Mode bus
/wallet               → Portefeuille
/rewards              → Récompenses
/history              → Historique trajets
/reservations         → Mes réservations
/notifications        → Notifications
/notifications/settings → Paramètres notifications
/profil               → Mon profil
/assistance           → Aide
/about                → À propos
/become-driver        → Devenir chauffeur

/driver               → Dashboard chauffeur V2
/driver/cockpit       → Cockpit chauffeur
/driver/classic       → Mode taxi classique
/driver/dashboard     → Dashboard V1
/driver/planning      → Planning
/driver/reports       → Rapports
/driver/analytics     → Analytics

/admin                → Dashboard admin
```

### 6.4 Conventions de Code

#### Nomenclature
- **Components** : PascalCase (`RideRequestCard`)
- **Hooks** : camelCase avec `use` (`useDriverMode`)
- **Pages** : PascalCase (`DriverDashboard`)
- **Utilitaires** : camelCase (`formatCurrency`)

#### Structure Fichiers
```
src/
├── components/
│   ├── [module]/           # Composants par module
│   │   ├── Component.tsx
│   │   └── index.ts        # Export barrel
│   └── ui/                 # Composants UI shadcn
├── hooks/
│   └── use[Feature].tsx    # Custom hooks
├── pages/
│   └── [Page].tsx          # Pages routées
├── lib/
│   └── utils.ts            # Utilitaires
└── integrations/
    └── supabase/           # Client Supabase (auto-généré)
```

---

## SIGNATURES

| Rôle | Nom | Date | Signature |
|------|-----|------|-----------|
| Product Owner | _____________ | ___/___/2026 | _____________ |
| Tech Lead | _____________ | ___/___/2026 | _____________ |
| Security Officer | _____________ | ___/___/2026 | _____________ |
| QA Lead | _____________ | ___/___/2026 | _____________ |

---

*Document généré automatiquement - LOKEBO DRIVE v2.0*
