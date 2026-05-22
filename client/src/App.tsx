import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Applications from "./pages/Applications";
import ApplicationForm from "./pages/ApplicationForm";
import ApplicationDetails from "./pages/ApplicationDetails";
import BiodataForm from "./pages/BiodataForm";
import AdminUsers from "./pages/AdminUsers";
import MastersManagement from "./pages/MastersManagement";
import SamvadSync from "./pages/SamvadSync";
import Login from "./pages/Login";
import PermissionLetter from "./pages/PermissionLetter";
import DocumentVerification from "./pages/DocumentVerification";
import GatePass from "./pages/GatePass";
import PostingPlanner from "./pages/PostingPlanner";
import CertificateComposer from "./pages/CertificateComposer";
import NoDueClearance from "./pages/NoDueClearance";
import Reports from "./pages/Reports";
import AuditLog from "./pages/AuditLog";
import MyTasks from "./pages/MyTasks";
import ApprovalInbox from "./pages/ApprovalInbox";
import ScrutinyQueue from "./pages/ScrutinyQueue";
import InChargeQueue from "./pages/InChargeQueue";
import ReportAcknowledgement from "./pages/ReportAcknowledgement";
import CertificateAcknowledgement from "./pages/CertificateAcknowledgement";
import RoleMappingAdmin from "./pages/RoleMappingAdmin";
import EmailNotificationSettings from "./pages/EmailNotificationSettings";
import AccountSettings from "./pages/AccountSettings";
import StudentPortal from "./pages/StudentPortal";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/portal" element={<StudentPortal />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/applications/new" element={<ApplicationForm />} />
          <Route path="/applications/:id" element={<ApplicationDetails />} />
          <Route path="/applications/:id/biodata" element={<BiodataForm />} />
          <Route path="/masters" element={<MastersManagement />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/samvad-sync" element={<SamvadSync />} />
          <Route path="/permission-letters" element={<PermissionLetter />} />
          <Route path="/document-verification" element={<DocumentVerification />} />
          <Route path="/gate-pass" element={<GatePass />} />
          <Route path="/posting-planner" element={<PostingPlanner />} />
          <Route path="/certificates" element={<CertificateComposer />} />
          <Route path="/no-due" element={<NoDueClearance />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/audit-log" element={<AuditLog />} />
          <Route path="/role-mappings" element={<RoleMappingAdmin />} />
          <Route path="/email-settings" element={<EmailNotificationSettings />} />
          <Route path="/my-tasks" element={<MyTasks />} />
          <Route path="/incharge-queue" element={<InChargeQueue />} />
          <Route path="/approval-inbox" element={<ApprovalInbox />} />
          <Route path="/scrutiny-queue" element={<ScrutinyQueue />} />
          <Route path="/report-acknowledgement" element={<ReportAcknowledgement />} />
          <Route path="/certificate-acknowledgement" element={<CertificateAcknowledgement />} />
          <Route path="/account" element={<AccountSettings />} />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
