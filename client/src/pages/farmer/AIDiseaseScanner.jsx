import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { diseaseScanService } from '../../services/diseaseScanService';
import { cattleService } from '../../services/cattleService';
import { VeterinarianRecommendations } from '../../components/farmer/VeterinarianRecommendations';
import {
  Scan,
  Upload,
  CheckCircle,
  AlertTriangle,
  Stethoscope,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Info,
  X,
  ChevronRight,
  HeartPulse,
  ShieldAlert
} from 'lucide-react';

export const AIDiseaseScanner = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cattleIdParam = searchParams.get('cattleId');

  const [cattleList, setCattleList] = useState([]);
  const [selectedCattle, setSelectedCattle] = useState(null);
  const [loadingCattle, setLoadingCattle] = useState(true);

  const [symptoms, setSymptoms] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');

  // Fetch Cattle List & Select Target Cattle
  useEffect(() => {
    const fetchCattle = async () => {
      try {
        setLoadingCattle(true);
        setError('');
        if (!token) return;

        const res = await cattleService.getFarmerCattle(token);
        const list = res.cattle || [];
        setCattleList(list);

        if (cattleIdParam) {
          const target = list.find((c) => c._id === cattleIdParam);
          if (target) {
            setSelectedCattle(target);
          } else {
            // Attempt direct fetch if list is empty or doesn't contain it
            try {
              const single = await cattleService.getCattleById(token, cattleIdParam);
              if (single) setSelectedCattle(single);
            } catch {
              setError('The requested cattle record could not be found or you do not have permission.');
            }
          }
        } else if (list.length > 0) {
          // Default to first cattle if available
          setSelectedCattle(list[0]);
        }
      } catch (err) {
        console.error('Error loading cattle list:', err);
        setError(err.message || 'Failed to load your registered cattle records.');
      } finally {
        setLoadingCattle(false);
      }
    };

    fetchCattle();
  }, [token, cattleIdParam]);

  // Handle local file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image file size should be less than 10MB.');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setError('');
  };

  const handleSubmitScan = async (e) => {
    e.preventDefault();

    if (!selectedCattle) {
      setError('Please select a cattle before running the AI health check.');
      return;
    }

    if (!imagePreview) {
      setError('Please upload or select an image of the cattle before submitting.');
      return;
    }

    setLoading(true);
    setError('');
    setScanResult(null);

    try {
      const data = await diseaseScanService.createScan(
        {
          cattleId: selectedCattle._id,
          animalType: selectedCattle.gender === 'male' ? 'bull' : 'cow',
          animalIdTag: selectedCattle.nameTag,
          imageUrl: imagePreview,
          symptoms
        },
        token
      );

      setScanResult(data.data);
    } catch (err) {
      setError(err.message || 'Failed to analyze image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevel = (confidence) => {
    if (confidence >= 88) return { label: 'High Priority', color: 'bg-red-100 text-red-800 border-red-200' };
    if (confidence >= 80) return { label: 'Moderate Risk', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    return { label: 'Low Risk', color: 'bg-green-100 text-green-800 border-green-200' };
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-white/10 backdrop-sm rounded-xl">
              <Scan className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-blue-300 font-bold block">Gauseva HealthTech</span>
              <h1 className="text-2xl font-extrabold tracking-tight">AI Health Screening</h1>
            </div>
          </div>
          <Link
            to="/farmer/cattle"
            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-sm transition flex items-center space-x-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>My Cattle</span>
          </Link>
        </div>
        <p className="text-xs text-blue-100 max-w-2xl mt-1">
          Select your cattle, upload a health/disease image, and enter observed symptoms for instant preliminary AI screening.
        </p>
      </div>

      {/* Main Container */}
      {!scanResult ? (
        <form onSubmit={handleSubmitScan} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Section 1: Selected Cattle Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
                <span>Target Cattle for Screening</span>
              </span>

              {cattleList.length > 0 && (
                <span className="text-xs font-normal text-slate-500">
                  {cattleList.length} Registered Cattle Available
                </span>
              )}
            </h3>

            {loadingCattle ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-blue-600" />
                Loading cattle records...
              </div>
            ) : cattleList.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>You have no cattle registered yet. Please register a cattle first to perform a health check.</span>
                </div>
                <Link
                  to="/farmer/cattle"
                  className="px-3 py-1.5 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition shrink-0 ml-2"
                >
                  + Add Cattle
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Cattle Dropdown Select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Cattle
                  </label>
                  <select
                    value={selectedCattle ? selectedCattle._id : ''}
                    onChange={(e) => {
                      const found = cattleList.find((c) => c._id === e.target.value);
                      setSelectedCattle(found || null);
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {cattleList.map((c) => (
                      <option key={c._id} value={c._id}>
                        🐄 {c.nameTag} — {c.breed} ({c.gender}, {c.ageYears} yrs)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Cattle Display Card */}
                {selectedCattle && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200 rounded-2xl flex items-center justify-between shadow-xs">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-12 h-12 rounded-xl bg-white border border-blue-200 text-2xl flex items-center justify-center shrink-0 shadow-xs">
                        {selectedCattle.imageUrl ? (
                          <img src={selectedCattle.imageUrl} alt={selectedCattle.nameTag} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          '🐄'
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-base font-extrabold text-slate-900">{selectedCattle.nameTag}</h4>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md capitalize">
                            {selectedCattle.breed}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {selectedCattle.gender === 'female' ? 'Female Cow' : 'Male Bull'} • {selectedCattle.ageYears} Years Old
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-xs">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Current Status</span>
                      <span className="font-bold text-slate-800 capitalize">{selectedCattle.healthStatus.replace('_', ' ')}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Health / Disease Image Selection */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">2</span>
              <span>Upload Disease / Health Image <span className="text-red-500">*</span></span>
            </h3>

            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-blue-500 bg-slate-900 group max-w-md mx-auto">
                <img src={imagePreview} alt="Cattle health preview" className="w-full h-64 object-cover" />
                <div className="absolute top-3 right-3 flex space-x-2">
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="p-2 bg-red-600/90 text-white rounded-xl hover:bg-red-700 transition shadow-md"
                    title="Remove Image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-sm p-2 rounded-xl text-white text-xs text-center font-medium">
                  Image Selected for {selectedCattle?.nameTag || 'Cattle'}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 block mb-1">Click to Upload or Capture Health Image</span>
                  <span className="text-[11px] text-slate-500 block">Select an image file directly from your device (JPG, PNG, WEBP, Max 10MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Section 3: Observed Symptoms */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">3</span>
              <span>Observed Symptoms / Notes</span>
            </h3>
            <textarea
              rows="3"
              placeholder="Enter symptoms (e.g. skin rash, udder swelling, limping, fever, loss of appetite)..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={loading || !selectedCattle || !imagePreview}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing Health Status...</span>
                </>
              ) : (
                <>
                  <Scan className="w-4 h-4" />
                  <span>Analyze Cattle Health</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* SCREENING RESULT REPORT */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          {/* Status Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">AI Screening Completed</h2>
                <span className="text-xs text-slate-500">Scan ID: #{scanResult._id?.slice(-8)}</span>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-full flex items-center space-x-1">
              <Stethoscope className="w-3.5 h-3.5 text-amber-600" />
              <span>Pending Vet Review</span>
            </span>
          </div>

          {/* Cattle Info Summary */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-2xl shrink-0">
                🐄
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600 block">Screened Cattle</span>
                <h3 className="text-sm font-bold text-slate-900">{selectedCattle?.nameTag}</h3>
                <p className="text-xs text-slate-500">
                  {selectedCattle?.breed} • {selectedCattle?.gender === 'female' ? 'Female' : 'Male'} • {selectedCattle?.ageYears} Years
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Screening Date</span>
              <span className="text-xs font-bold text-slate-700">{new Date(scanResult.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Result Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <img src={scanResult.imageUrl} alt="Scanned cattle" className="w-full h-64 object-cover rounded-2xl border border-slate-200" />
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-2">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-blue-600 block">Possible Condition Detected</span>
                <h3 className="text-lg font-extrabold text-blue-950">{scanResult.detectedCondition}</h3>
                <div className="flex items-center space-x-2 pt-1">
                  <span className="text-xs text-slate-600 font-semibold">AI Confidence:</span>
                  <span className="px-2.5 py-0.5 bg-blue-600 text-white font-bold text-xs rounded-lg">
                    {scanResult.confidence}%
                  </span>
                  <span className={`px-2.5 py-0.5 border font-bold text-xs rounded-lg ${getRiskLevel(scanResult.confidence).color}`}>
                    {getRiskLevel(scanResult.confidence).label}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Symptoms / Observations:</span>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {scanResult.symptoms || 'No additional symptoms reported.'}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Preliminary AI Guidance:</span>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {scanResult.recommendations}
                </p>
              </div>
            </div>
          </div>

          {/* Medical Disclaimer Alert (AUTHORITATIVE REQUIREMENT) */}
          <div className="p-4 bg-amber-50 border border-amber-300 text-amber-950 rounded-2xl flex items-start space-x-3 text-xs shadow-xs">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-amber-900 mb-0.5">Important Medical Disclaimer</span>
              <span>
                This AI health check is a preliminary screening tool and is <strong>NOT a final medical diagnosis</strong>. 
                For clinical diagnosis, treatment, or prescription, please consult a qualified veterinarian. 
                Your scan has been added to your cattle's medical record and queued for professional review.
              </span>
            </div>
          </div>

          {/* Recommended Veterinarians (Phase 20) */}
          <VeterinarianRecommendations scanId={scanResult._id} conditionName={scanResult.detectedCondition} />

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={() => {
                setScanResult(null);
                setImagePreview(null);
                setSymptoms('');
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Run Another Scan</span>
            </button>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Link
                to="/farmer/cattle"
                className="w-full sm:w-auto px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center"
              >
                Back to My Cattle
              </Link>
              <button
                onClick={() => navigate('/farmer/scan-history')}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
              >
                <span>View Health History</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
