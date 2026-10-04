# Dairy & Medical Management System

A full-stack web application designed to streamline dairy operations, milk collection, payment processing, reports generation, and veterinary medicine request management for farmers, dairy owners, medical providers, and administrators.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Main Features](#2-main-features)
3. [User Roles](#3-user-roles)
4. [Technology Stack](#4-technology-stack)
5. [Folder Structure](#5-folder-structure)
6. [Prerequisites](#6-prerequisites)
7. [Node.js Version](#7-nodejs-version)
8. [MongoDB Requirements](#8-mongodb-requirements)
9. [Brevo Requirements](#9-brevo-requirements)
10. [Environment Setup](#10-environment-setup)
11. [Backend Installation](#11-backend-installation)
12. [Frontend Installation](#12-frontend-installation)
13. [Running Backend](#13-running-backend)
14. [Running Frontend](#14-running-frontend)
15. [Local URLs](#15-local-urls)
16. [Login & OTP Setup](#16-login--otp-setup)
17. [Complete Demo Workflow](#17-complete-demo-workflow)
18. [Troubleshooting](#18-troubleshooting)
19. [Project Architecture](#19-project-architecture)
20. [Security Warning](#20-security-warning)
21. [Current Limitations](#21-current-limitations)
22. [Future Scope](#22-future-scope)

---

## 1. Project Overview
The Dairy & Medical Management System connects Dairy Farmers, Dairy Owners, Medical Providers (Veterinary Pharmacists), and System Administrators onto a unified digital platform. It digitizes daily milk collections, transparent automated payment calculations based on FAT/SNF quality standards, real-time veterinary medicine cataloging and request fulfillment, and comprehensive financial reports.

---

## 2. Main Features
- **OTP Authentication**: Phone-based authentication with transactional email OTP verification via Brevo API.
- **Role-Based Access Control (RBAC)**: Distinct dashboards and permissions for Farmer, Dairy Owner, Medical Provider, and Admin.
- **Dairy Connections**: Farmers search and request connections with Dairy Owners; Dairy Owners approve or reject requests.
- **Milk Collection Management**: Daily morning/evening milk logging with quantity (Liters), FAT %, SNF %, and automatic total rate calculation.
- **Automated Billing & Payments**: Period-based unpaid milk collection summaries, preview payouts, and status tracking (Pending/Completed).
- **Veterinary Medicine Catalog**: Medical Providers add/update medicines, manage stock levels, and set prices.
- **Medicine Request Workflow**: Multi-step request state machine: `Requested` -> `Accepted` -> `Packed` -> `Ready for Pickup` -> `Completed`.
- **Analytics & Reporting**: Daily, weekly, and monthly reports for milk yield, earnings, collection totals, and pending payouts.

---

## 3. User Roles
1. **Farmer (`FARMER`)**: Views connections, milk records, payment history, reports, catalog of medicines, and places medicine requests.
2. **Dairy Owner (`DAIRY_OWNER`)**: Manages farmer connections, logs daily milk collections, calculates payouts, processes payments, and views collection analytics.
3. **Medical Provider (`MEDICAL_PROVIDER`)**: Manages medicine inventory, sets stock availability, accepts/packs/fulfills medicine orders placed by farmers.
4. **Admin (`ADMIN`)**: System-wide overview of users, connections, system activity, and administrative management.

---

## 4. Technology Stack
- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React, React Router DOM v7
- **Backend**: Node.js (v24.15.0), Express.js (ES Modules), Mongoose, Express Validator, JSON Web Token (JWT)
- **Database**: MongoDB Atlas (Cloud Database)
- **Email Service**: Brevo (formerly Sendinblue) Transactional Email API
- **Authentication**: OTP Verification + JWT Bearer Tokens + RBAC Middleware

---

## 5. Folder Structure
```
DairyMedicalManagement/
├── .nvmrc                      # Node.js version declaration (v24.15.0)
├── .gitignore                  # Root Git ignore file
├── START_PROJECT.bat           # Windows 1-click startup script
├── README.md                   # Complete repository documentation
├── SETUP_GUIDE.md              # 12-step setup walkthrough
├── client/                     # Frontend Application (React + Vite)
│   ├── .gitignore
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── context/
│       ├── pages/
│       └── services/           # API fetch client handlers
└── server/                     # Backend Application (Express.js)
    ├── .env.example            # Safe environment template
    ├── .gitignore
    ├── package.json
    ├── server.js               # Application entry point
    └── src/
        ├── app.js              # Express app setup & routes
        ├── config/             # DB & Env configuration
        ├── controllers/        # Business logic controllers
        ├── middleware/         # Auth, validation, RBAC middleware
        ├── models/             # Mongoose schemas
        ├── routes/             # Express API routes
        ├── services/           # Brevo email service
        └── utils/              # Helper utilities
```

---

## 6. Prerequisites
- **Node.js**: `v24.15.0`
- **npm**: `v10.x` or higher (comes bundled with Node.js)
- **MongoDB**: Active MongoDB Atlas cluster or local MongoDB instance
- **Brevo Account**: Active Brevo account with a verified sender email and API Key

---

## 7. Node.js Version
This project strictly requires **Node.js v24.15.0**.
To set the version via NVM (Node Version Manager):
```bash
nvm use 24.15.0
```
Verify your installed Node version:
```bash
node -v
# Output must be v24.15.0
```

---

## 8. MongoDB Requirements
The application connects to MongoDB using Mongoose.
- A valid MongoDB connection string (`MONGODB_URI`) must be provided in `server/.env`.
- Database name defaults to `dairy_medical_management`.
- Ensure network access IP whitelist in MongoDB Atlas allows connections from your IP (`0.0.0.0/0` for development).

---

## 9. Brevo Requirements
Email OTP dispatch uses the Brevo HTTP API.
- You must create an API key in your Brevo Dashboard (Settings -> API Keys).
- Your sender email must be verified in Brevo.
- Configure `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and `BREVO_SENDER_NAME` in `server/.env`.

---

## 10. Environment Setup
1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Populate `server/.env` with your actual credentials:
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/dairy_medical_management
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d

   EMAIL_PROVIDER=brevo
   BREVO_API_KEY=your_actual_brevo_api_key
   BREVO_SENDER_EMAIL=your_verified_sender_email@domain.com
   BREVO_SENDER_NAME=Gauseva
   ```

---

## 11. Backend Installation
```bash
cd server
npm install
```

---

## 12. Frontend Installation
```bash
cd client
npm install
```

---

## 13. Running Backend
From the `server` directory:
```bash
npm run dev
```
The backend will start at `http://localhost:5000`. You should see:
- `Server is running on port 5000`
- `MongoDB Connected successfully`

---

## 14. Running Frontend
From the `client` directory:
```bash
npm run dev
```
The frontend will start at `http://localhost:5173`.

---

## 15. Local URLs
- **Frontend Application**: `http://localhost:5173`
- **Backend API Base**: `http://localhost:5000/api`
- **Backend Health Check**: `http://localhost:5000/api/health`

---

## 16. Login & OTP Setup
1. Open `http://localhost:5173` in your browser.
2. Select your role (**Farmer**, **Dairy Owner**, **Medical Provider**, or **Admin**).
3. Enter your phone number (e.g., `9876543210`).
4. Click **Request OTP**.
5. Check the email account registered or configured in Brevo for the 6-digit OTP code.
6. Enter the 6-digit OTP in the verification step and click **Verify OTP**.
7. Upon successful verification, a JWT token is stored in `localStorage` and you are redirected to your role dashboard.

---

## 17. Complete Demo Workflow

### 👨‍🌾 FARMER DEMO
1. **Login**: Authenticate as Farmer.
2. **Dashboard**: View active dairy connection status, recent milk entries, and pending payments.
3. **Connections**: Search for a Dairy Owner by phone number and click **Send Connection Request**.
4. **Milk Records**: View daily logged milk entries (Quantity, FAT%, SNF%, Total Amount).
5. **Payments**: Inspect received payouts and pending payment summaries.
6. **Reports**: View milk supply summaries and earnings charts.
7. **Medicines & Requests**: Browse veterinary medicines added by Medical Providers. Click **Request Medicine**, select quantity, and submit request.

### 🥛 DAIRY OWNER DEMO
1. **Login**: Authenticate as Dairy Owner.
2. **Dashboard**: View connected farmers count, daily milk collection totals, and pending payouts.
3. **Search & Connection**: View pending incoming connection requests from farmers and click **Accept**.
4. **Milk Collection**: Select connected farmer, shift (Morning/Evening), quantity (Liters), FAT%, and SNF%. Log collection.
5. **Payments**: Generate payment previews for unpaid collections, select date range, and record payment completion.
6. **Reports**: Access aggregated milk collection and financial payout reports.

### 💊 MEDICAL PROVIDER DEMO
1. **Login**: Authenticate as Medical Provider.
2. **Dashboard**: Overview of medicine inventory, low stock alerts, and incoming medicine orders.
3. **Inventory**: Add new veterinary medicine with Name, Category, Price, and Stock Quantity.
4. **Medicine Request State Machine**:
   - View new incoming requests from Farmers (Status: `Requested`).
   - Click **Accept Request** (Status changes to `Accepted`).
   - Click **Pack Order** (Status changes to `Packed`).
   - Click **Mark Ready for Pickup** (Status changes to `Ready`).
   - Click **Complete Order** (Status changes to `Completed`).

### 🛡️ ADMIN DEMO
1. **Login**: Authenticate as System Admin.
2. **Dashboard**: View high-level analytics on total registered users, active connections, total milk collected, and platform activity.

---

## 18. Troubleshooting
- **Backend cannot connect to MongoDB**: Verify `MONGODB_URI` in `server/.env` and ensure your current IP is whitelisted in MongoDB Atlas Network Access.
- **OTP Email not arriving**: Check `BREVO_API_KEY` and `BREVO_SENDER_EMAIL` in `server/.env`. Verify that the sender email is verified in your Brevo account.
- **CORS Error in Browser**: Ensure backend server is running on `http://localhost:5000`. `server/src/app.js` enables CORS for requests from `http://localhost:5173`.
- **Node version mismatch**: Ensure Node `v24.15.0` is active using `node -v`.

---

## 19. Project Architecture
```
[ React Client (Vite) ]
     http://localhost:5173
              │
              │ HTTP REST Requests (Fetch API)
              ▼
[ Express.js Server ]
     http://localhost:5000
   ├── Auth Middleware (JWT Verification & RBAC)
   ├── Controllers & Business Logic
   └── Mongoose Models
         ├── DB Connection ──► [ MongoDB Atlas Cloud ]
         └── Email Dispatch ──► [ Brevo HTTP API ]
```

---

## 20. Security Warning
- **Never commit `.env` files** containing live database URIs or API keys.
- Store real production secrets securely using environment secret managers.
- Always use `.env.example` as a template for public code distribution.

---

## 21. Current Limitations
- Phone authentication currently verifies OTP delivered via transactional email API. Direct SMS gateway integration can be attached in future releases.
- File uploads for user profile avatars or medicine images default to string URLs.

---

## 22. Future Scope
- **SMS Gateway Integration**: Twilio or MSG91 integration for direct mobile SMS OTPs.
- **Automated Milk Analyzer IoT Integration**: Direct Bluetooth/Wi-Fi integration with digital FAT/SNF testing machines.
- **Multi-language Support**: Local language options (Hindi, Marathi, Gujarati) for regional farmers.
- **PDF Invoice Export**: Downloadable PDF receipts for milk payments and veterinary medicine purchases.
