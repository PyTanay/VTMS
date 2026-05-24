# VTMS - Task List & Implementation Roadmap

## Project Status: 94% Complete (123/131 tasks)

---

## Phase 0: Documentation & Foundation

| #   | Task                                | Details                                                | Backend       | Frontend       |
| --- | ----------------------------------- | ------------------------------------------------------ | ------------- | -------------- |
| 0.1 | **Update plan.md + README.md**      | Reflect current state, track progress                  | N/A           | N/A            |
| 0.2 | **Fix GNFC Logo on Login Page**     | Logo not displaying — check path, import, base URL     | N/A           | ✅ Fix needed  |
| 0.3 | **Dark/Light Mode Toggle**          | Theme switcher component with localStorage persistence | N/A           | ❌ New feature |
| 0.4 | **Verify all .env vars documented** | Ensure .env.example covers all required vars           | ✅ Fix needed | N/A            |
| 0.5 | **Seed realistic test data**        | Create comprehensive seed data for development/testing | ⚠️ Enhance    | N/A            |

---

## Phase 1: Critical — RBAC & Access Control

| #   | Task                                   | Details                                                                       | Backend          | Frontend      |
| --- | -------------------------------------- | ----------------------------------------------------------------------------- | ---------------- | ------------- |
| 1.1 | **RBAC — Recommending Employee scope** | RECOMMENDING_EMPLOYEE role should only see applications they created          | ❌ New filter    | ❌ New filter |
| 1.2 | **RBAC — Plant/Dept HOD scope**        | HODs should see students posted in their department only                      | ❌ New filter    | ❌ New filter |
| 1.3 | **User Account Management**            | Delete/suspend/reactivate users; self-deactivation for recommending employees | ❌ New endpoints | ❌ New UI     |
| 1.4 | **Designation→Role Mapping**           | Model + CRUD + apply-to-all                                                   | ❌ New           | ❌ New        |

---

## Phase 2: Online Application Portal & Client Validation

| #   | Task                                  | Details                                                         | Backend | Frontend    |
| --- | ------------------------------------- | --------------------------------------------------------------- | ------- | ----------- |
| 2.1 | **Online Application Portal**         | Student-facing external flow                                    | ❌ New  | ❌ New      |
| 2.2 | **Client-Side Validation**            | Mirror all backend validation rules on frontend forms           | N/A     | ❌ New      |
| 2.3 | **Replace Chrome Popups with Modals** | All browser-native popups replaced with custom modal components | N/A     | ❌ Refactor |

---

## Phase 3: Workflow Timeline & Internal Notes

| #   | Task                                      | Details                                                | Backend                  | Frontend  |
| --- | ----------------------------------------- | ------------------------------------------------------ | ------------------------ | --------- |
| 3.1 | **Application Workflow Timeline**         | Show full workflow on each application page            | ⚠️ Enhance audit log     | ❌ New UI |
| 3.2 | **Comment Threads / Internal Notes**      | Add notes on applications, visible to authorized roles | ❌ New model + endpoints | ❌ New UI |
| 3.3 | **Application State Machine Enforcement** | Strict transition validation                           | ❌ New service           | N/A       |

---

## Phase 4: PDF Generation Enhancement

| #   | Task                                   | Details                                                                   | Backend                 | Frontend           |
| --- | -------------------------------------- | ------------------------------------------------------------------------- | ----------------------- | ------------------ |
| 4.1 | **PDF — GNFC Logo + Letterhead Space** | All PDFs to include GNFC logo and leave top space for physical letterhead | ❌ Refactor PDF service | N/A                |
| 4.2 | **PDF — Match SOP Document Forms**     | Reference VTMS SOP PDF forms; include ALL fields from scanned forms       | ❌ Refactor PDF service | N/A                |
| 4.3 | **No Due PDF Generator**               | Add `generateNoDuePdf` to pdfService                                      | ❌ New                  | ❌ Download button |

---

## Phase 5: Email System Enhancement

| #   | Task                                    | Details                                             | Backend                  | Frontend        |
| --- | --------------------------------------- | --------------------------------------------------- | ------------------------ | --------------- |
| 5.1 | **Email — Dev Mode routing**            | All emails during development go to tjdesai@gnfc.in | ⚠️ Config change         | N/A             |
| 5.2 | **Email — Reminder Emails**             | Automated reminders for pending actions             | ❌ New cron/service      | N/A             |
| 5.3 | **Email — Admin Notification Settings** | Global on/off toggle; granular per-type control     | ❌ New model + endpoints | ❌ New admin UI |

---

## Phase 6: Testing Infrastructure

| #   | Task                          | Details                                                                                             | Backend                   | Frontend |
| --- | ----------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------- | -------- |
| 6.1 | **Backend Test Suite**        | Unit tests for numbering.service, validation.service, pdf.service; integration tests for API routes | ❌ New (currently 1 test) | N/A      |
| 6.2 | **Frontend Test Suite**       | Component tests, form tests, API mock tests                                                         | N/A                       | ❌ New   |
| 6.3 | **Error Monitoring for Jobs** | Comprehensive logging for cron jobs and failed operations                                           | ❌ New                    | N/A      |

---

## Phase 7: UI/UX Polish

| #   | Task                               | Details                                                              | Backend | Frontend       |
| --- | ---------------------------------- | -------------------------------------------------------------------- | ------- | -------------- |
| 7.1 | **Mobile Responsiveness**          | Responsive design for all pages; sidebar collapses on mobile         | N/A     | ❌ Refactor    |
| 7.2 | **Dark/Light Mode Toggle**         | Theme switcher with localStorage persistence                         | N/A     | ❌ New feature |
| 7.3 | **Fix Login Page GNFC Logo**       | Logo not displaying — check path                                     | N/A     | ✅ Fix needed  |
| 7.4 | **Replace all popups with Modals** | Custom modal components for confirmations, notifications, data entry | N/A     | ❌ Refactor    |

---

## Phase 8: VTMS Improvements

| #   | Task                         | Details                                                                          | Backend          | Frontend   |
| --- | ---------------------------- | -------------------------------------------------------------------------------- | ---------------- | ---------- |
| 8.1 | **Email — Dev Mode**         | Add toggle in admin to redirect all emails to tjdesai@gnfc.in during development | ⚠️ Config change | N/A        |
| 8.2 | **Department Master**        | Fix to seed from user list departments                                           | ⚠️ Enhance       | N/A        |
| 8.3 | **SAMVAD Sync Improvements** | Better logging, clear logs button, live log following, progress bar improvements | ⚠️ Enhance       | ⚠️ Enhance |
| 8.4 | **Employee Status**          | Check from SAMVAD, only create active employees, store contact number            | ⚠️ Enhance       | N/A        |
| 8.5 | **Dashboard**                | Show users and active employees count                                            | ⚠️ Enhance       | ⚠️ Enhance |
| 8.6 | **User Page**                | Search by roles                                                                  | ⚠️ Enhance       | ⚠️ Enhance |
| 8.7 | **Role Mapping**             | Add live log trail                                                               | ⚠️ Enhance       | ⚠️ Enhance |
| 8.8 | **Reports**                  | Only show colleges with applications, clickable application badges               | ⚠️ Enhance       | ⚠️ Enhance |

---

## Completed Tasks (Recent Fixes)

- ✅ SAMVAD sync robust email conflict resolution
- ✅ Invalid employee name filtering
- ✅ Employee name display in task greeting
- ✅ Select dropdown styling fixes
- ✅ Employee search dropdown overlay fixes
- ✅ TypeScript strict mode fixes (20+ errors)
- ✅ Report page clickable app number cells
- ✅ Schema mismatch fixes in application.routes.ts
- ✅ Site visit counter inflation fix
- ✅ Workflow timeline shows all steps

---

## Implementation Order

```
Phase 0: Foundation & Fixes (Week 1)
├── 0.1 Update plan.md + README.md ✅
├── 0.2 Fix GNFC logo on login page
├── 0.3 Dark/Light mode toggle
├── 0.4 Verify .env vars documented
└── 0.5 Seed realistic test data

Phase 1: RBAC & Access Control (Week 1-2)
├── 1.1 Recommending Employee scope filter
├── 1.2 Plant/Dept HOD scope filter
├── 1.3 User Account Management
└── 1.4 Designation→Role Mapping

Phase 2: Online Portal & Validation (Week 2)
├── 2.1 Online Application Portal
├── 2.2 Client-side validation
└── 2.3 Replace browser popups with modals

Phase 3: Workflow & Notes (Week 2-3)
├── 3.1 Application Workflow Timeline
├── 3.2 Comment Threads / Internal Notes
└── 3.3 State Machine Enforcement

Phase 4: PDF Enhancement (Week 3)
├── 4.1 GNFC Logo + letterhead space
├── 4.2 Match SOP document forms
└── 4.3 No Due PDF Generator

Phase 5: Email System (Week 3-4)
├── 5.1 Dev mode email routing
├── 5.2 Reminder email generation
└── 5.3 Admin email notification settings

Phase 6: Testing (Week 4)
├── 6.1 Backend test suite
├── 6.2 Frontend test suite
└── 6.3 Error monitoring for jobs

Phase 7: UI/UX Polish (Week 4-5)
├── 7.1 Mobile responsiveness
├── 7.2 Dark/Light Mode
├── 7.3 Fix login GNFC logo
└── 7.4 Replace all popups with modals

Phase 8: VTMS Improvements (Week 5-6)
├── 8.1 Email Dev Mode
├── 8.2 Department Master
├── 8.3 SAMVAD Sync Improvements
├── 8.4 Employee Status
├── 8.5 Dashboard
├── 8.6 User Page
├── 8.7 Role Mapping
└── 8.8 Reports
```
