import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dairyFarmerService } from '../../services/dairyFarmerService';
import { PageHeader } from '../../components/common/PageHeader';
import { SectionCard } from '../../components/common/SectionCard';
import { EmptyState } from '../../components/common/EmptyState';
import { Milk, CheckCircle2, XCircle, Clock, UserMinus } from 'lucide-react';

export const DairyConnections = () => {
  const { token } = useAuth();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchConnections = useCallback(async () => {
    try {
      setError('');
      const data = await dairyFarmerService.getFarmerDairies(token);
      setConnections(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleAccept = async (connectionId) => {
    setActionLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await dairyFarmerService.acceptConnection(connectionId, token);
      setSuccessMsg(res.message || 'Dairy connection accepted successfully!');
      await fetchConnections();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (connectionId) => {
    if (!window.confirm('Reject this dairy connection request?')) return;
    setActionLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await dairyFarmerService.rejectConnection(connectionId, token);
      setSuccessMsg(res.message || 'Connection request rejected.');
      await fetchConnections();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async (connectionId) => {
    if (!window.confirm('Disconnect from this dairy owner?')) return;
    setActionLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await dairyFarmerService.disconnectConnection(connectionId, token);
      setSuccessMsg(res.message || 'Dairy relationship disconnected.');
      await fetchConnections();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingRequests = connections.filter((c) => c.status === 'pending');
  const activeConnections = connections.filter((c) => c.status === 'active');
  const otherConnections = connections.filter((c) => c.status === 'rejected' || c.status === 'disconnected');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dairy Connections"
        description="View incoming connection requests from dairy owners and manage active dairy relationships."
        breadcrumbs={['Home', 'Farmer Dashboard', 'Dairy Connections']}
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-800 font-bold text-xs">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg flex justify-between items-center">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-green-500 hover:text-green-800 font-bold text-xs">Dismiss</button>
        </div>
      )}

      {/* Incoming Requests Section */}
      <SectionCard
        title={`Incoming Dairy Connection Requests (${pendingRequests.length})`}
        subtitle="Dairy owners requesting to connect with your farmer profile"
      >
        {loading ? (
          <div className="py-8 text-center text-slate-500 text-xs">Loading requests...</div>
        ) : pendingRequests.length === 0 ? (
          <EmptyState
            title="No Incoming Connection Requests"
            description="When a dairy owner sends a connection request to your mobile number, it will appear here for your approval."
            icon={Clock}
          />
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((item) => (
              <div
                key={item._id}
                className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 font-bold text-sm flex items-center justify-center">
                    🥛
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-800">{item.dairyOwner?.name}</h4>
                    <p className="text-xs text-slate-600 font-mono">Mobile: {item.dairyOwner?.phone}</p>
                    <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider block mt-0.5">
                      Role: {item.dairyOwner?.role}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAccept(item._id)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-50 flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accept Request</span>
                  </button>

                  <button
                    onClick={() => handleReject(item._id)}
                    disabled={actionLoading}
                    className="px-3 py-2 bg-slate-200 hover:bg-red-50 hover:text-red-700 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition disabled:opacity-50 flex items-center space-x-1"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Active Dairy Relationship Section */}
      <SectionCard
        title={`Active Dairy Connection (${activeConnections.length})`}
        subtitle="Dairy owner linked for your daily milk collections and payments"
      >
        {loading ? (
          <div className="py-8 text-center text-slate-500 text-xs">Loading active connections...</div>
        ) : activeConnections.length === 0 ? (
          <EmptyState
            title="No Active Dairy Connection"
            description="You are currently not actively linked with any dairy owner."
            icon={Milk}
          />
        ) : (
          <div className="space-y-4">
            {activeConnections.map((item) => (
              <div
                key={item._id}
                className="p-4 bg-green-50/50 border border-green-200 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-800 font-bold text-sm flex items-center justify-center">
                    🥛
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-base font-bold text-slate-900">{item.dairyOwner?.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-800 rounded border border-green-200">
                        Active Relationship
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-mono mt-0.5">Mobile: {item.dairyOwner?.phone}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDisconnect(item._id)}
                  disabled={actionLoading}
                  className="px-3.5 py-1.5 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-300 text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Past Log */}
      {otherConnections.length > 0 && (
        <SectionCard title="Past Connections Log" subtitle="History of rejected or disconnected requests">
          <div className="space-y-2">
            {otherConnections.map((item) => (
              <div key={item._id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-700">{item.dairyOwner?.name}</span>
                  <span className="text-slate-400 font-mono ml-2">({item.dairyOwner?.phone})</span>
                </div>
                <span className={`px-2 py-0.5 rounded font-semibold text-[10px] uppercase ${item.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
};
