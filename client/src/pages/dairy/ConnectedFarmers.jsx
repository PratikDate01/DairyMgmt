import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dairyFarmerService } from '../../services/dairyFarmerService';
import { PageHeader } from '../../components/common/PageHeader';
import { SectionCard } from '../../components/common/SectionCard';
import { EmptyState } from '../../components/common/EmptyState';
import { Search, UserPlus, Users, CheckCircle2, Clock, UserMinus } from 'lucide-react';

export const ConnectedFarmers = () => {
  const { token } = useAuth();

  const [searchPhone, setSearchPhone] = useState('');
  const [foundFarmer, setFoundFarmer] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchConnections = useCallback(async () => {
    try {
      setError('');
      const data = await dairyFarmerService.getDairyFarmers(token);
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

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchError('');
    setFoundFarmer(null);
    setSearchLoading(true);

    try {
      const farmer = await dairyFarmerService.searchFarmer(searchPhone, token);
      setFoundFarmer(farmer);
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSendRequest = async (farmerPhone) => {
    setActionLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await dairyFarmerService.requestConnection(farmerPhone, token);
      setSuccessMsg(res.message || 'Connection request sent successfully!');
      setFoundFarmer(null);
      setSearchPhone('');
      await fetchConnections();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async (connectionId) => {
    if (!window.confirm('Are you sure you want to disconnect this farmer relationship?')) return;
    setActionLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await dairyFarmerService.disconnectConnection(connectionId, token);
      setSuccessMsg(res.message || 'Relationship disconnected successfully.');
      await fetchConnections();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const activeConnections = connections.filter((c) => c.status === 'active');
  const pendingConnections = connections.filter((c) => c.status === 'pending');
  const otherConnections = connections.filter((c) => c.status === 'rejected' || c.status === 'disconnected');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Connected Farmers"
        description="Search, connect, and manage farmers registered under your dairy operation."
        breadcrumbs={['Home', 'Dairy Console', 'Connected Farmers']}
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

      {/* Step 1: Search & Add Farmer */}
      <SectionCard title="Add / Connect New Farmer" subtitle="Search for registered farmers using their 10-digit mobile number">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Enter 10-digit farmer mobile number"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              required
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>
          <button
            type="submit"
            disabled={searchLoading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-xs transition disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>{searchLoading ? 'Searching...' : 'Search Farmer'}</span>
          </button>
        </form>

        {searchError && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg max-w-xl">
            {searchError}
          </div>
        )}

        {/* Found Farmer Preview Card */}
        {foundFarmer && (
          <div className="mt-4 p-4 bg-blue-50/60 border border-blue-200 rounded-lg max-w-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-xs text-blue-600 font-bold uppercase tracking-wider block">Farmer Found</span>
              <h4 className="text-base font-bold text-slate-900">{foundFarmer.name}</h4>
              <p className="text-xs text-slate-600 font-mono">Mobile: {foundFarmer.phone}</p>
            </div>
            <button
              onClick={() => handleSendRequest(foundFarmer.phone)}
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>{actionLoading ? 'Sending...' : 'Send Connection Request'}</span>
            </button>
          </div>
        )}
      </SectionCard>

      {/* Step 2: Lists of Active & Pending Connections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Farmers List */}
        <SectionCard
          title={`Active Farmers (${activeConnections.length})`}
          subtitle="Farmers currently associated with your dairy"
        >
          {loading ? (
            <div className="py-8 text-center text-slate-500 text-xs">Loading farmers...</div>
          ) : activeConnections.length === 0 ? (
            <EmptyState
              title="No Active Farmers Connected"
              description="Use the search box above to send connection requests to farmers."
              icon={Users}
            />
          ) : (
            <div className="space-y-3">
              {activeConnections.map((item) => (
                <div
                  key={item._id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 font-bold text-xs flex items-center justify-center">
                      {item.farmer?.name?.slice(0, 2).toUpperCase() || 'FA'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{item.farmer?.name}</h4>
                      <p className="text-xs text-slate-500 font-mono">{item.farmer?.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 bg-green-100 text-green-800 rounded flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" /> Active
                    </span>
                    <button
                      onClick={() => handleDisconnect(item._id)}
                      disabled={actionLoading}
                      title="Disconnect Relationship"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Pending Requests List */}
        <SectionCard
          title={`Pending Requests (${pendingConnections.length})`}
          subtitle="Connection requests waiting for farmer approval"
        >
          {loading ? (
            <div className="py-8 text-center text-slate-500 text-xs">Loading requests...</div>
          ) : pendingConnections.length === 0 ? (
            <EmptyState
              title="No Pending Connection Requests"
              description="Pending connection invitations will be listed here."
              icon={Clock}
            />
          ) : (
            <div className="space-y-3">
              {pendingConnections.map((item) => (
                <div
                  key={item._id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center">
                      {item.farmer?.name?.slice(0, 2).toUpperCase() || 'FA'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{item.farmer?.name}</h4>
                      <p className="text-xs text-slate-500 font-mono">{item.farmer?.phone}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded flex items-center">
                    <Clock className="w-3 h-3 mr-1 text-amber-600" /> Pending Approval
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* History Log (Rejected / Disconnected) */}
      {otherConnections.length > 0 && (
        <SectionCard title="Past Connections History" subtitle="Rejected or disconnected relationship logs">
          <div className="space-y-2">
            {otherConnections.map((item) => (
              <div key={item._id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-700">{item.farmer?.name}</span>
                  <span className="text-slate-400 font-mono ml-2">({item.farmer?.phone})</span>
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
