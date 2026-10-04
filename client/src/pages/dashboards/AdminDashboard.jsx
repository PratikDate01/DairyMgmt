import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { SectionCard } from '../../components/common/SectionCard';
import { EmptyState } from '../../components/common/EmptyState';
import { Shield, Users, Milk, Stethoscope } from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Control Center"
        description={`Welcome, ${user?.name || 'Administrator'}. Oversee system users, system health, and cross-platform role permissions.`}
        breadcrumbs={['Home', 'Admin Dashboard']}
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Users"
          value="System User"
          icon={Users}
          badgeText="Active Base"
          badgeType="blue"
        />
        <StatCard
          title="Active Farmers"
          value="0 Farmers"
          icon={Users}
          badgeText="Role: farmer"
          badgeType="neutral"
        />
        <StatCard
          title="Registered Dairies"
          value="0 Units"
          icon={Milk}
          badgeText="Role: dairyOwner"
          badgeType="neutral"
        />
        <StatCard
          title="Medical Providers"
          value="0 Providers"
          icon={Stethoscope}
          badgeText="Role: medicalProvider"
          badgeType="neutral"
        />
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionCard title="System User Directory" subtitle="Manage account activation, roles, and security policies">
            <EmptyState
              title="User Directory Placeholder"
              description="Full administration, user status toggles, and role assignment tables will be accessible here."
              icon={Users}
            />
          </SectionCard>
        </div>

        <div className="lg:col-span-1">
          <SectionCard title="System Overview" subtitle="System diagnostics and environment status">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">API Status</span>
                <span className="font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200 text-xs">
                  Operational
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Database Connection</span>
                <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                  MongoDB Atlas
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Authentication</span>
                <span className="font-semibold text-slate-800 text-xs">OTP + JWT</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Admin Account</span>
                <span className="font-semibold text-slate-800 text-xs flex items-center">
                  <Shield className="w-3.5 h-3.5 text-blue-600 mr-1" />
                  {user?.phone}
                </span>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};
