# 🍽️ FoodShare App — Complete Project Blueprint

> A mobile platform connecting food donors (events, caterers, households) with receivers (NGOs, community kitchens, individuals) via volunteer couriers — reducing food waste and feeding people in need.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Solution](#3-solution)
4. [Target Users](#4-target-users)
5. [User Personas](#5-user-personas)
6. [Core Features — MVP](#6-core-features--mvp)
7. [User Flows](#7-user-flows)
8. [App Screens List](#8-app-screens-list)
9. [Tech Stack](#9-tech-stack)
10. [System Architecture](#10-system-architecture)
11. [Database Schema](#11-database-schema)
12. [API Design](#12-api-design)
13. [Real-Time Features](#13-real-time-features)
14. [Notifications Design](#14-notifications-design)
15. [Food Safety & Legal](#15-food-safety--legal)
16. [UI/UX Guidelines](#16-uiux-guidelines)
17. [Build Roadmap — Step by Step](#17-build-roadmap--step-by-step)
18. [Prompts for Each Build Step](#18-prompts-for-each-build-step)
19. [Future Features (Post-MVP)](#19-future-features-post-mvp)
20. [Risks & Mitigations](#20-risks--mitigations)
21. [Success Metrics](#21-success-metrics)

---

## 1. Project Overview

| Field | Detail |
|---|---|
| **App Type** | Mobile (Android + iOS) |
| **Platform** | React Native (cross-platform) |
| **MVP Timeline** | ~12–16 weeks |
| **User Roles** | Donor, Receiver, Courier |
| **Core Purpose** | Connect excess food to people who need it, fast |
| **Key Problem Solved** | Food waste from events + hunger gap in communities |

---

## 2. Problem Statement

- **40%+** of food produced globally is wasted
- Events, weddings, corporate gatherings routinely discard hundreds of meals
- NGOs and community kitchens lack real-time supply visibility
- No reliable, fast, mobile-first platform exists in India to bridge this gap
- Existing solutions (OLIO, Too Good To Go) are Western-market focused and don't cover the NGO/courier layer

---

## 3. Solution

A three-sided mobile marketplace:

```
DONOR (has excess food)
    ↓  posts listing
PLATFORM (matches, notifies, tracks)
    ↓  alerts nearby
RECEIVER / COURIER (claims + picks up + delivers)
    ↓
NEEDY PERSON / NGO
```

The app handles discovery, coordination, real-time tracking, and trust — so food moves in under 2 hours.

---

## 4. Target Users

### Primary Markets
- **Tier 1 & Tier 2 Indian cities** — Pune, Mumbai, Bengaluru, Delhi, Hyderabad
- **Event density** — wedding season (Oct–Feb), corporate events, college fests

### User Segments

| Segment | Who They Are |
|---|---|
| Individual Donors | Home cooks, households, party hosts |
| Event/Catering Donors | Caterers, event managers, wedding planners, hotels |
| NGO Receivers | Registered NGOs, orphanages, old-age homes, shelters |
| Individual Receivers | Volunteers, social workers picking food for distribution |
| Couriers | Gig-economy freelancers, social volunteers with vehicles |

---

## 5. User Personas

### 🍽️ Persona 1 — Donor: Ramesh, Event Caterer
- Age: 42, runs a catering business in Pune
- Pain: 20–30% food always left over at events, feels guilty discarding
- Goal: Quick, hassle-free way to give food away, get a receipt for goodwill
- Behaviour: Busy, mobile-first, needs listing to take under 2 minutes

### 🤝 Persona 2 — Receiver: Priya, NGO Coordinator
- Age: 31, manages food distribution for a Pune NGO
- Pain: Never knows when and where excess food will be available
- Goal: Reliable daily food supply for 50–100 people she serves
- Behaviour: Checks app morning/evening, needs advance notice when possible

### 🚗 Persona 3 — Courier: Aditya, Freelance Delivery Guy
- Age: 24, does Swiggy deliveries, wants side income + social impact
- Pain: Wants meaningful work between shifts
- Goal: Accept pickup jobs nearby, earn points/rewards, help community
- Behaviour: Highly mobile, needs fast job acceptance UI

---

## 6. Core Features — MVP

### Donor Features
- [ ] Register with name, phone, type (individual / caterer / NGO)
- [ ] Post food listing:
  - Food name & description
  - Quantity (servings estimate)
  - Food type (veg / non-veg / both)
  - Photo upload
  - Pickup location (map pin or address)
  - Pickup window (start time → deadline)
  - Special notes (allergens, packaging, etc.)
- [ ] View active listings posted
- [ ] Real-time status updates (claimed / picked up / delivered)
- [ ] Mark food as picked up (confirmation)
- [ ] Receive impact report ("You fed 40 people this month!")
- [ ] Rate the receiver/courier after pickup

### Receiver Features
- [ ] Register with type (individual / NGO) + optional NGO verification docs
- [ ] Browse map of nearby active food listings
- [ ] Filter listings by:
  - Distance (1km / 5km / 10km)
  - Food type (veg/non-veg)
  - Quantity (small / medium / large)
  - Time left to claim
- [ ] View listing detail (photo, description, donor info, map)
- [ ] Claim a listing (reserve it)
- [ ] Chat with donor in-app
- [ ] Request courier pickup (if can't pick up self)
- [ ] Mark food as collected
- [ ] Rate the donor

### Courier Features
- [ ] Register with name, phone, vehicle type (bike / car / auto)
- [ ] See courier job board — nearby unclaimed/undelivered listings
- [ ] Filter by distance and vehicle type needed
- [ ] Accept a courier job
- [ ] See pickup address + navigate via maps
- [ ] See delivery address + navigate
- [ ] Mark as picked up
- [ ] Mark as delivered
- [ ] View completed job history
- [ ] Earn impact points per delivery

### Common Features
- [ ] Phone number OTP login (no password needed)
- [ ] Role selection on onboarding
- [ ] Push notifications (new listing, claimed, pickup reminder)
- [ ] In-app chat (donor ↔ receiver, donor ↔ courier)
- [ ] Food safety disclaimer + acknowledgement before claiming
- [ ] Ratings & reviews system
- [ ] Profile page with impact stats

---

## 7. User Flows

### 7.1 Donor Flow

```
App Open
  → Splash / Onboarding (first time)
  → OTP Login
  → Role Selection: DONOR
  → Home Screen (my active listings)
  → Tap "+" → Post Food
      → Enter food details
      → Upload photo
      → Set location (map)
      → Set pickup window
      → Review & Confirm
      → Listing goes LIVE
  → Notification: "Your listing was claimed by [Name]"
  → Chat with receiver if needed
  → Receiver arrives → Donor taps "Confirm Pickup"
  → Listing marked COMPLETED
  → Impact stat updated
  → Rate receiver/courier
```

### 7.2 Receiver Flow

```
App Open
  → OTP Login
  → Role Selection: RECEIVER
  → Home Screen = MAP with food pins nearby
  → Browse listings
  → Tap a pin → Listing Detail
      → See photo, food info, quantity, time left, donor rating
      → Tap "Claim This Food"
      → Food safety disclaimer → Accept
      → Listing reserved for you (30 min to arrive)
  → Chat with donor if needed
  → Navigate to pickup location
  → Pick up food → Tap "Collected"
  → Rate donor
```

### 7.3 Courier Flow

```
App Open
  → OTP Login
  → Role Selection: COURIER
  → Home Screen = JOB BOARD (list of pending deliveries nearby)
  → Browse jobs (pickup location, distance, food type, time urgency)
  → Tap a job → Job Detail
      → See donor address, receiver/NGO address, food description
      → Tap "Accept Job"
  → Navigate to donor location
  → Pick up food → Tap "Picked Up"
  → Navigate to receiver/NGO location
  → Drop food → Tap "Delivered"
  → Job complete → Impact points added
  → Rate donor + receiver
```

### 7.4 Listing Lifecycle (State Machine)

```
DRAFT → LIVE → CLAIMED → PICKED_UP → DELIVERED → COMPLETED
                       ↘ EXPIRED (if not claimed before deadline)
                                  ↘ CANCELLED (donor cancels)
```

---

## 8. App Screens List

### Onboarding
1. Splash Screen
2. Welcome / Value Prop Screen (3 slides)
3. Phone Number Entry
4. OTP Verification
5. Role Selection (Donor / Receiver / Courier)
6. Profile Setup

### Donor Screens
7. Donor Home (my listings dashboard)
8. Post Food — Step 1 (details)
9. Post Food — Step 2 (location + time)
10. Post Food — Step 3 (preview + confirm)
11. Listing Detail (own listing with status)
12. Impact Dashboard

### Receiver Screens
13. Receiver Home (map with food pins)
14. Listing Detail (food card with claim button)
15. Food Safety Disclaimer Modal
16. Active Claim Screen (countdown + chat + navigate)
17. Receiver History

### Courier Screens
18. Courier Home (job board list)
19. Job Detail Screen
20. Active Job Screen (pickup → deliver steps)
21. Courier History + Points

### Common Screens
22. In-App Chat Screen
23. Notifications List
24. Profile Screen
25. Settings Screen
26. Rating/Review Modal
27. Filter/Search Screen

---

## 9. Tech Stack

### Frontend
| Layer | Technology | Reason |
|---|---|---|
| Framework | React Native (Expo) | Single codebase for Android + iOS |
| Navigation | React Navigation v6 | Industry standard, smooth UX |
| State Management | Zustand | Lightweight, simple |
| Maps | react-native-maps + Google Maps SDK | Best map experience |
| UI Components | NativeWind (Tailwind for RN) | Fast styling |
| Chat UI | react-native-gifted-chat | Battle-tested chat UI |
| Image Upload | Expo ImagePicker + Cloudinary | Easy + scalable |
| Push Notifications | Expo Notifications + FCM | Cross-platform push |

### Backend
| Layer | Technology | Reason |
|---|---|---|
| Runtime | Node.js | JS everywhere, large ecosystem |
| Framework | Express.js | Lightweight REST API |
| Real-time | Socket.io | Chat + live status updates |
| Auth | Firebase Auth (OTP) | Phone OTP out of the box |
| ORM | Prisma | Type-safe DB queries |
| File Queue | Bull (Redis-based) | Background jobs (expiry, reminders) |

### Database & Storage
> ⚠️ **v1.1 Change**: Removed Firebase Firestore — chat is handled via PostgreSQL + Socket.io to avoid dual-system complexity and cost. One less service to manage.

| Layer | Technology | Reason |
|---|---|---|
| Primary DB | PostgreSQL | Relational data, location queries |
| Location Queries | PostGIS extension | Efficient "nearby" geo queries |
| Cache | Redis | Sessions, job queues, rate limiting |
| File Storage | Cloudinary | Food photos, profile pics |

### DevOps & Infrastructure
| Layer | Technology |
|---|---|
| Hosting | Railway.app or Render (backend) |
| DB Hosting | Supabase (PostgreSQL + PostGIS) |
| CDN | Cloudinary |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Maps API | Google Maps Platform |
| SMS/OTP | Firebase Auth or MSG91 |
| Monitoring | Sentry (errors) + LogRocket (sessions) |
| CI/CD | GitHub Actions |

---

## 10. System Architecture

```
┌─────────────────────────────────────────────────┐
│                  MOBILE APP                      │
│         React Native (Expo) — iOS + Android      │
└──────────────────┬──────────────────────────────┘
                   │ HTTPS / WebSocket
┌──────────────────▼──────────────────────────────┐
│               API GATEWAY / NGINX                │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│              EXPRESS.JS BACKEND                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Auth     │ │ Listings │ │ Courier Jobs     │ │
│  │ Service  │ │ Service  │ │ Service          │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Chat     │ │ Notif.   │ │ Ratings          │ │
│  │ Service  │ │ Service  │ │ Service          │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│                Socket.io Layer                   │
└───────┬──────────────┬──────────────────────────┘
        │              │
┌───────▼──────┐ ┌─────▼────────────────┐
│  PostgreSQL  │ │  Redis               │
│  + PostGIS   │ │  (cache + queues)    │
└──────────────┘ └──────────────────────┘
        │
┌───────▼──────────────────────────────────────────┐
│  External Services                               │
│  Firebase Auth │ FCM │ Cloudinary │ Google Maps  │
└──────────────────────────────────────────────────┘
```

---

## 11. Database Schema

### Users Table
> ⚠️ **v1.1 Change**: Removed single `role` column. Users now support multiple roles via `user_roles` junction table (e.g., a social worker can be both receiver + courier).

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone         VARCHAR(15) UNIQUE NOT NULL,
  name          VARCHAR(100),
  primary_role  VARCHAR(20) NOT NULL,           -- 'donor' | 'receiver' | 'courier' (default UI role)
  avatar_url    TEXT,
  org_name      TEXT,                           -- for NGOs/caterers
  org_type      TEXT,                           -- NGO / catering / individual
  verified      BOOLEAN DEFAULT false,
  is_admin      BOOLEAN DEFAULT false,           -- platform admin/moderator flag
  rating_avg    DECIMAL(2,1) DEFAULT 0,
  rating_count  INTEGER DEFAULT 0,
  impact_meals  INTEGER DEFAULT 0,
  impact_points INTEGER DEFAULT 0,              -- courier gamification points
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- Many-to-many user roles (one user can be donor + courier etc.)
CREATE TABLE user_roles (
  user_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  role      VARCHAR(20) NOT NULL,              -- 'donor' | 'receiver' | 'courier'
  PRIMARY KEY (user_id, role)
);
```

### Food Listings Table
> ⚠️ **v1.1 Change**: Added `requires_cold_chain` flag (India climate risk), `needs_courier` flag (receiver-requested pickup), and `is_scheduled` for pre-announced listings.

```sql
CREATE TABLE food_listings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id            UUID REFERENCES users(id),
  title               VARCHAR(200) NOT NULL,
  description         TEXT,
  food_type           VARCHAR(10) NOT NULL,       -- 'veg' | 'non_veg' | 'both'
  quantity_text       VARCHAR(100),               -- e.g. "approx 50 servings"
  quantity_num        INTEGER,                    -- estimated number of people it feeds
  photo_url           TEXT,
  location            GEOGRAPHY(POINT, 4326),     -- PostGIS point
  address_text        TEXT,
  pickup_start        TIMESTAMP NOT NULL,
  pickup_end          TIMESTAMP NOT NULL,         -- deadline
  status              VARCHAR(20) DEFAULT 'live', -- live|claimed|picked_up|delivered|expired|cancelled
  allergen_notes      TEXT,
  packaging_notes     TEXT,
  requires_cold_chain BOOLEAN DEFAULT false,      -- ⚠️ NEW: flag for refrigerated transport need
  needs_courier       BOOLEAN DEFAULT false,      -- receiver flagged they need courier pickup
  is_scheduled        BOOLEAN DEFAULT false,      -- pre-announced future listing
  flagged             BOOLEAN DEFAULT false,      -- admin moderation flag
  flag_reason         TEXT,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_listings_location ON food_listings USING GIST(location);
CREATE INDEX idx_listings_status ON food_listings(status);
CREATE INDEX idx_listings_pickup_end ON food_listings(pickup_end);
CREATE INDEX idx_listings_donor ON food_listings(donor_id);
```

### Claims Table
> ⚠️ **v1.1 Change**: Added `UNIQUE` constraint on `(listing_id)` where `status = 'active'` to prevent double-claiming race condition. Handle with `SELECT FOR UPDATE` in the claim API transaction.

```sql
CREATE TABLE claims (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    UUID REFERENCES food_listings(id),
  receiver_id   UUID REFERENCES users(id),
  claimed_at    TIMESTAMP DEFAULT NOW(),
  collected_at  TIMESTAMP,
  expires_at    TIMESTAMP,                        -- auto-release deadline (claimed_at + 30 min)
  status        VARCHAR(20) DEFAULT 'active'      -- 'active' | 'collected' | 'cancelled' | 'expired'
);

-- Enforce only ONE active claim per listing at a time
CREATE UNIQUE INDEX idx_one_active_claim_per_listing
  ON claims (listing_id)
  WHERE status = 'active';

-- API note: Use BEGIN; SELECT ... FOR UPDATE on food_listings WHERE id=? AND status='live';
-- before inserting into claims to prevent race conditions.
```

### Courier Jobs Table
```sql
CREATE TABLE courier_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      UUID REFERENCES food_listings(id),
  claim_id        UUID REFERENCES claims(id),
  courier_id      UUID REFERENCES users(id),
  accepted_at     TIMESTAMP,
  picked_up_at    TIMESTAMP,
  delivered_at    TIMESTAMP,
  status          ENUM('open','accepted','picked_up','delivered','cancelled') DEFAULT 'open',
  vehicle_type    ENUM('bike','car','auto','walk')
);
```

### Messages Table
```sql
CREATE TABLE messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    UUID REFERENCES food_listings(id),
  sender_id     UUID REFERENCES users(id),
  receiver_id   UUID REFERENCES users(id),
  content       TEXT NOT NULL,
  read          BOOLEAN DEFAULT false,
  created_at    TIMESTAMP DEFAULT NOW()
);
```

### Ratings Table
```sql
CREATE TABLE ratings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    UUID REFERENCES food_listings(id),
  rater_id      UUID REFERENCES users(id),
  rated_id      UUID REFERENCES users(id),
  score         INTEGER CHECK (score BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMP DEFAULT NOW()
);
```

### Notifications Table
```sql
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  type          VARCHAR(50),    -- new_listing, claimed, reminder, delivered
  title         TEXT,
  body          TEXT,
  data          JSONB,          -- extra payload (listing_id etc.)
  read          BOOLEAN DEFAULT false,
  sent_at       TIMESTAMP DEFAULT NOW()
);
```

---

## 12. API Design

### Auth Endpoints
```
POST   /api/auth/send-otp          → Send OTP to phone number
POST   /api/auth/verify-otp        → Verify OTP, return JWT token
POST   /api/auth/profile           → Complete profile setup
GET    /api/auth/me                → Get current user profile
PATCH  /api/auth/me                → Update profile
```

### Listings Endpoints
```
GET    /api/listings               → Get nearby listings (lat, lng, radius, filters)
POST   /api/listings               → Create new listing (donor only)
GET    /api/listings/:id           → Get single listing detail
PATCH  /api/listings/:id           → Update listing (donor only)
DELETE /api/listings/:id           → Cancel listing (donor only)
PATCH  /api/listings/:id/confirm-pickup  → Donor confirms pickup
GET    /api/listings/my            → Donor's own listings
```

### Claims Endpoints
```
POST   /api/listings/:id/claim     → Receiver claims a listing
DELETE /api/listings/:id/claim     → Receiver cancels claim
PATCH  /api/claims/:id/collected   → Receiver marks as collected
GET    /api/claims/my              → Receiver's claim history
```

### Courier Endpoints
```
GET    /api/courier/jobs           → Get available courier jobs nearby
POST   /api/courier/jobs/:id/accept → Courier accepts a job
PATCH  /api/courier/jobs/:id/picked-up  → Mark food as picked up from donor
PATCH  /api/courier/jobs/:id/delivered  → Mark food as delivered to receiver
GET    /api/courier/jobs/my        → Courier's job history
```

### Chat Endpoints
```
GET    /api/messages/:listingId    → Get chat history for a listing
POST   /api/messages/:listingId    → Send a message
PATCH  /api/messages/:listingId/read → Mark messages as read
```

### Ratings Endpoints
```
POST   /api/ratings                → Submit a rating
GET    /api/users/:id/ratings      → Get ratings for a user
```

### Notifications Endpoints
```
GET    /api/notifications          → Get user's notifications
PATCH  /api/notifications/:id/read → Mark as read
PATCH  /api/notifications/read-all → Mark all as read
POST   /api/notifications/token    → Register device FCM token
```

### Users Endpoints
```
GET    /api/users/:id              → Get public profile
GET    /api/users/:id/impact       → Get impact stats
```

---

## 13. Real-Time Features

### Socket.io Events

#### Client → Server
```javascript
// Join listing room (for updates)
socket.emit('join:listing', { listingId })

// Send chat message
socket.emit('message:send', { listingId, content, receiverId })

// Courier location update
socket.emit('courier:location', { jobId, lat, lng })
```

#### Server → Client
```javascript
// Listing status changed
socket.emit('listing:status', { listingId, status })

// New message received
socket.emit('message:new', { listingId, message })

// Courier location update (for donor/receiver to see)
socket.emit('courier:location', { jobId, lat, lng })

// New listing nearby (for receivers/couriers)
socket.emit('listing:new', { listing })
```

### Real-time Rooms Strategy
```
listing:{listingId}   → donor + receiver + courier on that listing
user:{userId}         → personal notifications channel
city:{cityCode}       → all users in a city (for new listing broadcasts)
```

---

## 14. Notifications Design

### Push Notification Triggers

| Trigger | Who Gets It | Message |
|---|---|---|
| New listing posted | Receivers + Couriers nearby | "🍽️ Food available 2km away — 40 servings of Dal Rice!" |
| Listing claimed | Donor | "✅ [Name] has claimed your food. They'll be there by 6PM." |
| Courier accepted job | Donor + Receiver | "🚗 A courier is on the way to pick up the food." |
| Courier picked up | Receiver | "📦 Food picked up! Delivery on the way." |
| Food delivered | Donor + Receiver | "🎉 Delivery complete! You helped feed 40 people." |
| 30 min before expiry | Donor + active Receivers | "⏰ Listing expires in 30 mins — still unclaimed!" |
| Listing expired | Donor | "😔 Your listing expired unclaimed. Try posting earlier next time." |
| New message in chat | Recipient | "💬 [Name]: Are you coming soon?" |

### Notification Implementation
```javascript
// FCM payload structure
{
  notification: {
    title: "Food available nearby!",
    body: "40 servings of Biryani — 1.5km from you"
  },
  data: {
    type: "new_listing",
    listingId: "uuid-here",
    screen: "ListingDetail"  // deep link target
  },
  token: "device_fcm_token"
}
```

---

## 15. Food Safety & Legal

### In-App Safety Measures
1. **Mandatory disclaimer** before claiming: user must tap "I Acknowledge" on food safety terms
2. **Time window enforcement**: listings auto-expire after pickup deadline
3. **Minimum claim window**: food must have at least 30 minutes left to be claimed
4. **Food type labelling**: veg/non-veg/both always shown prominently
5. **Allergen notes**: required field with option to specify common allergens
6. **Photo required**: helps receivers assess food quality visually

### Disclaimer Text (shown before first claim)
> *"By claiming this food, you acknowledge that FoodShare is a platform connecting donors and receivers. FoodShare does not inspect, prepare, or store food. The donor is solely responsible for food quality and safety. Claim only food that appears safe and has been properly stored. FoodShare is not liable for any illness or damage resulting from food consumed via this platform. Please use your judgment."*

### Legal Considerations (India)
- Register as a technology intermediary — not a food business
- Terms of Service must include liability waiver for food quality
- NGO partners should have FSSAI-registered kitchens
- Consider partnering with a food safety NGO for credibility
- FSSAI has a "Food Safety on Wheels" program — explore partnership
- Under Indian law (IT Act 2000), platform is intermediary — not liable for user content

---

## 16. UI/UX Guidelines

### Color Palette
```
Primary:     #2D6A4F  (deep green — fresh, trustworthy, nature)
Secondary:   #F4A261  (warm orange — food, warmth, energy)
Accent:      #E9C46A  (golden yellow — highlight, CTA)
Background:  #FAFAF8  (off-white — clean, fresh)
Surface:     #FFFFFF
Text Primary: #1A1A1A
Text Secondary: #6B7280
Error:        #DC2626
Success:      #16A34A
```

### Typography
```
Heading:  Inter Bold (32/28/24/20px)
Subhead:  Inter SemiBold (18/16px)
Body:     Inter Regular (16/14px)
Caption:  Inter Regular (12px)
```

### Key UX Principles
- **Speed over beauty for donors**: posting food must take < 90 seconds
- **Map-first for receivers**: always show food geographically, not just as a list
- **Urgency cues**: show time-remaining countdown prominently on all listing cards
- **Trust signals**: donor rating, number of successful donations shown on every card
- **One thumb rule**: all primary actions reachable without stretching thumb (bottom nav)
- **Offline tolerance**: cache last known listings on device, show stale indicator
- **Offline post queue for donors**: if connectivity drops mid-post (common at banquet halls), save draft locally and sync automatically when back online using Expo NetInfo + AsyncStorage retry queue

### Bottom Navigation (per role)
```
DONOR:    [Home/Listings] [Post Food] [Chat] [Profile]
RECEIVER: [Map] [Browse] [My Claims] [Profile]
COURIER:  [Jobs] [Active Job] [History] [Profile]
```

---

## 17. Build Roadmap — Step by Step

### Phase 1 — Foundation (Weeks 1–3)
- [ ] Project setup (Expo + Node.js monorepo)
- [ ] PostgreSQL + PostGIS setup on Supabase
- [ ] Prisma schema + migrations
- [ ] Firebase project setup (Auth + FCM)
- [ ] Cloudinary account + image upload utility
- [ ] OTP Auth flow (send + verify + JWT)
- [ ] User profile setup

### Phase 2 — Core Donor Flow (Weeks 4–6)
- [ ] Post food listing (all fields + photo upload)
- [ ] Listing stored in DB with location
- [ ] Donor home screen (my listings)
- [ ] Listing detail screen
- [ ] Listing status management
- [ ] Donor confirms pickup

### Phase 3 — Core Receiver Flow (Weeks 6–8)
- [ ] Map screen with PostGIS nearby query
- [ ] Listing pins on map
- [ ] Listing detail (receiver view)
- [ ] Claim listing flow + food safety modal
- [ ] Claim expires if not collected
- [ ] Receiver marks as collected

### Phase 4 — Courier Flow (Weeks 8–10)
- [ ] Courier job board (unclaimed/undelivered nearby)
- [ ] Accept job
- [ ] Pickup → Deliver flow with status updates
- [ ] Real-time status broadcast via Socket.io

### Phase 5 — Chat + Notifications (Weeks 10–12)
- [ ] Socket.io chat between donor ↔ receiver
- [ ] FCM push notifications (all triggers)
- [ ] In-app notification list
- [ ] Deep linking from notifications to screens

### Phase 6 — Polish (Weeks 12–15)
- [ ] Ratings & reviews
- [ ] Impact dashboard (donor + receiver + courier views)
- [ ] Listing auto-expiry (Bull job queue)
- [ ] 30-min reminder notifications
- [ ] Filters on map/list view
- [ ] Error handling + loading states
- [ ] Offline post queue (Expo NetInfo + AsyncStorage draft sync)
- [ ] Admin moderation panel (flag listings, ban users, review reports)
- [ ] User reporting flow ("Report this listing" in-app)
- [ ] Courier points redemption UI (view points, milestone badges)

### Phase 7 — Testing & Launch (Weeks 14–16)
- [ ] End-to-end testing all 3 user flows
- [ ] Performance testing (PostGIS queries at scale)
- [ ] Beta testing with 10 donors + 3 NGOs in one city
- [ ] Play Store + App Store submission
- [ ] Monitoring setup (Sentry + LogRocket)

---

## 18. Prompts for Each Build Step

### Step 2 — UI Mockups
> "Create high-quality mobile UI mockups for a food sharing app. 3 user types: Donor, Receiver, Courier. Screens: Onboarding/role selection, Home/map view with nearby food listings, Post food listing form, Listing detail page, Claim & pickup flow, Courier job board, In-app chat, Impact dashboard. Mobile-first, warm & trustworthy color palette (deep green + warm orange), modern clean design."

### Step 3 — Prototype
> "Build a working React prototype for a food sharing mobile app. Include: role selection (Donor/Receiver/Courier), donor can post food listing with photo/location/time, receiver sees map with nearby listings and can claim one, courier sees job board and can accept deliveries. Use mock data. No backend needed. Make it fully interactive and navigable."

### Step 4 — Tech Stack
> "Recommend a full tech stack for a mobile food sharing app with 3 user roles (Donor, Receiver, Courier). Needs: real-time location/maps, push notifications, in-app chat, image uploads, OTP auth. Must scale to 50k users in India. Give stack for React Native frontend, Node.js backend, PostgreSQL + PostGIS database, Firebase for auth + FCM. Justify each choice."

### Step 5 — Backend Design
> "Design a complete REST API for a food sharing app. Entities: User (3 roles), FoodListing, Claim, CourierJob, Message, Rating, Notification. For each entity give: Prisma schema, all API endpoints (method + route + purpose), auth middleware rules (who can access what). Include Socket.io real-time events for chat and listing status updates."

### Step 6 — Build Core App
> "Build the core features of a food sharing mobile app using React Native (Expo) + Node.js + PostgreSQL + PostGIS. Implement: OTP phone login, role-based onboarding, donor posts food listing with photo + GPS location + expiry time, receiver browses map of nearby listings using PostGIS query, receiver claims a listing, listing status updates in real-time via Socket.io. Full code: frontend screens + backend routes + Prisma schema."

### Step 7 — Courier Layer
> "Add a courier/volunteer feature to an existing food sharing app (React Native + Node.js + PostgreSQL). Courier sees a job board of nearby pending deliveries. Can accept a job, navigate to donor address, pick up food (mark as picked up), navigate to receiver/NGO address, deliver food (mark as delivered). Status changes broadcast via Socket.io to donor and receiver. Full code: frontend screens + backend routes."

### Step 8 — Notifications + Chat
> "Add real-time push notifications and in-app chat to a food sharing app (React Native + Node.js + Firebase FCM + Socket.io). Notifications: new listing nearby, listing claimed, courier on the way, pickup reminder 30 min before expiry, delivery complete. Chat: donor ↔ receiver, donor ↔ courier, per listing context. Store messages in PostgreSQL. Full implementation code."

### Step 9 — Polish
> "Add final polish to a food sharing app: (1) Ratings — donor/receiver/courier rate each other after each listing (1–5 stars + comment, stored in DB, averaged on user profile). (2) Impact Dashboard — total meals shared, estimated people fed, CO2 saved, personal timeline of activity. (3) Food safety — mandatory modal acknowledgement before first claim, auto-expire listings past deadline using Bull queue job. Full code."

---

## 19. Future Features (Post-MVP)

| Feature | Description |
|---|---|
| **Advance Scheduling** | Caterers register upcoming events in advance so NGOs can plan |
| **Recurring Donors** | Restaurant chains set up recurring daily surplus alerts |
| **NGO Verification Badge** | Verified badge for registered NGOs with FSSAI compliance |
| **Tax Receipt / Donation Certificate** | Auto-generate PDF donation receipt for corporate donors — critical for CSR reporting |
| **Food Quality AI** | Photo-based AI check to flag questionable food before listing |
| **Route Optimization** | Courier picks up from multiple donors and delivers to one NGO |
| **Community Feed** | Social feed showing impact stories, photos, milestones |
| **Corporate Partnerships** | Companies book app for their event catering surplus |
| **Analytics Dashboard** | Admin panel for city-level food waste + donation stats |
| **Multi-language** | Hindi, Marathi, Kannada, Tamil support — even Hindi alone expands Tier 2 reach significantly |
| **Gamification** | Leaderboards, badges, streaks for couriers and donors |
| **WhatsApp Notifications** | WhatsApp Business API fallback — open rates far exceed FCM push in India |
| **Courier Points Redemption** | Partner with local brands (coffee shops, fuel stations) for points-to-reward exchange |
| **Listing Quality Score** | Auto-score listings by completeness (photo + allergens + packaging) to surface best listings first |

---

## 20. Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Food safety incident | 🔴 High | Strong disclaimer, auto-expiry, photo requirement, time windows |
| Cold start (no listings = no receivers) | 🔴 High | Partner with 5+ caterers + 3 NGOs before launch day |
| Listing claimed but not picked up | 🟡 Medium | Auto-release claim after 30 min, notify next receiver |
| Donor posts and no one claims | 🟡 Medium | Proactive push to all nearby receivers when listing posted |
| No couriers available | 🟡 Medium | Allow receiver to self-pickup always; courier is optional |
| Abuse (fake listings, spam) | 🟡 Medium | Phone OTP verification, community reporting, moderation |
| App crashes during pickup | 🟠 Low | Donor phone number shown on claim confirmation screen |
| Scalability under event spike | 🟠 Low | PostGIS indexed queries, Redis caching, horizontal scaling |

---

## 21. Success Metrics

### North Star Metric
> **Meals facilitated per week** — total number of estimated servings successfully collected by receivers

### Supporting Metrics
| Metric | Target (Month 3) | Target (Month 6) |
|---|---|---|
| Active donors | 50 | 200 |
| Active NGO/receivers | 20 | 80 |
| Active couriers | 15 | 60 |
| Listings posted/week | 30 | 150 |
| Listing claim rate | 70% | 85% |
| Meals facilitated/week | 500 | 3000 |
| Avg. time to claim | < 20 min | < 10 min |
| App rating (store) | 4.2+ | 4.5+ |

---

*Document last updated: May 2026 | Version: 1.0*
*This is a living document — update after each build phase completes.*
