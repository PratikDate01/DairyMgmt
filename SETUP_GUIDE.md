# Dairy & Medical Management System - Step-by-Step Setup Guide

Follow these 12 exact steps to setup, configure, run, and demonstrate the application locally.

---

### STEP 1: Install Node.js v24.15.0
Ensure Node.js `v24.15.0` is installed on your computer.
Verify by running:
```bash
node -v
```
*Expected Output*: `v24.15.0`

---

### STEP 2: Clone Repository
Clone the repository to your local computer:
```bash
git clone <repository-url>
```

---

### STEP 3: Open Project Folder
Navigate into the root directory:
```bash
cd DairyMedicalManagement
```

---

### STEP 4: Install Server Dependencies
Navigate into the `server` directory and install dependencies:
```bash
cd server
npm install
```

---

### STEP 5: Create `server/.env` File
In the `server` directory, create a `.env` file by copying `.env.example`:
```bash
cp .env.example .env
```

---

### STEP 6: Configure MongoDB
Open `server/.env` and insert your MongoDB Atlas connection string:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/dairy_medical_management
```

---

### STEP 7: Configure Brevo Email Service
In `server/.env`, insert your Brevo API key and verified sender details:
```env
EMAIL_PROVIDER=brevo
BREVO_API_KEY=your_brevo_api_key_here
BREVO_SENDER_EMAIL=your_verified_sender_email@domain.com
BREVO_SENDER_NAME=Gauseva
```

---

### STEP 8: Start Backend Server
From the `server` directory, run:
```bash
npm run dev
```
*Expected Output*:
- `Server is running on port 5000`
- `MongoDB Connected successfully`

---

### STEP 9: Install Client Dependencies
Open a new terminal window, navigate to the `client` directory, and install dependencies:
```bash
cd client
npm install
```

---

### STEP 10: Start Frontend Client
From the `client` directory, run:
```bash
npm run dev
```
*Expected Output*: Vite dev server listening on `http://localhost:5173`.

---

### STEP 11: Open Browser
Open your browser and navigate to:
```
http://localhost:5173
```

---

### STEP 12: Test Login & OTP Workflow
1. Click **Farmer** (or another role).
2. Enter a phone number (e.g., `9876543210`).
3. Click **Request OTP**.
4. Retrieve the 6-digit OTP sent to your Brevo sender/registered email.
5. Enter the OTP and click **Verify OTP**.
6. Access the dashboard and demonstrate features!

---

### Windows 1-Click Startup Option
Alternatively, on Windows systems, double-click `START_PROJECT.bat` in the project root directory. It will automatically open two terminal windows and start both backend (`http://localhost:5000`) and frontend (`http://localhost:5173`).
