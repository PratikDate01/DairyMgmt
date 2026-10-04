# Comprehensive Technical & Pedagogical Architecture Documentation
## Dairy & Medical Management System (Gauseva)

---

## 1. Project Overview

### What is this project?
The **Dairy & Medical Management System** (branded internally as **Gauseva**) is a full-stack web platform designed to streamline daily dairy operations and veterinary medicine supply chains. It acts as an integrated digital bridge linking dairy farmers, dairy owners (milk collection centers), veterinary medical providers, and system administrators.

### Why did we build it?
In traditional rural and semi-urban agricultural ecosystems, milk collection logging, fat-based payout calculations, and veterinary medicine procurement are managed through manual paper registers or fragmented communication channels. This leads to operational friction:
- **Discrepancies in milk logs:** Manual entries often lead to mathematical errors in total quantity, fat-based rate calculations, and billing payouts.
- **Delayed Payouts:** Dairy owners lack structured ledger tools to calculate gross earnings, record partial payments, or settle pending dues against specific milk collections.
- **Inaccessible Veterinary Supplies:** Farmers struggle to find nearby stocked veterinary medicines or track urgent medical supply requests.
- **Security & Data Integrity Risks:** Lack of verified authentication and role isolation leads to unauthorized record access.

### What real-world problem does it solve?
1. **Authoritative Milk Ledger:** Automated calculation of daily milk value based on fat percentage and per-liter rate with compound unique constraints preventing duplicate session logs.
2. **Transparent Financial Settlements:** Automated selection of unsettled milk collections with real-time payout calculations, partial payment handling, and protection against double settlement.
3. **Structured Veterinary Supply Chain:** Farmers can browse available veterinary inventory and place medicine orders. Medical providers manage stock levels, accept requests, deduct inventory atomically, and transition request states through packing, pickup readiness, and completion.
4. **Verified Multi-Role Portal:** Secure passwordless access powered by 6-digit OTP delivery (via Brevo Email API or dev mode) and Role-Based Access Control (RBAC).

---

## 2. Problem Statement

Rural dairy operations and livestock healthcare management face four critical operational bottlenecks:
1. **Opaque Milk Accounting:** Milk collection entries (morning/evening shifts) lack centralized validation, allowing disputes over quantity and fat percentages.
2. **Complex Payout Tracking:** Unpaid collections accumulate over weeks; calculating accurate payout settlements without double-paying previously settled logs is error-prone.
3. **Stock Mismanagement in Animal Healthcare:** Veterinary clinics and medical providers lack real-time digital channels to showcase medicine availability to local farmers.
4. **User Onboarding Friction:** Farmers frequently forget complex passwords. A secure, low-friction OTP authentication mechanism is required for non-technical users.

---

## 3. Project Objectives

1. **Digitalize Dairy Collections:** Enable dairy owners to record shift collections (morning/evening) for connected farmers with backend validation.
2. **Automate Financial Settlements:** Allow dairy owners to filter unpaid milk collections, generate settlement previews, record payment methods (cash, UPI, bank transfer), and update ledger balances.
3. **Digitize Veterinary Inventory & Procurement:** Enable medical providers to list medicines with automatic stock management (deducting inventory upon request acceptance and restoring inventory upon cancellation).
4. **Implement Secure Passwordless Authentication:** Utilize SHA-256 hashed 6-digit OTPs with timing-safe comparison, resend cooldowns, attempt limits, TTL indexes, and Brevo Email API integration.
5. **Enforce Role-Based Security:** Protect API routes and frontend views for 4 distinct user roles: `farmer`, `dairyOwner`, `medicalProvider`, and `admin`.

---

## 4. Users and Roles

The application strictly defines four distinct user roles stored in the `User` Mongoose model (`server/src/models/User.js`):

| Role | Target User | Key Responsibilities & Capabilities |
| :--- | :--- | :--- |
| **`farmer`** | Milk Producer / Livestock Owner | Connect with Dairy Owners; View milk collection logs; Track payouts and pending dues; Browse available veterinary medicines; Submit & track medicine requests. |
| **`dairyOwner`** | Milk Collection Center Operator | Search & connect with registered farmers; Record daily morning/evening milk collections; Filter unpaid collections; Create payment settlements; View analytical reports. |
| **`medicalProvider`** | Veterinary Clinic / Pharmacy | Manage medicine inventory (price, stock, unit, availability); Process incoming farmer medicine requests (Accept → Pack → Ready → Complete / Reject / Cancel). |
| **`admin`** | System Administrator / Supervisor | Global system oversight; Access all dashboards, reports, ledgers, and inventory catalogs across all roles. |

---

## 5. Current Scope

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CURRENT IMPLEMENTATION SCOPE                     │
├───────────────────────────────────┬────────────────────────────────────┤
│ 🟢 Fully Implemented              │ 🟡 Partially / Basic Implementation│
│  - Phone/Email OTP Authentication │  - Brevo Email Delivery Fallback   │
│  - SHA-256 Hashing & Timing-Safe  │    (Dev console fallback if no key)│
│  - JWT Bearer Token Guard         │  - Admin User Management UI        │
│  - RBAC Middleware                │    (Read-only summary implemented) │
│  - Farmer-Dairy Connections       │ 🔴 Not Implemented / Future Scope  │
│  - Milk Collection Logging        │  - SMS Gateway Integration (Twilio)│
│  - Payment Ledger & Settlement    │  - Online Payment Gateway (Razorpay│
│  - Veterinary Medicine Catalog    │  - Real-time WebSockets / Push     │
│  - Medicine Request Workflow      │  - PDF Export / Invoice Printing   │
│  - Aggregated Analytics Reports   │  - Multi-language UI (Hindi/Guj)   │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## 6. Technology Stack

### FRONTEND TECHNOLOGY STACK
- **React (v19.2.8):** Declarative UI library using Functional Components and Hooks (`useState`, `useEffect`, `useContext`).
- **Vite (v8.3.0):** Modern frontend build tool and dev server powering hot module replacement (HMR).
- **React Router DOM (v7.18.4):** Client-side routing library supporting protected routes, role routing, and dynamic navigation.
- **Tailwind CSS (v4.3.3 via `@tailwindcss/vite`):** Utility-first CSS framework used for styling responsive, modern user interfaces.
- **Lucide React (v1.50.0):** Icon library providing iconography throughout navigation, action buttons, and stat cards.
- **Native Fetch API:** Custom service modules (`authService`, `paymentService`, etc.) wrap native `fetch` requests with Bearer token authentication.

### BACKEND TECHNOLOGY STACK
- **Node.js (ES Modules `import/export`):** JavaScript runtime environment.
- **Express.js (v5.2.1):** Web framework powering RESTful API routes, middleware chains, and JSON body parsing.
- **MongoDB & Mongoose (v9.10.3):** NoSQL document database and Object Data Modeling (ODM) library with schema validation, compound indexes, and TTL indexes.
- **JSONWebToken (`jsonwebtoken` v9.0.3):** Standard for signing and verifying JWT session tokens.
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
│   ├── public/                          # Static assets (favicon.svg)
│   ├── src/                             # Source code
│   │   ├── assets/                      # Application media (hero.png)
│   │   ├── components/                  # Reusable UI & Layout Components
│   │   │   ├── common/                  # Atomic UI components
│   │   │   │   ├── EmptyState.jsx       # Fallback empty UI placeholder
│   │   │   │   ├── PageHeader.jsx       # Standardized page title header
│   │   │   │   ├── SectionCard.jsx      # Content section container card
│   │   │   │   └── StatCard.jsx         # Analytics metric display card
│   │   │   ├── layout/                  # Structural Shell Components
│   │   │   │   ├── DashboardLayout.jsx  # Main layout wrapper with sidebar & header
│   │   │   │   ├── Header.jsx           # Topbar with profile initials & logout
│   │   │   │   ├── MobileNavigation.jsx # Mobile navigation drawer modal
│   │   │   │   └── Sidebar.jsx          # Role-aware desktop navigation sidebar
│   │   │   ├── LoginPage.jsx            # OTP Login & Registration Component
│   │   │   ├── ProtectedRoute.jsx       # Auth guard wrapper
│   │   │   └── RoleRoute.jsx            # Role authorization guard wrapper
│   │   ├── context/                     # Global State Management
│   │   │   └── AuthContext.jsx          # User session, JWT storage & auth state
│   │   ├── pages/                       # Application Views / Pages
│   │   │   ├── admin/                   # Admin Role Pages
│   │   │   │   └── Reports.jsx          # System-wide analytics & reports
│   │   │   ├── dairy/                   # Dairy Owner Role Pages
│   │   │   │   ├── ConnectedFarmers.jsx # Farmer search & connection manager
│   │   │   │   ├── MilkCollection.jsx   # Milk intake entry & history log
│   │   │   │   ├── Payments.jsx         # Settlement engine & payment ledger
│   │   │   │   └── Reports.jsx          # Dairy analytics & farmer breakdown
│   │   │   ├── dashboards/              # Role Dashboard Views
│   │   │   │   ├── AdminDashboard.jsx           # System administrator console
│   │   │   │   ├── DairyOwnerDashboard.jsx      # Dairy operator console
│   │   │   │   ├── FarmerDashboard.jsx          # Farmer overview console
│   │   │   │   └── MedicalProviderDashboard.jsx # Veterinary provider console
│   │   │   ├── farmer/                  # Farmer Role Pages
│   │   │   │   ├── DairyConnections.jsx # Pending/active dairy connection requests
│   │   │   │   ├── MedicineRequests.jsx # Medicine order tracker & cancellation
│   │   │   │   ├── Medicines.jsx        # Public veterinary medicine catalog
│   │   │   │   ├── MilkCollections.jsx  # Farmer milk collection history log
│   │   │   │   ├── Payments.jsx         # Received payments & settlement history
│   │   │   │   └── Reports.jsx          # Personal milk & income analytics
│   │   │   ├── medical/                 # Medical Provider Role Pages
│   │   │   │   ├── Inventory.jsx        # Medicine inventory management
│   │   │   │   └── MedicineRequests.jsx # Incoming request processing console
│   │   │   └── DashboardRedirect.jsx    # Smart router redirecting / to role dashboard
│   │   ├── services/                    # API Service Wrappers (HTTP Fetch)
│   │   │   ├── authService.js           # Register, requestOTP, verifyOTP, getMe API
│   │   │   ├── dairyFarmerService.js    # Farmer search & connection management API
│   │   │   ├── medicineRequestService.js# Medicine request lifecycle API
│   │   │   ├── medicineService.js       # Inventory & catalog CRUD API
│   │   │   ├── milkCollectionService.js # Milk intake logging & history API
│   │   │   ├── paymentService.js        # Unpaid collections, preview & settlement API
│   │   │   └── reportService.js         # Summary & date-wise analytics API
│   │   ├── App.jsx                      # Client Router & Provider Entrypoint
│   │   ├── index.css                    # Tailwind CSS imports & global root styles
│   │   └── main.jsx                     # DOM Mounting Entrypoint
│   ├── eslint.config.js                 # ESLint code quality configuration
│   ├── index.html                       # HTML5 entry document
│   ├── package.json                     # Frontend dependencies & scripts
│   └── vite.config.js                   # Vite configuration with React & Tailwind plugins
│
└── server/                              # Express Node.js Backend Application
    ├── src/                             # Source code
    │   ├── config/                      # System Configurations
    │   │   └── db.js                    # Mongoose MongoDB connection initializer
    │   ├── controllers/                 # Business Logic & HTTP Request Handlers
    │   │   ├── authController.js            # Authentication, OTP & JWT logic
    │   │   ├── dairyFarmerController.js     # Connection workflow logic
    │   │   ├── medicineController.js        # Veterinary medicine inventory logic
    │   │   ├── medicineRequestController.js # Medicine request processing logic
    │   │   ├── milkCollectionController.js  # Milk intake calculation & logging logic
    │   │   ├── paymentController.js         # Settlement engine & ledger logic
    │   │   └── reportController.js          # Aggregated analytics pipeline logic
    │   ├── middleware/                  # Request Interceptors
    │   │   ├── authMiddleware.js            # JWT Bearer token authentication guard
    │   │   └── roleMiddleware.js            # Role authorization guard
    │   ├── models/                      # Mongoose Database Schemas
    │   │   ├── DairyFarmerConnection.js     # Farmer-Dairy relationship schema
    │   │   ├── Medicine.js                  # Veterinary medicine inventory schema
    │   │   ├── MedicineRequest.js           # Medicine request order schema
    │   │   ├── MilkCollection.js            # Daily milk collection log schema
    │   │   ├── OTP.js                       # Temporary OTP storage schema (with TTL)
    │   │   ├── Payment.js                   # Financial payout settlement schema
    │   │   └── User.js                      # User profile & credentials schema
    │   ├── routes/                      # Express Endpoint Registrations
    │   │   ├── authRoutes.js            # /api/auth endpoints
    │   │   ├── dairyFarmerRoutes.js     # /api/dairy-connections endpoints
    │   │   ├── medicineRequestRoutes.js # /api/medicine-requests endpoints
    │   │   ├── medicineRoutes.js        # /api/medicines endpoints
    │   │   ├── milkCollectionRoutes.js  # /api/milk-collections endpoints
    │   │   ├── paymentRoutes.js         # /api/payments endpoints
    │   │   └── reportRoutes.js          # /api/reports endpoints
    │   ├── services/                    # External Service Integrations
    │   │   └── emailService.js          # Brevo SMTP API email delivery service
    │   ├── utils/                       # Helper Utilities
    │   │   ├── otpUtils.js              # Crypto OTP generation & SHA-256 hashing
    │   │   └── phoneUtils.js            # Phone & email identity normalization
    │   └── app.js                       # Express App configuration & middleware setup
    ├── .env                             # Environment secrets (ignored by git)
    ├── .env.example                     # Environment template configuration
    ├── package.json                     # Backend dependencies & scripts
    └── server.js                        # HTTP server listener entrypoint
```

---

## 8. Every File Documentation

### Backend Infrastructure Files

#### 1. `server/server.js`
- **Purpose:** Entrypoint for starting the Node.js HTTP server.
- **Responsibility:** Loads environment variables via `dotenv/config`, imports the configured Express instance from `src/app.js`, and binds the app to `process.env.PORT || 5000`.
- **Functions:** Anonymous callback for `app.listen()`.
- **Dependencies:** `dotenv/config`, `./src/app.js`.
- **Used By:** `npm start`, `npm run dev`.

#### 2. `server/src/app.js`
- **Purpose:** Express application setup and route mounting.
- **Responsibility:** Initializes MongoDB connection, configures `cors()`, `express.json()`, and `express.urlencoded()`, mounts API routes under `/api/*`, and registers `/api/health`.
- **Functions:** Express app instance export.
- **Dependencies:** `express`, `cors`, `./config/db.js`, all 7 route files.
- **Used By:** `server/server.js`.

#### 3. `server/src/config/db.js`
- **Purpose:** Database connection initialization.
- **Responsibility:** Establishes connection to MongoDB Atlas using Mongoose and `process.env.MONGODB_URI`. Applies Google/Cloudflare DNS servers (`8.8.8.8`, `1.1.1.1`) to prevent SRV lookup failures on restricted networks.
- **Functions:** `connectDB()` (Async).
- **Dependencies:** `mongoose`, `dns`.
- **Used By:** `server/src/app.js`.

#### 4. `server/src/middleware/authMiddleware.js`
- **Purpose:** JWT Bearer authentication guard.
- **Responsibility:** Extracts `Authorization: Bearer <token>` header, verifies signature against `JWT_SECRET`, extracts `userId` and `role`, attaches `req.user = { id, role }`, and passes control to next middleware. Returns `401 Unauthorized` for missing/invalid/expired tokens.
- **Functions:** `authMiddleware(req, res, next)`.
- **Dependencies:** `jsonwebtoken`.
- **Used By:** Applied to protected backend routes.

#### 5. `server/src/middleware/roleMiddleware.js`
- **Purpose:** Role authorization guard (RBAC).
- **Responsibility:** Accepts allowed roles (e.g. `requireRole('farmer', 'admin')`), checks if `req.user.role` matches. Returns `403 Forbidden` if unauthorized.
- **Functions:** `requireRole(...allowedRoles)`.
- **Dependencies:** None.
- **Used By:** Backend route declarations.

#### 6. `server/src/services/emailService.js`
- **Purpose:** Brevo Email API Integration.
- **Responsibility:** Validates recipient email, formats responsive HTML OTP template, and sends HTTP POST request to `https://api.brevo.com/v3/smtp/email` using `BREVO_API_KEY` and `BREVO_SENDER_EMAIL`.
- **Functions:** `isValidEmail(email)`, `sendOtpEmail({ to, otp, expiresInMinutes })`.
- **Dependencies:** Native `fetch`, `dotenv`.
- **Used By:** `authController.js`.

#### 7. `server/src/utils/otpUtils.js`
- **Purpose:** Cryptographic OTP helpers.
- **Responsibility:** Generates 6-digit numeric OTP via `crypto.randomInt()`, hashes OTP using SHA-256 (`crypto.createHash`), and performs timing-safe comparison using `crypto.timingSafeEqual()`.
- **Functions:** `generateOTP()`, `hashOTP(otp)`, `verifyOTPHash(plainOTP, storedHash)`.
- **Dependencies:** `crypto`.
- **Used By:** `authController.js`.

#### 8. `server/src/utils/phoneUtils.js`
- **Purpose:** Input identity normalization.
- **Responsibility:** Normalizes 10-digit Indian phone numbers (stripping `+91`, `91`, or leading `0`). Validates and normalizes email strings.
- **Functions:** `normalizePhone(phone)`, `normalizeIdentity(input)`.
- **Dependencies:** None.
- **Used By:** `authController.js`, `dairyFarmerController.js`.

---

### Backend Models (Mongoose Schemas)

#### 9. `server/src/models/User.js`
- **Fields:** `name` (String, required), `phone` (String, unique, required), `email` (String, unique, sparse), `role` (Enum: `['farmer', 'dairyOwner', 'medicalProvider', 'admin']`), `isActive` (Boolean, default `true`), `timestamps`.
- **Collection:** `users`.

#### 10. `server/src/models/OTP.js`
- **Fields:** `phone` (String, indexed), `otpHash` (String, SHA-256), `expiresAt` (Date, TTL indexed), `attempts` (Number, default 0), `lastSentAt` (Date), `verified` (Boolean).
- **TTL Index:** `otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })` automatically purges expired OTP documents.
- **Collection:** `otps`.

#### 11. `server/src/models/DairyFarmerConnection.js`
- **Fields:** `dairyOwner` (Ref: `User`), `farmer` (Ref: `User`), `status` (Enum: `['pending', 'active', 'rejected', 'disconnected']`).
- **Compound Index:** `{ dairyOwner: 1, farmer: 1 }` (unique constraint).
- **Collection:** `dairy_farmer_connections`.

#### 12. `server/src/models/MilkCollection.js`
- **Fields:** `dairyOwner` (Ref: `User`), `farmer` (Ref: `User`), `collectionDate` (Date), `session` (Enum: `['morning', 'evening']`), `quantityLiters` (Number), `fatPercentage` (Number), `ratePerLiter` (Number), `totalAmount` (Number), `paymentStatus` (Enum: `['unpaid', 'settled']`), `paymentId` (Ref: `Payment`).
- **Compound Unique Index:** `{ dairyOwner: 1, farmer: 1, collectionDate: 1, session: 1 }`.
- **Collection:** `milk_collections`.

#### 13. `server/src/models/Payment.js`
- **Fields:** `dairyOwner` (Ref: `User`), `farmer` (Ref: `User`), `collectionIds` (Array of Ref: `MilkCollection`), `milkCollections` (Array of Ref: `MilkCollection`), `paymentPeriodStart` (Date), `paymentPeriodEnd` (Date), `grossAmount` (Number), `paidAmount` (Number), `remainingAmount` (Number), `paymentStatus` (Enum: `['pending', 'partiallyPaid', 'paid', 'cancelled']`), `paymentDate` (Date), `paymentMethod` (Enum: `['cash', 'bankTransfer', 'upi', 'other']`), `referenceNumber` (String), `remarks` (String).
- **Collection:** `payments`.

#### 14. `server/src/models/Medicine.js`
- **Fields:** `name` (String), `genericName` (String), `category` (String), `description` (String), `price` (Number), `stockQuantity` (Number), `unit` (Enum: `['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'powder', 'other']`), `availability` (Enum: `['available', 'unavailable']`), `isActive` (Boolean), `medicalProvider` (Ref: `User`).
- **Indexes:** `{ medicalProvider: 1, isActive: 1 }`, `{ name: 'text', genericName: 'text', category: 'text' }`.
- **Collection:** `medicines`.

#### 15. `server/src/models/MedicineRequest.js`
- **Fields:** `farmer` (Ref: `User`), `medicalProvider` (Ref: `User`), `medicine` (Ref: `Medicine`), `medicineNameSnapshot` (String), `unitPriceSnapshot` (Number), `quantity` (Number), `totalAmount` (Number), `status` (Enum: `['pending', 'accepted', 'packed', 'ready', 'completed', 'cancelled', 'rejected']`), `notes` (String), `providerRemarks` (String), Timestamps for state transitions (`requestedAt`, `acceptedAt`, `packedAt`, `readyAt`, `completedAt`, `cancelledAt`, `rejectedAt`).
- **Collection:** `medicine_requests`.

---

### Backend Controllers & Routes

#### 16. `authController.js` & `authRoutes.js`
- **POST `/api/auth/register`:** Validates input, creates `User`, generates 6-digit OTP, saves hashed OTP in `OTP` collection, delivers via Brevo API (or returns `devOtp` in non-production).
- **POST `/api/auth/request-otp`:** Checks user existence, verifies 60s resend cooldown, invalidates old OTPs, generates & hashes new OTP, delivers via Brevo API / dev mode console log.
- **POST `/api/auth/verify-otp`:** Looks up active OTP, verifies expiry & max attempts limit (5 attempts max), compares hash using `crypto.timingSafeEqual`, checks `user.isActive`, signs 7-day JWT token (`{ userId, role }`), returns session object.
- **GET `/api/auth/me`:** Protected endpoint returning current user profile.

#### 17. `dairyFarmerController.js` & `dairyFarmerRoutes.js`
- **GET `/api/dairy-connections/search-farmer?phone=...`:** Search farmer by mobile number (`role === 'farmer'`).
- **POST `/api/dairy-connections/request`:** Sends connection request from Dairy Owner to Farmer (creates/resets `DairyFarmerConnection` to `pending`).
- **GET `/api/dairy-connections/dairy-farmers`:** Returns all connections for Dairy Owner.
- **GET `/api/dairy-connections/farmer-dairies`:** Returns all connections for Farmer.
- **PATCH `/api/dairy-connections/:id/accept`:** Farmer accepts connection request (`status = 'active'`).
- **PATCH `/api/dairy-connections/:id/reject`:** Farmer rejects connection request (`status = 'rejected'`).
- **PATCH `/api/dairy-connections/:id/disconnect`:** Either party disconnects relationship (`status = 'disconnected'`).

#### 18. `milkCollectionController.js` & `milkCollectionRoutes.js`
- **POST `/api/milk-collections`:** Validates active connection requirement, calculates `totalAmount = round(qty * rate)`, enforces unique shift index (prevents duplicate logs), saves `MilkCollection`.
- **GET `/api/milk-collections/dairy-owner`:** Fetches collection logs for Dairy Owner with optional farmer/date filter.
- **GET `/api/milk-collections/farmer`:** Fetches collection logs for logged-in Farmer.
- **GET `/api/milk-collections/farmer/:farmerId`:** Fetches collections for specific farmer under Dairy Owner.

#### 19. `paymentController.js` & `paymentRoutes.js`
- **GET `/api/payments/unpaid-collections?farmerId=...`:** Finds collections with `paymentStatus !== 'settled'` not linked to active payments.
- **POST `/api/payments/preview`:** Generates settlement breakdown (gross amount, total liters, remaining balance) before saving.
- **POST `/api/payments`:** Saves `Payment` document, marks selected `MilkCollection` records as `settled` with `paymentId`.
- **GET `/api/payments/dairy-owner`:** Returns payment history & aggregate ledger metrics (`totalGross`, `totalPaid`, `totalPending`).
- **GET `/api/payments/farmer`:** Returns received payment settlements for Farmer.
- **PATCH `/api/payments/:paymentId/status`:** Adds partial payment or cancels settlement (reverting collections back to `unpaid`).

#### 20. `reportController.js` & `reportRoutes.js`
- **GET `/api/reports/milk-summary`:** Aggregates total milk volume, average fat, average rate, total milk valuation.
- **GET `/api/reports/payment-summary`:** Aggregates gross, paid, outstanding balances and status counts.
- **GET `/api/reports/farmer-summary`:** Aggregates per-farmer performance breakdown for Dairy Owners.
- **GET `/api/reports/date-wise-milk`:** Grouped date-wise milk collections for charts/tables.
- **GET `/api/reports/date-wise-payments`:** Grouped date-wise payment payouts.
- **GET `/api/reports/dashboard-summary`:** Role-aware metrics for initial dashboard loading.

#### 21. `medicineController.js` & `medicineRoutes.js`
- **POST `/api/medicines`:** Adds medicine to provider inventory (auto-sets `availability = 'unavailable'` if stock is 0).
- **GET `/api/medicines/my`:** Paginated inventory manager for Medical Provider.
- **GET `/api/medicines/available`:** Public catalog of active, stocked medicines for Farmers.
- **GET `/api/medicines/summary`:** Inventory metrics (total, low stock, out of stock).
- **PATCH `/api/medicines/:id/stock`:** Updates stock quantity.
- **PATCH `/api/medicines/:id/availability`:** Toggles availability status.
- **PATCH `/api/medicines/:id/deactivate`:** Soft-deletes medicine (`isActive = false`).

#### 22. `medicineRequestController.js` & `medicineRequestRoutes.js`
- **POST `/api/medicine-requests`:** Farmer creates request (snapshots name & price; checks 5-second duplicate protection).
- **GET `/api/medicine-requests/my`:** Farmer tracks request history.
- **GET `/api/medicine-requests/provider`:** Provider views incoming requests with search & date filters.
- **PATCH `/api/medicine-requests/:id/accept`:** Provider accepts request → **atomically deducts stock from `Medicine` collection**.
- **PATCH `/api/medicine-requests/:id/pack`:** Provider marks request as `packed`.
- **PATCH `/api/medicine-requests/:id/ready`:** Provider marks request as `ready` for pickup.
- **PATCH `/api/medicine-requests/:id/complete`:** Provider completes request.
- **PATCH `/api/medicine-requests/:id/cancel`:** Cancels request → **restores stock to `Medicine` collection if previously accepted**.

---

### Frontend Services, Context & Components

#### 23. `client/src/context/AuthContext.jsx`
- React Context storing `user`, `token`, `isAuthenticated`, `loading`. Restores session on startup by reading `localStorage.getItem('authToken')` and calling `/api/auth/me`.

#### 24. `client/src/components/LoginPage.jsx`
- Modern multi-step login & registration component. Toggle between Phone Number and Email address identity inputs. Displays `devOtp` banner in development mode.

#### 25. Router Guards & Layouts
- **`ProtectedRoute.jsx`:** Redirects unauthenticated users to `/login`.
- **`RoleRoute.jsx`:** Displays 403 Access Denied banner if user role does not match allowed roles.
- **`DashboardLayout.jsx`:** Responsive container with `Sidebar.jsx`, `Header.jsx`, `MobileNavigation.jsx`, and footer.
- **`DashboardRedirect.jsx`:** Automatically routes `/` to the correct role dashboard (`/farmer/dashboard`, `/dairy-owner/dashboard`, etc.).

---

## 9. Frontend Architecture

```
index.html
  │
  ▼
main.jsx (Mounts React root & StrictMode)
  │
  ▼
App.jsx (Defines AuthProvider, BrowserRouter & Route Tree)
  │
  ▼
AuthProvider (Restores token from localStorage & fetches /api/auth/me)
  │
  ▼
ProtectedShell (Combines ProtectedRoute guard & DashboardLayout shell)
  │
  ▼
RoleRoute (Validates user.role against route permissions)
  │
  ▼
Page Component (e.g. MilkCollection.jsx / Inventory.jsx)
  │
  ▼
Service Layer (e.g. milkCollectionService.js via native fetch)
  │
  ▼
Backend REST API
```

---

## 10. Backend Architecture & Express Flow

```
Client HTTP Request (Bearer JWT in Authorization Header)
  │
  ▼
Express Server listener (server.js / app.js)
  │
  ▼
Global Middleware (cors, express.json, express.urlencoded)
  │
  ▼
Router Layer (e.g., /api/payments)
  │
  ▼
authMiddleware (Validates JWT, attaches req.user = { id, role })
  │
  ▼
roleMiddleware (Checks req.user.role against allowed roles)
  │
  ▼
Controller (Validates body/params, executes business logic)
  │
  ▼
Mongoose Model Layer (Schema validation, query execution, indexing)
  │
  ▼
MongoDB Atlas Database
  │
  ▼
Controller Formats JSON Response ({ success: true, data })
  │
  ▼
Client React State Update & UI Render
```

---

## 11. API Routes Table

| Method | Endpoint | Purpose | Auth | Role | Controller Function |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register user & request initial OTP | Public | Any | `register` |
| `POST` | `/api/auth/request-otp` | Request 6-digit login OTP | Public | Any | `requestOTP` |
| `POST` | `/api/auth/verify-otp` | Verify OTP & issue JWT session | Public | Any | `verifyOTP` |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Bearer | Any | `getMe` |
| `GET` | `/api/dairy-connections/search-farmer` | Search farmer by phone number | Bearer | `dairyOwner`, `admin` | `searchFarmer` |
| `POST` | `/api/dairy-connections/request` | Send connection request | Bearer | `dairyOwner`, `admin` | `requestConnection` |
| `GET` | `/api/dairy-connections/dairy-farmers` | List connected farmers | Bearer | `dairyOwner`, `admin` | `getDairyFarmers` |
| `GET` | `/api/dairy-connections/farmer-dairies` | List connected dairies | Bearer | `farmer`, `admin` | `getFarmerDairies` |
| `PATCH`| `/api/dairy-connections/:id/accept` | Accept connection request | Bearer | `farmer`, `admin` | `acceptConnection` |
| `PATCH`| `/api/dairy-connections/:id/reject` | Reject connection request | Bearer | `farmer`, `admin` | `rejectConnection` |
| `PATCH`| `/api/dairy-connections/:id/disconnect`| Disconnect relationship | Bearer | Any connected party | `disconnectConnection` |
| `POST` | `/api/milk-collections` | Record milk collection entry | Bearer | `dairyOwner`, `admin` | `createCollection` |
| `GET` | `/api/milk-collections/dairy-owner` | View dairy milk logs | Bearer | `dairyOwner`, `admin` | `getDairyOwnerCollections` |
| `GET` | `/api/milk-collections/farmer` | View farmer milk logs | Bearer | `farmer`, `admin` | `getFarmerCollections` |
| `GET` | `/api/payments/unpaid-collections` | Filter unsettled milk collections | Bearer | `dairyOwner`, `admin` | `getUnpaidCollections` |
| `POST` | `/api/payments/preview` | Preview settlement payout | Bearer | `dairyOwner`, `admin` | `previewSettlement` |
| `POST` | `/api/payments` | Create payment settlement | Bearer | `dairyOwner`, `admin` | `createPayment` |
| `GET` | `/api/payments/dairy-owner` | View dairy payment ledger | Bearer | `dairyOwner`, `admin` | `getDairyOwnerPayments` |
| `GET` | `/api/payments/farmer` | View farmer payment receipts | Bearer | `farmer`, `admin` | `getFarmerPayments` |
| `PATCH`| `/api/payments/:id/status` | Update/Cancel settlement | Bearer | `dairyOwner`, `admin` | `updatePaymentStatus` |
| `POST` | `/api/medicines` | Add medicine to inventory | Bearer | `medicalProvider` | `createMedicine` |
| `GET` | `/api/medicines/my` | View provider inventory | Bearer | `medicalProvider` | `getMyMedicines` |
| `GET` | `/api/medicines/available` | View public medicine catalog | Bearer | `farmer`, `med`, `admin`| `getAvailableMedicines` |
| `PATCH`| `/api/medicines/:id/stock` | Update stock quantity | Bearer | `medicalProvider` | `updateStock` |
| `POST` | `/api/medicine-requests` | Submit medicine order | Bearer | `farmer` | `createMedicineRequest` |
| `GET` | `/api/medicine-requests/my` | View farmer medicine orders | Bearer | `farmer` | `getMyRequests` |
| `GET` | `/api/medicine-requests/provider` | View incoming provider orders | Bearer | `medicalProvider` | `getProviderRequests` |
| `PATCH`| `/api/medicine-requests/:id/accept` | Accept order (deducts stock) | Bearer | `medicalProvider` | `acceptMedicineRequest` |
| `PATCH`| `/api/medicine-requests/:id/pack` | Mark order as packed | Bearer | `medicalProvider` | `packMedicineRequest` |
| `PATCH`| `/api/medicine-requests/:id/ready` | Mark order ready for pickup | Bearer | `medicalProvider` | `readyMedicineRequest` |
| `PATCH`| `/api/medicine-requests/:id/complete`| Mark order completed | Bearer | `medicalProvider` | `completeMedicineRequest` |
| `PATCH`| `/api/medicine-requests/:id/cancel` | Cancel order (restores stock) | Bearer | `farmer`, `medicalProvider`| `cancelMedicineRequest` |

---

## 12. Database Architecture & Relationships

```
                         ┌──────────────┐
                         │     User     │
                         └──────┬───────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│  DairyFarmer │        │     Milk     │        │   Medicine   │
│  Connection  │        │  Collection  │        │  Inventory   │
└──────────────┘        └───────┬──────┘        └──────┬───────┘
                                │                      │
                                ▼                      ▼
                        ┌──────────────┐        ┌──────────────┐
                        │   Payment    │        │   Medicine   │
                        │  Settlement  │        │   Request    │
                        └──────────────┘        └──────────────┘
```

1. **User → DairyFarmerConnection:** One-to-Many relationship connecting a `dairyOwner` User and a `farmer` User.
2. **DairyFarmerConnection → MilkCollection:** Milk collection requires an active connection between the `dairyOwner` and `farmer`.
3. **MilkCollection → Payment:** Settled milk collections store the `paymentId` of the associated `Payment` settlement.
4. **User → Medicine:** A `medicalProvider` User owns multiple `Medicine` documents.
5. **Farmer + Provider + Medicine → MedicineRequest:** Links a `farmer` User, a `medicalProvider` User, and a target `Medicine` with price/name snapshots.

---

## 13. Authentication & Security Systems

### Passwordless OTP System
1. **Generation:** Cryptographically secure 6-digit numeric string generated using `crypto.randomInt(100000, 1000000)`.
2. **Storage:** Stored in the `otps` collection as a SHA-256 hash (`crypto.createHash('sha256')`).
3. **Security Safeguards:**
   - **Timing-Safe Comparison:** Plaintext input is hashed and compared using `crypto.timingSafeEqual()` to prevent timing side-channel attacks.
   - **Resend Cooldown:** 60-second minimum cooldown enforced between OTP requests for the same identity.
   - **Expiration & TTL:** OTPs expire after 5 minutes (`expiresAt`). MongoDB TTL index automatically purges expired records.
   - **Attempt Limits:** Maximum 5 verification attempts allowed. Record is deleted after 5 failed attempts.

### Email OTP Delivery via Brevo
When `EMAIL_PROVIDER=brevo` is configured in `.env`, `emailService.js` dispatches emails using Brevo's v3 SMTP API:
```javascript
fetch('https://api.brevo.com/v3/smtp/email', {
  method: 'POST',
  headers: {
    'accept': 'application/json',
    'api-key': process.env.BREVO_API_KEY,
    'content-type': 'application/json'
  },
  body: JSON.stringify({
    sender: { name: process.env.BREVO_SENDER_NAME, email: process.env.BREVO_SENDER_EMAIL },
    to: [{ email: recipientEmail }],
    subject: 'Your Gauseva verification code',
    htmlContent: '...'
  })
})
```

---

## 14. Real API Request Example Walkthrough

### Request: Farmer Submits a Veterinary Medicine Request
```
1. USER ACTION: Farmer selects a medicine in FarmersMedicines.jsx and clicks "Request Medicine".
2. FRONTEND SERVICE: createMedicineRequest({ medicineId: "65f1a2b...", quantity: 2, notes: "Urgent" })
3. HTTP REQUEST: POST /api/medicine-requests
   Headers: Authorization: Bearer <jwt_token>
4. EXPRESS ROUTER: Passes to authMiddleware -> verifies JWT token -> attaches req.user = { id: "farmer_id", role: "farmer" }
5. ROLE MIDDLEWARE: requireRole('farmer') verifies req.user.role === 'farmer'.
6. CONTROLLER (medicineRequestController.createMedicineRequest):
   a. Validates medicine existence, isActive === true, and stockQuantity >= 2.
   b. Checks 5-second duplicate protection against rapid re-submission.
   c. Captures snapshots: unitPriceSnapshot = medicine.price, medicineNameSnapshot = medicine.name.
   d. Calculates totalAmount = unitPriceSnapshot * quantity.
   e. Saves MedicineRequest document with status = 'pending'.
7. DATABASE: Document inserted into medicine_requests collection.
8. HTTP RESPONSE: 201 Created with JSON data.
9. UI UPDATE: Farmer's MedicineRequests view re-renders showing newly pending request.
```

---

## 15. Environment Variables Guide

| Variable Name | Purpose | Required? | Example Value |
| :--- | :--- | :--- | :--- |
| `PORT` | Node.js HTTP server port | Optional (Default: `5000`) | `5000` |
| `MONGODB_URI` | MongoDB Atlas database connection string | **Required** | `mongodb+srv://user:pass@cluster.mongodb.net/dairy_db` |
| `JWT_SECRET` | Secret key for signing/verifying JWT tokens | **Required** | `super_secret_jwt_key_2026` |
| `JWT_EXPIRES_IN` | Token expiration duration | Optional (Default: `7d`) | `7d` |
| `EMAIL_PROVIDER` | Email provider selection (`brevo`) | Optional | `brevo` |
| `BREVO_API_KEY` | Brevo REST API access key | Required if `EMAIL_PROVIDER=brevo` | `xkeysib-xxxx...` |
| `BREVO_SENDER_EMAIL` | Verified sender email address in Brevo | Required if `EMAIL_PROVIDER=brevo` | `verify@gauseva.com` |
| `BREVO_SENDER_NAME` | Sender display name in emails | Optional | `Gauseva System` |

---

## 16. How to Run the Project

### Prerequisites
- Node.js (v18.x or higher)
- MongoDB Atlas database cluster
- Active Brevo account (optional for email OTP delivery)

### Installation & Startup Steps

1. **Install Backend Dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Configure Environment Variables:**
   Copy `.env.example` to `.env` inside `server/` and fill in `MONGODB_URI`, `JWT_SECRET`, and Brevo credentials.

3. **Start Backend Server:**
   ```bash
   # Development Mode (with hot-reload via nodemon)
   npm run dev
   ```

4. **Install Frontend Dependencies:**
   ```bash
   cd ../client
   npm install
   ```

5. **Start Frontend Client:**
   ```bash
   npm run dev
   ```

6. **Access Application:**
   Open browser at `http://localhost:5173`.

---

## 17. Developer Map: "Where Do I Change X?"

| If you want to modify... | Target File(s) |
| :--- | :--- |
| **Login UI or OTP input fields** | `client/src/components/LoginPage.jsx` |
| **OTP Generation, Hashing, or Cooldowns** | `server/src/controllers/authController.js` & `server/src/utils/otpUtils.js` |
| **Email Template or Brevo API settings** | `server/src/services/emailService.js` |
| **JWT Expiry or Token Payload** | `server/src/controllers/authController.js` & `server/src/middleware/authMiddleware.js` |
| **Milk Calculation Logic & Rate Limits** | `server/src/controllers/milkCollectionController.js` & `client/src/pages/dairy/MilkCollection.jsx` |
| **Payment Settlement Ledger Logic** | `server/src/controllers/paymentController.js` & `client/src/pages/dairy/Payments.jsx` |
| **Medicine Stock & Request Lifecycle** | `server/src/controllers/medicineRequestController.js` |
| **Navigation Menu & Sidebar Links** | `client/src/components/layout/Sidebar.jsx` |

---

## 18. Complete File Inventory

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   COMPLETE FILE INVENTORY TABLE                                  │
├──────────────────────────────────┬───────────┬───────────────────────────────────┬──────────────┤
│ File Path                        │ Layer     │ Primary Responsibility            │ Status       │
├──────────────────────────────────┼───────────┼───────────────────────────────────┼──────────────┤
│ server/server.js                 │ Server    │ Node.js HTTP server listener      │ Active       │
│ server/src/app.js                │ Server    │ Express app & route mounting      │ Active       │
│ server/src/config/db.js          │ Database  │ MongoDB Mongoose connection       │ Active       │
│ server/src/models/User.js        │ Model     │ User profile & authentication     │ Active       │
│ server/src/models/OTP.js         │ Model     │ OTP storage with TTL index        │ Active       │
│ server/src/models/DairyFarmer..  │ Model     │ Farmer-Dairy relationship schema  │ Active       │
│ server/src/models/MilkCollect..  │ Model     │ Daily shift milk collection schema│ Active       │
│ server/src/models/Payment.js     │ Model     │ Payment settlement schema         │ Active       │
│ server/src/models/Medicine.js    │ Model     │ Veterinary medicine schema        │ Active       │
│ server/src/models/MedicineReq..  │ Model     │ Medicine request order schema     │ Active       │
│ server/src/controllers/auth..    │ Controller│ OTP & JWT Authentication handlers │ Active       │
│ server/src/controllers/dairy..   │ Controller│ Farmer-Dairy connection handlers  │ Active       │
│ server/src/controllers/milk..    │ Controller│ Milk collection intake handlers   │ Active       │
│ server/src/controllers/pay..     │ Controller│ Settlement & payout ledger handlers│ Active       │
│ server/src/controllers/rep..     │ Controller│ Aggregate analytical report pipelines│ Active    │
│ server/src/controllers/med..     │ Controller│ Medicine inventory CRUD handlers  │ Active       │
│ server/src/controllers/medReq..  │ Controller│ Order status transition handlers  │ Active       │
│ server/src/middleware/auth..     │ Middleware│ JWT Bearer token authentication   │ Active       │
│ server/src/middleware/role..     │ Middleware│ Role-based access control (RBAC)  │ Active       │
│ server/src/services/email..      │ Service   │ Brevo API transactional email     │ Active       │
│ server/src/utils/otpUtils.js     │ Utility   │ Crypto OTP generation & SHA-256    │ Active       │
│ server/src/utils/phoneUtils.js   │ Utility   │ Phone/Email normalization         │ Active       │
│ client/src/main.jsx              │ Client    │ React DOM mounting entrypoint     │ Active       │
│ client/src/App.jsx               │ Client    │ Route tree & layout wrapper       │ Active       │
│ client/src/context/AuthContext   │ Context   │ Global auth state & token storage │ Active       │
│ client/src/components/Login..    │ View      │ OTP Login & Registration screen   │ Active       │
│ client/src/components/Protected..│ Guard     │ Authentication route guard        │ Active       │
│ client/src/components/RoleRoute  │ Guard     │ Role permission route guard       │ Active       │
│ client/src/components/layout/..  │ Shell     │ Sidebar, Header & Layout shell    │ Active       │
│ client/src/services/* (7 files)  │ API Client│ Native fetch service HTTP wrappers│ Active       │
│ client/src/pages/* (17 files)    │ Views     │ Role dashboards, ledgers, pages   │ Active       │
└──────────────────────────────────┴───────────┴───────────────────────────────────┴──────────────┘
```

---

## 19. Project Viva Questions & Answers

### Basic Questions (20)
1. **Q: What is the main objective of this project?**
   *A: To digitize rural dairy collection operations, streamline fat-based financial payouts, and manage veterinary medicine supply chains.*
2. **Q: What technology stack is used?**
   *A: MERN Stack variant (MongoDB, Express.js, React 19, Node.js) with Tailwind CSS, Vite, and Brevo Email API.*
3. **Q: What user roles are supported?**
   *A: Four roles: Farmer, Dairy Owner, Medical Provider, and Admin.*
4. **Q: How does user authentication work?**
   *A: Passwordless authentication via a 6-digit numeric OTP sent via Email (Brevo API) or dev console, followed by a signed JWT session.*
5. **Q: What database is used?**
   *A: MongoDB Atlas using Mongoose Object Data Modeling (ODM).*
6. **Q: What is the purpose of `AuthContext.jsx`?**
   *A: It provides global React state for user authentication, token storage, login methods, and session restoration.*
7. **Q: What is JWT?**
   *A: JSON Web Token is a compact, URL-safe standard for transferring claims between two parties, used here for stateless API authentication.*
8. **Q: How are protected routes handled on the frontend?**
   *A: Using `ProtectedRoute.jsx` (checks authentication token) and `RoleRoute.jsx` (checks user role permissions).*
9. **Q: What is Brevo?**
   *A: Brevo (formerly Sendinblue) is a cloud email service provider used to deliver transactional OTP emails via HTTP API.*
10. **Q: What shift sessions are supported for milk collection?**
    *A: Morning and Evening shifts.*
11. **Q: How is the milk total amount calculated?**
    *A: Authoritatively calculated on the backend as `Math.round(quantityLiters * ratePerLiter * 100) / 100`.*
12. **Q: Can a farmer collect milk directly without a dairy owner connection?**
    *A: No. Milk collection requires an active `DairyFarmerConnection` status.*
13. **Q: What happens when a medicine stock drops to 0?**
    *A: The system automatically updates its availability to `unavailable`.*
14. **Q: What happens when a medical provider accepts a medicine request?**
    *A: The system atomically deducts the requested quantity from the provider's inventory stock.*
15. **Q: What happens if an accepted medicine request is cancelled?**
    *A: The system restores the reserved medicine quantity back to the stock inventory.*
16. **Q: How are expired OTP documents deleted from MongoDB?**
    *A: Via a Mongoose TTL (Time-To-Live) index on the `expiresAt` field in the `OTP` model.*
17. **Q: What is CORS?**
    *A: Cross-Origin Resource Sharing, configured via Express middleware to allow frontend requests from `http://localhost:5173` to the backend on `port 5000`.*
18. **Q: What bundling tool is used for the frontend?**
    *A: Vite.*
19. **Q: What icon library is used in the frontend?**
    *A: Lucide React.*
20. **Q: Is password storage required in this application?**
    *A: No, the system uses passwordless OTP authentication, eliminating password hashing and leakage risks.*

### Technical Questions (20)
21. **Q: How is OTP security guaranteed against timing attacks?**
    *A: OTPs are hashed using SHA-256 (`crypto.createHash`) and verified using `crypto.timingSafeEqual()`.*
22. **Q: How is double-submission of milk collection entries prevented?**
    *A: Using a compound unique Mongoose index: `{ dairyOwner: 1, farmer: 1, collectionDate: 1, session: 1 }`.*
23. **Q: How does the backend prevent double settlement of unpaid milk collections?**
    *A: `previewSettlement` and `createPayment` check if selected collection IDs are already marked `settled` or associated with non-cancelled payment documents.*
24. **Q: How is atomic stock deduction implemented in medicine request acceptance?**
    *A: Using Mongoose `findOneAndUpdate` with stock query conditions: `{ _id: medId, stockQuantity: { $gte: reqQty } }, { $inc: { stockQuantity: -reqQty } }`.*
25. **Q: What is the purpose of `normalizeIdentity` in `phoneUtils.js`?**
    *A: It standardizes inputs to either a clean 10-digit Indian phone string or a lowercase email address.*
26. **Q: How does the frontend handle token persistence across page refreshes?**
    *A: Tokens are saved in `localStorage.setItem('authToken', token)` and verified on mount via `/api/auth/me`.*
27. **Q: What HTTP status code is returned for an invalid or expired JWT?**
    *A: `401 Unauthorized`.*
28. **Q: What HTTP status code is returned when a user accesses a route forbidden for their role?**
    *A: `403 Forbidden`.*
29. **Q: How is DNS SRV resolution handled for MongoDB Atlas on restricted networks?**
    *A: `db.js` overrides DNS servers using `dns.setServers(['8.8.8.8', '1.1.1.1'])`.*
30. **Q: What is the maximum number of OTP verification attempts allowed?**
    *A: 5 attempts (`MAX_ATTEMPTS = 5`).*
31. **Q: What is the minimum cooldown duration between consecutive OTP requests?**
    *A: 60 seconds (`RESEND_COOLDOWN_MS = 60 * 1000`).*
32. **Q: How are snapshot fields used in `MedicineRequest.js`?**
    *A: `unitPriceSnapshot` and `medicineNameSnapshot` preserve historical prices/names even if the provider updates the medicine later.*
33. **Q: What is the purpose of `express.urlencoded({ extended: true })`?**
    *A: It parses URL-encoded incoming request payloads into `req.body`.*
34. **Q: How does `reportController.js` group collections date-wise?**
    *A: Using MongoDB aggregation pipelines with `$dateToString: { format: '%Y-%m-%d', date: '$collectionDate' }`.*
35. **Q: What is the function of `DashboardRedirect.jsx`?**
    *A: It acts as an index router that inspects `user.role` and redirects to the appropriate role dashboard.*
36. **Q: How does the system handle rapid duplicate medicine request submissions?**
    *A: By checking for pending requests submitted by the same farmer for the same medicine within 5 seconds.*
37. **Q: What role does `dotenv` play in backend security?**
    *A: It loads sensitive API keys and database credentials into `process.env` without hardcoding them in git repositories.*
38. **Q: What is the difference between `app.js` and `server.js`?**
    *A: `app.js` configures Express routes & middleware (testable without opening ports), while `server.js` starts the HTTP listener.*
39. **Q: What CSS framework utility classes are used for dynamic badges?**
    *A: Tailwind CSS dynamic class maps (e.g. `bg-green-50 text-green-700 border-green-200`).*
40. **Q: How are partial payments tracked in the payment ledger?**
    *A: `Payment` schema maintains `grossAmount`, `paidAmount`, `remainingAmount`, and sets status to `partiallyPaid` when `0 < paidAmount < grossAmount`.*

---

## 20. Student & Viva Explanation Guide

### 1-Minute Student Viva Summary
> "Our project is a **Dairy & Medical Management System** built using the MERN stack (MongoDB, Express, React, Node.js). It solves the problem of manual, error-prone milk logging, financial settlement disputes, and inaccessible veterinary healthcare in rural communities. 
> 
> The application supports four distinct user roles: **Farmers, Dairy Owners, Medical Providers, and Administrators**. It features a passwordless OTP authentication system backed by SHA-256 hashing and Brevo email delivery. 
> 
> Dairy Owners can log daily shift milk collections with automatic fat-based calculations and settle unpaid dues through a payment ledger. Farmers can track their milk earnings and submit veterinary medicine orders directly to local Medical Providers. Providers manage medicine stock levels with automatic inventory deduction upon accepting orders. The system enforces strict role-based access control and atomic database operations throughout."

---

## 21. Student / Viva Presentation Diagrams

### 1. Overall System Architecture
```
                                 ┌────────────────────────┐
                                 │      USER / CLIENT     │
                                 └───────────┬────────────┘
                                             │
                                             ▼
                                 ┌────────────────────────┐
                                 │   REACT 19 FRONTEND    │
                                 │ (Vite, Tailwind, Router)│
                                 └───────────┬────────────┘
                                             │
                                   HTTP REST / Bearer JWT
                                             │
                                             ▼
                                 ┌────────────────────────┐
                                 │   EXPRESS BACKEND API  │
                                 │  (Node.js, ES Modules) │
                                 └───────────┬────────────┘
                                             │
           ┌─────────────────────────────────┼─────────────────────────────────┐
           │                                 │                                 │
           ▼                                 ▼                                 ▼
┌────────────────────┐            ┌────────────────────┐            ┌────────────────────┐
│    MIDDLEWARE      │            │    CONTROLLERS     │            │   EMAIL SERVICE    │
│  - authMiddleware  │            │  - authController  │            │  - emailService.js │
│  - roleMiddleware  │            │  - paymentControl. │            │  - Brevo API       │
└──────────┬─────────┘            └──────────┬─────────┘            └──────────┬─────────┘
           │                                 │                                 │
           └─────────────────────────────────┼─────────────────────────────────┘
                                             │
                                             ▼
                                 ┌────────────────────────┐
                                 │    MONGOOSE ODM LAYER  │
                                 └───────────┬────────────┘
                                             │
                                             ▼
                                 ┌────────────────────────┐
                                 │  MONGODB ATLAS CLUSTER │
                                 └───────────┬────────────┘
```

### 2. OTP Authentication & Verification Workflow
```
[ User Inputs Phone/Email ]
           │
           ▼
[ POST /api/auth/request-otp ]
           │
           ▼
[ Backend Checks User & Cooldown (60s) ]
           │
           ▼
[ Generate 6-Digit OTP & SHA-256 Hash ]
           │
           ▼
[ Save Hashed OTP in MongoDB (5 min TTL) ]
           │
           ▼
[ Deliver OTP via Brevo API / Dev Console ]
           │
           ▼
[ User Enters 6-Digit OTP ]
           │
           ▼
[ POST /api/auth/verify-otp ]
           │
           ▼
[ Verify Expiry & Attempt Count (Max 5) ]
           │
           ▼
[ Timing-Safe Hash Verification (crypto.timingSafeEqual) ]
           │
           ▼
[ Delete OTP Record & Issue Signed JWT Token (7 Days) ]
           │
           ▼
[ Client Authenticated & Redirected to Role Dashboard ]
```

---

## 22. Project Understanding Checklist

- [x] **Frontend understood:** Verified React 19, Vite, Tailwind CSS, React Router v7, Lucide icons, and state structure.
- [x] **Backend understood:** Verified Express app/server separation, middleware pipeline, and ES module architecture.
- [x] **Database understood:** Verified MongoDB Mongoose schemas, compound unique indexes, TTL indexes, and references.
- [x] **Authentication understood:** Verified passwordless OTP request/verification flow and JWT issuance.
- [x] **OTP understood:** Verified 6-digit generation, SHA-256 hashing, timing-safe equality, resend cooldown, and attempt limits.
- [x] **Email OTP understood:** Verified `emailService.js` integration with Brevo API v3.
- [x] **JWT understood:** Verified 7-day token signing, Bearer extraction, and signature verification.
- [x] **RBAC understood:** Verified 4 roles (`farmer`, `dairyOwner`, `medicalProvider`, `admin`) and middleware enforcement.
- [x] **Dairy workflow understood:** Verified farmer searching, connection requests, shift collection logging, and payment settlements.
- [x] **Medical workflow understood:** Verified inventory stock management, price snapshotting, and atomic stock deduction/restoration.
- [x] **Frontend-backend communication understood:** Verified native fetch service layer and JSON payloads.
- [x] **File structure understood:** Complete inspection conducted across all files without omitting any source component.
