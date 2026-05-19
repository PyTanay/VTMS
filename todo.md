# VTMS - Actionable Implementation Todo List

## Phase 1: Complete Backend Transaction Flows

- [ ] **1.1** Implement Scrutiny controller: GET/POST/PATCH `/api/scrutiny` with rejection reasons, supporting Application status transition to SCRUTINY_PASSED/SCRUTINY_FAILED
- [ ] **1.2** Implement Employee controller: GET `/api/employees` with search/filter (by name, department, code) from Employee table
- [ ] **1.3** Add Master Data CRUD: POST/PUT/DELETE endpoints for all 8 master entities (categories, branches, colleges, states, districts, talukas, cities, departments)
- [ ] **1.4** Add Posting Letter PDF generation endpoint: `POST /api/postings/:id/generate` using existing `generatePostingLetterPdf` from pdfService
- [ ] **1.5** Add No Due PDF generation to pdfService.ts: `generateNoDuePdf` that renders clearance certificate with all line items
- [ ] **1.6** Create Handlebars email templates for permission letter notifications and integrate with existing email utility

## Phase 2: Build Frontend Transaction Pages

- [ ] **2.1** Build Permission Letter Management page: composer with preview, PDF download, email send trigger, issuance log
- [ ] **2.2** Build Document Verification Management page: checklist UI, document upload, verify/approve workflow with remarks
- [ ] **2.3** Build Gate Pass print/management page: front+back page preview, issuance tracking, PDF download
- [ ] **2.4** Build Posting Planner page: group trainees by plant/department, assign to colleges, generate posting letter PDF
- [ ] **2.5** Build Certificate Composer page: template selection, duplicate approval workflow, PDF generation
- [ ] **2.6** Build No Due Clearance page: line-by-line clearance with remarks, finalize workflow, print certificate

## Phase 3: Complete Reports Module

- [ ] **3.1** Implement 6 missing report endpoints: in-charge wise, college wise applications, plant/department wise posting, recommended by employee, other references, employee's son/daughter, training during FY
- [ ] **3.2** Add date range filters to all 12 report endpoints
- [ ] **3.3** Add CSV export to all report endpoints
- [ ] **3.4** Build Reports page: report selector, date filters, data table, chart visualization, export buttons

## Phase 4: Cross-Cutting Business Rules

- [ ] **4.1** Enhance eligibility validation in validation.service.ts: applicant-type-specific year ranges (employee_ward: 1-4, other_reference: 2-4), category must be Master/Bachelor/Diploma, compulsory fields (presently_pursuing, training_compulsory, part_of_curriculum, full_time_course all true), course+branch from master list
- [ ] **4.2** Enhance numbering.service.ts: encode branch code in application_no, proper serial-per-FY for all ref types (application_no, permission_letter_ref, certificate_ref, no_due_ref)
- [ ] **4.3** Build Audit Log viewer: GET `/api/audit-logs` with filters (entity, action, user, date range), frontend audit log page
- [ ] **4.4** Update Layout.tsx sidebar: add navigation items for Masters, Reports, Permission Letters, Gate Pass, Posting, Certificates, No Dues — with role-based visibility
- [ ] **4.5** Add new routes in App.tsx: all missing transaction pages with role-based ProtectedRoute wrappers

## Phase 5: Polish & Infrastructure

- [ ] **5.1** Review `.env.example` — ensure all required vars documented (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SAMVAD_URL, SAMVAD_USERNAME, SAMVAD_PASSWORD, JWT_SECRET, DATABASE_URL, CLIENT_URL)
- [ ] **5.2** Convert raw HTML email strings to Handlebars templates with GNFC branding, stored in `api/src/templates/emails/`
- [ ] **5.3** Add unit tests for numbering.service.ts, validation.service.ts, pdf.service.ts
- [ ] **5.4** Add error monitoring / logging for background jobs (samvadSync, cleanupUploads, queue failures)

---

## Legend

- [ ] = Not started
- [-] = In progress
- [x] = Complete
