import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { DashboardPage } from './DashboardPage';
import { EmployeesPage } from './EmployeesPage';
import { ActivityLogPage } from './ActivityLogPage';
import { useAuthStore } from '../store/authStore';

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.accessToken);
  return token ? children : <Navigate to="/login" replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
      <Route path="/activity-logs" element={<ProtectedRoute><ActivityLogPage /></ProtectedRoute>} />
    </Routes>
  );
}
