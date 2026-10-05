import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RoleRoute = ({ allowedRoles = [], children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-600">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        <span className="text-sm font-medium">Checking authorization...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const activeRole = user?.activeRole || user?.role;

  if (!user || !allowedRoles.includes(activeRole)) {
    return (
      <div className="p-6 text-center bg-red-50 text-red-800 rounded-lg border border-red-200 m-6 max-w-xl mx-auto">
        <h3 className="text-lg font-bold mb-2">403 — Access Denied</h3>
        <p className="text-sm text-red-700">
          Your current active role (<strong className="capitalize">{activeRole || 'Unknown'}</strong>) is not authorized to access this portal.
        </p>
      </div>
    );
  }

  return children;
};
