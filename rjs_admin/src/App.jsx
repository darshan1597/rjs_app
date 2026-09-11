import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import MfaSetupPage from './pages/MfaSetupPage.jsx';
import MfaVerifyPage from './pages/MfaVerifyPage.jsx';
import RecoveryCodesPage from './pages/RecoveryCodesPage.jsx';
import ChangePasswordPage from './pages/ChangePasswordPage.jsx';
import EmployeesPage from './pages/EmployeesPage.jsx';
import AuditLogsPage from './pages/AuditLogsPage.jsx';
import SystemSettingsPage from './pages/SystemSettingsPage.jsx';
import AdminProfilePage from './pages/AdminProfilePage.jsx';
import DriversPage from './pages/DriversPage.jsx';
import AddDriverPage from './pages/AddDriverPage.jsx';
import BookingsPage from './pages/BookingsPage.jsx';
import TourPackagesPage from './pages/TourPackagesPage.jsx';
import TourPackageEditorPage from './pages/TourPackageEditorPage.jsx';
import PaymentsPage from './pages/PaymentsPage.jsx';
import DriverDetailsPage from './pages/DriverDetailsPage.jsx';
import BookingDetailsPage from './pages/BookingDetailsPage.jsx';
import SupportTicketsPage from './pages/SupportTicketsPage.jsx';
import VehiclesPage from './pages/VehiclesPage.jsx';
import AddVehiclePage from './pages/AddVehiclePage.jsx';
import VehicleVariantsPage from './pages/VehicleVariantsPage.jsx';
import CustomEnquiryPage from './pages/CustomEnquiryPage.jsx';
import CustomEnquiriesPage from './pages/CustomEnquiriesPage.jsx';
import CustomEnquiryDetailsPage from './pages/CustomEnquiryDetailsPage.jsx';

export default function App() {
  const { admin, challenge, setupResult } = useAuth();
  const signedInPath = admin?.mustChangePassword ? '/change-password' : '/';
  return (
    <Routes>
      <Route path="/login" element={!admin ? <LoginPage /> : <Navigate to={signedInPath} replace />} />
      <Route path="/mfa/setup" element={!admin && challenge?.mfaSetupRequired ? <MfaSetupPage /> : <Navigate to={admin ? '/' : '/login'} replace />} />
      <Route path="/mfa/verify" element={!admin && challenge?.mfaRequired ? <MfaVerifyPage /> : <Navigate to={admin ? '/' : '/login'} replace />} />
      <Route path="/mfa/recovery-codes" element={!admin && setupResult ? <RecoveryCodesPage /> : <Navigate to={admin ? '/' : '/login'} replace />} />
      <Route path="/change-password" element={admin ? <ChangePasswordPage /> : <Navigate to="/login" replace />} />
      <Route path="/" element={admin ? (admin.mustChangePassword ? <Navigate to="/change-password" replace /> : <DashboardPage />) : <Navigate to="/login" replace />} />
      <Route path="/employees" element={admin ? (admin.accountType === 'SUPER_ADMIN' ? <EmployeesPage /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
      <Route path="/audit-logs" element={admin ? (admin.accountType === 'SUPER_ADMIN' ? <AuditLogsPage /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
      <Route path="/system-settings" element={admin ? (admin.accountType === 'SUPER_ADMIN' ? <SystemSettingsPage /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
      <Route path="/profile" element={admin ? <AdminProfilePage /> : <Navigate to="/login" replace />} />
      <Route path="/drivers" element={admin ? (admin.accountType === 'EMPLOYEE' ? <DriversPage /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
      <Route path="/drivers/add" element={admin ? (admin.accountType === 'EMPLOYEE' ? <AddDriverPage /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
      <Route path="/drivers/:id" element={admin ? (admin.accountType === 'EMPLOYEE' ? <DriverDetailsPage /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
      <Route path="/vehicles" element={admin ? (admin.accountType === 'EMPLOYEE' ? <VehiclesPage /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
      <Route path="/vehicles/categories/add" element={admin ? (admin.accountType === 'EMPLOYEE' ? <AddVehiclePage /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
      <Route path="/vehicles/categories/:categoryId" element={admin ? (admin.accountType === 'EMPLOYEE' ? <VehicleVariantsPage /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
      <Route path="/vehicles/categories/:categoryId/variants/add" element={admin ? (admin.accountType === 'EMPLOYEE' ? <AddVehiclePage variant /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
      <Route path="/bookings" element={admin ? (admin.accountType === 'EMPLOYEE' ? <BookingsPage /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
      <Route path="/custom-enquiries" element={admin ? (admin.accountType === 'EMPLOYEE' ? <CustomEnquiriesPage /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
      <Route path="/custom-enquiries/add" element={admin ? (admin.accountType === 'EMPLOYEE' ? <CustomEnquiryPage /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
      <Route path="/custom-enquiries/:id/edit" element={admin ? (admin.accountType === 'EMPLOYEE' ? <CustomEnquiryPage /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
      <Route path="/custom-enquiries/:id" element={admin ? (admin.accountType === 'EMPLOYEE' ? <CustomEnquiryDetailsPage /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
      <Route path="/bookings/:id" element={admin ? (admin.accountType === 'EMPLOYEE' ? <BookingDetailsPage /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
      <Route path="/support-tickets" element={admin ? (admin.accountType === 'EMPLOYEE' ? <SupportTicketsPage /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
      <Route path="/tour-packages" element={admin ? (admin.accountType === 'EMPLOYEE' ? <TourPackagesPage /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
      <Route path="/tour-packages/add" element={admin ? (admin.accountType === 'EMPLOYEE' ? <TourPackageEditorPage /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
      <Route path="/tour-packages/:id/edit" element={admin ? (admin.accountType === 'EMPLOYEE' ? <TourPackageEditorPage /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
      <Route path="/payments" element={admin ? (admin.accountType === 'EMPLOYEE' ? <PaymentsPage /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to={admin ? signedInPath : '/login'} replace />} />
    </Routes>
  );
}
