import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import DashboardLayout from './components/layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './features/admin/Dashboard';
import DriverDashboard from './features/driver/Dashboard';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register-driver" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />

      {/* Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<AdminDashboard />} />
          {/* Add other admin routes here */}
        </Route>
      </Route>

      {/* Driver Routes */}
      <Route element={<ProtectedRoute allowedRoles={['driver']} />}>
        <Route path="/driver" element={<DashboardLayout />}>
          <Route index element={<DriverDashboard />} />
          {/* Add other driver routes here */}
        </Route>
      </Route>

      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
