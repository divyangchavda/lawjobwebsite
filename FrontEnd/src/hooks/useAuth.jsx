import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const AuthContext = createContext(null);

// Helper function to decode JWT token
const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (error) {
    return null;
  }
};

// Helper function to check if token is expired
const isTokenExpired = (token) => {
  if (!token) return true;
  const decoded = decodeToken(token);
  if (!decoded) return true;
  return decoded.exp * 1000 < Date.now();
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load user from localStorage
  const loadUser = useCallback(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    const userRole = localStorage.getItem('userRole');

    if (token && !isTokenExpired(token) && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        const decodedToken = decodeToken(token);
        
        // Verify token data matches user data
        if (decodedToken && decodedToken.userId === parsedUser.id) {
          setUser(parsedUser);
        } else {
          // Invalid token-user match, clear everything
          handleLogout();
        }
      } catch (error) {
        handleLogout();
      }
    } else if (token && isTokenExpired(token)) {
      // Token expired, clear everything
      handleLogout();
      toast.error('Your session has expired. Please login again.');
    }
    setLoading(false);
  }, []);

  // Initialize auth state
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Handle successful login
  const handleLogin = useCallback((token, userData) => {
    if (!token || isTokenExpired(token)) {
      toast.error('Invalid login credentials');
      return false;
    }

    try {
      localStorage.setItem('token', token);
      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.setItem('userRole', userData.userType.toLowerCase());
      localStorage.setItem('tokenTimestamp', Date.now().toString());
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to save login information');
      return false;
    }
  }, []);

  // Handle logout
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');
    localStorage.removeItem('tokenTimestamp');
    setUser(null);
    navigate('/login');
    toast.success('Logged out successfully');
  }, [navigate]);

  // Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    const token = localStorage.getItem('token');
    return token && !isTokenExpired(token) && user !== null;
  }, [user]);

  // Get user role
  const getUserRole = useCallback(() => {
    if (user?.userType) {
      return user.userType.toLowerCase();
    }
    const storedRole = localStorage.getItem('userRole');
    return storedRole ? storedRole.toLowerCase() : null;
  }, [user]);

  const value = {
    user,
    loading,
    login: handleLogin,
    logout: handleLogout,
    isAuthenticated,
    getUserRole,
    refreshUser: loadUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 