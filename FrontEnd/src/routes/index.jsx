import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import Login from '../components/Login';
import RegistrationFlow from '../components/RegistrationFlow';
import Profile from '../components/Profile';
import AdvocateDashboard from '../components/dashboards/AdvocateDashboard';
import ClientDashboard from '../components/dashboards/ClientDashboard';
import InternDashboard from '../components/dashboards/InternDashboard';
import Unauthorized from '../pages/Unauthorized';
import Index from '../pages/Index';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegistrationFlow />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected routes */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Role-specific routes */}
      <Route
        path="/dashboards/advocate"
        element={
          <ProtectedRoute roles={['advocate']}>
            <AdvocateDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboards/client"
        element={
          <ProtectedRoute roles={['client']}>
            <ClientDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboards/intern"
        element={
          <ProtectedRoute roles={['intern']}>
            <InternDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes; 