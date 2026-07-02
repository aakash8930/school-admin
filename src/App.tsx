import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { SetPasswordPage } from './pages/SetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { SchoolsPage } from './pages/schools/SchoolsPage';
import { SchoolDetailPage } from './pages/schools/SchoolDetailPage';
import { StudentsPage } from './pages/students/StudentsPage';
import { ClassesPage } from './pages/classes/ClassesPage';
import { AttendancePage } from './pages/attendance/AttendancePage';
import { FeesPage } from './pages/fees/FeesPage';
import { DaycarePage } from './pages/daycare/DaycarePage';
import { AcademicPage } from './pages/academic/AcademicPage';
import { AdmissionsPage } from './pages/admissions/AdmissionsPage';
import { CommunicationPage } from './pages/communication/CommunicationPage';
import { NotFoundPage, PlaceholderPage } from './pages/PlaceholderPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/set-password" element={<SetPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="schools" element={<SchoolsPage />} />
            <Route path="schools/:id" element={<SchoolDetailPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="staff" element={<PlaceholderPage title="Staff" />} />
            <Route path="classes" element={<ClassesPage />} />
            <Route path="fees" element={<FeesPage />} />
            <Route path="daycare" element={<DaycarePage />} />
            <Route path="academic" element={<AcademicPage />} />
            <Route path="admissions" element={<AdmissionsPage />} />
            <Route path="communication" element={<CommunicationPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="users" element={<UsersPage />} />
          </Route>
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
