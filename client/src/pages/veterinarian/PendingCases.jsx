import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { veterinarianService } from '../../services/veterinarianService';
import {
  Activity,
  Stethoscope,
  CheckCircle,
  Clock,
  Info,
  Calendar,
  User,
  ChevronRight,
  Filter
} from 'lucide-react';
import { CaseDetailModal } from './CaseDetailModal';

export const PendingCases = () => {
  const { token } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCase, setSelectedCase] = useState(null);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const data = await veterinarianService.getCases(token, statusFilter);
      setCases(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch cases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [token, statusFilter]);

  const handleCaseUpdated = (updatedCase) => {
    setCases(prev => prev.map(c => c._id === updatedCase._id ? updatedCase : c));
    setSelectedCase(updatedCase);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Activity className="w-6 h-6 text-teal-600" />
            <span>Disease Cases Queue</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Clinical case review management for cattle AI screenings submitted by farmers.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          {[
            { id: 'all', label: 'All Cases' },
            { id: 'pending_review', label: 'Pending' },
            { id: 'under_review', label: 'In Progress' },
            { id: 'review_completed', label: 'Completed' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === tab.id
                  ? 'bg-white text-teal-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* Cases List */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-3"></div>
          <p className="text-xs font-medium text-slate-500">Loading cases queue...</p>
        </div>
      ) : cases.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto text-xl">
            🩺
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Cases Found</h3>
          <p className="text-xs text-slate-500">
            There are currently no cattle disease cases matching the selected status filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cases.map((caseItem) => (
            <div
              key={caseItem._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-400 transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                    {caseItem.animalType} • {caseItem.animalIdTag}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    caseItem.veterinarianReviewStatus === 'review_completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : caseItem.veterinarianReviewStatus === 'under_review'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {caseItem.veterinarianReviewStatus.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-start space-x-3">
                  <img
                    src={caseItem.imageUrl}
                    alt="Cattle scan"
                    className="w-16 h-16 object-cover rounded-xl border border-slate-200 flex-shrink-0"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2">{caseItem.detectedCondition}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{caseItem.farmer?.name || 'Farmer'} ({caseItem.farmer?.phone})</span>
                    </p>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 line-clamp-2">
                  <strong className="text-slate-800">Symptoms:</strong> {caseItem.symptoms || 'None reported.'}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(caseItem.createdAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => setSelectedCase(caseItem)}
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1"
                >
                  <span>Review Case</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Case Review Modal */}
      {selectedCase && (
        <CaseDetailModal
          caseData={selectedCase}
          onClose={() => setSelectedCase(null)}
          onCaseUpdated={handleCaseUpdated}
        />
      )}
    </div>
  );
};
