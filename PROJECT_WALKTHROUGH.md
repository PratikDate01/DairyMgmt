# Comprehensive Technical & Pedagogical Architecture Documentation
## Dairy & Medical Management System (Gauseva)

---

## 1. Project Overview

### What is this project?
The **Dairy & Medical Management System** (branded internally as **Gauseva**) is a full-stack web platform designed to streamline daily dairy operations, veterinary medicine supply chains, individual cattle management, AI-driven health diagnostics, veterinarian recommendation scoring, consultation requests, and automated veterinarian escalation. It acts as an integrated digital bridge linking **dairy farmers**, **dairy owners (milk collection centers)**, **veterinary medical providers**, **licensed veterinarians**, and **system administrators**.

### Why did we build it?
In traditional rural and semi-urban agricultural ecosystems, milk collection logging, fat-based payout calculations, veterinary medicine procurement, and livestock healthcare diagnostics are managed through manual paper registers or fragmented communication channels. This leads to operational friction:
- **Discrepancies in milk logs:** Manual entries often lead to mathematical errors in total quantity, fat-based rate calculations, and billing payouts.
- **Delayed Payouts:** Dairy owners lack structured ledger tools to calculate gross earnings, record partial payments, or settle pending dues against specific milk collections.
- **Inaccessible Veterinary Supplies:** Farmers struggle to find nearby stocked veterinary medicines or track urgent medical supply requests.
- **Delayed Livestock Diagnostics & Referral Barriers:** Cattle diseases (e.g., Lumpy Skin Disease, Mastitis, Foot & Mouth Disease) often go unnoticed. Farmers lack direct access to specialized veterinarians, and when a doctor is unavailable or declines a case, requests get stalled.
- **Security & Multi-Role Friction:** Traditional single-role accounts forced users with multiple real-world roles (e.g., a farmer who is also a veterinarian) to create separate email accounts.

### What real-world problem does it solve?
1. **Authoritative Milk Ledger:** Automated calculation of daily milk value based on fat percentage and per-liter rate with compound unique constraints preventing duplicate session logs.
2. **Transparent Financial Settlements:** Automated selection of unsettled milk collections with real-time payout calculations, partial payment handling, and protection against double settlement.
3. **Structured Veterinary Supply Chain:** Farmers can browse available veterinary inventory and place medicine orders. Medical providers manage stock levels, accept requests, deduct inventory atomically, and transition request states.
4. **Individual Cattle Profile Management:** Farmers maintain profile cards for each animal (Name/Tag, Breed, Gender, Age, Health Status, last screening date).
5. **AI Cattle Disease Diagnostics & Recommendation Engine:** Farmers analyze cattle photos with AI screening. The system ranks registered veterinarians using a 100-point suitability algorithm (Base +10, Expertise +40, Availability +30, Risk +20).
6. **Consultation Requests & Basic Automated Escalation:** Farmers send consultation requests to chosen veterinarians. If a veterinarian declines or does not respond within the configurable timeout (`VET_REQUEST_TIMEOUT_MINUTES`), the system automatically excludes attempted doctors, selects the next top-ranked eligible veterinarian, and reassigns the single `VetRequest` document while preserving complete escalation history.
7. **Single-Email Multi-Role Authentication:** Users can register multiple roles under a single email address (`roles: ['farmer', 'veterinarian']`) and seamlessly select their active working role (`activeRole`) during OTP login.

---

## 2. Problem Statement

Rural dairy operations and livestock healthcare management face six critical operational bottlenecks:
1. **Opaque Milk Accounting:** Milk collection entries (morning/evening shifts) lack centralized validation, allowing disputes over quantity and fat percentages.
2. **Complex Payout Tracking:** Unpaid collections accumulate over weeks; calculating accurate payout settlements without double-paying previously settled logs is error-prone.
3. **Stock Mismanagement in Animal Healthcare:** Veterinary clinics and medical providers lack real-time digital channels to showcase medicine availability to local farmers.
4. **Lack of Individual Cattle Tracking:** Health check histories and AI scan results are often unlinked to specific animals.
5. **Veterinarian Bottlenecks & Unhandled Declines:** When a farmer requests a doctor who happens to be unavailable, the request is permanently stranded unless manually re-created.
6. **Account Duplication Friction:** Multi-role community members had to register multiple email accounts to access different portal dashboards.

---

## 3. Project Objectives

1. **Digitalize Dairy Collections:** Enable dairy owners to record shift collections (morning/evening) for connected farmers with backend validation.
2. **Automate Financial Settlements:** Allow dairy owners to filter unpaid milk collections, generate settlement previews, record payment methods, and update ledger balances.
3. **Digitize Veterinary Inventory & Procurement:** Enable medical providers to list medicines with atomic inventory deduction upon acceptance and restoration upon cancellation.
4. **Cattle Profile Management:** Allow farmers to register and manage individual cattle records.
5. **Integrate AI Cattle Health Screening & Recommendation Engine:** Provide instant AI diagnostic screening for cattle diseases and rank suitable veterinarians with a normalized 100-point scoring model.
6. **Implement Automated Basic Veterinarian Escalation:** Automatically forward declined or timed-out consultation requests to the next suitable veterinarian using single-document history tracking without Redis or complex cron servers.
7. **Support Single-Email Multi-Role Authentication:** Allow a single email account to hold multiple roles and switch active working roles securely.
8. **Implement Secure Passwordless Authentication:** Utilize SHA-256 hashed 6-digit OTPs with timing-safe comparison, resend cooldowns, attempt limits, TTL indexes, and Brevo Email API integration.

---

## 4. Users and Roles

The application strictly defines five distinct user roles stored in the `User` Mongoose model (`server/src/models/User.js`):

| Role | Target User | Key Responsibilities & Capabilities |
| :--- | :--- | :--- |
| **`farmer`** | Milk Producer / Livestock Owner | Manage cattle profiles; View milk collection logs & payout receipts; Browse veterinary medicines & submit orders; Run AI disease scans; Receive doctor recommendations; Send consultation requests; Track escalation history. |
| **`dairyOwner`** | Milk Collection Center Operator | Search & connect with registered farmers; Record daily morning/evening milk collections; Filter unpaid collections; Create payment settlements; View analytical reports. |
| **`medicalProvider`** | Veterinary Clinic / Pharmacy | Manage medicine inventory (price, stock, unit, availability); Process incoming farmer medicine requests (Accept → Pack → Ready → Complete / Reject / Cancel). |
| **`veterinarian`** | Licensed Veterinary Doctor | View incoming consultation requests & referred cases; Inspect AI screening details, symptoms, & photos; Accept or decline cases (triggering escalation); Issue clinical diagnoses and prescriptions. |
| **`admin`** | System Administrator / Supervisor | Global system oversight; Access all dashboards, reports, ledgers, disease cases, vet requests, escalation logs, and inventory catalogs across all roles. |

---

## 5. Current Scope

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CURRENT IMPLEMENTATION SCOPE                     │
├───────────────────────────────────┬────────────────────────────────────┤
│ 🟢 Fully Implemented              │ 🟡 Basic / Student Project Scope   │
│  - 5-Role RBAC Authorization      │  - REST-based Timeout Escalation   │
│  - Single-Email Multi-Role Auth   │    (No background cron/Redis queue)│
│  - Phone/Email OTP Authentication │  - Brevo Email Delivery Fallback   │
│  - SHA-256 Hashing & Timing-Safe  │    (Dev console fallback if no key)│
│  - Farmer-Dairy Connections       │  - Admin User Management Summary   │
│  - Milk Collection (Cow & Buffalo)│ 🔴 Not Implemented / Future Scope  │
│  - 10-Day Milk & Payment Summary  │  - SMS Gateway Integration (Twilio)│
│    (Authoritative Billing Cycles) │  - Real-time WebSockets / Push     │
│  - Refined Dairy & Farmer Consoles│  - Online Payment Gateway (Razorpay│
│  - Cattle Profile Management      │  - PDF Export / Invoice Printing   │
│  - Veterinary Medicine Catalog    │  - Video Consultation Call         │
│  - Prescription Filter & Stock    │                                    │
│  - Medicine Request Workflow      │                                    │
│  - AI Disease Scanner (Cow/Bull)  │                                    │
│  - Vet Recommendation Engine (100)│                                    │
│  - Vet Request Consultation Flow  │                                    │
│  - Basic Automated Escalation     │                                    │
│  - Vet Clinical Case Workflow (23)│                                    │
│    (Exam ➔ Rx ➔ Follow-up Physical)│                                   │
│  - Direct Calling (Doctor/Farmer) │                                    │
│  - Global Back Button Navigation  │                                    │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## 6. Technology Stack

### FRONTEND TECHNOLOGY STACK
- **React (v19.2.8):** Declarative UI library using Functional Components and Hooks (`useState`, `useEffect`, `useContext`).
- **Vite (v8.3.0):** Modern frontend build tool and dev server powering hot module replacement (HMR).
- **React Router DOM (v7.18.4):** Client-side routing library supporting protected routes, role routing, and dynamic navigation.
- **Tailwind CSS (v4.3.3 via `@tailwindcss/vite`):** Utility-first CSS framework used for styling responsive, modern user interfaces.
- **Lucide React (v1.50.0):** Icon library providing iconography throughout navigation, action buttons, stat cards, and clinical widgets.
- **Native Fetch API:** Custom service modules (`authService`, `vetRequestService`, `cattleService`, `paymentService`, etc.) wrap native `fetch` requests with Bearer token authentication.

### BACKEND TECHNOLOGY STACK
- **Node.js (ES Modules `import/export`):** JavaScript runtime environment.
- **Express.js (v5.2.1):** Web framework powering RESTful API routes, middleware chains, and JSON body parsing.
- **MongoDB & Mongoose (v9.10.3):** NoSQL document database and ODM library with schema validation, compound indexes, and TTL indexes.
- **JSONWebToken (`jsonwebtoken` v9.0.3):** Standard for signing and verifying JWT session tokens carrying `roles` array and `activeRole`.
- **Crypto (Node.js Native):** Module used for `crypto.randomInt` (OTP generation), `crypto.createHash('sha256')` (OTP hashing), and `crypto.timingSafeEqual` (secure OTP verification).
- **CORS (v2.8.6):** Cross-Origin Resource Sharing middleware enabling frontend-backend communication across ports.
- **Dotenv (v18.0.5):** Environment variable manager loading configurations from `.env`.
- **Brevo API (v3 SMTP Email API):** RESTful HTTP integration for sending transactional OTP verification emails.

---

## 7. Complete Folder Structure

```
DairyMedicalManagement/
│
├── client/                              # React Frontend Application
│   ├── public/                          # Static assets
│   ├── src/                             # Source code
│   │   ├── components/                  # Reusable UI & Layout Components
│   │   │   ├── common/                  # Atomic UI components (EmptyState, PageHeader, SectionCard, StatCard)
│   │   │   ├── farmer/                  # Farmer components (VeterinarianRecommendations.jsx)
│   │   │   ├── layout/                  # Structural Shell Components (DashboardLayout, Header, MobileNavigation, Sidebar)
│   │   │   ├── LoginPage.jsx            # OTP Login, Multi-Role Selection & Registration
│   │   │   ├── ProtectedRoute.jsx       # Auth guard wrapper
│   │   │   └── RoleRoute.jsx            # Role authorization guard wrapper
│   │   ├── context/                     # Global State Management (AuthContext.jsx)
│   │   ├── pages/                       # Application Views / Pages
│   │   │   ├── admin/                   # Admin Role Pages (Reports.jsx)
│   │   │   ├── dairy/                   # Dairy Owner Role Pages (ConnectedFarmers, MilkCollection, Payments, Reports)
│   │   │   ├── dashboards/              # Role Dashboards (Admin, DairyOwner, Farmer, MedicalProvider, Veterinarian)
│   │   │   ├── farmer/                  # Farmer Role Pages
│   │   │   │   ├── AIDiseaseScanner.jsx # AI photo analysis & vet recommendation trigger
│   │   │   │   ├── CattleManagement.jsx # Cattle profile CRUD management
│   │   │   │   ├── FarmerVetRequests.jsx# Consultation tracker, referral badge & escalation history
│   │   │   │   ├── ScanHistory.jsx      # Disease screening history & vet review logs
│   │   │   │   ├── DairyConnections.jsx # Dairy connection manager
│   │   │   │   ├── MedicineRequests.jsx # Medicine order tracker
│   │   │   │   ├── Medicines.jsx        # Veterinary medicine catalog
│   │   │   │   ├── MilkCollections.jsx  # Milk logs
│   │   │   │   ├── Payments.jsx         # Payment receipts
│   │   │   │   └── Reports.jsx          # Personal analytics
│   │   │   ├── medical/                 # Medical Provider Pages (Inventory.jsx, MedicineRequests.jsx)
│   │   │   ├── veterinarian/            # Veterinarian Pages (PendingCases.jsx, CaseDetailModal.jsx)
│   │   │   └── DashboardRedirect.jsx    # Smart router redirecting to active role dashboard
│   │   ├── services/                    # API Service Wrappers
│   │   │   ├── authService.js           # Multi-role authentication & OTP API
│   │   │   ├── cattleService.js         # Cattle CRUD API
│   │   │   ├── diseaseScanService.js    # AI scan & vet recommendation API
│   │   │   ├── vetRequestService.js     # Consultation request & escalation API
│   │   │   ├── dairyFarmerService.js    # Connection API
│   │   │   ├── medicineRequestService.js# Order lifecycle API
│   │   │   ├── medicineService.js       # Inventory API
│   │   │   ├── milkCollectionService.js # Milk intake API
│   │   │   ├── paymentService.js        # Settlement API
│   │   │   ├── reportService.js         # Analytics API
│   │   │   └── veterinarianService.js   # Case review API
│   │   ├── App.jsx                      # Client Router & Provider Entrypoint
│   │   └── main.jsx                     # DOM Mounting Entrypoint
│   └── package.json                     # Frontend dependencies & scripts
│
└── server/                              # Express Node.js Backend Application
    ├── src/                             # Source code
    │   ├── config/                      # MongoDB Connection Initializer (db.js)
    │   ├── controllers/                 # Business Logic & Request Handlers
    │   │   ├── authController.js            # Authentication, OTP, Multi-role logic
    │   │   ├── cattleController.js          # Cattle profile management logic
    │   │   ├── dairyFarmerController.js     # Connection workflow logic
    │   │   ├── diseaseScanController.js    # AI scanner & Vet recommendation scoring logic (100 Max)
    │   │   ├── vetRequestController.js      # Consultation request & auto-escalation engine
    │   │   ├── medicineController.js        # Pharmacy inventory logic
    │   │   ├── medicineRequestController.js # Medicine request processing logic
    │   │   ├── milkCollectionController.js  # Milk collection intake logic
    │   │   ├── paymentController.js         # Settlement engine & ledger logic
    │   │   └── reportController.js          # Aggregated analytics logic
    │   ├── middleware/                  # authMiddleware.js & roleMiddleware.js
    │   ├── models/                      # Mongoose Schemas
    │   │   ├── Cattle.js                    # Cattle profile schema
    │   │   ├── DairyFarmerConnection.js     # Connection schema
    │   │   ├── DiseaseScan.js               # Disease scan & timeline schema
    │   │   ├── Medicine.js                  # Pharmacy inventory schema
    │   │   ├── MedicineRequest.js           # Medicine request order schema
    │   │   ├── MilkCollection.js            # Milk log schema
    │   │   ├── OTP.js                       # Temporary OTP schema
    │   │   ├── Payment.js                   # Settlement schema
    │   │   ├── User.js                      # Multi-role User profile schema
    │   │   └── VetRequest.js                # Consultation request & escalation history schema
    │   ├── routes/                      # API Endpoint Routers (auth, cattle, vet-requests, etc.)
    │   ├── services/                    # External services (aiDiseaseService.js, emailService.js)
    │   └── utils/                       # Cryptographic OTP & phone normalization utilities
    └── app.js                           # Express App setup & middleware registration
```

---

## 8. Detailed Component Documentation

### Backend Models (Mongoose Schemas)

#### 1. `server/src/models/User.js`
- **Fields:** `name` (String, required), `phone` (String, unique, required), `email` (String, unique, sparse), `role` (String, legacy primary role), `roles` (Array of Strings: `['farmer', 'dairyOwner', 'medicalProvider', 'veterinarian', 'admin']`), `isActive` (Boolean, default `true`), `specialization` (String), `expertise` (Array of Strings), `availability` (Enum: `['available', 'busy', 'offline']`), `clinicName` (String), `timestamps`.

#### 2. `server/src/models/Cattle.js`
- **Fields:** `farmer` (Ref: `User`, required), `nameTag` (String, required), `breed` (String), `gender` (Enum: `['female', 'male']`), `ageYears` (Number), `healthStatus` (Enum: `['healthy', 'under_observation', 'critical']`), `imageUrl` (String), `lastHealthCheck` (Date), `timestamps`.

#### 3. `server/src/models/DiseaseScan.js`
- **Fields:** `farmer` (Ref: `User`), `cattle` (Ref: `Cattle`), `animalType` (String), `animalIdTag` (String), `imageUrl` (String), `symptoms` (String), `detectedCondition` (String), `confidence` (Number), `recommendations` (Array of Strings), `veterinarianRecommended` (Boolean), `veterinarianReviewStatus` (Enum: `['pending_review', 'under_review', 'review_completed']`), `veterinarian` (Ref: `User`), `timeline` (Array of status log events).

#### 4. `server/src/models/VetRequest.js`
- **Fields:** 
  - `farmer` (Ref: `User`, required), `veterinarian` (Ref: `User`, required), `cattle` (Ref: `Cattle`, required), `diseaseScan` (Ref: `DiseaseScan`, required),
  - `symptoms` (String), `aiCondition` (String), `riskLevel` (String), `farmerMessage` (String),
  - `status` (Enum: `['pending', 'accepted', 'rejected', 'completed', 'escalated']`, default `'pending'`),
  - `rejectionReason` (String),
  - `escalationHistory`: Array of `{ veterinarian: Ref User, status: Enum ['rejected', 'timeout', 'escalated'], reason: String, assignedAt: Date, respondedAt: Date }`,
  - `requestedAt` (Date, default `Date.now`), `respondedAt` (Date).

---

### Key Business Logic Handlers

#### 5. `diseaseScanController.js` — Recommendation Scoring Engine
- **Endpoint:** `GET /api/disease-scans/:id/recommended-veterinarians`
- **Logic:** Retrieves active users with veterinarian role. Evaluates each doctor using normalized 100-point scoring:
  - Base Suitability: **+10 pts**
  - Condition & Specialization/Expertise Match: **+40 pts**
  - Availability (`available`): **+30 pts**
  - High-Risk Suitability (confidence $\ge 80\%$ or critical condition): **+20 pts**
  - Max Score: **100 pts**. Ranks candidates descending and returns structured match levels (`Highly Suitable`, `Suitable`, `General Match`).

#### 6. `vetRequestController.js` — Escalation Engine
- **Rejection Handler (`PATCH /api/vet-requests/:id/reject`)**:
  1. Verifies doctor ownership (`req.user.id === vetReq.veterinarian`).
  2. Records current doctor's rejection into `escalationHistory`.
  3. Gathers all attempted doctor IDs (`[currentVet, ...escalationHistory.map(h => h.veterinarian)]`).
  4. Invokes `findNextEligibleVeterinarian(scan, attemptedVetIds)`.
  5. If candidate found: reassigns `vetReq.veterinarian = nextVet._id`, resets `status = 'pending'`, updates `DiseaseScan` timeline, returns success with message *"Consultation request declined and automatically forwarded to Dr. XYZ"*.
  6. If no candidate found: sets `status = 'rejected'`, `rejectionReason = "... (No other suitable veterinarian is currently available.)"`.
- **Timeout / Manual Escalation Handler (`POST /api/vet-requests/:id/escalate`)**:
  1. Verifies farmer ownership & `pending` status.
  2. Checks timeout: `(Date.now() - requestedAt) >= VET_REQUEST_TIMEOUT_MINUTES * 60 * 1000` (or `force: true` / admin trigger).
  3. Records timeout status in `escalationHistory`.
  4. Reassigns to next eligible doctor or sets safe terminal state.

---

## 9. API Routes Table

| Method | Endpoint | Purpose | Auth | Role | Controller Function |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register user (multi-role support) & send OTP | Public | Any (5 Roles) | `register` |
| `POST` | `/api/auth/request-otp` | Request 6-digit login OTP | Public | Any | `requestOTP` |
| `POST` | `/api/auth/verify-otp` | Verify OTP & issue JWT session with activeRole | Public | Any | `verifyOTP` |
| `GET` | `/api/cattle` | Fetch farmer's registered cattle profiles | Bearer | `farmer`, `admin` | `getFarmerCattle` |
| `POST` | `/api/cattle` | Register new cattle profile | Bearer | `farmer`, `admin` | `createCattle` |
| `POST` | `/api/disease-scans` | Upload photo & run AI disease scan for cattle | Bearer | `farmer`, `admin` | `createDiseaseScan` |
| `GET` | `/api/disease-scans/:id/recommended-veterinarians` | Fetch ranked vet recommendations (100 Max) | Bearer | `farmer`, `admin` | `getRecommendedVeterinarians` |
| `POST` | `/api/vet-requests` | Create consultation request to doctor | Bearer | `farmer`, `admin` | `createVetRequest` |
| `GET` | `/api/vet-requests/farmer` | View submitted requests & escalation logs | Bearer | `farmer`, `admin` | `getFarmerRequests` |
| `GET` | `/api/vet-requests/veterinarian` | View incoming & referred requests | Bearer | `veterinarian`, `admin` | `getVeterinarianRequests` |
| `PATCH`| `/api/vet-requests/:id/accept` | Accept consultation request | Bearer | `veterinarian`, `admin` | `acceptVetRequest` |
| `PATCH`| `/api/vet-requests/:id/reject` | Decline request & trigger auto-escalation | Bearer | `veterinarian`, `admin` | `rejectVetRequest` |
| `POST` | `/api/vet-requests/:id/escalate` | Trigger response timeout / manual escalation | Bearer | `farmer`, `admin` | `escalateVetRequest` |
| `POST` | `/api/milk-collections` | Record shift milk collection log | Bearer | `dairyOwner`, `admin` | `createCollection` |
| `POST` | `/api/payments` | Create payment settlement | Bearer | `dairyOwner`, `admin` | `createPayment` |
| `POST` | `/api/medicines` | Add medicine to inventory | Bearer | `medicalProvider` | `createMedicine` |
| `POST` | `/api/medicine-requests` | Submit medicine order | Bearer | `farmer` | `createMedicineRequest` |

---

## 10. Database Architecture & Relationships

```
                         ┌──────────────┐
                         │     User     │ (Multi-Role: Farmer, Vet, etc.)
                         └──────┬───────┘
                                │
    ┌────────────────┬──────────┼──────────┬────────────────┐
    │                │          │          │                │
    ▼                ▼          ▼          ▼                ▼
┌─────────┐   ┌────────────┐ ┌─────┐   ┌───────┐   ┌────────────────┐
│ Cattle  │   │Connection  │ │Milk │   │Medicine│  │  DiseaseScan   │
└────┬────┘   └────────────┘ └─────┘   └───────┘   └───────┬────────┘
     │                                                     │
     └──────────────────────────┬──────────────────────────┘
                                │
                                ▼
                       ┌────────────────┐
                       │   VetRequest   │ (Single Document Continuum)
                       │                │
                       │ veterinarian   │ ──► Current Assigned Vet
                       │ escalationHist │ ──► [Attempted Doctor Logs]
                       └────────────────┘
```

1. **User → Cattle:** One-to-Many relationship between `farmer` User and registered `Cattle` profiles.
2. **Cattle & DiseaseScan → VetRequest:** Single continuous `VetRequest` document linking `Farmer`, `Cattle`, `DiseaseScan`, and current assigned `Veterinarian`.
3. **VetRequest → escalationHistory:** Array recording past attempted doctors, decline/timeout reasons, and timestamps to prevent re-selecting previous doctors.

---

## 10.5. Phase 26: Dairy Owner & Milk Management Architecture & 10-Day Summary

### Core Workflow
```
Dairy Owner ──► Select Connected Farmer ──► Enter Liters, Fat %, Rate & Date
                      │
                      ▼
         Live Amount Preview (Qty × Rate)
                      │
                      ▼
            Authoritative Save Record (HTTP 201)
            [Unique Index: DairyOwner + Farmer + Date + Session]
                      │
                      ▼
    ┌─────────────────┴──────────────────┐
    ▼                                    ▼
Dairy Console Updated            Farmer Dashboard Updated
- Today's Liters & Gross ₹       - Today's Intake & Shifts
- Shift Breakdown (☀️ / 🌙)      - Read-Only Collection Log
- 10-Day Billing Cycle Summary   - 10-Day Billing Cycle Summary
- Disbursed vs Pending Ledger    - Settled Funds vs Dues
```

### Key Technical Achievements in Phase 26
1. **Authoritative 10-Day Billing Cycles (`GET /api/milk-collections/ten-day-summary`):**
   - Implements standard Indian cooperative dairy billing periods: Cycle 1 (1st–10th), Cycle 2 (11th–20th), Cycle 3 (21st–End), Rolling Last 10 Days, or Custom Range.
   - Distinctly calculates and isolates:
     - **Milk Amount Recorded** (Gross value of collections)
     - **Amount Already Paid** (Settled funds disbursed in payment ledger)
     - **Outstanding Balance** (Pending dues to be settled)
   - Groups shift collections day-by-day (Morning vs Evening) with full rate, fat %, quantity, and settlement status breakdown.
2. **Active Connection Enforcement:**
   - Dairy Owners can only select and record milk for farmers verified with `status: 'active'`. Unconnected farmers are rejected with `403 Forbidden`.
3. **Double Entry & Conflict Protection:**
   - Client pre-check + Mongo compound unique index `{ dairyOwner: 1, farmer: 1, collectionDate: 1, session: 1 }` returning `409 Conflict`.
4. **Multi-Role & Read-Only Safety:**
   - Farmers access their collection records in strictly read-only mode (`GET /api/milk-collections/farmer`), with ownership checks preventing access to unrelated users.
   - Preserves all Phase 6-10 payment ledger mechanics (partial payments, payment receipts, duplicate-settlement protection).

---

## 11. Phase 27 — Admin Dashboard & Complete System Management

### Overview & Primary Objective
Phase 27 establishes a unified, authoritative administrative control center that grants authorized Administrators (`role: 'admin'`) comprehensive visibility and system management across all platform domains without breaking or duplicating any functionality from Phases 1–26.

```
                         ADMIN CONTROL CENTER (Tabbed Oversight)
                                           │
  ┌───────────────┬────────────────┬───────┴────────┬───────────────┬───────────────┐
  ▼               ▼                ▼                ▼               ▼               ▼
1. Overview    2. Users        3. Verification  4. Cattle       5. Vet Requests 6. Medicines
- Real Stats   - Directory     - Vets & Stores  - Across Herds  - Referrals     - Inventory
- Recent Feeds - Suspend/Act   - Approve/Reject - Health Filter - History Logs  - Store Links
                                                    │
  ┌───────────────────────────────┬─────────────────┴───────────────┐
  ▼                               ▼                                 ▼
7. Fodder Listings              8. Complaints                     9. Reports
- Marketplace Moderation        - Dispute Resolution              - Milk Intake Volumes
- Active / Inactive Toggles     - Open/Progress/Resolved Notes    - Cumulative Settlement
```

### 10 Core Management Areas
1. **Farmers**: Comprehensive oversight in User Directory with filterable role tags, contact information, and account activation controls.
2. **Dairy Owners**: Visibility into processing units, connected farmers count, and financial ledger totals.
3. **Veterinarians**: Verification lifecycle (`pending`, `approved`, `rejected`) persisting `licenseNumber` and `verificationNotes` to the `User` collection.
4. **Medical Stores**: Professional review and credential persistence for `medicalProvider` accounts.
5. **Cattle Records**: System-wide inspection of herd profiles (`nameTag`, `breed`, `gender`, `ageYears`, `healthStatus`, and owner references).
6. **Veterinary Requests**: Full clinical case auditing including disease scan linkages, assigned veterinarians, clinical stages, and complete chronological `escalationHistory` timeline inspection.
7. **Medicines**: Real catalog oversight detailing unit pricing, pharmaceutical categories, medical provider ownership, and atomic inventory stock levels (`in_stock`, `low_stock`, `out_of_stock`).
8. **Fodder Listings**: Administrative moderation allowing deactivation/activation of marketplace listings with server-side validation.
9. **Complaints**: Lightweight grievance workflow supporting user submission (`POST /api/complaints`, `GET /api/complaints/my`) and administrator management (`GET /api/admin/complaints`, `PATCH /api/admin/complaints/:id`) with persistent status changes and resolution notes.
10. **Reports**: Dynamic, real-time MongoDB aggregations for user demographics, cumulative milk volume and valuation, gross financial settlements, disbursed payouts, and outstanding balances.

### Status of Features
- **REAL FUNCTIONALITY:**
  - Strict RBAC enforcement requiring Bearer token + `requireRole('admin')`.
  - Non-admins receiving `403 Forbidden` on all privileged endpoints.
  - Self-deactivation protection preventing administrators from suspending their own accounts.
  - Sensitive authentication fields (`otpHash`, `otpExpiresAt`, JWT secrets) excluded from admin responses.
  - Verification decisions (`status`, `notes`, `licenseNumber`) persisted in `User` documents.
  - Complaint creation, querying, status updating, and admin resolution notes persisted in `Complaint` documents.
  - Fodder listing moderation (`active` ↔ `inactive`) with persistent updates.
  - Direct tabs and subviews in `AdminDashboard.jsx` synchronized via URL search parameters.
- **BASIC/DEMO FUNCTIONALITY:**
  - Direct complaint logging modal embedded in Admin header for rapid testing alongside user submission flow.
- **NOT IMPLEMENTED (Out of Scope):**
  - External payment gateways (preserves internal ledger system).
  - SMS gateways (OTP is delivered via Brevo Email and logged securely in development).
  - Background WebSocket/Push notifications.
  - Complex enterprise ticketing/chat platforms.

---

## 12. Phase 28 — Role Navigation Integration & End-to-End Workflow Consistency

### Overview & Integration Audit
Phase 28 establishes seamless, end-to-end user navigation and role-based consistency across all five supported personas (`farmer`, `dairyOwner`, `veterinarian`, `medicalProvider`, `admin`). It eliminates isolated page silos, enables instant in-session active role switching for multi-role accounts, exposes user-facing grievances/complaints across all roles, and connects major cross-module workflows.

### Verified Route Inventory & Navigation Map

| Route Path | Component | Allowed Roles | Navigation Location | Real API Backed |
| :--- | :--- | :--- | :--- | :--- |
| `/login` | `LoginPage` | Public | Auth Redirect / Logout | Yes (`/api/auth/*`) |
| `/` & `/dashboard` | `DashboardRedirect` | All Authenticated | Automatic role dispatcher | Yes (checks `activeRole`) |
| `/farmer/dashboard` | `FarmerDashboard` | `farmer`, `admin` | Sidebar & Mobile Menu | Yes (Livestock, Milk, Payments) |
| `/farmer/cattle` | `MyCattle` | `farmer`, `admin` | Sidebar, Farmer Dash Quick Link | Yes (`/api/cattle`) |
| `/farmer/ai-scanner` | `AIDiseaseScanner` | `farmer` | Sidebar, Healthcare Banner | Yes (`/api/disease-scans`) |
| `/farmer/scan-history` | `ScanHistory` | `farmer`, `admin` | Sidebar, Scanner Footer Link | Yes (`/api/disease-scans/history`) |
| `/farmer/vet-requests`| `FarmerVetRequests` | `farmer`, `admin` | Sidebar, Healthcare Banner | Yes (`/api/vet-requests/farmer`) |
| `/farmer/medicines` | `FarmerMedicines` | `farmer`, `admin` | Sidebar, Healthcare Banner | Yes (`/api/medicines`) |
| `/farmer/medicine-requests` | `FarmerMedicineRequests` | `farmer`, `admin` | Sidebar, Medicines Tab | Yes (`/api/medicine-requests/my`) |
| `/farmer/fodder-marketplace` | `FodderMarketplace` | `farmer`, `admin` | Sidebar & Farmer Dash Header | Yes (`/api/fodder-listings`) |
| `/farmer/milk-collections` | `MilkCollections` | `farmer`, `admin` | Sidebar, Farmer Dash Quick Link | Yes (`/api/milk-collections/farmer`) |
| `/farmer/payments` | `FarmerPayments` | `farmer`, `admin` | Sidebar, Farmer Dash Quick Link | Yes (`/api/payments/farmer`) |
| `/farmer/reports` | `FarmerReports` | `farmer`, `admin` | Sidebar & Header | Yes (`/api/reports/farmer`) |
| `/farmer/connections` | `DairyConnections` | `farmer`, `admin` | Sidebar & Connection Card | Yes (`/api/dairy-connections`) |
| `/dairy-owner/dashboard` | `DairyOwnerDashboard` | `dairyOwner`, `admin` | Sidebar & Mobile Menu | Yes (Collections, Ledgers) |
| `/dairy-owner/milk-collection` | `MilkCollection` | `dairyOwner`, `admin` | Sidebar & Dairy Dash Action | Yes (`/api/milk-collections`) |
| `/dairy-owner/payments` | `Payments` | `dairyOwner`, `admin` | Sidebar & Dairy Dash Action | Yes (`/api/payments`) |
| `/dairy-owner/reports` | `DairyOwnerReports` | `dairyOwner`, `admin` | Sidebar & Dairy Dash Action | Yes (`/api/reports/dairy`) |
| `/dairy-owner/farmers` | `ConnectedFarmers` | `dairyOwner`, `admin` | Sidebar & Dairy Dash Action | Yes (`/api/dairy-connections`) |
| `/veterinarian/dashboard` | `VeterinarianDashboard` | `veterinarian`, `admin` | Sidebar & Mobile Menu | Yes (`/api/veterinarian/cases`) |
| `/veterinarian/cases` | `PendingCases` | `veterinarian`, `admin` | Sidebar & Dashboard Banner | Yes (`/api/veterinarian/cases`) |
| `/medical-provider/dashboard` | `MedicalProviderDashboard` | `medicalProvider`, `admin`| Sidebar & Mobile Menu | Yes (Inventory & Order Summaries) |
| `/medical-provider/inventory` | `Inventory` | `medicalProvider`, `admin`| Sidebar & Dash Action | Yes (`/api/medicines`) |
| `/medical-provider/medicine-requests` | `MedicalMedicineRequests` | `medicalProvider`, `admin`| Sidebar & Orders Queue Action | Yes (`/api/medicine-requests/provider`)|
| `/admin/dashboard` | `AdminDashboard` | `admin` | Sidebar & Mobile Menu | Yes (`/api/admin/*`) |
| `/admin/reports` | `AdminReports` | `admin` | Sidebar & Admin Tab Action | Yes (`/api/reports/dashboard-summary`)|
| `/complaints` | `Complaints` | All Authenticated | Sidebar & Mobile Menu (All Roles) | Yes (`/api/complaints`) |

### Key Technical Achievements in Phase 28
1. **Interactive In-Session Multi-Role Switching (`POST /api/auth/switch-role`):**
   - Enables users with multiple registered roles (`user.roles.length > 1`) to switch their `activeRole` with a single click from the application header without having to log out or request new OTPs.
   - Enforces strict server-side authorization: users cannot switch to a role they do not possess (`403 Forbidden`).
   - Automatically issues a fresh JWT with updated `role` and `activeRole`, updates `AuthContext` state, and dispatches the user to the corresponding role dashboard.
2. **Universal User Complaints & Grievance Portal (`/complaints`):**
   - Accessible to all roles (`farmer`, `dairyOwner`, `veterinarian`, `medicalProvider`, `admin`).
   - Authenticated users submit platform grievances across 7 categories (`milk_collection`, `payments`, `veterinary`, `medicines`, `fodder`, `account`, `general`).
   - Displays real-time status badges (`open`, `in_progress`, `resolved`, `closed`), submission date, category, and administrator resolution notes.
3. **Connected Farmer Healthcare Journey:**
   - Embedded a prominent "Cattle Healthcare & Veterinary Services" action banner in `FarmerDashboard.jsx`.
   - Direct shortcuts to AI Disease Scanner, Veterinary Requests, Medicines Catalog, and Support without traversing unrelated menus.
4. **Connected Medical Provider Fulfillment Queue:**
   - Replaced static placeholder in `MedicalProviderDashboard.jsx` with real-time summary statistics from `medicineRequestService.getProviderRequestsSummary`.
   - Direct action button to `Orders Queue` (`/medical-provider/medicine-requests`).

---

## 13. Phase 29 — Complete English & Marathi Bilingual Architecture

### Overview & Objective
Phase 29 delivers comprehensive, production-grade bilingual localization supporting **English (`en`)** and **Marathi (`mr`)** throughout the entire Gauseva platform. Users can switch language at any moment across desktop and mobile, on public authentication pages, and across all five role consoles (**Farmer**, **Dairy Owner**, **Veterinarian**, **Medical Provider**, and **Administrator**).

### Architectural Design & Core Principles
1. **Zero Backend Mutation:** Backend API contracts, MongoDB documents, JWT payloads, role identifiers, enum states (`pending`, `completed`, `healthy`, `morning`, etc.), and monetary/milk arithmetic are 100% preserved. Localization affects visual presentation only.
2. **Centralized Enum Mapping (`statusMap.js`):** Display text for statuses, roles, sessions, and payment methods is mapped via pure functions (`getStatusLabel`, `getRoleLabel`, `getSessionLabel`, `getPaymentMethodLabel`, `getGenderLabel`), preventing raw backend enum strings from being sent to the database or rendered in translated forms.
3. **Static Resource Bundling:** Language catalogs are statically bundled into `client/src/i18n/index.js` to eliminate asynchronous HTTP fetch delays, raw key flashes, and 404 network errors during production builds.
4. **Resilient Fallback Hierarchy:** Fallback language is hard-set to `en`, with `fallbackNS: 'common'` ensuring that any missing key in a domain namespace safely resolves to the English default without exposing raw translation keys.
5. **Persistence & Session Continuity:** Selected language is persisted in `localStorage` under `'gauseva_language'`. The selection survives page reloads, navigation, and logout/login without clearing active form data or triggering authentication side effects.
6. **Devanagari Typography:** Font fallbacks (`'Noto Sans Devanagari', 'Nirmala UI', 'Mangal'`) were integrated in `index.css` to guarantee clean rendering of Marathi conjuncts (जोडाक्षरे) across mobile and desktop browsers.

### Translation Directory Structure
```
client/src/i18n/
├── index.js                      # i18next & react-i18next central bootstrap
├── statusMap.js                  # Central backend enum ➔ localized presentation mapper
├── locales/
│   ├── en/                       # English Catalogs (Default & Fallback)
│   │   ├── common.json           # Layout, nav, buttons, roles, statuses, empty states
│   │   ├── auth.json             # Login, registration, role selection, OTP timers
│   │   ├── farmer.json           # Dashboard, cattle, AI scanner, requests, fodder
│   │   ├── dairyOwner.json       # Dashboard, shift collections, settlements, ledger
│   │   ├── veterinarian.json     # Dashboard, clinical triage, examinations, prescriptions
│   │   ├── medicalProvider.json  # Dashboard, inventory management, order fulfillment
│   │   ├── admin.json            # Dashboard, KPIs, user directory, verifications
│   │   ├── complaints.json       # Grievance desk, categories, resolution notes
│   │   └── validation.json       # Required field hints, pattern constraints
│   └── mr/                       # Marathi Catalogs (पूर्ण मराठी भाषांतर)
│       ├── common.json           # सामान्य नेव्हिगेशन, क्रिया, भूमिका आणि स्थिती
│       ├── auth.json             # प्रवेश, नोंदणी, ओटीपी आणि ओळख पडताळणी
│       ├── farmer.json           # शेतकरी डॅशबोर्ड, जनावरे, AI स्कॅनर, चारा बाजार
│       ├── dairyOwner.json       # डेअरी संकलन, 10-दिवसीय बिलिंग, पेमेंट लेजर
│       ├── veterinarian.json     # पशुवैद्यकीय तपासणी, निदान आणि औषधोपचार
│       ├── medicalProvider.json  # औषध साठा व्यवस्थापन, प्रिस्क्रिप्शन ऑर्डर्स
│       ├── admin.json            # प्रशासक केंद्र, पडताळणी आणि प्रणाली अहवाल
│       ├── complaints.json       # तक्रार निवारण कक्ष आणि प्रशासकीय शेरे
│       └── validation.json       # फॉर्म प्रमाणीकरण आणि त्रुटी संदेश
```

### Language Switcher Component
The `LanguageSwitcher.jsx` component renders a modern segmented pill toggle (`English` | `मराठी`) with active visual indicators. Embedded in:
- Main desktop `Header.jsx`
- Mobile navigation drawer in `MobileNavigation.jsx`
- Public authentication card in `LoginPage.jsx`

All buttons declare explicit `type="button"` preventing accidental form submission.

### How to Add New Translations
1. Open the target namespace JSON file in both `client/src/i18n/locales/en/<namespace>.json` and `client/src/i18n/locales/mr/<namespace>.json`.
2. Add the key pair matching your component's needs.
3. In your React component, call `const { t } = useTranslation(['<namespace>', 'common']);` and access the translated string via `t('<namespace>:key.name', 'English Fallback')`.
4. If rendering dynamic values (e.g. counts, names), use translation interpolation: `t('key.name', { count: total, name: user.name })`.

---

## 14. Developer Map: "Where Do I Change X?"

| If you want to modify... | Target File(s) |
| :--- | :--- |
| **Bilingual i18n Core Config** | `client/src/i18n/index.js` |
| **Language Catalogs & Strings** | `client/src/i18n/locales/en/` & `client/src/i18n/locales/mr/` |
| **Status & Role Presentation Mapper** | `client/src/i18n/statusMap.js` |
| **Language Switcher UI** | `client/src/components/common/LanguageSwitcher.jsx` |
| **Multi-Role Switching Engine** | `server/src/controllers/authController.js` (`switchRole`) & `Header.jsx` |
| **Universal Complaints Portal** | `client/src/pages/common/Complaints.jsx` & `complaintService.js` |
| **Admin Control Center UI & Tabs** | `client/src/pages/dashboards/AdminDashboard.jsx` & `adminService.js` |
| **Admin System APIs & Aggregates** | `server/src/controllers/adminController.js` & `server/src/routes/adminRoutes.js` |
| **Complaints Model & APIs** | `server/src/models/Complaint.js`, `complaintController.js` & `complaintRoutes.js` |
| **Role Navigation & Menus** | `client/src/components/layout/Sidebar.jsx` & `MobileNavigation.jsx` |
| **Login & Multi-Role Selection UI** | `client/src/components/LoginPage.jsx` & `authController.js` |
| **Cattle Management UI & API** | `client/src/pages/farmer/MyCattle.jsx` & `cattleController.js` |
| **AI Disease Analysis Engine** | `server/src/services/aiDiseaseService.js` |
| **Veterinarian Recommendation Scoring** | `server/src/controllers/diseaseScanController.js` & `VeterinarianRecommendations.jsx` |
| **Veterinarian Escalation Engine** | `server/src/controllers/vetRequestController.js` & `server/src/models/VetRequest.js` |
| **Farmer Request Tracker & Referral History UI** | `client/src/pages/farmer/FarmerVetRequests.jsx` & `vetRequestService.js` |
| **Veterinarian Cases Queue** | `client/src/pages/veterinarian/PendingCases.jsx` & `CaseDetailModal.jsx` |
| **Milk Collections, History & 10-Day Summary** | `client/src/pages/dairy/MilkCollection.jsx`, `MilkCollections.jsx` & `milkCollectionController.js` |
| **Dairy Payments & Settlements Ledger** | `client/src/pages/dairy/Payments.jsx` & `paymentController.js` |
| **Cow / Buffalo Milk Types & Dual Session Ledger** | `server/src/models/MilkCollection.js`, `milkCollectionController.js`, `MilkCollection.jsx`, `MilkCollections.jsx` |
| **Prescription Extraction & Catalog Filtering** | `server/src/controllers/medicineController.js` & `client/src/pages/farmer/Medicines.jsx` |
| **Male Cattle AI Screening & Enum Fix** | `server/src/models/DiseaseScan.js`, `diseaseScanController.js` & `aiDiseaseService.js` |
| **Veterinarian Direct Calling & Clinical Follow-up** | `server/src/models/VetRequest.js`, `vetRequestController.js`, `ClinicalWorkspaceModal.jsx` & `FarmerCaseDetailModal.jsx` |
| **Global Back Navigation & Fallback Engine** | `client/src/components/common/BackButton.jsx`, `PageHeader.jsx` & `client/test/navigation.test.js` |

---

## 15. Project Viva Questions & Answers

### Advanced Phase Questions (10)
1. **Q: How does in-session multi-role switching work in Phase 28?**
   *A: A multi-role user selects an authorized role from the Header dropdown. The client calls `POST /api/auth/switch-role`. The backend verifies the user's `roles` array in MongoDB, generates a new JWT with the selected `activeRole`, and updates the client session and navigation state without re-requiring OTP authentication.*
2. **Q: How does the system prevent unauthorized access when a user switches roles?**
   *A: The JWT payload encodes `activeRole`. Both frontend `RoleRoute` guards and backend `requireRole` middleware check `req.user.role` (which equals `activeRole`). Routes and APIs belonging to other roles return `403 Forbidden` until the active role is switched.*
2. **Q: Does escalation create duplicate VetRequest documents in MongoDB?**
   *A: No. Escalation maintains a single `VetRequest` document continuum, updating the `veterinarian` reference and appending past attempts to `escalationHistory`. This preserves original `Cattle`, `DiseaseScan`, and `farmerMessage` references.*
3. **Q: How are previously attempted veterinarians prevented from being re-selected?**
   *A: The helper queries `User` with `$nin: [currentVetId, ...escalationHistory.map(h => h.veterinarian)]`, strictly excluding all doctors who have already handled or timed out on the case.*
4. **Q: How does the recommendation scoring model work?**
   *A: It uses a normalized 100-point maximum model: Base Suitability (+10), Condition Specialization/Expertise Match (+40), Availability (+30), and High-Risk Suitability (+20).*
5. **Q: How is response timeout escalation triggered without background cron services?**
   *A: The system provides a REST endpoint `POST /api/vet-requests/:id/escalate` that calculates `(Date.now() - requestedAt)`. If the configured timeout (`VET_REQUEST_TIMEOUT_MINUTES`, default 30) has passed, or if forced during a demo/admin action, the backend executes the escalation engine.*
6. **Q: What happens if all eligible veterinarians decline a request?**
   *A: The system transitions `vetRequest.status = 'rejected'` and sets `rejectionReason = "No other suitable veterinarian is currently available."`, preventing infinite loop re-assignments and notifying the farmer clearly.*
7. **Q: How does single-email multi-role authentication work?**
   *A: The `User` model stores an array of registered `roles`. Upon entering an email during login, the system displays the registered roles. After OTP verification, the JWT token carries both the `roles` array and the user's chosen `activeRole`.*
8. **Q: How does a newly assigned veterinarian know a request was escalated?**
   *A: In the Veterinarian clinical console (`PendingCases.jsx`), incoming requests with `escalationHistory.length > 0` display a distinct `🔁 Referred Request` badge.*
9. **Q: Can a farmer escalate another farmer's request?**
   *A: No. Server-side authorization enforces `req.user.id === vetReq.farmer.toString()`, returning `403 Forbidden` if another user attempts escalation.*
10. **Q: How does the system update the AI DiseaseScan record during escalation?**
    *A: The `DiseaseScan.veterinarian` field is updated to the newly assigned doctor, and an automated log entry (`VET_ESCALATED`) is appended to the scan's `timeline` array.*

---

## 16. Phase 29 — Complete English & Marathi Localization Coverage

### Architecture & Coverage Summary
- **i18n Engine**: `i18next` + `react-i18next` with `LanguageDetector` and `localStorage` caching (`i18nextLng`).
- **Resource Key Parity**: 1,032 English keys and 1,032 Marathi keys (100% parity across 9 namespaces: `admin`, `auth`, `common`, `complaints`, `dairyOwner`, `farmer`, `medicalProvider`, `validation`, `veterinarian`).
- **Status & Risk Mapping**: Managed via [statusMap.js](file:///c:/Users/Pratik/Downloads/DairyMedicalManagement/client/src/i18n/statusMap.js) (`getStatusLabel`, `getRiskLabel`, `getRoleLabel`, `getGenderLabel`). Backend enums (`pending`, `settled`, `review_completed`, etc.) remain untranslated for API fidelity while display labels immediately update upon switching to Marathi.
- **Coverage**: All five roles (Farmer, Dairy Owner, Veterinarian, Medical Store, Administrator), authentication flows, clinical case workspace, AI scanners, prescription procurement, milk collections, 10-day summaries, fodder marketplace, and admin oversight.

---

## 18. Phase 30 — Global UI/UX Polish, Accessibility & Responsiveness

### Polish & Responsiveness Summary
- **Universal Accessibility (`:focus-visible`)**: Enhanced high-contrast keyboard navigation rings across all interactive buttons, inputs, tabs, and selects with consistent 2px blue outlines.
- **Devanagari / Marathi Typography**: Added `:lang(mr)` line-height (1.625) and letter-spacing rules ensuring Marathi conjuncts (जोडाक्षरे) and diacritics are crisp and never cut off vertically.
- **Responsive Dialog & Modal Architecture**: Standardized every modal across all 5 roles with `p-3 sm:p-4 overflow-y-auto` overlays and `max-h-[90vh] overflow-y-auto my-auto modal-animate` containers, preventing form button clipping on mobile viewports (360×800 and 390×844).
- **Navigation & Layout Alignment**:
  - `Header.jsx`: Streamlined mobile spacing by hiding secondary subtitle text on screens `<640px` to guarantee zero horizontal scroll.
  - `Sidebar.jsx` & `MobileNavigation.jsx`: Enforced `shrink-0` on icons and `min-w-0 truncate` on navigation labels so long Marathi strings never distort drawer items.
  - `LanguageSwitcher.jsx`: Standardized active button states to high-contrast `bg-blue-600 text-white font-bold` with responsive padding.
  - `EmptyState.jsx`: Cleaned up empty states without hardcoded "Module In Progress" tags on production data filters.
- **Automated Validation**:
  - `npm test` (`statusMap.test.js`): 10/10 tests pass.
  - `npm run build`: Production bundle compiles cleanly with 0 errors in 1.07s.

---

## 19. Phase 30.1 — Global Navigation Architecture & Core Operational Workflows

### 1. Global Back Button & Navigation Architecture
- **Universal Component (`client/src/components/common/BackButton.jsx`)**:
  - Encapsulates safe back navigation with bilingual labeling (`common:actions.back`, English: "Back", Marathi: "मागे").
  - Evaluates `window.history.state?.idx > 0` and referrer history:
    - If valid local history exists: invokes `navigate(-1)`.
    - If accessed directly (bookmark, external link, fresh tab) or from another domain: gracefully falls back to explicit `fallback` route or the user's role-specific dashboard.
- **Header Integration (`PageHeader.jsx`)**:
  - Automatically renders the back button when `showBack` or `backFallback` is provided, matching the current theme and spacing.
- **Route Fallback Inventory**:
  - Role dashboards: `/farmer/dashboard`, `/dairy-owner/dashboard`, `/veterinarian/dashboard`, `/medical-provider/dashboard`, `/admin/dashboard`.
  - Child sections map reliably to parent lists (e.g. Scan History ➔ AI Scanner, Complaint Details ➔ Complaints List).
- **Unit Testing Suite (`client/test/navigation.test.js`)**:
  - 4 automated suites verifying English/Marathi translations, role dashboard resolution, history decision logic, and fallback map integrity.

### 2. Dairy Owner Module: Dual Milk Type Selection (Cow & Buffalo)
- **Database Schema & Compound Index (`server/src/models/MilkCollection.js`)**:
  - Added `milkType: { type: String, enum: ['cow', 'buffalo'], default: 'cow', required: true }`.
  - Updated compound unique index from `{ dairyOwner, farmer, collectionDate, session }` to `{ dairyOwner, farmer, collectionDate, session, milkType }`.
  - Dairy owners can now record both cow milk and buffalo milk entries for the same farmer during the same morning or evening session without duplicate key errors (`E11000`).
- **REST Controller (`server/src/controllers/milkCollectionController.js`)**:
  - Extracts and validates `milkType` in `createCollection`.
  - Supports `?milkType=cow` and `?milkType=buffalo` query filtering in collection histories and reports.
- **User Interface (`MilkCollection.jsx` & `MilkCollections.jsx`)**:
  - Modern toggle selector in the entry form: **🐄 Cow Milk** | **🐃 Buffalo Milk**.
  - History filter toolbar supports filtering by milk type.
  - Clear visual badges displayed across table rows and mobile card views.

### 3. Farmer Module: Prescription-Driven Medicine Catalog
- **Problem Solved**:
  - Previously, uploading a prescription file returned every medicine in the catalog regardless of what was prescribed.
- **Smart Keyword Extraction (`server/src/controllers/medicineController.js`)**:
  - `processPrescription` extracts candidate medicine terms from `prescribedMedicinesText`, OCR fields, and the uploaded filename while discarding common stop words (`rx`, `tab`, `syrup`, `prescription`, `mg`, `ml`).
  - Matches candidate tokens strictly against active pharmacy inventory.
  - Only medicines mentioned in the prescription and currently available in stock are returned in `matchingMedicines`. Unavailable prescribed items are categorized in `extractedMedicines`.
  - If no prescribed terms match inventory, an empty result set (`[]`) is returned rather than dumping the entire catalog.
- **Farmer UI (`Medicines.jsx`)**:
  - Farmers can inspect and edit extracted medicine names directly below the prescription preview before searching stock.

### 4. AI Cattle Diagnostics: Male Cattle Support (`bull`, `ox`)
- **Schema Fix (`server/src/models/DiseaseScan.js`)**:
  - Expanded `animalType` enum to include `['cow', 'bull', 'ox', 'buffalo', 'cattle', 'goat', 'sheep', 'other']`.
  - Prevents Mongoose `ValidationError` ("`bull` is not a valid enum value for path `animalType`") when screening male cattle.
- **Gender-Aware Disease Filtering (`aiDiseaseService.js`)**:
  - Filters out female-only conditions (e.g. Bovine Mastitis, udder swelling) when screening bulls or oxen, preventing clinically impossible diagnostic predictions.

### 5. Veterinarian Clinical Workflow: Direct Calling & Follow-up Physical Examination
- **Direct Calling Integration (Farmer ↔ Doctor)**:
  - **Doctor Workspace (`ClinicalWorkspaceModal.jsx` & `PendingCases.jsx`)**: Activated one-click phone dialer (`tel:${farmer.phone}`) in the farmer profile card and pending case list.
  - **Farmer Workspace (`FarmerCaseDetailModal.jsx`)**: Added direct "Call Doctor" button in the case details header linking directly to `tel:${veterinarian.phone}`.
- **Follow-up Physical Examination (`server/src/models/VetRequest.js`)**:
  - Added `physicalExamination` subdocument under `followUp`:
    - `conducted`: Boolean flag.
    - `examinedAt`: Date of clinical follow-up visit.
    - `temperature`: Physical body temperature.
    - `appetite`: Clinical appetite status (`normal`, `reduced`, `poor`).
    - `physicalFindings`: Doctor's on-site physical examination observations.
    - `recoveryStatus`: Assessment (`recovering`, `fully_recovered`, `stable`, `deteriorating`).
    - `observations`: Prescribed directives and dietary/medical care guidelines.
- **Workspace UI**:
  - Dedicated Follow-up Physical Examination card in Tab 5 of `ClinicalWorkspaceModal.jsx`.
  - Displays recorded follow-up examination findings directly to the farmer in `FarmerCaseDetailModal.jsx`.

### 6. Admin Control Center: Metrics & Reporting Realignment
- **Total Registered Users**: Fixed metric in `AdminDashboard.jsx` and `adminController.js` to accurately aggregate actual registered system users.
- **System Reports**: Split Medical Providers and Veterinarians into distinct metrics in `Reports.jsx` and `reportController.js`, giving administrators clear visibility into both healthcare pillars.

### 7. Phase 30.1 Verification Status
- **Server Code Syntax**: Passed `node -c` with 0 errors across all updated models, services, and controllers.
- **Client Build**: Compiled with `vite v8.3.2` production bundle in 1.10s without errors.
- **Automated Tests**: 15/15 tests passing (`navigation.test.js` and `statusMap.test.js`).



