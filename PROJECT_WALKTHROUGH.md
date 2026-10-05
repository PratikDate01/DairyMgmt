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
│  - Milk Collection & Settlement   │ 🔴 Not Implemented / Future Scope  │
│  - Cattle Profile Management      │  - SMS Gateway Integration (Twilio)│
│  - Veterinary Medicine Catalog    │  - Real-time WebSockets / Push     │
│  - Medicine Request Workflow      │  - Online Payment Gateway (Razorpay│
│  - AI Disease Scanner             │  - PDF Export / Invoice Printing   │
│  - Vet Recommendation Engine (100)│  - Video Consultation Call         │
│  - Vet Request Consultation Flow  │                                    │
│  - Basic Automated Escalation     │                                    │
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

## 11. Developer Map: "Where Do I Change X?"

| If you want to modify... | Target File(s) |
| :--- | :--- |
| **Login, Multi-Role Selection & Registration UI** | `client/src/components/LoginPage.jsx` & `server/src/controllers/authController.js` |
| **Cattle Management UI & API** | `client/src/pages/farmer/CattleManagement.jsx` & `server/src/controllers/cattleController.js` |
| **AI Disease Analysis Engine** | `server/src/services/aiDiseaseService.js` |
| **Veterinarian Recommendation Scoring (Max 100)** | `server/src/controllers/diseaseScanController.js` & `VeterinarianRecommendations.jsx` |
| **Veterinarian Escalation Engine** | `server/src/controllers/vetRequestController.js` & `server/src/models/VetRequest.js` |
| **Farmer Request Tracker & Referral History UI** | `client/src/pages/farmer/FarmerVetRequests.jsx` & `vetRequestService.js` |
| **Veterinarian Incoming & Referred Cases Console** | `client/src/pages/veterinarian/PendingCases.jsx` & `CaseDetailModal.jsx` |
| **Milk Collections & Settlements** | `server/src/controllers/milkCollectionController.js` & `paymentController.js` |

---

## 12. Project Viva Questions & Answers

### Advanced Phase Questions (10)
1. **Q: How does the system handle veterinarian escalation when a doctor declines a request?**
   *A: When a doctor declines, `rejectVetRequest` records the doctor in `escalationHistory`, gathers all attempted doctor IDs, and invokes `findNextEligibleVeterinarian`. The system ranks non-attempted active veterinarians using the Phase 20 scoring algorithm, reassigns the single `VetRequest` document to the top candidate, and sets status back to `pending`.*
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

## 13. Student & Viva Summary

> "Our project is a **Dairy & Medical Management System** built using the MERN stack (MongoDB, Express, React, Node.js). It solves manual milk logging friction, financial settlement disputes, veterinary medicine supply gaps, cattle health tracking, and veterinarian referral bottlenecks in rural communities.
> 
> The platform supports five distinct user roles (**Farmers, Dairy Owners, Medical Providers, Veterinarians, and Administrators**) with single-email multi-role account switching.
> 
> Dairy Owners log daily shift milk collections and settle unpaid dues through a transparent payment ledger. Farmers manage cattle profiles, track earnings, order veterinary medicines, and scan cattle photos using an AI disease screening tool. 
> 
> Scanned cases generate ranked veterinarian recommendations based on a 100-point suitability engine. When a farmer submits a consultation request, the assigned veterinarian can accept or decline. Declines or response timeouts automatically trigger our **Basic Veterinarian Escalation Engine**, which excludes attempted doctors, selects the next top-ranked veterinarian, updates the request history, and forwards the case seamlessly without duplicate records or complex background workers."
