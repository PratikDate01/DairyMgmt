import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dairyFarmerService } from '../../services/dairyFarmerService';
import { milkCollectionService } from '../../services/milkCollectionService';
import { paymentService } from '../../services/paymentService';
import { cattleService } from '../../services/cattleService';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { SectionCard } from '../../components/common/SectionCard';
import { EmptyState } from '../../components/common/EmptyState';
import { Milk, Stethoscope, Wallet, UserCheck, CheckCircle2, Sun, Moon, HeartPulse, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FarmerDashboard = () => {
  const { user, token } = useAuth();
  const [connections, setConnections] = useState([]);
  const [collections, setCollections] = useState([]);
  const [paymentMetrics, setPaymentMetrics] = useState({ totalPaid: 0, totalPending: 0 });
  const [cattleList, setCattleList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (token) {
          const [connData, collRes, payRes, cattleRes] = await Promise.all([
            dairyFarmerService.getFarmerDairies(token),
            milkCollectionService.getFarmerCollections(token),
            paymentService.getFarmerPayments(token),
            cattleService.getFarmerCattle(token).catch(() => ({ cattle: [] }))
          ]);
          setConnections(connData);
          setCollections(collRes.collections || []);
          if (payRes.metrics) {
            setPaymentMetrics(payRes.metrics);
          }
          setCattleList(cattleRes.cattle || []);
        }
      } catch (err) {
        console.warn('Failed to fetch farmer dashboard data:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [token]);

  const activeConnection = connections.find((c) => c.status === 'active');
  const pendingRequests = connections.filter((c) => c.status === 'pending');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCollections = collections.filter((c) => {
    if (!c.collectionDate) return false;
    const itemDate = new Date(c.collectionDate).toISOString().split('T')[0];
    return itemDate === todayStr;
  });

  const todayQty = todayCollections.reduce(
    (sum, item) => sum + (item.quantityLiters || 0),
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Farmer Dashboard"
        description={`Welcome back, ${user?.name || 'Farmer'}. Manage your livestock, dairy connections, and view milk collections.`}
        breadcrumbs={['Home', 'Farmer Dashboard']}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/farmer/cattle"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <HeartPulse className="w-4 h-4" />
              <span>My Cattle</span>
            </Link>
            <Link
              to="/farmer/milk-collections"
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <Milk className="w-4 h-4 text-slate-500" />
              <span>Collections</span>
            </Link>
            <Link
              to="/farmer/payments"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <Wallet className="w-4 h-4" />
              <span>Payments</span>
            </Link>
          </div>
        }
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="My Cattle"
          value={loading ? 'Loading...' : `${cattleList.length} Head`}
          icon={HeartPulse}
          badgeText={cattleList.length > 0 ? `${cattleList.length} Registered` : 'No Cattle Added'}
          badgeType={cattleList.length > 0 ? 'success' : 'neutral'}
        />
        <StatCard
          title="Connected Dairy"
          value={loading ? 'Loading...' : activeConnection ? activeConnection.dairyOwner?.name || 'Connected' : 'Not Connected'}
          icon={Milk}
          badgeText={activeConnection ? 'Active Relationship' : pendingRequests.length > 0 ? `${pendingRequests.length} Request Pending` : 'No Connection'}
          badgeType={activeConnection ? 'success' : pendingRequests.length > 0 ? 'amber' : 'neutral'}
        />
        <StatCard
          title="Milk Collected Today"
          value={loading ? 'Loading...' : `${todayQty.toFixed(1)} Liters`}
          icon={Milk}
          badgeText={todayCollections.length > 0 ? `${todayCollections.length} Shift Recorded` : 'No Log Today'}
          badgeType={todayCollections.length > 0 ? 'success' : 'neutral'}
        />
        <StatCard
          title="Pending Payments"
          value={loading ? 'Loading...' : `₹ ${paymentMetrics.totalPending.toFixed(2)}`}
          icon={Wallet}
          badgeText={paymentMetrics.totalPending > 0 ? 'Awaiting Settlement' : 'Settled'}
          badgeType={paymentMetrics.totalPending > 0 ? 'amber' : 'success'}
        />
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile & Cattle Summary */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <SectionCard title="Farmer Profile Summary" subtitle="Your registered identity details">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Name</span>
                <span className="font-semibold text-slate-800">{user?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Mobile</span>
                <span className="font-mono text-slate-800">{user?.phone}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Role</span>
                <span className="font-semibold text-blue-600 capitalize flex items-center">
                  <UserCheck className="w-3.5 h-3.5 mr-1" />
                  {user?.role}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Account Status</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-green-50 text-green-700 rounded border border-green-200">
                  Active
                </span>
              </div>
            </div>
          </SectionCard>

          {/* My Cattle Summary Section */}
          <SectionCard
            title="My Cattle Summary"
            subtitle="Registered livestock status"
            action={
              <Link to="/farmer/cattle" className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
                View All →
              </Link>
            }
          >
            {loading ? (
              <div className="py-6 text-center text-slate-500 text-xs">Loading cattle...</div>
            ) : cattleList.length === 0 ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-xs text-slate-500">No cattle added yet.</p>
                <Link
                  to="/farmer/cattle"
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Cattle</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {cattleList.slice(0, 3).map((item) => (
                  <div key={item._id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-xl">🐄</span>
                      <div>
                        <h4 className="font-bold text-slate-800 leading-tight">{item.nameTag}</h4>
                        <p className="text-[10px] text-slate-500">{item.breed} • {item.gender}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                      item.healthStatus === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.healthStatus.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right Column: Active Connections & Collections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Connection */}
          <SectionCard
            title="Active Dairy Connection"
            subtitle="Your current linked dairy owner for milk intake"
            action={
              <Link to="/farmer/connections" className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
                View All →
              </Link>
            }
          >
            {activeConnection ? (
              <div className="p-4 bg-green-50/60 border border-green-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-800 font-bold text-sm flex items-center justify-center">
                    🥛
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{activeConnection.dairyOwner?.name}</h4>
                    <p className="text-xs text-slate-600 font-mono">Mobile: {activeConnection.dairyOwner?.phone}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-green-100 text-green-800 rounded border border-green-200 flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-green-600" /> Connected
                </span>
              </div>
            ) : (
              <EmptyState
                title="No Active Dairy Connection"
                description="When a dairy owner requests a connection and you accept it, your active dairy relationship will display here."
                icon={Milk}
              />
            )}
          </SectionCard>

          {/* Recent Milk Collection Records */}
          <SectionCard
            title="Recent Milk Collections"
            subtitle="Milk records logged by your dairy owner"
            action={
              <Link to="/farmer/milk-collections" className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
                View History →
              </Link>
            }
          >
            {loading ? (
              <div className="py-8 text-center text-slate-500 text-xs">Loading collections...</div>
            ) : collections.length === 0 ? (
              <EmptyState
                title="No Milk Collection Recorded"
                description="No milk collection records recorded yet."
                icon={Milk}
              />
            ) : (
              <div className="space-y-3">
                {collections.slice(0, 4).map((item) => (
                  <div key={item._id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5">
                      <div className={`p-2 rounded-lg ${item.session === 'morning' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>
                        {item.session === 'morning' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{item.dairyOwner?.name || 'Dairy Owner'}</h4>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {new Date(item.collectionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • Fat: {item.fatPercentage}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-900">{item.quantityLiters} L</div>
                      <div className="font-mono text-emerald-700 font-semibold text-[11px]">₹{item.totalAmount?.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
};
