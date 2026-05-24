# GNFC VTMS — Vocational Training Management System

A full-stack enterprise application for managing the complete vocational training lifecycle at **Gujarat Narmada Valley Fertilizers & Chemicals Ltd.** — from application intake and approval through scrutiny, document verification, joining, gate pass, posting, certificates, and no-due clearance.

**Tech Stack:** React 19 + TypeScript + Vite (frontend) · Express 5 + TypeScript + Prisma/PostgreSQL (backend)

---

## ✨ Features at a Glance

| Feature                       | Description                                                                                                                                   |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Application Intake**        | Employee ward / online student application with document uploads                                                                              |
| **Multi-Role Workflow**       | ED/GM approval → Scrutiny → Permission Letter → Joining → Posting → Closure                                                                   |
| **PDF Document Generation**   | Permission letters, biodata, gate pass (front+back), posting letters, certificates                                                            |
| **Document Verification**     | Upload & verify 7 required trainee documents with status tracking                                                                             |
| **Biodata / Joining**         | Complete biodata form with academics, family, sports, GNFC relatives tables                                                                   |
| **Gate Pass**                 | Printable front+back gate pass with photo, blood group, posting dept                                                                          |
| **Posting Planner**           | Group trainees by department (max 10/letter), assign officers, generate letters                                                               |
| **Certificates**              | Training completion certificates with ratings, duplicate approval workflow                                                                    |
| **No Dues Clearance**         | Line-by-line clearance tracking (reference material, safety items, ID card, report)                                                           |
| **13 Reports**                | All reports with date filters & CSV export (Application Register, Approved Apps, Permissions Given, Branch/College/In-Charge/Dept-wise, etc.) |
| **SAMVAD Integration**        | Nightly employee sync from SAMVAD with conflict resolution                                                                                    |
| **Audit Trail**               | Full action history on every record with filters                                                                                              |
| **Role-Based Access Control** | ADMIN, ED_GM_APPROVER, TRAINING_CENTER_SECTION_HEAD, TRAINING_IN_CHARGE, RECOMMENDING_EMPLOYEE, APPLICANT                                     |
| **Email Notifications**       | Template-driven emails for approvals, permission letters, reminders                                                                           |

---

## 🚀 Quick Start (5 Steps)

### Prerequisites

- **Node.js** v24+ and npm 10+
- **PostgreSQL** 14+ (local or network)
- **Git**

### Step 1: Clone & Install

```bash
git clone https://github.com/PyTanay/VTMS.git
cd VTMS

# Install backend
cd api
npm install

# Install frontend
cd ../client
npm install
```

### Step 2: Configure Database

Create a PostgreSQL database and set up the connection string:

```bash
# Connect to PostgreSQL
psql -U postgres
CREATE DATABASE vtms;
\q
```

### Step 3: Configure Environment

Create `api/.env` (copy from `.env.example`):

```env
# Required
DATABASE_URL="postgresql://username:password@localhost:5432/vtms"
JWT_SECRET="your-secret-key-min-32-chars-long"
CLIENT_URL="http://localhost:5173"
PORT=3000

# SAMVAD Employee Sync (optional)
SAMVAD_URL="http://samvad-url"
SAMVAD_USERNAME="your-username"
SAMVAD_PASSWORD="your-password"
CREATE_EMPLOYEE_USERS="true"
EMPLOYEE_DEFAULT_PASSWORD="gnfc123"
SAMVAD_SYNC_CRON="0 2 * * *"

# Email (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Dev mode email routing (redirect all emails to dev inbox)
DEV_EMAIL="tjdesai@gnfc.in"
EMAIL_REDIRECT_MODE="true"
```

### Step 4: Run Database Migrations

```bash
cd api
npx prisma migrate dev --name init
npx prisma db seed    # Populate master data from CSV files
```

This creates all tables and seeds departments, categories, branches, colleges, states, districts, talukas, cities, employees, and a default admin user.

### Step 5: Start Both Servers

**Terminal 1 — Backend (http://localhost:3000):**

```bash
cd api
npm run dev
```

**Terminal 2 — Frontend (http://localhost:5173):**

```bash
cd client
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🔑 Default Login Credentials

| Username | Password  | Role                  |
| -------- | --------- | --------------------- |
| `admin`  | `gnfc123` | ADMIN (full access)   |
| `emp001` | `gnfc123` | RECOMMENDING_EMPLOYEE |

> ⚠️ Change these in production!

---

## 📁 Project Structure

```
VTMS/
├── api/                          # Backend (Express + Prisma)
│   ├── src/
│   │   ├── index.ts              # App entry, middleware, routes
│   │   ├── prisma.ts             # Prisma client singleton
│   │   ├── routes/               # All API route definitions
│   │   ├── services/             # PDF generation, numbering, validation
│   │   ├── middleware/           # Auth JWT, audit logging, error handling, upload
│   │   ├── controllers/          # Business logic (auth, master, samvad, upload, user)
│   │   ├── jobs/                 # Background jobs (SAMVAD sync, queue, cleanup)
│   │   ├── utils/                # Email utility
│   │   ├── templates/            # Handlebars email templates
│   │   └── config/               # Storage paths
│   ├── prisma/
│   │   ├── schema.prisma         # 24+ database models
│   │   ├── seed.ts               # CSV-based seed script
│   │   └── migrations/           # Migration history
│   └── uploads/                  # Stored PDFs & uploaded documents
│
├── client/                       # Frontend (React + Vite)
│   ├── src/
│   │   ├── main.tsx              # Entry point
│   │   ├── App.tsx               # Routes with ProtectedRoute
│   │   ├── components/           # Reusable: Layout, EmployeeSearch, AuditTimeline, etc.
│   │   ├── pages/                # 22+ page components
│   │   ├── context/              # AuthContext, ToastContext
│   │   ├── api/                  # Axios API client
│   │   └── theme.ts              # Design tokens
│   └── public/                   # Static assets (GNFC logo, favicon)
│
├── masters/                      # CSV master data files for seeding
├── plan.md                       # Implementation plan & status (~80% complete)
├── todo.md                       # Granular task tracking checklist
└── VTMS.md                       # Full product specification
```

---

## 🌐 Application Workflow

```
DRAFT → SUBMITTED → PENDING_APPROVAL → APPROVED/REJECTED
    → RECEIVED_BY_TC → SCRUTINIZED → ASSIGNED_TO_INCHARGE
    → PERMISSION_LETTER_SENT → JOINING_PENDING
    → DOCUMENTS_VERIFIED → BIODATA_COMPLETED → GATE_PASS_CREATED
    → POSTED → TRAINING_ACTIVE → REPORT_SUBMITTED
    → CERTIFICATE_READY → CERTIFICATE_ISSUED
    → NO_DUES_PENDING → NO_DUES_CLEARED → CLOSED
```

Each step has a dedicated page in the sidebar with role-based visibility.

---

## 👥 User Roles & Access Matrix

| Role                             | Can See                             | Can Do                                                  |
| -------------------------------- | ----------------------------------- | ------------------------------------------------------- |
| **ADMIN**                        | All applications, all data          | Full system control, user management, email config      |
| **ED_GM_APPROVER**               | Applications assigned for approval  | Approve/reject applications in Approval Inbox           |
| **TRAINING_CENTER_SECTION_HEAD** | All applications                    | Scrutiny queue, master management, assign in-charges    |
| **TRAINING_IN_CHARGE**           | All applications                    | Permission letters, gate pass, posting planner, biodata |
| **RECOMMENDING_EMPLOYEE**        | Only their own applications         | Submit/edit own applications                            |
| **DEPARTMENT_HOD**               | Students posted in their department | View status, receive notifications                      |
| **APPLICANT (Student)**          | Only their own application          | Submit application, upload docs, track status           |

---

## 🧪 Development Commands

### Backend

```bash
npm run dev         # Development with hot reload (tsx watch)
npm run build       # Compile TypeScript
npm start           # Run compiled production build
npx prisma studio   # Database GUI browser
npx prisma db seed  # Re-seed master data
npm test            # Run test suite
```

### Frontend

```bash
npm run dev         # Vite dev server (port 5173)
npm run build       # Production build
npm run preview     # Preview production build
npm run lint        # ESLint check
npm test            # Run test suite
```

---

## 📄 License

Proprietary — GNFC Ltd. Unauthorized use or distribution is prohibited.

---

## 📞 Support

For issues or contributions, please reach out to the development team or create an issue on the GitHub repository.

**Last Updated:** May 2026  
**Repository:** https://github.com/PyTanay/VTMS  
**Implementation Status:** ~80% Complete (see `plan.md` for details, `todo.md` for pending tasks)
