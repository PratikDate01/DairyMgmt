import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { diseaseScanService } from '../../services/diseaseScanService';
import { VeterinarianRecommendations } from '../../components/farmer/VeterinarianRecommendations';
import {
  FileText,
  Scan,
  Calendar,
  CheckCircle,
  Clock,
  Stethoscope,
  ChevronRight,
  Info,
  X
} from 'lucide-react';

export const ScanHistory = () => {
  const { token } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedScan, setSelectedScan] = useState(null);

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const data = await diseaseScanService.getFarmerScans(token);
        setScans(data);
      } catch (err) {
        setError(err.message || 'Failed to load disease scan history.');
      } finally {
        setLoading(false);
      }
    };
    fetchScans();
  }, [token]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'review_completed':
        return (
          <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 text-xs font-bold rounded-lg flex items-center space-x-1">
            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
            <span>Vet Reviewed</span>
          </span>
        );
      case 'under_review':
        return (
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg flex items-center space-x-1">
            <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
            <span>Under Vet Review</span>
          </span>
        );
      case 'info_requested':
        return (
          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-lg flex items-center space-x-1">
            <Info className="w-3.5 h-3.5 text-amber-600" />
            <span>More Info Required</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-lg flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Pending Review</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <span>Disease Scan History</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            View your cattle disease screening reports and professional veterinarian reviews.
          </p>
        </div>

        <Link
          to="/farmer/ai-scanner"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
        >
          <Scan className="w-4 h-4" />
          <span>New AI Disease Scan</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* Scans List */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-xs font-medium text-slate-500">Loading scan history...</p>
        </div>
      ) : scans.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-xl">
            🐄
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Disease Scans Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven't submitted any cattle disease scans yet. Use our AI Scanner to check your cattle's health.
          </p>
          <Link
            to="/farmer/ai-scanner"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition"
          >
            <Scan className="w-4 h-4" />
            <span>Start AI Scan Now</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scans.map((scan) => (
            <div
              key={scan._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={scan.imageUrl}
                    alt={scan.animalIdTag}
                    className="w-16 h-16 object-cover rounded-xl border border-slate-200"
                  />
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-blue-600 block tracking-wider">
                      🐄 {scan.cattle?.nameTag || scan.animalIdTag} {scan.cattle?.breed ? `(${scan.cattle.breed})` : ''}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{scan.detectedCondition}</h4>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(scan.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {getStatusBadge(scan.veterinarianReviewStatus)}

                <button
                  onClick={() => setSelectedScan(scan)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-slate-200 hover:border-blue-200 transition flex items-center space-x-1"
                >
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative my-8">
            <button
              onClick={() => setSelectedScan(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold">
                🐄
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedScan.detectedCondition}</h3>
                <span className="text-xs text-slate-500">
                  Cattle: <strong>{selectedScan.cattle?.nameTag || selectedScan.animalIdTag}</strong> {selectedScan.cattle?.breed ? `(${selectedScan.cattle.breed})` : ''} • Scanned on {new Date(selectedScan.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <img src={selectedScan.imageUrl} alt="Scan detail" className="w-full h-48 object-cover rounded-xl border border-slate-200" />
              
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <span className="font-bold text-blue-900 block mb-1">AI Screening Assessment</span>
                  <p className="text-blue-950 font-semibold">{selectedScan.detectedCondition}</p>
                  <p className="text-slate-600 mt-1">Confidence Score: <strong className="text-blue-700">{selectedScan.confidence}%</strong></p>
                </div>

                <div>
                  <span className="font-bold text-slate-700 block mb-0.5">Symptoms Reported:</span>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {selectedScan.symptoms || 'None specified.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Veterinarian Section */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 flex items-center space-x-1.5">
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                  <span>Veterinarian Professional Assessment</span>
                </span>
                {getStatusBadge(selectedScan.veterinarianReviewStatus)}
              </div>

              {selectedScan.veterinarianNotes ? (
                <div className="space-y-2 text-xs pt-2">
                  <p className="text-slate-700">
                    <strong className="text-slate-900 block mb-0.5">Doctor's Notes:</strong>
                    {selectedScan.veterinarianNotes}
                  </p>
                  {selectedScan.veterinarianRecommendation && (
                    <p className="text-slate-700 pt-1 border-t border-slate-200">
                      <strong className="text-slate-900 block mb-0.5">Treatment Recommendation:</strong>
                      {selectedScan.veterinarianRecommendation}
                    </p>
                  )}
                  {selectedScan.veterinarian && (
                    <p className="text-[11px] text-slate-400 pt-1">
                      Reviewed by Dr. {selectedScan.veterinarian.name} ({selectedScan.veterinarian.phone})
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic pt-1">
                  This case is currently queued. A licensed veterinarian will review the scan and add professional clinical advice shortly.
                </p>
              )}
            </div>

            {/* Recommended Veterinarians (Phase 20) */}
            <VeterinarianRecommendations scanId={selectedScan._id} conditionName={selectedScan.detectedCondition} />

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-center space-x-2">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>AI results are for initial screening. Always consult a veterinarian for critical livestock health decisions.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
