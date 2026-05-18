# VTMS - Vocational Training Management System

A comprehensive management system for handling employee vocational training applications, SAMVAD integration, and role-based workflow approvals.

**Live Repository:** https://github.com/PyTanay/VTMS

---

## 📋 Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [Database Setup](#database-setup)
- [Key Features](#key-features)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

---

## 🎯 Overview

VTMS is a full-stack web application designed to:

- Manage employee training applications with multi-stage approval workflows
- Sync employee data from SAMVAD (internal system) to local database
- Support role-based access control (Admin, Recommending Employee, Training Center Section Head, etc.)
- Track application status through multiple stages (scrutiny, permission letters, biodata, certificates, etc.)
- Generate and manage various training-related documents (gate passes, no-due clearances, reports)

---

## 🛠️ Technology Stack

### Backend

- **Runtime:** Node.js (v24+)
- **Language:** TypeScript
- **Framework:** Express.js 5.x
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT + Cookies
- **Task Scheduling:** node-cron
- **HTML Parsing:** Cheerio (for SAMVAD sync)

### Frontend

- **Framework:** React 18+ with TypeScript
- **Build Tool:** Vite
- **HTTP Client:** Axios
- **Routing:** React Router v7+
- **Styling:** CSS (with theme.ts for theming)

---

## 📦 Prerequisites

Before you begin, ensure you have:

- **Node.js** v24+ and npm 10+
- **PostgreSQL** 14+ (local or remote)
- **Git**
- **Code Editor** (VS Code recommended)
- **PowerShell 5.1+** (for Windows users)

---

## 📁 Project Structure

```
VTMS/
├── api/                          # Backend API
│   ├── src/
│   │   ├── index.ts              # App entry point
│   │   ├── prisma.ts             # Database client
│   │   ├── controllers/          # Route handlers
│   │   ├── middleware/           # Auth, error handling
│   │   ├── routes/               # Route definitions
│   │   ├── jobs/                 # Scheduled jobs (SAMVAD sync)
│   │   └── utils/                # Email, helpers
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema
│   │   ├── seed.ts               # Database seeding
│   │   └── migrations/           # Migration history
│   ├── package.json
│   └── tsconfig.json
│
├── client/                        # Frontend React app
│   ├── src/
│   │   ├── main.tsx              # React entry point
│   │   ├── App.tsx               # Main component
│   │   ├── components/           # Reusable UI components
│   │   ├── pages/                # Page components
│   │   ├── context/              # Auth context
│   │   ├── api/                  # HTTP client setup
│   │   └── theme.ts              # Theme configuration
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── masters/                       # CSV data files
│   ├── employee_master_template.csv
│   ├── department_master.csv
│   └── ...
│
├── README.md
└── .gitignore
```

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/PyTanay/VTMS.git
cd VTMS
```

### 2. Install Dependencies

**Backend:**

```bash
cd api
npm install
```

**Frontend:**

```bash
cd ../client
npm install
```

### 3. Install PostgreSQL

If not already installed, download and install PostgreSQL from https://www.postgresql.org/download/

---

## 🔧 Environment Setup

### Backend (.env)

Create an `.env` file in the `api/` directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/vtms_db"

# JWT
JWT_SECRET="your-secret-key-here-min-32-chars"
JWT_EXPIRY="7d"

# CORS & Client
CLIENT_URL="http://localhost:5173"

# SAMVAD Sync
CREATE_EMPLOYEE_USERS="true"
EMPLOYEE_DEFAULT_PASSWORD="gnfc123"

# Email (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Server
PORT=3000
NODE_ENV="development"
```

### Frontend (.env)

Create an `.env` file in the `client/` directory (if needed):

```env
VITE_API_URL="http://localhost:3000/api"
```

---

## 🗄️ Database Setup

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# In psql prompt:
CREATE DATABASE vtms_db;
\q
```

Or using a GUI tool like pgAdmin.

### 2. Run Prisma Migrations

```bash
cd api
npx prisma migrate dev --name init
```

This will:

- Create all tables defined in `schema.prisma`
- Generate the Prisma client
- Optionally seed the database

### 3. (Optional) Seed Master Data

```bash
npx prisma db seed
```

This populates master tables (departments, categories, colleges, etc.) from CSV files.

---

## ▶️ Running the Application

### Start Backend

```bash
cd api
npm run dev
```

Backend will run on **http://localhost:3000**

### Start Frontend

In a **new terminal**:

```bash
cd client
npm run dev
```

Frontend will run on **http://localhost:5173**

### Access the App

- **Frontend:** http://localhost:5173
- **API:** http://localhost:3000/api

---

## 🔑 Default Credentials

After seeding, use:

| Username | Password | Role                  |
| -------- | -------- | --------------------- |
| admin    | gnfc123  | ADMIN                 |
| emp001   | gnfc123  | RECOMMENDING_EMPLOYEE |

> ⚠️ **Change these credentials in production!**

---

## 🎨 Key Features

### Authentication & Authorization

- JWT-based authentication with secure HTTP-only cookies
- Role-based access control (RBAC)
- Protected routes with middleware checks

### Application Workflow

- Multi-stage application status tracking
- Role-specific views and actions
- Approval chains for scrutiny, permission letters, biodata verification

### SAMVAD Integration

- Automated nightly employee data sync
- Manual sync trigger for admins
- Robust HTML parsing for employee details extraction
- Automatic user account creation for synced employees

### Admin Features

- User management and listing
- Manual SAMVAD sync control
- Master data management

### Reporting & Documents

- Gate pass generation
- No-due clearance tracking
- Training reports and certificates

---

## 📡 API Documentation

### Authentication Endpoints

**Login**

```
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "gnfc123"
}
```

**Logout**

```
POST /api/auth/logout
```

### Application Endpoints

**List Applications**

```
GET /api/applications
Authorization: Bearer <token>
```

**Get Application Details**

```
GET /api/applications/:id
Authorization: Bearer <token>
```

**Create Application**

```
POST /api/applications
Content-Type: application/json
Authorization: Bearer <token>
```

### SAMVAD Sync (Admin Only)

**Trigger Manual Sync**

```
POST /api/samvad/sync
Authorization: Bearer <admin-token>
```

### User Management (Admin Only)

**List All Users**

```
GET /api/users
Authorization: Bearer <admin-token>
```

---

## 🔄 SAMVAD Sync Details

The system automatically syncs employee data from SAMVAD every night at 2 AM. To manually trigger:

1. Log in as admin
2. Go to **SAMVAD Sync** page (in Navigation)
3. Click **"Trigger Sync"** button
4. Monitor sync progress in console/logs

**Synced Fields:**

- Employee ID
- Full Name (Short, First, Middle, Last)
- Department
- Designation
- Official Email
- Mobile Number (optional)

---

## 🛠️ Development Commands

### Backend

```bash
# Development mode (with hot reload)
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start

# Type check
npm exec -- tsc --noEmit

# Prisma Studio (visual DB browser)
npx prisma studio
```

### Frontend

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Type check
npm run type-check
```

---

## 📝 Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Commit changes: `git commit -m "Add my feature"`
3. Push to origin: `git push origin feature/my-feature`
4. Open a Pull Request on GitHub

---

## 📄 License

This project is proprietary to GNFC Ltd. Unauthorized use or distribution is prohibited.

---

## 📞 Support

For issues, questions, or contributions, please reach out to the development team or create an issue on the GitHub repository.

---

**Last Updated:** May 2026  
**Repository:** https://github.com/PyTanay/VTMS
