# Smart Food Redistribution Platform (NourishRoute)

A responsive 24-hour hackathon web application connecting 15 hyper-local food providers (9 bakeries, 4 small restaurants, 2 hostel messes within 1.5 km of a college campus) with a central NGO (3 km away) that feeds 80 people nightly. The platform batches micro-donations (5–15 meals each) into single, capacity-aware, food-safety-prioritized multi-stop pickup routes that make collection economically viable and track verified community impact.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following design decisions directly reflect the requirements and hackathon constraints:

- **Persona Authentication Flow**: Separate simulated login portal allowing seamless switching between any of the 15 Food Providers, the NGO Logistics Coordinator, or the Autonomous Route Dispatcher.
- **Batching & Route Optimization Strategy**: Hybrid greedy algorithm prioritizing strictest food-safety expiry deadlines first, followed by nearest-neighbor distance minimization to pack the NGO van up to capacity (e.g. 80–85 meals).
- **Visual Aesthetic & Theme**: Clean modern logistics dashboard with emerald sustainability accents, high-density data tables, tabular numerals (`tabular-nums`), interactive SVG route manifests, and zero decorative AI-slop pills.

---

## 1. Overview & Core Concept

### What It Does
- **Food Providers**: Fast 30-second surplus confirmation (dish name, meal count 5–15, food category, safety expiry timer), real-time batching status, driver ETA countdown, and verified impact badges.
- **Receiving NGO**: One-click route acceptance when an aggregated batch nears the 80-meal nightly target, interactive turn-by-turn stop manifest with provider OTP verification, and live quota progress bar.
- **Dispatcher & Algorithmic Simulator**: Visual map of the 1.5 km college zone showing all 15 provider nodes, live cluster formation, vehicle capacity utilization, and step-by-step route optimization logs for hackathon evaluation.

### Target Personas
1. **Donor Manager (Bakery / Mess Manager)**: Closes at 9:30 PM; needs to log 5–15 surplus meals in seconds and receive prompt, verified pickup.
2. **NGO Logistics Coordinator**: Manages an 80-meal capacity van; cannot afford individual 8-meal trips; needs an automated batch of $\ge 40\text{–}80$ meals with predictable safety windows.
3. **Hackathon Judge / Viewer**: Wants to test the batching algorithm live with mock data, adjust vehicle capacity or expiry deadlines, and verify real-time state transitions.

---

## 2. User Experience & Visual Design

### Page & View Hierarchy

```
[Persona Selector / Landing Gateway]
    ├── Provider Persona ──> [Provider Portal]
    │                             ├── View 1: Quick Surplus Confirmation (Form)
    │                             ├── View 2: Active Pickup & OTP Handover
    │                             └── View 3: Verified Impact & History Ledger
    │
    ├── NGO Persona ───────> [NGO Operations Dashboard]
    │                             ├── View 1: Route Batches & 1-Click Acceptance
    │                             ├── View 2: Turn-by-Turn Manifest & OTP Verification
    │                             └── View 3: Nightly Quota Fill (e.g. 74/80 meals)
    │
    └── Dispatcher / Judge ─> [Algorithmic Route Playground]
                                  ├── View 1: Interactive Campus Map (15 Provider Pins)
                                  ├── View 2: Step-by-Step Batching Engine Runner
                                  └── View 3: Scenario Presets & 1-Click Reset
```

### Visual Identity & Theme
- **Layout**: Utilitarian, crisp operations dashboard following the SaaS / Logistics design constitution.
- **Color Discipline (60-30-10 Rule)**:
  - Canvas (60%): Crisp white (`#FFFFFF`) with cool neutral slate surfaces (`#F8FAFC`, `#F1F5F9`).
  - Structural Surfaces & Type (30%): Deep charcoal text (`#0F172A`), hairline dividers (`#E2E8F0`), muted labels (`#64748B`).
  - Accent Budget (10%): Vivid Emerald (`#059669` / `#10B981`) for sustainability milestones and primary actions; Amber (`#D97706`) strictly for food-safety expiry countdowns.
- **Typography**: Clean display sans with tabular figures (`font-mono tabular-nums`) for meal counts, ETAs, timestamps, and coordinates. Zero decorative pulsing dots or unboxed pill capsules.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Seeded In-Memory State with LocalStorage Persistence**
  - *Chosen Approach*: Pre-seed all 15 realistic food providers (9 bakeries, 4 restaurants, 2 hostel messes with realistic campus coordinates), 1 central NGO, and 6 active surplus donations into a reactive store backed by `localStorage`.
  - *Why*: Instant, zero-friction testing for hackathon judges with a prominent "Reset Demo Data" button.
- **Decision 2: Transparent Algorithmic Execution Panel**
  - *Chosen Approach*: Expose the greedy optimization step-by-step in plain English directly in the UI (e.g., "Step 1: Identified urgent 2-hour cooked meal at Mess A -> Step 2: Clustered nearby Bakery 3 & 4 -> Vehicle filled to 76/85 meals -> Formed route").
  - *Why*: Highlights the core problem-solving logic to judges without burying it in background code.

---

## 4. Technical Architecture & System Specifications

### System Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Role Switcher Bar / Gateway                     │
│         [Provider Portal]   ·   [NGO Operations]   ·   [Route Engine]  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌────────────────────┐
│   Provider Views     │  │      NGO Views       │  │ Dispatch Simulator │
│ - Surplus Log Form   │  │ - Route Approval     │  │ - 1.5 km Campus Map│
│ - Live Pickup OTP    │  │ - Stop Manifest Check│  │ - Hybrid Algorithm │
│ - Verified Impact    │  │ - 80-Meal Quota Bar  │  │ - Scenario Presets │
└──────────┬───────────┘  └──────────┬───────────┘  └─────────┬──────────┘
           │                         │                        │
           └─────────────────────────┼────────────────────────┘
                                     ▼
                ┌────────────────────────────────────────┐
                │        Reactive State Store            │
                │  - 15 Providers & 1 NGO Depot          │
                │  - Active & Batched Food Donations     │
                │  - Multi-Stop Collection Routes        │
                │  - Verified Impact Ledger              │
                └────────────────────────────────────────┘
```

---

### (1) Complete Data Model

```typescript
// 1. PROVIDER ENTITY (15 venues within 1.5 km of college)
export interface Provider {
  id: string;
  name: string;
  type: 'bakery' | 'restaurant' | 'hostel_mess';
  contactPerson: string;
  phone: string;
  address: string;
  coordinates: { lat: number; lng: number }; // Relative to campus center (0,0)
  distanceKmFromCollege: number;            // 0.2 km - 1.5 km
  avgNightlySurplusMeals: number;           // 5 - 15 meals
  closingTime: string;                      // e.g. "21:30"
}

// 2. NGO ENTITY (Feeding station 3.0 km away)
export interface NGO {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  coordinates: { lat: number; lng: number }; // ~3.0 km from college
  nightlyQuotaMeals: number;                 // 80 meals
  currentMealsReceivedTonight: number;
  vehicle: {
    type: string;                            // e.g. "Cargo Electric Van"
    capacityMeals: number;                  // 80 - 90 meals max
    driverName: string;
    driverPhone: string;
  };
}

// 3. FOOD DONATION ENTITY
export type FoodSafetyTier = 'hot_cooked' | 'baked_goods' | 'packaged_chilled';

export type DonationStatus = 
  | 'AVAILABLE'       // Confirmed by provider; awaiting batch grouping
  | 'BATCHED'         // Bundled into an optimized collection route
  | 'ACCEPTED_BY_NGO' // NGO approved route; van dispatched
  | 'IN_TRANSIT'      // Picked up from provider; OTP verified
  | 'DELIVERED'       // Reached NGO shelter; meal served
  | 'EXPIRED'         // Safety window elapsed before pickup
  | 'CANCELLED';

export interface FoodDonation {
  id: string;
  providerId: string;
  providerName: string;
  providerType: Provider['type'];
  foodTitle: string;                        // e.g. "Sourdough & Dinner Rolls", "Steamed Rice & Dal"
  quantityMeals: number;                    // 5 - 15 meals
  safetyTier: FoodSafetyTier;
  preparedTime: string;                     // e.g. "20:00"
  expiryDeadline: string;                   // e.g. "22:30" (strict safety deadline)
  dietary: 'veg' | 'non-veg' | 'vegan';
  packaging: 'foil_boxes' | 'crates' | 'thermal_insulated';
  verificationOtp: string;                  // 4-digit handover code (e.g. "4821")
  status: DonationStatus;
  collectionId?: string;                    // Foreign key to Collection route
  createdAt: string;
}

// 4. COLLECTION (MULTI-STOP ROUTE BATCH) ENTITY
export type CollectionStatus = 
  | 'OFFERED_TO_NGO'  // Generated route waiting for NGO 1-click accept
  | 'DISPATCHED'      // NGO van started route
  | 'IN_PROGRESS'     // Actively collecting from stops
  | 'COMPLETED'       // All stops collected and delivered to NGO
  | 'CANCELLED';

export interface RouteStop {
  stopIndex: number;
  providerId: string;
  providerName: string;
  address: string;
  coordinates: { lat: number; lng: number };
  donationIds: string[];
  mealsToCollect: number;
  safetyTier: FoodSafetyTier;
  expiryDeadline: string;
  status: 'PENDING' | 'ARRIVED' | 'COLLECTED' | 'SKIPPED';
  completedAt?: string;
  enteredOtp?: string;
}

export interface Collection {
  id: string;
  ngoId: string;
  ngoName: string;
  driverName: string;
  status: CollectionStatus;
  stops: RouteStop[];
  totalMeals: number;                       // e.g. 74 meals
  vehicleCapacityMax: number;               // 85 meals
  totalDistanceKm: number;                  // e.g. 5.8 km roundtrip
  estimatedDurationMins: number;            // e.g. 42 mins
  earliestSafetyExpiry: string;             // Strictest stop deadline
  acceptedAt?: string;
  completedAt?: string;
  impactMetrics: {
    peopleFed: number;
    co2SavedKg: number;                     // 2.5 kg CO2 per meal saved
    mealsDiverted: number;
  };
}
```

---

### (2) Page List for Provider & NGO Interfaces

#### Provider Interface
- **Page P-1: Surplus Confirmation Form**: Clean 30-second form to confirm tonight's surplus. Provider selects/types item name, meals (5–15 slider), dietary category, packaging type, and safety tier. System computes safety expiry and generates a 4-digit pickup OTP.
- **Page P-2: Live Dispatch & Handover**: Shows current status of their donation (`Available` -> `Batched` -> `Van Dispatched` -> `Arrived`). Displays van ETA, driver contact, and the large 4-digit Handover OTP for driver verification.
- **Page P-3: Verified Impact & History**: Cumulative impact scoreboard (total meals donated, kg CO₂ prevented, clean waste diversion certificates, and timestamped donation log).

#### NGO Operations Interface
- **Page N-1: Incoming Route Batches**: Displays candidate multi-stop routes generated by the system. Shows total meals (e.g. 72 / 80 target), stop count (e.g. 5 stops), total route distance (5.4 km), and earliest safety deadline. 1-click **"Accept Route & Dispatch Van"** button.
- **Page N-2: Live Route Manifest & Turn-by-Turn Pickup**: Driver interactive interface listing sequential stops. At each stop, the driver clicks "Arrive", enters the provider's 4-digit OTP, confirms meal count, and advances to the next stop with remaining vehicle capacity updating live.
- **Page N-3: Nightly Quota & Receiving Ledger**: Visual gauge showing tonight's progress toward the 80-meal target (e.g. 74 / 80 meals fed). Breakdown of dietary types (vegetarian vs non-veg) and final delivery sign-off at the NGO base.

#### Dispatcher & Algorithmic Sandbox (Bonus Hackathon Demo View)
- **Page D-1: Live Campus Logistics Map**: Interactive 2D visualization showing the 1.5 km college radius with all 15 provider nodes and the 3.0 km NGO depot.
- **Page D-2: Batching Algorithm Console**: Real-time control to simulate new surplus entries, trigger the hybrid greedy solver, and view step-by-step algorithmic clustering decisions.

---

### (3) Donation Status Lifecycle

```
 ┌─────────────┐
 │  AVAILABLE  │ ──> Provider logs surplus (5–15 meals) with safety deadline
 └──────┬──────┘
        │
        ▼ (Batching Algorithm groups stops into viable route ≥ 40 meals)
 ┌─────────────┐
 │   BATCHED   │ ──> Locked into a proposed route respecting vehicle capacity
 └──────┬──────┘
        │
        ▼ (NGO accepts batch and dispatches van)
 ┌─────────────────┐
 │ ACCEPTED_BY_NGO │ ──> Van en route; providers notified with driver ETA
 └──────┬──────────┘
        │
        ▼ (Driver arrives at provider and enters 4-digit OTP)
 ┌─────────────┐
 │ IN_TRANSIT  │ ──> Food verified, custody transferred to van
 └──────┬──────┘
        │
        ▼ (All stops collected and unloaded at NGO shelter)
 ┌─────────────┐
 │  DELIVERED  │ ──> Quota fulfilled; impact metrics credited to providers
 └─────────────┘

 [Exception Transitions]:
 • AVAILABLE ──(Safety deadline passes before route forms)──> EXPIRED
 • BATCHED   ──(NGO declines or kitchen closes)─────────────> CANCELLED
```

---

### (4) The Batching Algorithm in Plain Steps

```
Algorithm: Hybrid Greedy Safety-First Capacity Router (HGS-Router)

INPUT:
  - UnbatchedDonations: List of all AVAILABLE surplus donations
  - NGODepot: NGO coordinates (3.0 km away)
  - VehicleCapacity: 85 meals
  - MaxStopsPerRoute: 6 stops (prevents food sitting in van too long)
  - ViabilityThreshold: 40 meals minimum (makes the 3 km van trip economically viable)
  - CurrentTime: e.g. 21:00

STEP 1: EXPIRY AUDIT & FILTER
  - For each donation, calculate RemainingMinutes = (expiryDeadline - CurrentTime).
  - If RemainingMinutes < 40 mins (insufficient time for van dispatch and transit),
    flag as URGENT_ALERT or omit to protect food safety.

STEP 2: ANCHOR SELECTION (SAFETY-FIRST)
  - Sort unbatched donations in ascending order of RemainingMinutes.
  - Pick the donation with the shortest safety window as the Route Anchor Stop.
  - Initialize Route = [AnchorStop].
  - CurrentMeals = AnchorStop.quantityMeals.
  - CurrentLocation = AnchorStop.coordinates.

STEP 3: GREEDY CLUSTERING & CAPACITY PACKING
  - WHILE CurrentMeals < VehicleCapacity AND Route.stops < MaxStopsPerRoute:
      a. Find all remaining unbatched donations where (CurrentMeals + donation.meals) <= VehicleCapacity.
      b. If no candidates fit, BREAK loop.
      c. For each fitting candidate, calculate composite Cost Score:
           Cost = (Distance(CurrentLocation, candidate) * 0.65) + 
                  ((MinutesToExpiry(candidate) / 60) * 0.35)
      d. Select the candidate with the lowest Cost Score.
      e. Add candidate to Route.
      f. CurrentMeals += candidate.quantityMeals.
      g. CurrentLocation = candidate.coordinates.

STEP 4: ROUTE ORDERING & SAFETY FEASIBILITY VALIDATION
  - Reorder stops from NGODepot -> Stop 1 -> Stop 2 -> ... -> Stop N -> NGODepot using
    Nearest-Neighbor TSP to minimize total driving kilometers.
  - Calculate cumulative ETA at each stop assuming 2.5 mins/km + 6 mins loading per stop.
  - VALIDATE: Ensure arrival ETA at each stop is strictly earlier than that stop's expiryDeadline.
    If a stop fails safety validation, revert to the safety-ordered sequence.

STEP 5: DISPATCH GATE
  - IF CurrentMeals >= ViabilityThreshold:
      - Finalize Collection batch with status = 'OFFERED_TO_NGO'.
      - Mark all included donations as 'BATCHED'.
      - Compute total savings: Fuel saved vs N individual trips = (N - 1) * 6.0 km.
  - ELSE:
      - Keep donations in pool awaiting additional evening kitchen closures.
```

---

## 5. Verification & Implementation Plan

1. **Phase 1: Mock State & Data Models (`src/data/mockData.ts`)**
   - Seed all 15 food providers with realistic names, coordinates, and types.
   - Seed NGO profile with 80-meal quota and vehicle capacity.
   - Initialize 6 active surplus donations and 1 active route batch.
2. **Phase 2: Hybrid Batching Algorithm Engine (`src/utils/batchingEngine.ts`)**
   - Implement the exact 5-step HGS-Router algorithm with detailed logging.
   - Add distance helper (Haversine formula scaled to campus grid).
3. **Phase 3: Core Application Views & Persona Switcher (`src/components/...`)**
   - Navigation header with Persona Gateway (Provider / NGO / Dispatcher).
   - Provider Surplus Submission Form & Live OTP Pickup Card.
   - NGO 1-Click Route Acceptance & Sequential Stop Manifest with OTP inputs.
   - Dispatcher Interactive 2D Campus Grid & Algorithmic Simulation Runner.
4. **Phase 4: Impact Ledger & Polish**
   - Real-time impact calculations (Meals rescued, CO₂ saved, Beneficiaries fed).
   - Tailwind styling, tabular numerals, and responsive design for 24-hour hackathon presentation.
