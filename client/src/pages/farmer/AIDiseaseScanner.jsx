import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { diseaseScanService } from '../../services/diseaseScanService';
import {
  Scan,
  Upload,
  Camera,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  Stethoscope,
  RefreshCw,
  ArrowRight,
  Info,
  X
} from 'lucide-react';

export const AIDiseaseScanner = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [animalType, setAnimalType] = useState('cow');
  const [animalIdTag, setAnimalIdTag] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');

  // Sample demonstration images for quick testing
  const sampleImages = [
    { label: 'Skin Inflammation (Cow)', url: 'https://images.unsplash.com/photo-1546445317-29f4545f9d52?auto=format&fit=crop&w=600&q=80' },
    { label: 'Udder / Mastitis Check', url: 'https://images.unsplash.com/photo-1570042707229-37397b2cf607?auto=format&fit=crop&w=600&q=80' },
    { label: 'Hoof / Limb Lesion', url: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80' }
  ];

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

  const handleSelectSample = (url) => {
    setError('');
    setImagePreview(url);
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setError('');
  };

  const handleSubmitScan = async (e) => {
    e.preventDefault();
    if (!imagePreview) {
      setError('Please upload or capture an image of the cattle before submitting.');
      return;
    }

    setLoading(true);
    setError('');
    setScanResult(null);

    try {
      const data = await diseaseScanService.createScan(
        {
          animalType,
          animalIdTag: animalIdTag || `${animalType.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-slate-900 rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 bg-white/10 backdrop-sm rounded-xl">
            <Scan className="w-6 h-6 text-blue-300" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-blue-300 font-bold block">Gauseva HealthTech</span>
            <h1 className="text-2xl font-extrabold tracking-tight">AI Disease Scanner</h1>
          </div>
        </div>
        <p className="text-xs text-blue-100 max-w-2xl">
          Upload or capture an image of your cow or buffalo to screen for potential skin, udder, or hoof conditions. 
          Results are automatically sent to our veterinary team for professional review.
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

          {/* Section 1: Animal Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
              <span>Select Animal & Identification</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Animal Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cow', label: 'Cow 🐄' },
                    { id: 'buffalo', label: 'Buffalo 🐃' },
                    { id: 'other', label: 'Other 🐾' }
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setAnimalType(type.id)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                        animalType === type.id
                          ? 'border-blue-600 bg-blue-50 text-blue-800'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="animalTag" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Animal Name / Tag Number (Optional)
                </label>
                <input
                  id="animalTag"
                  type="text"
                  placeholder="e.g. Gauri / Tag #104"
                  value={animalIdTag}
                  onChange={(e) => setAnimalIdTag(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Image Selection */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">2</span>
              <span>Upload Cow/Buffalo Image</span>
            </h3>

            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-blue-500 bg-slate-900 group max-w-md mx-auto">
                <img src={imagePreview} alt="Cattle preview" className="w-full h-64 object-cover" />
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
                  Image Ready for AI Analysis
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 block mb-1">Click to Upload or Capture Image</span>
                  <span className="text-[11px] text-slate-500 block">Supports JPG, PNG, WEBP (Max 10MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {/* Demonstration Presets */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Or select a demo cattle image:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {sampleImages.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSample(sample.url)}
                        className="p-1.5 border border-slate-200 rounded-xl bg-white hover:border-blue-500 text-left transition group"
                      >
                        <img src={sample.url} alt={sample.label} className="w-full h-16 object-cover rounded-lg mb-1" />
                        <span className="text-[10px] font-semibold text-slate-700 truncate block group-hover:text-blue-600">
                          {sample.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Observed Symptoms */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">3</span>
              <span>Observed Symptoms / Notes (Optional)</span>
            </h3>
            <textarea
              rows="3"
              placeholder="Describe what you noticed (e.g., loss of appetite, swelling, skin redness, limping)..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={loading || !imagePreview}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing Image...</span>
                </>
              ) : (
                <>
                  <Scan className="w-4 h-4" />
                  <span>Scan for Possible Disease</span>
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
                <h2 className="text-base font-bold text-slate-900">AI Screening Complete</h2>
                <span className="text-xs text-slate-500">Scan ID: #{scanResult._id?.slice(-8)}</span>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-full flex items-center space-x-1">
              <Stethoscope className="w-3.5 h-3.5 text-amber-600" />
              <span>Pending Vet Review</span>
            </span>
          </div>

          {/* Result Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <img src={scanResult.imageUrl} alt="Scanned cattle" className="w-full h-64 object-cover rounded-2xl border border-slate-200" />
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-2">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-blue-600 block">Possible Condition Detected</span>
                <h3 className="text-lg font-extrabold text-blue-950">{scanResult.detectedCondition}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-600 font-semibold">AI Confidence:</span>
                  <span className="px-2.5 py-0.5 bg-blue-600 text-white font-bold text-xs rounded-lg">
                    {scanResult.confidence}%
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
                <span className="text-xs font-bold text-slate-700 block">Recommended Initial Care:</span>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {scanResult.recommendations}
                </p>
              </div>
            </div>
          </div>

          {/* Medical Disclaimer Alert */}
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-start space-x-3 text-xs">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">Medical Screening Disclaimer</span>
              <span>
                AI result is an initial screening and should be confirmed by a qualified veterinarian. 
                Your case has been queued for professional veterinarian evaluation.
              </span>
            </div>
          </div>

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
              <span>Scan Another Animal</span>
            </button>

            <button
              onClick={() => navigate('/farmer/scan-history')}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
            >
              <span>View Scan History</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
