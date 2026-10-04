import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dairyFarmerService } from '../../services/dairyFarmerService';
import { milkCollectionService } from '../../services/milkCollectionService';
import { paymentService } from '../../services/paymentService';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { SectionCard } from '../../components/common/SectionCard';
import { EmptyState } from '../../components/common/EmptyState';
import { Milk, Users, Wallet, Clock, UserPlus, PlusCircle, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DairyOwnerDashboard = () => {
  const { user, token } = useAuth();
  const [connections, setConnections] = useState([]);
  const [collections, setCollections] = useState([]);
  const [paymentMetrics, setPaymentMetrics] = useState({ totalGross: 0, totalPaid: 0, totalPending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (token) {
          const [connData, collRes, payRes] = await Promise.all([
            dairyFarmerService.getDairyFarmers(token),
            milkCollectionService.getDairyOwnerCollections(token),
            paymentService.getDairyOwnerPayments(token)
          ]);
          setConnections(connData);
          setCollections(collRes.collections || []);
          if (payRes.metrics) {
            setPaymentMetrics(payRes.metrics);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch dairy owner data:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [token]);

  const activeFarmers = connections.filter((c) => c.status === 'active');
  const pendingRequests = connections.filter((c) => c.status === 'pending');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCollections = collections.filter((c) => {
    if (!c.collectionDate) return false;
    const itemDate = new Date(c.collectionDate).toISOString().split('T')[0];
    return itemDate === todayStr;
  });

  const todayTotalLiters = todayCollections.reduce(
    (sum, c) => sum + (c.quantityLiters || 0),
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dairy Owner Console"
        description={`Welcome, ${user?.name || 'Dairy Owner'}. Monitor registered farmers, daily milk intake, and payment settlements.`}
        breadcrumbs={['Home', 'Dairy Console']}
        actions={
          <div className="flex items-center space-x-2">
            <Link
              to="/dairy-owner/milk-collection"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record Milk</span>
            </Link>
            <Link
              to="/dairy-owner/payments"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <Wallet className="w-4 h-4" />
              <span>Payments</span>
            </Link>
            <Link
              to="/dairy-owner/farmers"
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1.5"
            >
              <UserPlus className="w-4 h-4 text-slate-500" />
              <span>Connect Farmer</span>
            </Link>
          </div>
        }
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Connected Farmers"
          value={loading ? 'Loading...' : `${activeFarmers.length} Farmers`}
          icon={Users}
          badgeText={activeFarmers.length > 0 ? `${activeFarmers.length} Active` : 'No Farmers Linked'}
          badgeType={activeFarmers.length > 0 ? 'success' : 'neutral'}
        />
        <StatCard
          title="Today's Milk Intake"
          value={loading ? 'Loading...' : `${todayTotalLiters.toFixed(1)} L`}
          icon={Milk}
          badgeText={todayCollections.length > 0 ? `${todayCollections.length} Logs Today` : 'No Record Today'}
          badgeType={todayCollections.length > 0 ? 'success' : 'neutral'}
        />
        <StatCard
          title="Pending Settlements"
          value={loading ? 'Loading...' : `₹ ${paymentMetrics.totalPending.toFixed(2)}`}
          icon={Wallet}
          badgeText={paymentMetrics.totalPending > 0 ? 'Outstanding Ledger' : 'All Clear'}
          badgeType={paymentMetrics.totalPending > 0 ? 'amber' : 'success'}
        />
        <StatCard
          title="Pending Approvals"
          value={loading ? 'Loading...' : `${pendingRequests.length} Pending`}
          icon={Clock}
          badgeText={pendingRequests.length > 0 ? 'Awaiting Farmer Approval' : 'No Queue'}
          badgeType={pendingRequests.length > 0 ? 'amber' : 'neutral'}
        />
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard
          title="Connected Farmers Overview"
          subtitle="List of farmers associated with your dairy unit"
          action={
            <Link to="/dairy-owner/farmers" className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
              Manage →
            </Link>
          }
        >
          {loading ? (
            <div className="py-8 text-center text-slate-500 text-xs">Loading farmers...</div>
          ) : activeFarmers.length === 0 ? (
            <EmptyState
              title="No Farmers Linked Yet"
              description="Farmers will appear here once they register and accept your connection request."
              icon={Users}
            />
          ) : (
            <div className="space-y-3">
              {activeFarmers.slice(0, 5).map((item) => (
                <div key={item._id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                      {item.farmer?.name?.slice(0, 2).toUpperCase() || 'FA'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{item.farmer?.name}</h4>
                      <p className="text-slate-500 font-mono">{item.farmer?.phone}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 font-semibold rounded text-[10px]">
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Today's Milk Collection Register"
          subtitle="Recent milk intake entries recorded"
          action={
            <Link to="/dairy-owner/milk-collection" className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
              View All / Entry →
            </Link>
          }
        >
          {loading ? (
            <div className="py-8 text-center text-slate-500 text-xs">Loading collections...</div>
          ) : collections.length === 0 ? (
            <EmptyState
              title="No Milk Collection Recorded"
              description="Milk collection records entered today will be itemized here in real-time."
              icon={Milk}
            />
          ) : (
            <div className="space-y-3">
              {collections.slice(0, 5).map((item) => (
                <div key={item._id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-2 rounded-lg ${item.session === 'morning' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>
                      {item.session === 'morning' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{item.farmer?.name || 'Farmer'}</h4>
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
  );
};
