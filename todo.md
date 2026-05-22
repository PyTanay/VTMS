# VTMS — Comprehensive Implementation Todo List

## Legend

- [x] = Already Implemented ✅
- [ ] = Not started / Needs work

---

## ✅ PHASE 0: Documentation & Foundation

- [x] **0.1** Update plan.md with comprehensive implementation status ✅
- [x] **0.2** Fix GNFC Logo on Login Page — updated to use real GNFC leaf logo ✅
- [x] **0.3** Implement Dark/Light Mode Toggle — ThemeContext + CSS variables + sidebar toggle button ✅
- [x] **0.4** Verify all .env vars documented — added DEV_EMAIL, EMAIL_REDIRECT_MODE, EMAIL_ENABLED to .env.example ✅
- [x] **0.5** Seed realistic test data — comprehensive seed script with states, colleges, departments, employees, users, applications at 5 workflow stages, email configs, and role mappings ✅

---

## ✅ PHASE 1: Backend Transaction Flows

- [x] **1.1** Scrutiny controller: GET/POST/PATCH `/api/scrutiny` with rejection reasons ✅
- [x] **1.2** Employee controller: GET `/api/employees` with search/filter (name, department, code) ✅
- [x] **1.3** Master Data CRUD: POST/PUT/DELETE for all 8 master entities ✅
- [x] **1.4** Posting Letter PDF generation endpoint ✅
- [x] **1.5** No Due PDF generation — `generateNoDuePdf` exists in pdfService.ts ✅
- [x] **1.6** Handlebars email templates for notifications ✅

---

## ✅ PHASE 2: Frontend Transaction Pages

- [x] **2.1** Permission Letter Management page ✅
- [x] **2.2** Document Verification Management page ✅
- [x] **2.3** Gate Pass print/management page ✅
- [x] **2.4** Posting Planner page ✅
- [x] **2.5** Certificate Composer page ✅
- [x] **2.6** No Due Clearance page ✅

---

## ✅ PHASE 3: Reports Module

- [x] **3.1** All 13 report endpoints ✅
- [x] **3.2** Date range filters on all reports ✅
- [x] **3.3** CSV export on all reports ✅
- [x] **3.4** Reports page with selector, filters, export buttons ✅

---

## ✅ PHASE 4: Cross-Cutting Business Rules

- [x] **4.1** Eligibility validation in validation.service.ts ✅
- [x] **4.2** Numbering.service.ts with branch encoding ✅
- [x] **4.3** Audit Log viewer (GET endpoint + frontend page) ✅
- [x] **4.4** Layout sidebar with all navigation items ✅
- [x] **4.5** All frontend routes with ProtectedRoute wrappers ✅

---

## ❌ PHASE 5: RBAC & Access Control

### 5.1 Recommending Employee Data Scope

- [x] **5.1.1** Backend: Add `recommending_employee_id` filter to application list query ✅
- [x] **5.1.2** Backend: Auto-set `recommending_employee_id` from authenticated user ✅
- [x] **5.1.3** Frontend: Filter application list display based on user role ✅

### 5.2 Plant/Department HOD Scope ✅

- [x] **5.2.1** Backend: Department-based scope filter for TRAINING_CENTER_SECTION_HEAD ✅
- [x] **5.2.2** Backend: posting_department_id filter based on employee's department ✅
- [x] **5.2.3** Frontend: Existing MyTasks + Dashboard serve as HOD view ✅

### 5.3 User Account Management ✅

- [x] **5.3.1** Backend: `active` field on User model ✅
- [x] **5.3.2** Backend: `suspended` field on User model ✅
- [x] **5.3.3** Backend: POST `/api/users/:id/deactivate` ✅
- [x] **5.3.4** Backend: POST `/api/users/:id/reactivate` ✅
- [x] **5.3.5** Backend: POST `/api/users/:id/suspend` ✅
- [x] **5.3.6** Backend: DELETE `/api/users/:id` — soft delete ✅
- [x] **5.3.7** Frontend: User management UI with suspend/delete/reactivate buttons ✅
- [x] **5.3.8** Frontend: Account settings page + sidebar link ✅

### 5.4 Designation → Role Mapping ✅

- [x] **5.4.1** Backend: Create RoleMapping model in Prisma schema ✅
- [x] **5.4.2** Backend: CRUD endpoints for role mappings ✅
- [x] **5.4.3** Backend: POST `/api/roles/apply` apply designation→role ✅
- [x] **5.4.4** Frontend: Role Assignment admin page UI ✅

---

## ❌ PHASE 6: Online Application Portal & Client Validation

### 6.1 Online Application Portal (Student-Facing) ✅

- [x] **6.1.1** Backend: Public application endpoint (POST /api/public/applications) ✅
- [x] **6.1.2** Backend: Public master data endpoint (GET /api/public/masters) ✅
- [x] **6.1.3** Backend: Track application status (GET /api/public/track + detail) ✅
- [x] **6.1.4** Frontend: StudentPortal page with Apply + Track tabs ✅
- [ ] **6.1.5** Frontend: Student portal login — deferred (track-by-email replaces need)
- [ ] **6.1.6** Frontend: Student dashboard — covered by Track tab in StudentPortal

### 6.2 Client-Side Validation ✅

- [x] **6.2.1** Create shared validation schema (validation.ts with helpers) ✅
- [x] **6.2.2** Application form: eligibility rules validation ✅
- [x] **6.2.3** Biodata form: required fields + numeric validators ✅
- [x] **6.2.4** Permission letter form: required fields validation ✅
- [x] **6.2.5** Real-time field validation helpers (getFieldError, hasFieldError, etc.) ✅

---

## ✅ PHASE 7: Workflow Timeline & Internal Notes

### 7.1 Application Workflow Timeline ✅

- [x] **7.1.1** Backend: Enhance audit log to capture step-by-step transitions ✅
- [x] **7.1.2** Backend: GET `/api/applications/:id/timeline` with durations ✅
- [x] **7.1.3** Frontend: Visual timeline component (completed/current/pending) ✅
- [x] **7.1.4** Frontend: Show time taken per step (e.g., "Approved in 2d 3h") ✅
- [x] **7.1.5** Frontend: Clear status indicators (green check, yellow pending, red rejected) ✅

### 7.2 Comment Threads / Internal Notes ✅

- [x] **7.2.1** Backend: Comment model ✅
- [x] **7.2.2** Backend: GET/POST `/api/applications/:id/comments` ✅
- [x] **7.2.3** Backend: DELETE `/api/comments/:id` ✅
- [x] **7.2.4** Frontend: Comment thread UI ✅
- [x] **7.2.5** Frontend: Multi-line input for comments ✅
- [x] **7.2.6** Frontend: Author name, role, timestamp for each comment ✅

### 7.3 State Machine Enforcement ✅

- [x] **7.3.1** Backend: WorkflowConfig with allowed transitions map ✅
- [x] **7.3.2** Backend: WorkflowEngine — `canTransition(from, to, userRole)` ✅
- [x] **7.3.3** Backend: `transition(applicationId, from, to, userId, comment)` ✅
- [x] **7.3.4** Backend: Integrate workflow engine into status-change endpoint ✅

---

## ❌ PHASE 8: PDF Generation Enhancement

### 8.1 GNFC Logo + Letterhead Space

- [x] **8.1.1** Add GNFC logo image to PDF generation (SVG embed attempt) ✅
- [x] **8.1.2** Add top margin space (40mm / 115pt) for physical letterhead printing ✅
- [x] **8.1.3** Restructure PDF header: Company name, address, CIN, GST, phone, email ✅

### 8.2 Match SOP Document Forms

- [ ] **8.2.1** Reference VTMS SOP PDF scanned forms — extract all fields
- [ ] **8.2.2** Update permission letter PDF template with ALL form fields
- [ ] **8.2.3** Update biodata PDF template with ALL form fields
- [ ] **8.2.4** Update gate pass PDF template with exact front/back layout
- [ ] **8.2.5** Update posting letter PDF template with ALL form fields
- [ ] **8.2.6** Update certificate PDF template with ALL form fields
- [ ] **8.2.7** Create no-due PDF template with ALL form fields

### 8.3 No Due PDF Generator ✅

- [x] **8.3.1** Backend: `generateNoDuePdf` already exists in pdfService.ts ✅
- [x] **8.3.2** Backend: POST `/api/no-dues/:id/generate` endpoint ✅
- [x] **8.3.3** Frontend: Download/print button on No Due Clearance page ✅

---

## ❌ PHASE 9: Email System Enhancement

### 9.1 Dev Mode Email Routing ✅

- [x] **9.1.1** `DEV_EMAIL` env var ✅
- [x] **9.1.2** `EMAIL_REDIRECT_MODE` env var ✅
- [x] **9.1.3** Redirect all emails to DEV_EMAIL when redirect mode is on ✅
- [x] **9.1.4** Log prefix "[DEV MODE]" in redirected emails ✅

### 9.2 Reminder Emails ✅

- [x] **9.2.1** Backend: Reminder engine service ✅
- [x] **9.2.2** Backend: Reminder types (PENDING_APPROVAL, etc.) ✅
- [x] **9.2.3** Backend: Cron job for daily reminders (twice daily at 8AM & 2PM) ✅
- [x] **9.2.4** Backend: Inline HTML email templates ✅

### 9.3 Admin Email Notification Settings ✅

- [x] **9.3.1** Backend: EmailConfig model ✅
- [x] **9.3.2** Backend: CRUD endpoints for email config (GET + PATCH) ✅
- [x] **9.3.3** Backend: Check config before sending (per-type + GLOBAL toggle) ✅
- [x] **9.3.4** Frontend: EmailNotificationSettings admin page ✅
- [x] **9.3.5** Frontend: Sidebar link + route ✅

---

## ❌ PHASE 10: Testing Infrastructure

### 10.1 Backend Test Suite

- [ ] **10.1.1** Jest + ts-jest setup
- [ ] **10.1.2** Unit tests: numbering.service.ts
- [ ] **10.1.3** Unit tests: validation.service.ts
- [ ] **10.1.4** Unit tests: pdf.service.ts
- [ ] **10.1.5** Integration tests: auth routes
- [ ] **10.1.6** Integration tests: application CRUD
- [ ] **10.1.7** Integration tests: master data CRUD
- [ ] **10.1.8** Integration tests: report endpoints
- [ ] **10.1.9** Integration tests: email utility
- [ ] **10.1.10** Integration tests: workflow transitions
- [ ] **10.1.11** Test database setup

### 10.2 Frontend Test Suite

- [ ] **10.2.1** Vitest + React Testing Library setup
- [ ] **10.2.2** Component tests: Layout/Sidebar
- [ ] **10.2.3** Component tests: Login page
- [ ] **10.2.4** Component tests: Application Form
- [ ] **10.2.5** Component tests: Dashboard
- [ ] **10.2.6** Component tests: ProtectedRoute
- [ ] **10.2.7** API mock tests
- [ ] **10.2.8** Form validation tests

### 10.3 Error Monitoring & Logging

- [ ] **10.3.1** Structured logging (winston/pino)
- [ ] **10.3.2** Log cron job executions
- [ ] **10.3.3** Log queue job processing
- [ ] **10.3.4** Log email send attempts
- [ ] **10.3.5** Log viewer dashboard

---

## ❌ PHASE 11: UI/UX Polish

### 11.1 Mobile Responsiveness ✅

- [x] **11.1.1** Sidebar: Auto-collapse on mobile (64px + icon-only) ✅
- [x] **11.1.2** Tables: Horizontal scroll on mobile (overflow-x: auto) ✅
- [x] **11.1.3** Forms: Full-width inputs on mobile (flex-direction: column) ✅
- [x] **11.1.4** Dashboard: Single column layout on mobile (1fr grid) ✅
- [x] **11.1.5** Stats cards: Full width on mobile ✅
- [x] **11.1.6** Touch-friendly controls (min 44px tap targets, 16px font) ✅
- [x] **11.1.7** Test on multiple viewport sizes (1024, 768, 480px breakpoints) ✅

### 11.2 Replace Browser Popups with Modals ✅

- [x] **11.2.1** Reusable Modal component — created `client/src/components/Modal.tsx` ✅
- [x] **11.2.2** Replace `window.confirm()` with Modal — MastersManagement + NoDueClearance ✅
- [x] **11.2.3** Replace `window.alert()` with Toast — NoDueClearance (alerts→addToast) ✅
- [x] **11.2.4** Replace `window.prompt()` with Modal input — NoDueClearance + DocumentVerification ✅
- [x] **11.2.5** Review all pages for remaining popups — zero remaining across codebase ✅

### 11.3 Dark/Light Mode Toggle ✅

- [x] **11.3.1** ThemeContext with mode state ✅
- [x] **11.3.2** Persist in localStorage ✅
- [x] **11.3.3** CSS variables for both themes ✅
- [x] **11.3.4** Toggle button in sidebar ✅
- [x] **11.3.5** Apply on initial load ✅

### 11.4 Fix Login Page GNFC Logo ✅

- [x] **11.4.1** Check logo file path ✅
- [x] **11.4.2** Correct image import path ✅
- [x] **11.4.3** Fallback/alt text ✅

---

## PHASE 12: Additional Admin Features

- [x] **12.1** Global email toggle (EmailConfig GLOBAL type) ✅
- [x] **12.2** Per-type notification toggle (EmailConfig per-type) ✅
- [x] **12.3** Per-employee email suppression (receive_emails field + check in sendEmail) ✅
- [x] **12.4** Admin Notification Settings page (EmailNotificationSettings) ✅
- [x] **12.5** Account deletion confirmation modal (Modal + delete handler in AdminUsers) ✅
- [x] **12.6** User activity log in admin panel (Activity button + audit log Modal in AdminUsers) ✅

---

## Summary Count

| Phase     | Title                        | Done   | Total   | %           |
| --------- | ---------------------------- | ------ | ------- | ----------- |
| 0         | Documentation & Foundation   | 5      | 5       | **100%** ✅ |
| 1         | Backend Transaction Flows    | 6      | 6       | **100%**    |
| 2         | Frontend Transaction Pages   | 6      | 6       | **100%**    |
| 3         | Reports Module               | 4      | 4       | **100%**    |
| 4         | Cross-Cutting Business Rules | 5      | 5       | **100%**    |
| 5         | RBAC & Access Control        | 16     | 16      | **100%** ✅ |
| 6         | Online Portal & Validation   | 9      | 11      | 82%         |
| 7         | Workflow Timeline & Notes    | **13** | **13**  | **100%** ✅ |
| 8         | PDF Generation Enhancement   | 7      | 12      | 58%         |
| 9         | Email System                 | 12     | 12      | **100%** ✅ |
| 10        | Testing                      | 0      | 25      | 0%          |
| 11        | UI/UX Polish                 | 12     | 12      | **100%** ✅ |
| 12        | Additional Admin Features    | 6      | 6       | **100%** ✅ |
| **Total** |                              | **93** | **131** | **71%**     |
