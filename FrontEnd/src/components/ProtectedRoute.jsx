import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, getUserRole, loading } = useAuth();
  const location = useLocation();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated()) {
    toast.error('Please login to access this page');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  const userRole = getUserRole();
  if (roles && !roles.includes(userRole)) {
    toast.error('You are not authorized to access this page');
    return <Navigate to={`/dashboards/${userRole}`} replace />;
  }

  return children;
};

export default ProtectedRoute; 