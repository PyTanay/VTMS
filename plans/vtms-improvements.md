# VTMS Improvements Implementation Plan

## Overview

This document outlines the implementation plan for 8 major VTMS improvements requested.

## Feature Breakdown

### 1. Email Dev Mode

**Goal**: Add toggle in admin to redirect all emails to tjdesai@gnfc.in during development

**Changes Required**:

- [ ] Add `dev_mode` field to `EmailConfig` model in schema
- [ ] Update `email.ts` to check database config for dev mode (instead of env var)
- [ ] Add endpoint to toggle dev mode in `emailConfig.routes.ts`
- [ ] Update frontend to show dev mode toggle

### 2. Department Master

**Goal**: Fix to seed from user list departments

**Changes Required**:

- [ ] Create seed script to extract unique departments from users
- [ ] Add endpoint to sync departments from existing data

### 3. SAMVAD Sync Improvements

**Goal**: Better logging, clear logs button, live log following, progress bar improvements

**Changes Required**:

- [ ] Create `SamvadSyncLog` model for structured logging
- [ ] Update `samvadSync.ts` to use new log model
- [ ] Add clear logs endpoint
- [ ] Add live log streaming endpoint (Server-Sent Events)
- [ ] Update frontend with clear logs button and improved progress

### 4. Employee Status

**Goal**: Check from SAMVAD, only create active employees, store contact number

**Changes Required**:

- [ ] Add `status` and `contact_no` fields to `Employee` model
- [ ] Update `fetchEmployeeDetails` in `samvadSync.ts` to extract status and contact
- [ ] Only create/update employees with active status from SAMVAD

### 5. Dashboard

**Goal**: Show users and active employees count

**Changes Required**:

- [ ] Update dashboard API to return active employees count
- [ ] Update `Dashboard.tsx` to show active employees count

### 6. User Page

**Goal**: Search by roles

**Changes Required**:

- [ ] Update `AdminUsers.tsx` to add role filter dropdown
- [ ] Update backend to support role-based filtering

### 7. Role Mapping

**Goal**: Add live log trail

**Changes Required**:

- [ ] Create `RoleMappingLog` model
- [ ] Log apply operations to database
- [ ] Update frontend to show log trail

### 8. Reports

**Goal**: Only show colleges with applications, clickable application badges

**Changes Required**:

- [ ] Update `/college-wise` and `/college-wise-apps` endpoints to filter empty colleges
- [ ] Make application numbers clickable in college-wise applications report

---

## Database Schema Changes

```prisma
// EmailConfig - add dev_mode
model EmailConfig {
  id           Int      @id @default(autoincrement())
  type         String   @unique
  enabled      Boolean  @default(true)
  dev_mode     Boolean  @default(false)  // NEW
  updatedAt    DateTime @updatedAt
}

// Employee - add status and contact_no
model Employee {
  id          Int      @id @default(autoincrement())
  employee_no String   @unique
  name        String
  department  String
  email       String
  designation String
  active      Boolean  @default(true)
  status      String?  // NEW - from SAMVAD
  contact_no  String?  // NEW - from SAMVAD
  receive_emails Boolean @default(true)
  user        User?
  applications Application[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// SamvadSyncLog - NEW
model SamvadSyncLog {
  id          Int      @id @default(autoincrement())
  level       String   // INFO, WARN, ERROR
  message     String
  details     String?  // JSON string for additional data
  syncRunId   String?  // Group logs by sync run
  createdAt   DateTime @default(now())
}

// RoleMappingLog - NEW
model RoleMappingLog {
  id          Int      @id @default(autoincrement())
  action      String   // APPLY, CREATE, UPDATE, DELETE
  designation String?
  role        String?
  result      String?  // JSON with matched, unmatched, etc.
  userId      Int?
  createdAt   DateTime @default(now())
}
```

## Implementation Order

1. **Database migrations** - Add new fields and models
2. **Email Dev Mode** - Backend + Frontend
3. **Employee Status** - Update SAMVAD sync
4. **SAMVAD Sync Logging** - New model + endpoints
5. **Dashboard** - Update counts
6. **User Page** - Role search
7. **Role Mapping** - Log trail
8. **Reports** - Filter and clickable badges
