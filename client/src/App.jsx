import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleRoute } from './components/RoleRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardRedirect } from './pages/DashboardRedirect';
import { FarmerDashboard } from './pages/dashboards/FarmerDashboard';
import { DairyOwnerDashboard } from './pages/dashboards/DairyOwnerDashboard';
import { MedicalProviderDashboard } from './pages/dashboards/MedicalProviderDashboard';
import { VeterinarianDashboard } from './pages/dashboards/VeterinarianDashboard';
import { AdminDashboard } from './pages/dashboards/AdminDashboard';
import { ConnectedFarmers } from './pages/dairy/ConnectedFarmers';
import { MilkCollection } from './pages/dairy/MilkCollection';
import { Payments } from './pages/dairy/Payments';
import { DairyOwnerReports } from './pages/dairy/Reports';
import { DairyConnections } from './pages/farmer/DairyConnections';
import { MilkCollections } from './pages/farmer/MilkCollections';
import { FarmerPayments } from './pages/farmer/Payments';
import { FarmerReports } from './pages/farmer/Reports';
import { FarmerMedicines } from './pages/farmer/Medicines';
import FarmerMedicineRequests from './pages/farmer/MedicineRequests';
import { AIDiseaseScanner } from './pages/farmer/AIDiseaseScanner';
import { ScanHistory } from './pages/farmer/ScanHistory';
import { PendingCases } from './pages/veterinarian/PendingCases';
import { AdminReports } from './pages/admin/Reports';
import { Inventory } from './pages/medical/Inventory';
import MedicalMedicineRequests from './pages/medical/MedicineRequests';

const ProtectedShell = ({ children }) => (
  <ProtectedRoute>
    <DashboardLayout>{children}</DashboardLayout>
  </ProtectedRoute>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Role Dashboard Redirects */}
          <Route
            path="/"
            element={
              <ProtectedShell>
                <DashboardRedirect />
              </ProtectedShell>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedShell>
                <DashboardRedirect />
              </ProtectedShell>
            }
          />

          {/* Farmer Routes */}
          <Route
            path="/farmer/dashboard"
            element={
              <ProtectedShell>
                <RoleRoute allowedRoles={['farmer', 'admin']}>
                  <FarmerDashboard />
                </RoleRoute>
              </ProtectedShell>
            }
          />
          <Route
            path="/farmer/milk-collections"
            element={
              <ProtectedShell>
                <RoleRoute allowedRoles={['farmer', 'admin']}>
                  <MilkCollections />
                </RoleRoute>
              </ProtectedShell>
            }
          />
          <Route
            path="/farmer/payments"
            element={
              <ProtectedShell>
                <RoleRoute allowedRoles={['farmer', 'admin']}>
                  <FarmerPayments />
                </RoleRoute>
              </ProtectedShell>
            }
          />
          <Route
            path="/farmer/reports"
            element={
              <ProtectedShell>
                <RoleRoute allowedRoles={['farmer', 'admin']}>
                  <FarmerReports />
                </RoleRoute>
              </ProtectedShell>
            }
          />
          <Route
            path="/farmer/medicines"
            element={
              <ProtectedShell>
                <RoleRoute allowedRoles={['farmer', 'admin']}>
                  <FarmerMedicines />
                </RoleRoute>
              </ProtectedShell>
            }
          />
          <Route
            path="/farmer/medicine-requests"
            element={
              <ProtectedShell>
                <RoleRoute allowedRoles={['farmer', 'admin']}>
                  <FarmerMedicineRequests />
                </RoleRoute>
              </ProtectedShell>
            }
          />
          <Route
            path="/farmer/connections"
            element={
              <ProtectedShell>
                <RoleRoute allowedRoles={['farmer', 'admin']}>
                  <DairyConnections />
                </RoleRoute>
              </ProtectedShell>
            }
          />
          <Route
            path="/farmer/ai-scanner"
            element={
              <ProtectedShell>
                <RoleRoute allowedRoles={['farmer', 'admin']}>
                  <AIDiseaseScanner />
                </RoleRoute>
              </ProtectedShell>
            }
          />
          <Route
            path="/farmer/scan-history"
            element={
              <ProtectedShell>
                <RoleRoute allowedRoles={['farmer', 'admin']}>
                  <ScanHistory />
                </RoleRoute>
              </ProtectedShell>
            }
          />

          {/* Veterinarian Routes */}
          <Route
            path="/veterinarian/dashboard"
            element={
              <ProtectedShell>
                <RoleRoute allowedRoles={['veterinarian', 'admin']}>
                  <VeterinarianDashboard />
                </RoleRoute>
              </ProtectedShell>
            }
          />
          <Route
            path="/veterinarian/cases"
            element={
              <ProtectedShell>
                <RoleRoute allowedRoles={['veterinarian', 'admin']}>
                  <PendingCases />
                </RoleRoute>
              </ProtectedShell>
            }
          />

          {/* Dairy Owner Routes */}
          <Route
            path="/dairy-owner/dashboard"
            element={
              <ProtectedShell>
                <RoleRoute allowedRoles={['dairyOwner', 'admin']}>
                  <DairyOwnerDashboard />
                </RoleRoute>
              </ProtectedShell>
            }
          />
          <Route
            path="/dairy-owner/milk-collection"
            element={
              <ProtectedShell>
                <RoleRoute allowedRoles={['dairyOwner', 'admin']}>
                  <MilkCollection />
                </RoleRoute>
              </ProtectedShell>
            }
          />
          <Route
            path="/dairy-owner/payments"
            element={
              <ProtectedShell>
                <RoleRoute allowedRoles={['dairyOwner', 'admin']}>
                  <Payments />
                </RoleRoute>
              </ProtectedShell>
            }
          />
          <Route
            path="/dairy-owner/reports"
            element={
              <ProtectedShell>
                <RoleRoute allowedRoles={['dairyOwner', 'admin']}>
                  <DairyOwnerReports />
                </RoleRoute>
              </ProtectedShell>
            }
          />
          <Route
            path="/dairy-owner/farmers"
            element={
              <ProtectedShell>
                <RoleRoute allowedRoles={['dairyOwner', 'admin']}>
                  <ConnectedFarmers />
                </RoleRoute>
              </ProtectedShell>
            }
          />

          {/* Medical Provider Routes */}
          <Route
            path="/medical-provider/dashboard"
            element={
              <ProtectedShell>
                <RoleRoute allowedRoles={['medicalProvider', 'admin']}>
                  <MedicalProviderDashboard />
                </RoleRoute>
              </ProtectedShell>
            }
          />
          <Route
            path="/medical-provider/inventory"
            element={
              <ProtectedShell>
                <RoleRoute allowedRoles={['medicalProvider', 'admin']}>
                  <Inventory />
                </RoleRoute>
              </ProtectedShell>
            }
          />
          <Route
            path="/medical-provider/medicine-requests"
            element={
              <ProtectedShell>
                <RoleRoute allowedRoles={['medicalProvider', 'admin']}>
                  <MedicalMedicineRequests />
                </RoleRoute>
              </ProtectedShell>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedShell>
                <RoleRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </RoleRoute>
              </ProtectedShell>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedShell>
                <RoleRoute allowedRoles={['admin']}>
                  <AdminReports />
                </RoleRoute>
              </ProtectedShell>
            }
          />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
