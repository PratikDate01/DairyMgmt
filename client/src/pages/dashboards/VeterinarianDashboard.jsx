import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { veterinarianService } from '../../services/veterinarianService';
import {
  Stethoscope,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Phone,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const VeterinarianDashboard = () => {
  const { user, token } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const data = await veterinarianService.getCases(token);
        setCases(data);
      } catch (err) {
        setError(err.message || 'Failed to load cases.');
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, [token]);

  const pendingCount = cases.filter(c => c.veterinarianReviewStatus === 'pending_review').length;
  const underReviewCount = cases.filter(c => c.veterinarianReviewStatus === 'under_review').length;
  const completedCount = cases.filter(c => c.veterinarianReviewStatus === 'review_completed').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-teal-300 font-bold block mb-1">Veterinary Medical Portal</span>
          <h1 className="text-2xl font-extrabold tracking-tight">Welcome, Dr. {user?.name || 'Veterinarian'}</h1>
          <p className="text-xs text-teal-100 mt-1 max-w-xl">
            Gauseva HealthTech Clinical Console — Review AI cattle disease screenings, provide expert treatment guidance, and assist dairy farmers.
          </p>
        </div>
        <Link
          to="/veterinarian/cases"
          className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2 self-start sm:self-auto"
        >
          <Activity className="w-4 h-4" />
          <span>Open Cases Queue ({pendingCount})</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Cases Received</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{loading ? '...' : cases.length}</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Pending Review</span>
            <span className="text-2xl font-extrabold text-amber-600 mt-1 block">{loading ? '...' : pendingCount}</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Under Clinical Review</span>
            <span className="text-2xl font-extrabold text-blue-600 mt-1 block">{loading ? '...' : underReviewCount}</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Stethoscope className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Completed Reviews</span>
            <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">{loading ? '...' : completedCount}</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Recent Cases Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Disease Cases Needing Review</h2>
            <p className="text-xs text-slate-500">Cattle disease scan reports submitted by farmers requiring veterinary consultation.</p>
          </div>
          <Link
            to="/veterinarian/cases"
            className="text-xs font-bold text-teal-600 hover:text-teal-800 transition flex items-center space-x-1"
          >
            <span>View All Queue</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading cases queue...</div>
        ) : cases.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No disease cases currently reported.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {cases.slice(0, 5).map((c) => (
              <div key={c._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <img src={c.imageUrl} alt={c.animalIdTag} className="w-12 h-12 object-cover rounded-xl border border-slate-200 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{c.detectedCondition}</h4>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="font-semibold text-slate-700">Farmer: {c.farmer?.name || 'Farmer'}</span>
                      <span>•</span>
                      <span>{c.animalType} ({c.animalIdTag})</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                    c.veterinarianReviewStatus === 'review_completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {c.veterinarianReviewStatus.replace('_', ' ')}
                  </span>
                  <Link
                    to={`/veterinarian/cases`}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-teal-50 text-teal-700 font-bold text-xs rounded-lg border border-slate-200 transition"
                  >
                    Review Case
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
