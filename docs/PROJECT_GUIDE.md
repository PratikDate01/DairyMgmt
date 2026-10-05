# Cattle Healthcare & Management System
## Complete Website Guide, Features, Operations & User Flow

---

## 1. Project Overview

### What is the Cattle Healthcare & Management System?
The **Cattle Healthcare & Management System** (internally branded as **Gauseva**) is a full-stack, multi-role web platform engineered to modernize rural agricultural operations, livestock health management, veterinary telemedicine, and dairy supply chain transactions.

### What is its Purpose?
The system provides a unified digital ecosystem connecting five primary stakeholder groups:
1. **Farmers (Livestock Owners & Milk Producers)**
2. **Veterinarians (Licensed Veterinary Professionals)**
3. **Dairy Owners (Milk Collection Center Operators)**
4. **Medical Providers (Veterinary Pharmacies & Clinics)**
5. **System Administrators (Supervisors & Compliance Monitors)**

### What Real-World Problems Does It Address?
- **Manual Milk Accounting Discrepancies:** Replaces error-prone paper logs with validated morning/evening milk intake entries, automated fat-based rate calculations, and compound unique constraints preventing double logging.
- **Delayed & Disputed Financial Settlements:** Eliminates payment friction by automatically filtering unsettled milk logs, generating settlement previews, recording payment modes (Cash, Bank Transfer, UPI), and preventing double payout settlement.
- **Fragmented Veterinary Supply Chains:** Provides a live inventory catalog for local veterinary clinics, enabling farmers to order essential medicines with atomic stock reservation and order tracking.
- **Delayed Cattle Healthcare & Diagnostic Reach:** Eliminates rural diagnostic delays by offering instant AI image screening for cattle health conditions (such as Lumpy Skin Disease, Mastitis, Foot & Mouth Disease), coupled with automated veterinarian recommendations.
- **Stranded Consultation Requests:** Solves doctor unavailability through a single-document **Basic Veterinarian Escalation Engine**. When a doctor declines or times out, the request is automatically reassigned to the next suitable veterinarian without duplicating records or stranding the farmer.
- **Single-Email Multi-Role Friction:** Allows individuals with multiple real-world responsibilities (e.g., a farmer who is also a veterinarian) to operate under a single email account with seamless active role switching (`activeRole`).

---

## 2. Technology Stack

The project is built using a modern JavaScript stack with client-side rendering and RESTful API backend architecture:

### Frontend Technologies
- **React (v19.2.8):** Component-based UI engine utilizing modern hooks (`useState`, `useEffect`, `useContext`).
- **Vite (v8.3.0):** Next-generation build tool and dev server featuring fast Hot Module Replacement (HMR).
- **React Router DOM (v7.18.4):** Client-side router enforcing authentication guards (`ProtectedRoute`) and role guards (`RoleRoute`).
- **Tailwind CSS (v4.3.3 via `@tailwindcss/vite`):** Utility-first styling framework powering responsive layouts, modal dialogs, and custom color tokens.
- **Lucide React (v1.50.0):** Clean icon library used across navigation, badges, stat cards, and clinical widgets.
- **Native Fetch API:** Encapsulated in modular service files (`authService`, `vetRequestService`, `cattleService`, `paymentService`, `medicineService`, etc.) handling Bearer token authorization headers.

### Backend Technologies
- **Node.js (v24 ES Modules `import/export`):** Asynchronous JavaScript runtime environment.
- **Express.js (v5.2.1):** Web framework managing middleware pipelines, CORS policy, JSON parsing, and REST endpoint routing.
- **MongoDB & Mongoose ODM (v9.10.3):** Document database and object modeling engine with schema validation, compound indexes, and Time-To-Live (TTL) indexes.
- **JSONWebToken (`jsonwebtoken` v9.0.3):** Statess-aware JWT session token management embedding user identity, registered roles, and active role.
- **Node.js Crypto Module:** Native cryptographic engine for `crypto.randomInt` (OTP creation), SHA-256 hashing, and timing-safe byte comparison (`crypto.timingSafeEqual`).
- **Brevo API (v3 SMTP Email API):** Transactional email delivery service sending 6-digit OTP verification codes.

---

## 3. User Roles

The platform strictly segregates capabilities across five distinct user roles stored in the database:

| Role | Target User | Main Operations |
| :--- | :--- | :--- |
| **Farmer** | Milk Producer & Livestock Owner | Manage cattle profiles; View milk collection logs & receipts; Browse veterinary catalog & submit orders; Run AI disease scans; Receive doctor recommendations; Request consultations; Track request escalation. |
| **Veterinarian** | Licensed Veterinary Doctor | Access incoming consultation requests; Review cattle AI disease scans & photos; Accept or decline cases (triggering auto-escalation); Record clinical diagnosis notes. |
| **Dairy Owner** | Milk Collection Center Manager | Search & connect with registered farmers; Record morning/evening shift milk entries; Filter unpaid collections; Generate payment settlements & preview ledgers. |
| **Medical Provider** | Veterinary Pharmacy / Clinic | Maintain pharmacy inventory (price, stock, unit, availability); Process farmer medicine orders (Accept → Pack → Ready → Complete / Cancel). |
| **Admin** | System Supervisor | Global overview access; View analytics across all modules; Access all dashboards, reports, and transaction logs. |

---

## 4. Authentication

Access control relies on a passwordless, 6-digit Email OTP authentication workflow:

```
User Enters Email
       │
       ▼
System Generates 6-Digit OTP
       │
       ▼
SHA-256 Hash Stored in DB (5-Min TTL) + Email Sent (Brevo API)
       │
       ▼
User Submits Received OTP
       │
       ▼
Backend Performs Timing-Safe Verification & Attempt Check
       │
       ▼
JWT Bearer Token Issued (Includes User ID, Registered Roles, Active Role)
       │
       ▼
User Redirected to Active Role Dashboard
```

### Key Security & Operational Properties:
- **Passwordless Entry:** Users do not need to memorize passwords.
- **Timing-Safe Comparison:** Hashed OTP values are verified using `crypto.timingSafeEqual` to prevent timing side-channel attacks.
- **Attempt Throttling:** Maximum 3 verification attempts per OTP before automatic invalidation.
- **Rate Limit Cooldown:** 60-second resend cooldown timer enforced server-side.
- **MongoDB TTL Index:** Temporary OTP records automatically expire and purge after 300 seconds (5 minutes).

---

## 5. Multi-Role Account Architecture

A fundamental innovation of this system is **Single-Email Multi-Role Support**.

```
                   user@example.com
                          │
            ┌─────────────┴─────────────┐
            ▼                           ▼
    Registered Roles            Active Role Session
  ['farmer', 'veterinarian']      activeRole: 'farmer'
```

### Why Multi-Role Support Matters:
In agricultural communities, a single individual often holds overlapping roles (e.g., a local livestock farmer who is also a licensed veterinarian, or a farmer operating a local dairy collection point). 

### How It Works:
1. **Single Database Document:** The user's email maps to a single `User` document containing an array field: `roles: ['farmer', 'veterinarian']`.
2. **Role Selection on Login:** When a multi-role user enters their email on the login screen, the system detects their registered roles and prompts them to select which role they want to enter for the current session.
3. **Session Token Isolation:** Upon verifying OTP, the returned JWT token encodes `roles` (all allowed roles) and `activeRole` (the specific role selected for the session).
4. **Context Switching:** Users can switch their `activeRole` at any time from the top navigation header without re-authenticating.

---

## 6. Farmer Module

The **Farmer Module** serves as the central hub for cattle management, healthcare, dairy intake tracking, and pharmacy procurement.

### Key Pages & Capabilities:
- **Farmer Dashboard (`/farmer/dashboard`):** Overview stats showing total registered cattle, recent milk collection totals, pending veterinarian requests, and active medicine orders.
- **My Cattle (`/farmer/cattle`):** Add, view, edit, and filter registered livestock profiles.
- **AI Health Scanner (`/farmer/ai-scanner`):** Select a specific cattle profile, upload/capture a symptom image, describe symptoms, and run instant AI disease screening.
- **Scan History (`/farmer/scan-history`):** View historical AI disease screening reports, risk levels, and attached veterinarian review notes.
- **My Vet Requests (`/farmer/vet-requests`):** Track consultation requests submitted to veterinarians, view forwarded/escalated statuses, inspect detailed escalation history, and trigger manual escalation.
- **Medicines Catalog (`/farmer/medicines`):** Browse veterinary medicines listed by local medical providers, filter by category or stock availability, and upload optional prescription photos.
- **Medicine Requests (`/farmer/medicine-requests`):** Track placed medicine orders and view fulfillment state changes (Pending → Accepted → Packed → Ready → Completed).
- **Dairy Connections (`/farmer/connections`):** Manage active and pending connection requests with local Dairy Owners.
- **Milk Collections (`/farmer/milk-collections`):** View logged milk intake records, fat percentages, shift details, and settlement statuses.
- **Payments & Receipts (`/farmer/payments`):** Inspect received payment settlements, payment modes, gross totals, and settled milk log breakdowns.
- **Farmer Reports (`/farmer/reports`):** Visual charts and analytics summarizing monthly milk production and financial income.

---

## 7. Cattle Management

The **Cattle Management Module** allows farmers to maintain digital identity cards for every animal in their herd.

### Workflow:
`Farmer` → `My Cattle` → `Add New Cattle` → `Fill Details` → `Save` → `Cattle Card Created`

### Data Fields Managed:
- **Cattle Name / Tag Number:** e.g., "Gauri - Tag #104" (Required)
- **Breed:** e.g., Gir, Sahiwal, Holstein Friesian, Jersey, Desi (Required)
- **Gender:** Female (Cow/Heifer) or Male (Bull/Ox)
- **Age:** Age in years
- **Health Status:** Healthy, Under Observation, or Critical
- **Cattle Photo:** Image URL or uploaded file
- **Last Health Check:** Automated timestamp updated whenever an AI scan is conducted.

---

## 8. AI Health Check

The **AI Health Check Engine** provides rapid preliminary diagnostic screening for cattle skin lesions, udder inflammation, and visible symptoms.

```
Select Cattle Profile ──► Upload/Capture Image ──► Enter Symptoms ──► Submit
                                                                         │
                                                                         ▼
AI Pattern Analysis ◄── Diagnostic Logic Engine ◄────────────────────────┘
        │
        ├─ Detected Condition (e.g. Mastitis, Lumpy Skin, Foot & Mouth)
        ├─ Confidence Score (e.g. 92%)
        ├─ Risk Rating (High / Moderate / Low)
        └─ Recommended Actions + Trigger Veterinarian Recommendation
```

> **IMPORTANT DISCLAIMER:** AI screening is strictly **preliminary** and designed to flag urgent health concerns. It does **NOT** replace a licensed veterinarian's final clinical diagnosis.

---

## 9. AI Scan History

The **Scan History (`/farmer/scan-history`)** page provides an immutable audit trail of all health screenings conducted for a farmer's herd.

### Features:
- Filter scan records by individual cattle profile.
- View detected condition, confidence percentage badge, and symptom summaries.
- Inspect timeline logs (`AI_SCREENING_COMPLETED`, `VET_REQUESTED`, `VET_ACCEPTED`, `VET_REJECTED`).
- Access attached doctor review notes once evaluated by a veterinarian.

---

## 10. Veterinarian Recommendation

Following an AI health screening, the system automatically runs the **Phase 20 Recommendation Algorithm** to match the farmer with the most suitable nearby veterinarians.

### 100-Point Suitability Scoring Model:
$$\text{Total Score} = \text{Base (10)} + \text{Expertise Match (40)} + \text{Availability (30)} + \text{Risk Suitability (20)}$$

1. **Base Suitability (+10 pts):** Awarded to all active, registered veterinarians.
2. **Condition & Expertise Match (+40 pts):** Awarded if doctor's specialization or listed expertise matches the AI-detected condition (e.g., Mastitis, Lumpy Skin).
3. **Availability Match (+30 pts):** Awarded if doctor availability is set to `available` (0 pts for `busy` or `offline`).
4. **High-Risk Suitability (+20 pts):** Awarded if screening confidence $\ge 80\%$ or condition is marked critical.

> **Note:** Recommendation ranking displays match badges (*Best Match*, *Recommended*, *Available*) but does **NOT** automatically assign the doctor. The farmer selects their preferred veterinarian to send a formal consultation request.

---

## 11. Veterinarian Request Workflow

The **Veterinarian Request System** enables stateful consultation requests between farmers and veterinarians.

```
Farmer Sends Request ──► VetRequest Created (Status: pending)
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
       Doctor Accepts                   Doctor Declines
 (Status: accepted, Timeline updated)  (Triggers Auto-Escalation Engine)
```

### Data Recorded in `VetRequest`:
- Farmer ID & Cattle ID
- DiseaseScan reference & AI Condition
- Risk level & Symptoms
- Optional Farmer Note ("Please inspect Gauri's udder urgently")
- Timestamps (`requestedAt`, `respondedAt`)

---

## 12. Basic Veterinarian Escalation

When a requested veterinarian declines a case or fails to respond within the configurable timeout period (`VET_REQUEST_TIMEOUT_MINUTES`), the **Basic Veterinarian Escalation Engine** automatically forwards the case.

```
Request Pending with Dr. A
            │
            ▼
   Dr. A Declines / Times Out
            │
            ▼
System records Dr. A in escalationHistory
            │
            ▼
System queries non-attempted active vets
            │
            ▼
Ranks candidates via 100-Point Algorithm
            │
            ▼
Assigns Dr. B (Status: pending) ──► Re-assigned Request delivered to Dr. B
```

### Key Engineering Features:
- **Single Document Continuum:** Reassigns the single `VetRequest` document without creating duplicate records.
- **Attempt Tracking (`escalationHistory`):** Stores past attempted doctors, decline reasons, and timestamps.
- **Candidate Exclusion:** Prevents previously attempted doctors from being re-selected (`$nin: attemptedVetIds`).
- **Terminal Fallback State:** If all registered veterinarians have been attempted, sets `status: 'rejected'` with `rejectionReason: "No other suitable veterinarian is currently available."`.
- **Farmer Referral Timeline:** Displays visual history in farmer modal (`Dr. A [Declined] → Reassigned to Dr. B [Pending]`).
- **Referred Request Badge:** Displays `🔁 Referred Request` tag in doctor console.

---

## 13. Veterinarian Module

The **Veterinarian Module** equips licensed doctors with clinical review tools.

### Pages & Tools:
- **Veterinarian Dashboard (`/veterinarian/dashboard`):** Overview metrics showing pending consultation requests, active cases, and recent completed evaluations.
- **Clinical Console (`/veterinarian/cases`):**
  - **Incoming Requests Tab:** Direct farmer requests assigned to doctor. Shows cattle details, AI condition, farmer note, and referral badges. Doctor can **Accept** or **Decline & Find Another Vet**.
  - **Disease Cases Queue Tab:** Filterable list of general cattle health screenings (`pending_review`, `under_review`, `review_completed`).
- **Case Review Modal (`CaseDetailModal.jsx`):** Detailed view displaying high-res scan image, AI confidence, reported symptoms, and input fields for clinical evaluation notes.

---

## 14. Diagnosis & Prescription

### Currently Supported (Implemented):
- **Clinical Evaluation Notes:** Doctors submit evaluation notes, treatment recommendations, and follow-up flags via the Case Review Modal.
- **Timeline Updates:** Evaluation notes attach directly to the `DiseaseScan` record and appear in the farmer's scan history.

### Planned / Future Module:
- **Digital Prescription Signatures & PDF Generator (Phase 24):** Formal digital prescription signing, Rx document generation, and direct pharmacy dispatch.

---

## 15. Medicine Module

The **Medicine Module** connects farmers with veterinary pharmacies for essential animal medications.

### Features:
- **Public Pharmacy Catalog (`/farmer/medicines`):** Farmers search medications by name, category, or target condition.
- **Prescription Attachment:** Farmers can attach prescription image URLs or photos when placing order requests.
- **Order Tracking (`/farmer/medicine-requests`):** Farmers track real-time order status updates.

---

## 16. Medical Store / Medical Provider

The **Medical Provider Module** enables veterinary pharmacies to manage inventory and fulfill farmer orders.

### Features:
- **Provider Dashboard (`/medical-provider/dashboard`):** Overview of active inventory items, low-stock warnings, and pending order requests.
- **Inventory Management (`/medical-provider/inventory`):** Full CRUD for medicines (Name, Description, Category, Price, Stock Quantity, Unit, In-Stock toggle).
- **Order Fulfillment Console (`/medical-provider/medicine-requests`):** Stateful order processing console:
  $$\text{Pending} \xrightarrow{\text{Accept (Deducts Stock)}} \text{Accepted} \xrightarrow{\text{Pack}} \text{Packed} \xrightarrow{\text{Ready}} \text{Ready for Pickup} \xrightarrow{\text{Complete}} \text{Completed}$$
  *(If cancelled at any stage, inventory stock is automatically restored).*

---

## 17. Fodder Marketplace

### Status: Planned / Future Feature (Phase 27)
- **Concept:** Peer-to-peer marketplace allowing farmers and fodder suppliers to list green fodder, dry hay, silage, and feed supplements with location filtering and price per ton.

---

## 18. Dairy Module

The **Dairy Owner Module** manages daily milk intake operations between collection centers and connected dairy farmers.

### Workflow:
1. **Farmer Connection:** Dairy Owner searches farmer by registered phone number and sends connection request (`/dairy-owner/farmers`). Farmer accepts (`/farmer/connections`).
2. **Milk Intake Entry (`/dairy-owner/milk-collection`):** Dairy Owner selects connected farmer, shift session (Morning/Evening), quantity in liters, and fat percentage.
3. **Automated Calculation:** Backend derives per-liter rate based on fat percentage and calculates authoritative total amount:
   $$\text{Total Amount} = \text{Math.round}(\text{Quantity Liters} \times \text{Rate Per Liter} \times 100) / 100$$
4. **Duplicate Protection:** Compound unique index (`dairyOwner + farmer + collectionDate + session`) prevents logging duplicate shift entries for the same farmer.

---

## 19. Milk & Payment Settlement

The **Payment Settlement Engine** streamlines financial payouts from Dairy Owners to Farmers.

```
Filter Unpaid Milk Logs ──► Generate Settlement Preview ──► Select Payment Mode ──► Execute Settlement
                                                                                       │
                                                                                       ▼
Milk Logs Marked 'settled' ◄── Payment Record Created ◄── Ledger Balances Updated ─────┘
```

### Key Capabilities:
- **Unpaid Log Aggregation:** Automatically groups all unsettled milk intake records for a selected farmer.
- **Partial Payment Handling:** Supports partial payout entries while maintaining accurate remaining balances.
- **Double-Settlement Protection:** Settled milk logs store the `paymentId` reference and cannot be included in future settlement runs.
- **Payment Receipts:** Farmers view itemized settlement receipts (`/farmer/payments`) detailing payment date, gross amount, paid amount, remaining balance, and payment mode (Cash, Bank Transfer, UPI).

---

## 20. Admin Module

The **Admin Module** provides global oversight capabilities across all system modules.

### Access & Capabilities:
- **Admin Dashboard (`/admin/dashboard`):** System-wide summary cards showing total registered users, farmer counts, active dairies, total milk collected, gross financial payouts, and disease screening metrics.
- **Admin Reports (`/admin/reports`):** Aggregated reporting views with system-wide date filtering and financial summaries.
- **Universal Route Access:** Admin users (`role: 'admin'`) can access all role routes (`/farmer/*`, `/dairy-owner/*`, `/medical-provider/*`, `/veterinarian/*`) as a global supervisor.

---

## 21. Role Permission Matrix

| Operation | Farmer | Veterinarian | Dairy Owner | Medical Provider | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Email OTP Authentication** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Active Role Switching** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Manage Cattle Profiles** | ✓ | — | — | — | ✓ |
| **Run AI Health Check** | ✓ | — | — | — | ✓ |
| **View AI Recommendations** | ✓ | — | — | — | ✓ |
| **Submit Vet Consultation Request** | ✓ | — | — | — | ✓ |
| **Trigger Request Escalation** | ✓ | — | — | — | ✓ |
| **Accept / Decline Vet Request** | — | ✓ | — | — | ✓ |
| **Review Disease Case Queue** | — | ✓ | — | — | ✓ |
| **Manage Pharmacy Inventory** | — | — | — | ✓ | ✓ |
| **Fulfill Medicine Orders** | — | — | — | ✓ | ✓ |
| **Connect with Farmers** | — | — | ✓ | — | ✓ |
| **Record Shift Milk Intake** | — | — | ✓ | — | ✓ |
| **Execute Financial Settlements** | — | — | ✓ | — | ✓ |
| **View System-Wide Reports** | — | — | — | — | ✓ |

---

## 22. Complete System Flow

```
                                  ┌──────────────────────────┐
                                  │   Email OTP Login Page   │
                                  └────────────┬─────────────┘
                                               │
                                               ▼
                                  ┌──────────────────────────┐
                                  │   Select Active Role     │
                                  └────────────┬─────────────┘
                                               │
               ┌───────────────────────┬───────┴───────┬───────────────────────┐
               ▼                       ▼               ▼                       ▼
       Farmer Dashboard        Dairy Dashboard  Medical Dashboard        Vet Console
               │                       │               │                       │
     ┌─────────┴─────────┐             │               │                       │
     ▼                   ▼             ▼               ▼                       ▼
Add Cattle        AI Health Check  Log Milk      Manage Pharmacy         Review Cases
     │                   │          Intake           Inventory                 │
     ▼                   ▼             │               │                       │
Profile Card       Rec Engine       Process         Process                  Accept /
  Created        (Max 100 Score)   Settlement        Orders                 Decline &
                         │                                                   Escalate
                         ▼
                   Send Vet Request
                         │
                         ▼
                   Auto Escalation
                    (If Declined)
```

---

## 23. Farmer End-to-End Flow

```
Login ──► Select Farmer Role ──► Dashboard ──► My Cattle ──► Register Cattle Tag
                                                                    │
                                                                    ▼
View Diagnosis Notes ◄── Track Request ◄── Send Request ◄── AI Health Check
         │                   │                                      │
         ▼                   ▼                                      ▼
View Milk Receipts ◄── Order Medicines ◄───────────── View Recommendations
```

---

## 24. Veterinarian End-to-End Flow

```
Login ──► Select Veterinarian Role ──► Clinical Console ──► Incoming Requests Tab
                                                                   │
                                                                   ▼
Submit Clinical Review Notes ◄── Accept Request ◄── Inspect AI Condition & Cattle
                                       │
                                       ▼ (If Declined)
                        System Auto-Escalates Request to Next Doctor
```

---

## 25. Dairy Owner Flow

```
Login ──► Dairy Dashboard ──► Search Farmer Phone ──► Send Connection Request
                                                             │
                                                             ▼
Filter Unpaid Logs ◄── Record Shift Milk Intake ◄── Farmer Accepts Connection
        │
        ▼
Execute Settlement Preview ──► Record Payment (Cash/UPI) ──► Print/View Receipts
```

---

## 26. Medical Provider Flow

```
Login ──► Medical Dashboard ──► Inventory Page ──► Add Medicine (Price/Stock)
                                                         │
                                                         ▼
Complete Request ◄── Ready for Pickup ◄── Pack ◄── Accept Order (Deducts Stock)
```

---

## 27. Admin Flow

```
Login ──► Admin Dashboard ──► View System Overview ──► Inspect Reports & Ledgers
```

---

## 28. Page / Route Directory

| Route | Component Page | Allowed Roles | Purpose |
| :--- | :--- | :--- | :--- |
| `/login` | `LoginPage.jsx` | Public | Email OTP entry, role selection, registration |
| `/` or `/dashboard` | `DashboardRedirect.jsx` | All Authenticated | Smart router redirecting `/` to active role dashboard |
| `/farmer/dashboard` | `FarmerDashboard.jsx` | `farmer`, `admin` | Farmer metrics & quick actions |
| `/farmer/cattle` | `MyCattle.jsx` | `farmer`, `admin` | Cattle profile CRUD management |
| `/farmer/ai-scanner` | `AIDiseaseScanner.jsx` | `farmer` | AI image screening & symptom input |
| `/farmer/scan-history` | `ScanHistory.jsx` | `farmer`, `admin` | Scan history & clinical review notes |
| `/farmer/vet-requests` | `FarmerVetRequests.jsx` | `farmer`, `admin` | Request tracker, escalation timeline, manual trigger |
| `/farmer/medicines` | `FarmerMedicines.jsx` | `farmer`, `admin` | Pharmacy catalog & order modal |
| `/farmer/medicine-requests` | `FarmerMedicineRequests.jsx` | `farmer`, `admin` | Order tracking & cancellation |
| `/farmer/connections` | `DairyConnections.jsx` | `farmer`, `admin` | Dairy connection manager |
| `/farmer/milk-collections` | `MilkCollections.jsx` | `farmer`, `admin` | Farmer milk intake log history |
| `/farmer/payments` | `FarmerPayments.jsx` | `farmer`, `admin` | Received settlement receipts |
| `/farmer/reports` | `FarmerReports.jsx` | `farmer`, `admin` | Personal milk & income charts |
| `/veterinarian/dashboard` | `VeterinarianDashboard.jsx` | `veterinarian`, `admin` | Doctor clinical console summary |
| `/veterinarian/cases` | `PendingCases.jsx` | `veterinarian`, `admin` | Incoming requests, cases queue, decline/accept |
| `/dairy-owner/dashboard` | `DairyOwnerDashboard.jsx` | `dairyOwner`, `admin` | Dairy intake overview metrics |
| `/dairy-owner/milk-collection` | `MilkCollection.jsx` | `dairyOwner`, `admin` | Shift milk entry logging |
| `/dairy-owner/payments` | `Payments.jsx` | `dairyOwner`, `admin` | Settlement engine & payment ledger |
| `/dairy-owner/reports` | `DairyOwnerReports.jsx` | `dairyOwner`, `admin` | Dairy volume & financial analytics |
| `/dairy-owner/farmers` | `ConnectedFarmers.jsx` | `dairyOwner`, `admin` | Search & connect with farmers |
| `/medical-provider/dashboard` | `MedicalProviderDashboard.jsx` | `medicalProvider`, `admin` | Pharmacy overview & stock warnings |
| `/medical-provider/inventory` | `Inventory.jsx` | `medicalProvider`, `admin` | Inventory CRUD & stock toggles |
| `/medical-provider/medicine-requests` | `MedicalMedicineRequests.jsx` | `medicalProvider`, `admin` | Order fulfillment state pipeline |
| `/admin/dashboard` | `AdminDashboard.jsx` | `admin` | System-wide admin overview |
| `/admin/reports` | `AdminReports.jsx` | `admin` | Aggregated cross-module reporting |

---

## 29. Feature Directory

| Feature | Module | Primary Role | Implementation Status |
| :--- | :--- | :--- | :--- |
| Email OTP Authentication | Auth | All Roles | 🟢 Implemented (Full Backend) |
| Single-Email Multi-Role Support | Auth | All Roles | 🟢 Implemented (Full Backend) |
| Cattle Profile CRUD | Cattle | Farmer | 🟢 Implemented (Full Backend) |
| AI Health Screening | Healthcare | Farmer | 🟢 Implemented (Full Backend + Service) |
| Vet Recommendation Engine (100 Max) | Healthcare | Farmer | 🟢 Implemented (Full Backend Algorithm) |
| Vet Consultation Request | Healthcare | Farmer / Vet | 🟢 Implemented (Full Backend) |
| Basic Vet Escalation Engine | Healthcare | System / Farmer | 🟢 Implemented (Full Backend Engine) |
| Clinical Case Review | Healthcare | Veterinarian | 🟢 Implemented (Full Backend) |
| Digital Prescription Signatures | Healthcare | Veterinarian | 🟡 Planned (Phase 24) |
| Pharmacy Inventory CRUD | Pharmacy | Medical Provider | 🟢 Implemented (Full Backend) |
| Medicine Request Pipeline | Pharmacy | Farmer / Provider | 🟢 Implemented (Full Backend) |
| Dairy Farmer Connections | Dairy | Dairy Owner / Farmer| 🟢 Implemented (Full Backend) |
| Milk Collection Intake Log | Dairy | Dairy Owner | 🟢 Implemented (Full Backend) |
| Financial Payout Settlement | Ledger | Dairy Owner / Farmer| 🟢 Implemented (Full Backend) |
| Fodder Marketplace | Marketplace | Farmer / Supplier | 🟡 Planned (Phase 27) |
| System Reports & Analytics | Reports | All Roles | 🟢 Implemented (Full Backend Pipeline) |

---

## 30. Database Architecture Overview

### Primary Mongoose Models:

1. **`User` (`users` collection):**
   - Stores account profile, email, phone, legacy primary `role`, `roles` array, and active availability flags for veterinarians.
2. **`OTP` (`otps` collection):**
   - Stores hashed OTPs with Mongoose TTL index (`expiresAt`) for automatic deletion after 5 minutes.
3. **`Cattle` (`cattles` collection):**
   - Stores individual cattle profiles, breed, age, health status, and owner reference.
4. **`DiseaseScan` (`disease_scans` collection):**
   - Stores AI screening results, detected conditions, confidence scores, symptoms, and doctor evaluation logs.
5. **`VetRequest` (`vet_requests` collection):**
   - Stores consultation requests, status (`pending`, `accepted`, `rejected`, `completed`, `escalated`), and the `escalationHistory` array tracking attempted doctors.
6. **`DairyFarmerConnection` (`dairy_farmer_connections` collection):**
   - Stores bilateral connection links between Dairy Owners and Farmers.
7. **`MilkCollection` (`milk_collections` collection):**
   - Stores shift milk intake logs, fat percentage, calculated total, and settlement status.
8. **`Payment` (`payments` collection):**
   - Stores financial payout settlements, paid amounts, remaining dues, and payment modes.
9. **`Medicine` (`medicines` collection):**
   - Stores pharmacy inventory items, pricing, stock levels, and provider references.
10. **`MedicineRequest` (`medicine_requests` collection):**
    - Stores farmer medicine orders, quantities, prescription links, and fulfillment state transitions.

---

## 31. Security

- **JWT Session Security:** Tokens carry encrypted user IDs, registered roles, and active session role.
- **Protected Client Routes:** React `ProtectedRoute` blocks unauthenticated users; `RoleRoute` enforces strict role authorization.
- **Server-Side Ownership Guards:** Controllers explicitly verify `req.user.id` against resource owner fields before executing updates or queries.
- **Timing-Safe OTP Checking:** Hashes are verified using `crypto.timingSafeEqual` to safeguard against timing attacks.
- **Compound Database Constraints:** Unique compound indexes prevent duplicate connection requests, duplicate milk shift entries, and duplicate pending vet requests.

---

## 32. Error & Edge Cases Handled

- **Invalid / Expired OTP:** Returns explicit error messages; invalidates OTP after 3 failed attempts.
- **Unauthorized Role Access:** Server returns `403 Forbidden`; client router redirects to active role dashboard.
- **Re-selecting Attempted Veterinarians:** Escalation engine strictly filters out previously attempted doctors (`$nin: attemptedVetIds`).
- **No Available Veterinarians:** Transitions request to terminal `rejected` state with clear user notification ("No other suitable veterinarian is currently available").
- **Double Settlement Prevention:** Settled milk logs cannot be included in secondary payment settlement runs.
- **Inventory Stock Exhaustion:** Prevents accepting medicine orders if requested quantity exceeds live inventory stock.

---

## 33. Mobile & Responsive Support

- **Tailwind Utility Layouts:** Standard responsive grid breakpoints (`sm:grid-cols-2`, `lg:grid-cols-4`).
- **Mobile Navigation Drawer (`MobileNavigation.jsx`):** Slide-out navigation menu for smartphones and tablets.
- **Touch-Friendly Buttons & Cards:** High-contrast buttons, flex wraps, and scrollable data tables prevent horizontal page overflow.

---

## 34. Demonstration Guide

To present this project effectively during a college evaluation, follow this 10-step sequence:

### Step 1: Passwordless OTP Login & Multi-Role Selection
1. Open `/login`.
2. Enter email registered with multiple roles (e.g. `farmer.vet@example.com`).
3. Select active role (e.g. **Farmer**).
4. Enter 6-digit OTP (check server console in dev mode).
5. Verify redirection to **Farmer Dashboard**.

### Step 2: Register Cattle Profile
1. Navigate to **My Cattle** (`/farmer/cattle`).
2. Click **Add New Cattle**.
3. Fill Tag Name (*Gauri - Tag #105*), Breed (*Gir*), Age (*4*), Health Status (*Healthy*).
4. Click **Register Cattle**.

### Step 3: Conduct AI Health Check & Recommendation
1. Navigate to **AI Health Scanner** (`/farmer/ai-scanner`).
2. Select *Gauri*.
3. Click demo sample image or upload photo.
4. Enter symptoms (*"Swollen udder, slight fever"*).
5. Click **Run AI Disease Screening**.
6. Review AI diagnosis result (*Mastitis*, *92% Confidence*, *High Risk*).
7. Review ranked **Veterinarian Recommendations** (showing 100-point suitability score).

### Step 4: Submit Veterinarian Consultation Request
1. Click **Request Consultation** on top-ranked doctor (e.g. *Dr. ABC*).
2. Enter optional message (*"Please inspect Gauri urgently"*).
3. Submit request. Verify status becomes `Pending`.

### Step 5: Veterinarian Console & Automatic Escalation
1. Switch role or log in as **Dr. ABC**.
2. Open **Veterinarian Clinical Console** (`/veterinarian/cases`).
3. Locate incoming request for *Gauri*.
4. Click **Decline**. Enter reason (*"Currently fully booked"*).
5. Confirm decline.
6. **Show Evaluator:** The system automatically executes escalation, records Dr. ABC in `escalationHistory`, and reassigns the request to *Dr. XYZ*.

### Step 6: Second Veterinarian Acceptance
1. Log in as **Dr. XYZ**.
2. Open **Clinical Console** (`/veterinarian/cases`).
3. Observe the **`🔁 Referred Request`** badge on *Gauri's* card.
4. Click **Accept Request**.

### Step 7: Farmer Escalation Timeline Audit
1. Log in as **Farmer**.
2. Open **My Vet Requests** (`/farmer/vet-requests`).
3. Observe current doctor is **Dr. XYZ (Accepted)**.
4. Click **View Details**. Show evaluator the **Veterinarian Escalation History** timeline (`Dr. ABC [Declined] → Reassigned to Dr. XYZ`).

### Step 8: Veterinary Pharmacy Inventory & Orders
1. Log in as **Medical Provider**.
2. Open **Inventory** (`/medical-provider/inventory`) and view medicine stock.
3. Log in as **Farmer**, open **Medicines Catalog** (`/farmer/medicines`), and place order.
4. Log back in as **Medical Provider** and transition order state (*Accept → Pack → Ready → Complete*). Show automatic stock deduction.

### Step 9: Dairy Collection & Payment Settlement
1. Log in as **Dairy Owner**.
2. Open **Milk Collection** (`/dairy-owner/milk-collection`). Record morning shift milk intake for connected farmer. Show automated total calculation.
3. Open **Payments** (`/dairy-owner/payments`). Filter unpaid collections, click **Preview Settlement**, and execute payment settlement.

### Step 10: Admin System Overview
1. Log in as **Admin**.
2. Open **Admin Dashboard** (`/admin/dashboard`) and **Reports** (`/admin/reports`).
3. Demonstrate global oversight cards and cross-module metrics.

---

## 35. Sample Presentation Script

> *"Good morning respected evaluators. Today we present our Diploma Final Year Project: the **Cattle Healthcare & Management System (Gauseva)**.*
> 
> *In traditional dairy farming, milk logging disputes, delayed payout settlements, fragmented medicine supply chains, and inaccessible livestock diagnostics create major operational losses. Our platform bridges these gaps across five distinct user roles: **Farmers, Dairy Owners, Medical Providers, Veterinarians, and Administrators**.*
> 
> *Key technical highlights of our platform include:*
> 1. *A **passwordless Email OTP system** with SHA-256 hashing and timing-safe security.*
> 2. *A **Single-Email Multi-Role architecture** allowing users to hold multiple roles and switch their active role seamlessly.*
> 3. *An **AI Health Scanner** that analyzes cattle symptoms and ranks registered veterinarians using a 100-point suitability algorithm.*
> 4. *A **Basic Veterinarian Escalation Engine** that automatically reassigns consultation requests if a doctor declines or times out, maintaining a single-document history without creating duplicate records.*
> 5. *An **Automated Financial Settlement Engine** for dairy owners that aggregates unpaid shift logs, handles partial payments, and prevents double-paying.*
> 6. *An **Atomic Veterinary Pharmacy Pipeline** that reserves and restores medicine inventory dynamically.*
> 
> *Let us now demonstrate the live application workflow."*

---

## 36. Current Project Status

| Module | Status | Implementation Notes |
| :--- | :--- | :--- |
| **Authentication & OTP** | 🟢 COMPLETED | Full Node.js Crypto, Brevo API, 5-min TTL, timing-safe checks |
| **Multi-Role Accounts** | 🟢 COMPLETED | `roles` array, `activeRole` selection, context switching |
| **Cattle Profile Management** | 🟢 COMPLETED | Full Mongoose CRUD, health status badges, health check logs |
| **AI Disease Scanner** | 🟢 COMPLETED | Image analysis service, confidence score, risk level |
| **Vet Recommendation Engine** | 🟢 COMPLETED | Normalized 100-point scoring model (Base + Expertise + Avail + Risk) |
| **Vet Request Workflow** | 🟢 COMPLETED | Stateful request lifecycle (`pending`, `accepted`, `rejected`) |
| **Vet Escalation Engine** | 🟢 COMPLETED | Single document continuum, `escalationHistory`, `$nin` candidate selection |
| **Vet Clinical Review** | 🟢 COMPLETED | Case queue, high-res scan inspection, clinical evaluation notes |
| **Pharmacy Inventory & Orders** | 🟢 COMPLETED | Inventory CRUD, order state machine, atomic stock deduction |
| **Milk Collection Intake** | 🟢 COMPLETED | Shift logging (Morning/Evening), fat rate calculation, duplicate index |
| **Financial Settlement Engine**| 🟢 COMPLETED | Unpaid log filter, settlement preview, partial payments, receipts |
| **Admin Reports & Dashboard** | 🟢 COMPLETED | System-wide metric cards, financial totals, cross-role analytics |
| **Digital Prescriptions (PDF)**| 🟡 PLANNED | Planned for Phase 24 |
| **Fodder Marketplace** | 🟡 PLANNED | Planned for Phase 27 |

---

## 37. Future Enhancements

1. **Digital Prescription PDF Generation (Phase 24):** Enable veterinarians to generate downloadable PDF prescriptions with digital signature validation.
2. **Fodder Marketplace (Phase 27):** Peer-to-peer fodder and feed supplement marketplace for rural farmers.
3. **SMS Gateway Integration (Twilio/Kaleyra):** Direct SMS OTP delivery for farmers without active email access.
4. **Online Payment Gateway Integration (Razorpay):** Direct UPI and net-banking payouts for dairy settlements and medicine purchases.
5. **Multi-Language UI (Hindi & Regional Languages):** Localization support for non-English rural users.

---

## 38. Quick User Guide

### For Farmers:
1. Log in with your email OTP and select **Farmer** role.
2. Register your cattle under **My Cattle**.
3. If an animal shows symptoms, open **AI Health Scanner**, take a photo, and run screening.
4. Review **Veterinarian Recommendations** and click **Request Consultation**.
5. Track request status under **My Vet Requests**. View escalation logs if request is forwarded.
6. Order veterinary medicines under **Medicines Catalog**.

### For Veterinarians:
1. Log in and select **Veterinarian** role.
2. Open **Clinical Console** (`/veterinarian/cases`).
3. Check **Incoming Requests** for direct or referred cases.
4. Click **Accept** to take the case, or **Decline & Find Another Vet** to escalate.
5. Provide clinical notes and recommendations.

### For Dairy Owners:
1. Log in and select **Dairy Owner** role.
2. Connect with farmers under **Connected Farmers**.
3. Record daily shift intake under **Milk Collection**.
4. Settle unpaid milk logs and issue payment receipts under **Payments**.

### For Medical Providers:
1. Log in and select **Medical Provider** role.
2. Add medicines and stock levels under **Inventory**.
3. Process incoming farmer orders under **Medicine Requests** (*Accept → Pack → Ready → Complete*).

---

## 39. Glossary

- **Active Role (`activeRole`):** The specific working role selected by a multi-role user for their current dashboard session.
- **AI Health Screening:** Preliminary automated pattern diagnostic performed on uploaded cattle symptom images.
- **Brevo API:** Transactional email delivery service used to send 6-digit OTP codes.
- **Compound Index:** Database index combining multiple fields to enforce business constraints (e.g., unique milk logs per shift).
- **DiseaseScan:** Mongoose database model storing AI diagnostic results, symptoms, confidence scores, and doctor review logs.
- **Escalation History (`escalationHistory`):** Array on a `VetRequest` document recording past attempted doctors, decline reasons, and timestamps.
- **Payment Settlement:** Financial transaction ledger record consolidating multiple unsettled milk intake logs into a single paid receipt.
- **Role-Based Access Control (RBAC):** Middleware security architecture restricting route access based on authenticated user roles.
- **TTL Index (Time-To-Live):** MongoDB feature that automatically deletes temporary database documents (like OTPs) after a specified expiration time.
- **VetRequest:** Mongoose database model representing a consultation request between a farmer and a veterinarian.

---

## 40. Important Limitations

1. **Preliminary AI Diagnostics:** AI health check results provide preliminary screening indicators and do **not** constitute a formal legal or medical diagnosis.
2. **REST-Based Timeout Escalation:** Response timeout escalation is processed via REST API calls without background cron server threads (designed purposefully for diploma project architecture).
3. **Email OTP Primary:** Authentication relies on email OTP delivery; SMS gateway integration is planned for future production phases.
4. **Local Hardware Constraints:** Camera access requires browser HTTPS or localhost permissions.

---
*Documentation compiled for Diploma Final Year Project Evaluation & Technical Audit.*
