import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const DashboardRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-600">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        <span className="text-sm font-medium">Redirecting to role dashboard...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  switch (user?.role) {
    case 'farmer':
      return <Navigate to="/farmer/dashboard" replace />;
    case 'dairyOwner':
      return <Navigate to="/dairy-owner/dashboard" replace />;
    case 'medicalProvider':
      return <Navigate to="/medical-provider/dashboard" replace />;
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/farmer/dashboard" replace />;
  }
};
