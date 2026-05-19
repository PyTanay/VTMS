# VTMS Architecture Enhancement Plan

## 1. User Login Display Enhancement

### Current State

Login returns `{ id, username, role }`. Employee name/designation/EC number not shown.

### Required Changes

#### Backend: [`api/src/controllers/auth.controller.ts`](api/src/controllers/auth.controller.ts)

- Modify the `login` and `getCurrentUser` endpoints to include employee details:

```ts
const user = await prisma.user.findUnique({
  where: { id: decoded.id },
  select: {
    id: true,
    username: true,
    role: true,
    email: true,
    employee: {
      select: { id: true, employee_no: true, name: true, designation: true, department: true },
    },
  },
});
```

- Response now includes: `user.employee.name`, `user.employee.employee_no`, `user.employee.designation`

#### Frontend: [`client/src/context/AuthContext.tsx`](client/src/context/AuthContext.tsx)

- Extend `User` interface:

```ts
interface User {
  id: number;
  username: string;
  role: string;
  email?: string;
  employee?: { id: number; employee_no: string; name: string; designation: string; department: string } | null;
}
```

#### Frontend: [`client/src/components/Layout.tsx`](client/src/components/Layout.tsx)

- In sidebar footer, display:

```
{user?.employee?.name || user?.username}
{user?.employee?.designation || ""}
EC: {user?.employee?.employee_no || ""}
Dept: {user?.employee?.department || ""}
```

---

## 2. Master Lists — Departments & Designations

### Backend: New Endpoints

#### [`GET /api/employees/departments`](api/src/routes/employee.routes.ts)

Returns list of distinct departments from Employee model:

```ts
const departments = await prisma.employee.findMany({
  select: { department: true },
  distinct: ["department"],
  orderBy: { department: "asc" },
});
```

#### [`GET /api/employees/designations`](api/src/routes/employee.routes.ts)

Returns list of distinct designations:

```ts
const designations = await prisma.employee.findMany({
  select: { designation: true },
  distinct: ["designation"],
  orderBy: { designation: "asc" },
});
```

#### [`GET /api/employees/stats`](api/src/routes/employee.routes.ts)

Returns employee count by department:

```ts
const byDepartment = await prisma.employee.groupBy({
  by: ["department"],
  _count: { id: true },
});
```

### Frontend: [`client/src/pages/EmployeeLists.tsx`](client/src/pages/EmployeeLists.tsx)

- Tabbed view: "All Employees", "By Department", "By Designation"
- Table with search, department/designation filter
- Count per department/designation

---

## 3. Designation‑Based Role Assignment

### Data Model Change

In [`api/prisma/schema.prisma`](api/prisma/schema.prisma), add a new model:

```prisma
model RoleMapping {
  id            Int      @id @default(autoincrement())
  designation   String   @unique  // e.g., "Manager", "Section Head"
  role          String   // e.g., "TRAINING_CENTER_SECTION_HEAD"
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("role_mappings")
}
```

Also add `designation` field to `User` model as optional override:

```prisma
model User {
  // ... existing fields ...
  designation     String?   // Override from employee
}
```

### Backend: [`api/src/routes/master.routes.ts`](api/src/routes/master.routes.ts)

New endpoints:

- `GET /api/roles/designations` — list all designation→role mappings
- `POST /api/roles/designations` — create mapping (ADMIN)
- `PUT /api/roles/designations/:id` — update mapping (ADMIN)
- `DELETE /api/roles/designations/:id` — delete mapping (ADMIN)
- `POST /api/roles/apply` — apply mappings: for each employee without explicit role, auto-assign based on designation

### Frontend: [`client/src/pages/RoleAssignment.tsx`](client/src/pages/RoleAssignment.tsx)

- Table: Designation → Current Role mapping
- Edit/Add modal
- "Apply to All" button that assigns roles to all employees matching designation

---

## 4. VTMS Workflow Definition

### Complete Workflow State Machine

```
┌─────────────┐
│   DRAFT     │  (Applicant / Training Center)
└──────┬──────┘
       │ Submit
       ▼
┌──────────────┐
│  SUBMITTED   │  → email notification to ED/GM
└──────┬───────┘
       │ Review
       ▼
┌──────────────────┐     ┌──────────────────┐
│   APPROVED       │     │   REJECTED       │
│  (ED/GM Approver)│     │  (ED/GM Approver)│
└──────┬───────────┘     └──────┬───────────┘
       │                        │
       ▼                        ▼
┌──────────────────┐     Notify applicant
│  RECEIVED_BY_TC  │     + Training Center
│ (Training Center)│
└──────┬───────────┘
       │ Scrutiny
       ▼
┌──────────────────┐
│  SCRUTINIZED     │  (Section Head → assign In-Charge)
│  ASSIGNED_TO_IC  │
└──────┬───────────┘
       │ Permission Letter
       ▼
┌──────────────────────┐
│ PERMISSION_LETTER_   │  (In-Charge generates PDF + email)
│ SENT                 │
└──────┬───────────────┘
       │ Student Joins
       ▼
┌──────────────────┐
│ JOINING_PENDING   │  (Verify documents)
│ DOCUMENTS_VERIFIED│
│ BIODATA_COMPLETED │
│ GATE_PASS_CREATED │
└──────┬───────────┘
       │ Posting
       ▼
┌──────────────────┐
│ POSTED           │  (In-Charge creates posting letter)
│ TRAINING_ACTIVE  │
└──────┬───────────┘
       │ Completion
       ▼
┌──────────────────┐
│ REPORT_SUBMITTED │
│ CERTIFICATE_ISSUE│
│ NO_DUES_CLEARED  │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ CLOSED           │
└──────────────────┘
```

### Roles & Responsibilities

| Role                             | Responsibilities                                                                                           |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **APPLICANT**                    | Submit application, upload documents, view status                                                          |
| **RECOMMENDING_EMPLOYEE**        | Sponsor employee ward, track application status                                                            |
| **ED_GM_APPROVER**               | Approve/reject applications, review details                                                                |
| **TRAINING_CENTER_SECTION_HEAD** | Scrutinize applications, assign in-charge, manage masters                                                  |
| **TRAINING_IN_CHARGE**           | Generate permission letters, verify docs, create biodata, gate pass, posting letters, certificates, no-due |
| **ADMIN**                        | Full system access, user management, role assignment, master data                                          |

---

## 5. Generic Approval Workflow Module

### Design Pattern: State Machine + Strategy

#### Core Interface

```ts
// api/src/services/workflow.service.ts
interface WorkflowStep {
  name: string;
  label: string;
  assigneeRole: string | null; // null = auto
  requiredAction: string; // "approve" | "review" | "generate" | "verify"
  nextOnApprove: string;
  nextOnReject: string | null; // null = terminal
  timeoutHours?: number;
}

interface WorkflowTransition {
  from: string;
  to: string;
  action: string;
  allowedRoles: string[];
  requiresComment: boolean;
  notifyRoles: string[];
}
```

#### Generic Steps Configuration

```ts
const APPLICATION_WORKFLOW: WorkflowStep[] = [
  { name: "DRAFT", label: "Draft", assigneeRole: null, requiredAction: "submit", nextOnApprove: "SUBMITTED", nextOnReject: null },
  {
    name: "SUBMITTED",
    label: "Awaiting ED/GM Approval",
    assigneeRole: "ED_GM_APPROVER",
    requiredAction: "approve",
    nextOnApprove: "APPROVED",
    nextOnReject: "REJECTED",
  },
  {
    name: "SCRUTINIZED",
    label: "Awaiting In-Charge",
    assigneeRole: "TRAINING_IN_CHARGE",
    requiredAction: "generate",
    nextOnApprove: "PERMISSION_LETTER_SENT",
    nextOnReject: null,
  },
  // ... etc
];
```

#### Implementation

1. **Workflow Engine** [`api/src/services/workflow.service.ts`](api/src/services/workflow.service.ts):
   - `getNextSteps(currentStatus, userRole)` — returns available transitions
   - `canTransition(from, to, userRole)` — authorization check
   - `transition(applicationId, from, to, userId, comment)` — state change + audit

2. **Workflow Config per Module**:
   - Application workflow
   - Certificate workflow (original → duplicate approval)
   - No-due workflow (pending → cleared)
   - Posting workflow

3. **Frontend Component** [`client/src/components/WorkflowTimeline.tsx`](client/src/components/WorkflowTimeline.tsx):
   - Visual timeline showing each step with status (completed/current/pending)
   - Action buttons for current step
   - Comment/remark input

---

## 6. Specific Bug Fixes

### Bug 1: Document Verification "Load Documents" Not Working

**Root Cause:** The page required manual Application ID entry. No global search existed.

**Fix Applied:**

- Backend: [`api/src/routes/documentVerification.routes.ts`](api/src/routes/documentVerification.routes.ts) — Added `GET /` with search/filter on `doc_type`, `verified`, `search`, pagination, and `GET /doc-types` for filter dropdown
- Frontend: [`client/src/pages/DocumentVerification.tsx`](client/src/pages/DocumentVerification.tsx) — Replaced with search bar, status filter, doc type dropdown, student/app no display, download button

### Bug 2: PDF Generation Not Working

**Root Cause:** Multiple issues:

1. `uploads/` directory might not exist
2. PDFKit output path might be relative and not match static serving
3. Frontend opens relative URL without proper base

**Fix Applied:**

- Added error boundaries in [`api/src/services/pdf.service.ts`](api/src/services/pdf.service.ts)
- Verify `uploadsDir` exists:

```bash
mkdir -p uploads
```

- Frontend PDF download: Uses `window.open()` with full URL (handles both relative and absolute)
- Added test script [`api/src/scripts/testPdf.ts`](api/src/scripts/testPdf.ts):

```ts
import { generateGatePassPdf } from "../services/pdf.service";
// Mock application
const mockApp = { application_no: "TEST001", student_name: "Test" /* ... */ };
const pdf = await generateGatePassPdf(mockApp);
console.log("PDF generated:", pdf.url);
```

---

## 7. Database Schema Changes Summary

```prisma
// New model for designation→role mapping
model RoleMapping {
  id          Int      @id @default(autoincrement())
  designation String   @unique
  role        String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("role_mappings")
}

// Add designation to User
model User {
  // ... existing fields ...
  designation     String?
  // ... existing relations ...
}
```

Migration command:

```bash
npx prisma migrate dev --name add_role_mappings_and_designation
```

---

## 8. Implementation Order

| Phase  | Items                                                      | Depends On |
| ------ | ---------------------------------------------------------- | ---------- |
| **P1** | Fix Doc Verification + PDF bugs                            | Nothing    |
| **P2** | Login display enhancement (employee data in auth response) | P1         |
| **P3** | Employee master lists (departments, designations, stats)   | P2         |
| **P4** | RoleMapping model + designation-based role assignment UI   | P3         |
| **P5** | Workflow engine service + generic transitions              | P4         |
| **P6** | Workflow timeline UI component                             | P5         |
| **P7** | Readme.md workflow documentation                           | P6         |

---

## 9. API Route Summary (New/Modified)

| Method | Endpoint                               | Description                                | Auth       |
| ------ | -------------------------------------- | ------------------------------------------ | ---------- |
| GET    | `/api/auth/me`                         | Returns user + employee details (enhanced) | Any        |
| GET    | `/api/employees/departments`           | List departments                           | Any        |
| GET    | `/api/employees/designations`          | List designations                          | Any        |
| GET    | `/api/employees/stats`                 | Employee counts by dept                    | Any        |
| GET    | `/api/document-verification`           | List with search/filter                    | Any        |
| GET    | `/api/document-verification/doc-types` | Distinct doc types                         | Any        |
| GET    | `/api/roles/designations`              | Role mappings list                         | ADMIN      |
| POST   | `/api/roles/designations`              | Create mapping                             | ADMIN      |
| PUT    | `/api/roles/designations/:id`          | Update mapping                             | ADMIN      |
| DELETE | `/api/roles/designations/:id`          | Delete mapping                             | ADMIN      |
| POST   | `/api/roles/apply`                     | Apply designation→role to all              | ADMIN      |
| GET    | `/api/workflow/:entity/:id`            | Get workflow state + transitions           | Any        |
| POST   | `/api/workflow/:entity/:id/transition` | Execute transition                         | Role-based |
