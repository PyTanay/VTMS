# VTMS Implementation Blueprint

## Objective
Build a production-ready **Vocational Training Management System (VTMS)** for Gujarat Narmada Valley Fertilizers & Chemicals Ltd. The system must digitize the full trainee lifecycle: application, approval, scrutiny, permission letter generation, document verification, joining biodata, gate pass, posting, certificate preparation, no-dues clearance, report submission tracking, certificate issue tracking, masters maintenance, reporting, and role-based access control.

This file is written as an implementation prompt for an AI coding agent. It should generate the **entire codebase**, not a prototype.

## Product scope
The VTMS manages vocational trainees from colleges/universities who join for industrial training as part of their curriculum, including personnel details, academic details, college details, training details, posting schedule, history, and management reporting.

The document states the training center handles roughly **300 to 350 trainees** from various colleges, so the system should be built as a durable internal business application with auditability, searchability, and operational reporting.

## Recommended architecture
Create a full-stack web application with the following stack unless constrained otherwise:

- Frontend: React + TypeScript + component library suitable for enterprise forms.
- Backend: Node.js + TypeScript (NestJS or Express with modular architecture).
- Database: PostgreSQL.
- ORM: Prisma or TypeORM.
- Auth: enterprise login plus role-based authorization.
- Document generation: PDF generation for permission letters, biodata print, gate pass, posting letters, certificates, and no-dues forms.
- Email service: SMTP or API-based mailer with templates and attachments.
- File storage: object storage or filesystem abstraction for uploaded trainee documents/photos.
- Background jobs: queue for email sending and batch document generation.
- Audit logging: mandatory for transaction changes.

Use clean architecture, modular domain boundaries, DTO validation, migration-based schema management, and strong server-side validation.

## Core modules
Implement these major menu groups exactly:

1. Master
2. Transactions
3. Reports

### Master menus
Implement the following master entities and screens:

1. College Master.
2. GNFC Plant/Department Master.
3. Plant/Department Head & Section Head Master (dynamic from external employee/SAMVAD source where possible).
4. Category Master.
5. State Master.
6. District Master.
7. Taluka Master.
8. City Master.
9. Branch/Discipline/Course Master.
10. Employee Master (dynamic from SAMVAD or external HR source).
11. Approved Authority Master for ED/GM (dynamic from SAMVAD or external HR source).

### Transaction menus
Implement the following transactions exactly:

1. Online Application from Employee / Others.
2. Scrutiny of Application.
3. Permission Letter.
4. Verification of Documents.
5. Joining / Biodata Form with attachments.
6. Gate Pass.
7. Posting.
8. Certificates.
9. No Dues.
10. Submission of Reports by Trainee (checkbox + date + actor).
11. Issuing of Certificates on last day of training (checkbox + date + actor).

### Reports
Implement these reports with filters and export capability:

1. Application Register.
2. Approved / Not Approved applications from GM/ED.
3. Application forwarded to Training In-charge.
4. Permissions Given.
5. In-charge wise Trainees.
6. Branch / Discipline Wise Applications.
7. College wise Application.
8. Plant / Department Wise Posting Details.
9. Recommended by Employee.
10. Other Reference Applications (Other / Ex-Employee / Retired Employee / VVIP / Business Associate).
11. Employee’s Son / Daughter report.
12. Training Given During Financial Year.

## User roles
Model explicit roles and permissions based on the access matrix in the PDF. At minimum support these roles:

- Recommending Employee
- Training Center Section Head
- Training In-charge
- College / Student-facing applicant flow (where required)
- ED / GM approver

Implement permission granularity per menu and action:

- View
- Entry/Create
- Edit
- Delete

The access matrix in the document must be reflected in seed data and authorization middleware/guards.

## Main workflow
Implement the end-to-end lifecycle below.

### 1) Application intake
Support **two applicant types**:

- Employee-sponsored ward application, where employee enters EC number and system auto-fills employee details.
- Other reference application, entered by Training Center on behalf of Other / Ex-Employee / Retired Employee / VVIP Reference / Business Associate.

Application routing logic:

- Application is submitted online.
- It is routed to ED/GM for approval.
- ED/GM can mark Approved or Not Approved.
- Approved or rejected applications are forwarded to Training Center.
- Training Center prepares a soft copy register / digital application register.

System rule: application should be savable/submittable only if required eligibility criteria are satisfied.

### 2) Scrutiny
After approval, Training Center Sectional Head scrutinizes the application, selects the concerned Training In-charge, enters editable approved training period, considers plant shutdown constraints, and forwards the record to the chosen in-charge.

### 3) Permission letter
Training In-charge generates permission letter with reference number, student/college details, approved training period, and attachments list; then emails it to:

- Student email
- Recommending employee email
- College T&P Officer / HOD email

Required attachments:

- Annexure 1
- Annexure 2
- Acknowledgement Letter

Training In-charge should also capture department/plant of posting during this stage for planning and tracking.

### 4) Verification of documents at joining
At joining, trainee reports with documents listed in permission letter. System must support upload and verification tracking for at least these seven items:

1. Acknowledgement of permission letter.
2. Annexure 1 signed/stamped by college HOD.
3. Annexure 2 signed by student and endorsed by college HOD.
4. Personal accident policy covering approved training period.
5. Passport size photographs.
6. Student college identity card copy.
7. Blood group report.

Each item should support:

- Uploaded file
- Verification checkbox
- Verified by
- Verification timestamp
- Remarks

### 5) Joining / biodata
Generate online biodata form and printable version. It must include:

- Joining metadata, training period, VT/application serial number.
- College details.
- Student personal details, local/permanent address, caste, physical details, contact details, challenge status, photo.
- Academic details in tabular form starting from SSCE.
- Previous trainings.
- Sports / games participation.
- Extra-curricular activities and awards.
- Family background table.
- Relatives / known persons in GNFC table.
- Training & posting details table filled by Training In-charge.
- Upload of required documents.
- Student declaration and signature placeholder.

Implement repeatable child tables for academic details, family members, known persons in GNFC, and posting schedule rows.

### 6) Gate pass
Generate gate pass online with gate pass number equal to application number.

Gate pass must include front/back layout data including:

- Gate pass number.
- Student photo.
- Student name.
- Father’s name.
- Qualification.
- Posting department.
- Date of joining.
- Valid up to.
- Blood group.
- Student mobile number.
- Signature placeholders for holder and authorized signatory.

Provide printable pass format.

### 7) Posting
Generate posting letters from pending-for-posting trainee list. Support grouping of same-college trainees, up to 10 students per letter, with manual selection of training days and department/reporting officer.

Posting letter must include:

- Reference number
- Date
- Qualification / branch
- College short name / place
- Training schedule rows
- Posting department
- To report to
- Reporting officer email
- Selected reporting days (checkboxes for weekdays)
- Training In-charge details
- Department head details

Also support email notification to reporting/sub-reporting HODs as proposed in the workflow.

### 8) Certificates
Generate editable training certificates from system data. Include:

- Certificate reference number
- Student name
- Institute
- Course
- Year / semester
- Study department
- Project title
- Training period
- Behaviour during training
- Progress during training
- Actual completion date
- Remarks for special issue
- Report submission date
- Training department section head

Certificate should be printable and support duplicate issue in special cases with approval trail if desired.

### 9) No dues
Generate no-dues clearance form with:

- Source plant/department head
- Student details
- Training period
- Reporting officer details
- Plant in-charge email IDs
- Plant/department head details
- Training center in-charge details

Support both:

- Printable manual clearance mode.
- Future-ready online no-due workflow with statuses and re-send/edit if reporting officer or sectional head is unavailable.

Also capture clearance lines for:

- Reference material
- Safety items / helmets
- Identity card
- Training report

### 10) Report submission acknowledgement
Training In-charge acknowledges receipt of trainee report using checkbox + date + actor identity.

### 11) Certificate issue acknowledgement
After report submission acknowledgement, Training In-charge marks certificate issued on last day of training, stores issuance date, and records receiving acknowledgement for future reference.

## Business rules
Implement these rules explicitly.

### Eligibility criteria for application save/submit
For employee ward and other-reference applications, save/submit only if these conditions hold:

- Presently pursuing study = Yes.
- Training is compulsory = Yes.
- Training is part of curriculum = Yes.
- Full-time course = Yes.
- Study year must be within allowed values; employee ward allows 1/2/3/4, other-reference allows 2/3/4.
- Semester must be one of 3/4/5/6/7/8 (any).
- Category must be Master / Bachelor / Diploma.
- Branch / discipline must come from master list.

If criteria fail, show precise validation messages and block submission.

### Numbering rules
Implement auto-generated reference numbers for:

- Application number
- Permission letter reference number
- Posting letter reference number
- Certificate reference number
- No-due reference number
- Gate pass number = application number

Reference numbers should encode branch, financial year, and running serial where required by templates.

### Capital-letter rule
For master maintenance, support an option or enforced formatting for uppercase data entry where specified in the document.

### Editable periods
Approved training period must be editable by authorized scrutiny users, because training period depends on plant shutdown constraints versus college-requested dates.

### Attachments and printability
Any transaction that generates official paperwork must support:

- Save draft
- Finalize
- Print preview
- PDF export
- Audit history

## Data model
Design a normalized schema roughly around these entities.

### Identity and authorization
- users
- roles
- permissions
- user_roles
- role_permissions
- employee_profiles
- approver_profiles

### Masters
- colleges
- departments
- department_heads
- categories
- states
- districts
- talukas
- cities
- branches
- academic_years / financial_years

### Main operational entities
- applications
- application_students
- application_college_details
- application_recommenders
- application_approvals
- scrutiny_records
- permission_letters
- permission_letter_attachments
- document_verifications
- biodata_forms
- biodata_academics
- biodata_other_trainings
- biodata_sports
- biodata_extracurriculars
- biodata_family_members
- biodata_gnfc_relatives
- biodata_postings
- uploaded_documents
- gate_passes
- posting_letters
- posting_letter_students
- certificates
- no_due_forms
- no_due_clearance_items
- report_submission_acknowledgements
- certificate_issue_acknowledgements
- audit_logs
- email_logs
- notification_queue

### Suggested application status state machine
Use a robust state machine, for example:

- DRAFT
- SUBMITTED
- PENDING_APPROVAL
- APPROVED
- REJECTED
- RECEIVED_BY_TC
- SCRUTINIZED
- ASSIGNED_TO_INCHARGE
- PERMISSION_LETTER_SENT
- JOINING_PENDING
- DOCUMENTS_VERIFIED
- BIODATA_COMPLETED
- GATE_PASS_CREATED
- POSTED
- TRAINING_ACTIVE
- NO_DUES_PENDING
- REPORT_SUBMITTED
- CERTIFICATE_READY
- CERTIFICATE_ISSUED
- TRAINING_COMPLETED
- CLOSED

Keep action-level transitions permission-aware and audit logged.

## Integrations
Design the system for these integrations:

### 1) Employee / SAMVAD data
The PDF says employee master, department master, section head master, and approved authority master are dynamic and should come from SAMVAD or equivalent enterprise data source.

Therefore:

- Build integration interfaces/adapters for employee and org-structure sync.
- Allow scheduled sync jobs.
- Keep local cached tables with source identifiers.
- Provide admin sync logs and reconciliation UI.

### 2) Email
Email is central to the workflow. Implement template-driven email sending for:

- Recommendation mail to ED/GM.
- Approval / rejection notifications.
- Permission letter with attachments.
- Posting mail to sub-reporting/reporting HODs.
- No-dues mail forwarding where online mode is used.

### 3) Document storage
Store uploaded trainee files and generated PDFs with metadata:

- document type
- source module
- linked entity id
- uploaded by
- uploaded at
- checksum / size / mime type

## UI/UX expectations
Build a serious enterprise workflow application, not a marketing site.

### General UI
- Clean dashboard with counters and pending tasks.
- Left navigation for Master / Transactions / Reports.
- Search-first design for applications and trainees.
- Multi-step forms for application and biodata.
- Read-only audit timeline on each main record.
- Print-friendly document screens.
- Status badges and workflow actions.

### Key pages
Implement at least:

- Login
- Dashboard
- Master management CRUD pages
- Application wizard
- Approval inbox for ED/GM
- Training Center scrutiny queue
- In-charge work queue
- Permission letter composer/preview
- Joining/document verification page
- Biodata editor + print view
- Gate pass print view
- Posting planner and posting letter generator
- Certificate generator and preview
- No-dues workflow page
- Reports listing page with filters and exports
- Role/permission admin page
- Audit log viewer

### Reports UX
Every report should support:

- column filters
- date range filters
- export to Excel/CSV/PDF
- printable layout
- totals/count summary where specified

## Detailed field requirements
Below are the critical fields the generated code must support.

### Application form fields
Support all fields shown in the PDF application section, including at least:

- Application date.
- Student title.
- Student surname, name, father’s name in capital letters.
- Son/Daughter yes/no; relation if no.
- Category.
- Branch / discipline / course / specialization.
- Student email.
- Year and semester of study.
- Training part of curriculum yes/no.
- Training compulsory yes/no.
- Trainings taken in past yes/no.
- Presently pursuing study yes/no.
- Full time course yes/no.
- College details and address.
- College website/place/pincode.
- T&P/HOD contact and email.
- Upload college application letter.
- College application letter reference no/date.
- Requested training period from/to.
- Recommending employee details by system for employee flow.
- Other-reference details entered by Training Center for other flow.
- Declaration checkboxes and undertaking text.

### Scrutiny fields
- Selected Training In-charge.
- Proposed training period (view).
- Approved training period from/to.
- Forward action.

### Permission letter fields
- Student branch for ref no.
- Current financial year.
- Letter serial number.
- Letter date.
- College addressee details.
- Subject qualification/specialization.
- Student name.
- Salutation paragraph.
- College application ref no/date.
- Approved training period.
- Training In-charge and designation.
- Issuing authority.
- Attachments list.

### Biodata fields
Include the many fields listed in pages 35 to 37, including academic and family tables, address structure, known GNFC relatives, and training/posting details.

### Gate pass fields
Use the page 41 field list exactly where possible.

### Posting fields
Use the page 41 to 42 posting letter field structure exactly where possible, including max 10 students, reporting days selection, and report-to officer details.

### Certificate fields
Use the page 43 list exactly where possible, including project title, behaviour, progress, actual completion date, and report submission date.

### No-due fields
Use the page 44 to 46 list exactly where possible, including plant/department in-charge details, email IDs, and multi-line clearance remarks/signatures.

## Seed masters
Seed the system with:

- Category master values including 10th Base F&S, 12th Base F&S, ITI-Base F&S, Diploma, Post Diploma, Bachelor, Master.
- State, district, taluka, city masters as described in the document.
- Branch / discipline / course master values from the document.
- Financial year helper tables.

If full static seed from the PDF is cumbersome, build import scripts and CSV-driven seeders.

## Non-functional requirements
- Enterprise-grade validation.
- Strong auditability for all sensitive transitions.
- Fine-grained authorization.
- Attachment security.
- Fast search on student, college, employee, department, status, and date ranges.
- Reliable PDF generation matching official templates.
- Email retry and failure logs.
- Mobile responsiveness for basic internal use, though desktop-first is acceptable.
- Clean error handling and user feedback.
- Pagination for registers/reports.
- Bulk actions where operationally useful.

## Suggested code organization
Use a monorepo or clean multi-package structure such as:

- apps/web
- apps/api
- packages/ui
- packages/types
- packages/config
- packages/email-templates
- packages/document-templates

On backend, create modules such as:

- auth
- users
- roles-permissions
- masters
- applications
- approvals
- scrutiny
- permission-letters
- document-verification
- biodata
- gate-pass
- postings
- certificates
- no-dues
- reports
- notifications
- audit
- integrations/samvad

## Implementation instructions for the coding agent
Generate the codebase in this order:

1. Project scaffolding.
2. Auth and RBAC.
3. Database schema + migrations.
4. Master modules + seed/import pipeline.
5. Application flow with approval routing.
6. Scrutiny and assignment flow.
7. Permission letter generation + mailer.
8. Document verification + biodata + uploads.
9. Gate pass.
10. Posting letters.
11. Certificates.
12. No dues.
13. Reports.
14. Audit logs, dashboards, exports, polishing.

For each module generate:

- database models
- validation schemas
- API routes/controllers
- service layer
- repository/data-access layer
- UI pages/forms/tables
- tests
- role checks
- document/PDF templates where applicable

## Acceptance criteria
The generated solution is acceptable only if it can:

- Create and track trainee applications from submission to closure.
- Enforce role-based actions per menu/action matrix.
- Generate all required official documents and print views.
- Handle all major fields from the PDF.
- Send required workflow emails.
- Verify and store trainee document uploads.
- Produce all 12 reports with filters and exports.
- Maintain complete audit logs.
- Support master maintenance and dynamic employee/org integration.

## Nice-to-have enhancements
These were not explicitly required in the PDF but are reasonable if time allows:

- Dashboard analytics cards.
- SLA aging for pending approvals and pending verification.
- Bulk permission letter generation for grouped trainees.
- QR code on gate pass and certificate for verification.
- Digital signatures.
- Reminder emails.
- Comment threads / internal notes.
- Archive and retention policies.

## Final instruction to the coding agent
Treat this as a **real internal enterprise application**. Preserve the domain language from the document: Training Center, Training In-charge, Permission Letter, Biodata, Gate Pass, Posting, Certificates, No Dues, and reports. Prefer correctness, maintainability, and auditability over flashy UI. Recreate the business process faithfully from the PDF, while modernizing the implementation details.
