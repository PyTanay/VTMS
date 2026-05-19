# GNFC VTMS — Vocational Training Management System

A full-stack web application for managing vocational training applications, approvals, scrutiny, document verification, biodata, gate passes, posting, certificates, and no-due clearance at **Gujarat Narmada Valley Fertilizers & Chemicals Ltd.**

**Tech Stack:** React 19 + TypeScript + Vite (frontend) · Express 5 + TypeScript + Prisma/PostgreSQL (backend)

---

## ✨ Features at a Glance

| Feature                   | Description                                                                   |
| ------------------------- | ----------------------------------------------------------------------------- |
| **Application Intake**    | Student/employee ward submits training application with documents             |
| **Multi-Role Approval**   | ED/GM approves applications; Training Center scrutinizes                      |
| **Permission Letters**    | Generate PDF permission letters with auto status transition                   |
| **Document Verification** | Upload & verify documents; auto-skips to gate pass if no docs needed          |
| **Biodata / Joining**     | Fill biodata form with academics, family, GNFC relatives                      |
| **Gate Pass**             | Generate front+back gate pass PDF with instructions                           |
| **Posting Planner**       | Group trainees by department, assign officers, generate posting letters       |
| **Certificates**          | Issue training completion certificates with ratings                           |
| **No Dues**               | Line-by-line clearance tracking with finalize workflow                        |
| **12 Reports**            | Application register, branch-wise, college-wise, department posting, etc.     |
| **SAMVAD Sync**           | Nightly employee sync from SAMVAD with conflict resolution                    |
| **Audit Trail**           | Full history of all actions on every record                                   |
| **Role-Based Access**     | ADMIN, ED_GM_APPROVER, TRAINING_CENTER_SECTION_HEAD, TRAINING_IN_CHARGE, etc. |

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

Create `api/.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/vtms"
JWT_SECRET="your-secret-key-min-32-chars-long"
CLIENT_URL="http://localhost:5173"
PORT=3000
```

Optional (for SAMVAD sync):

```env
SAMVAD_URL="http://samvad-url"
SAMVAD_USERNAME="your-username"
SAMVAD_PASSWORD="your-password"
CREATE_EMPLOYEE_USERS="true"
EMPLOYEE_DEFAULT_PASSWORD="gnfc123"
```

Optional (for email notifications):

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### Step 4: Run Database Migrations

```bash
cd api
npx prisma migrate dev --name init
npx prisma db seed    # Populate master data from CSV files
```

This creates all tables and seeds departments, categories, branches, colleges, states, districts, talukas, cities, and a default admin user.

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
│   │   ├── schema.prisma         # 24 database models
│   │   ├── seed.ts               # CSV-based seed script
│   │   └── migrations/           # Migration history
│   └── uploads/                  # Stored PDFs & uploaded documents
│
├── client/                       # Frontend (React + Vite)
│   ├── src/
│   │   ├── main.tsx              # Entry point
│   │   ├── App.tsx               # Routes with ProtectedRoute
│   │   ├── components/           # Reusable: Layout, EmployeeSearch, AuditTimeline, etc.
│   │   ├── pages/                # 20+ page components
│   │   ├── context/              # AuthContext, ToastContext
│   │   ├── api/                  # Axios API client
│   │   └── theme.ts              # Design tokens
│   └── public/                   # Static assets (GNFC logo, favicon)
│
├── masters/                      # CSV master data files for seeding
├── plan.md                       # Implementation plan & status
├── todo.md                       # Task tracking checklist
└── VTMS.md                       # Full product specification
```

---

## 🌐 Application Flow

```
Application → ED/GM Approval → Scrutiny → Permission Letter
    → Document Verification (skipped if no docs uploaded)
    → Biodata / Joining → Gate Pass → Posting
    → Training → Certificate → No Dues → Closed
```

Each step has a dedicated page in the sidebar with role-based visibility.

---

## 👥 User Roles & Permissions

| Role                             | Responsibilities                                               |
| -------------------------------- | -------------------------------------------------------------- |
| **ADMIN**                        | Full access: manage users, masters, all workflows, SAMVAD sync |
| **ED_GM_APPROVER**               | Approve/reject applications in Approval Inbox                  |
| **TRAINING_CENTER_SECTION_HEAD** | Scrutiny queue, document verification, issue certificates      |
| **TRAINING_IN_CHARGE**           | Permission letters, gate pass, posting planner, biodata        |
| **RECOMMENDING_EMPLOYEE**        | Submit applications for employee wards                         |

---

## 🧪 Development Commands

### Backend

```bash
npm run dev         # Development with hot reload (tsx watch)
npm run build       # Compile TypeScript
npm start           # Run compiled production build
npx prisma studio   # Database GUI browser
npx prisma db seed  # Re-seed master data
```

### Frontend

```bash
npm run dev         # Vite dev server (port 5173)
npm run build       # Production build
npm run preview     # Preview production build
npm run lint        # ESLint check
```

---

## 📄 License

Proprietary — GNFC Ltd. Unauthorized use or distribution is prohibited.

---

## 📞 Support

For issues or contributions, please reach out to the development team or create an issue on the GitHub repository.

**Last Updated:** May 2026  
**Repository:** https://github.com/PyTanay/VTMS
