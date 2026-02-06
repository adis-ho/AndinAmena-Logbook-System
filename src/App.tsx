import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './features/auth/LoginPage';
import DashboardLayout from './components/layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Admin components
import AdminDashboard from './features/admin/Dashboard';
import UserList from './features/admin/UserList';
import UnitList from './features/admin/UnitList';
import LogbookList from './features/admin/LogbookList';
import EtollList from './features/admin/EtollList';
import OperationalBudgetPage from './features/admin/OperationalBudgetPage';
import DriverSummary from './features/admin/DriverSummary';
import MonthlyReport from './features/admin/MonthlyReport';
import TransactionLogsPage from './features/admin/TransactionLogsPage';

// Driver components
import DriverDashboard from './features/driver/Dashboard';
import LogbookForm from './features/driver/LogbookForm';
import LogbookHistory from './features/driver/LogbookHistory';

// Shared components
import ProfilePage from './features/profile/ProfilePage';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<div className="min-h-screen flex items-center justify-center">Unauthorized Access</div>} />

      {/* Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserList />} />
          <Route path="units" element={<UnitList />} />
          <Route path="logbooks" element={<LogbookList />} />
          <Route path="etolls" element={<EtollList />} />
          <Route path="operational" element={<OperationalBudgetPage />} />
          <Route path="driver-summary" element={<DriverSummary />} />
          <Route path="laporan" element={<MonthlyReport />} />
          <Route path="transactions" element={<TransactionLogsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Driver Routes */}
      <Route element={<ProtectedRoute allowedRoles={['driver']} />}>
        <Route path="/driver" element={<DashboardLayout />}>
          <Route index element={<DriverDashboard />} />
          <Route path="logbook" element={<LogbookForm />} />
          <Route path="history" element={<LogbookHistory />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
