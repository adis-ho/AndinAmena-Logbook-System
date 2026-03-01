import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

const LoginPage = lazy(() => import('./features/auth/LoginPage'));

// Admin components
const AdminDashboard = lazy(() => import('./features/admin/Dashboard'));
const UserList = lazy(() => import('./features/admin/UserList'));
const UnitList = lazy(() => import('./features/admin/UnitList'));
const LogbookList = lazy(() => import('./features/admin/LogbookList'));
const EtollList = lazy(() => import('./features/admin/EtollList'));
const OperationalBudgetPage = lazy(() => import('./features/admin/OperationalBudgetPage'));
const DriverSummary = lazy(() => import('./features/admin/DriverSummary'));
const MonthlyReport = lazy(() => import('./features/admin/MonthlyReport'));
const TransactionLogsPage = lazy(() => import('./features/admin/TransactionLogsPage'));

// Shared components
const DriverDashboard = lazy(() => import('./features/driver/Dashboard'));
const LogbookForm = lazy(() => import('./features/driver/LogbookForm'));
const LogbookHistory = lazy(() => import('./features/driver/LogbookHistory'));
const ProfilePage = lazy(() => import('./features/profile/ProfilePage'));

function App() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>}>
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
        </Suspense>
    );
}

export default App;
