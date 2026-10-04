import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { veterinarianService } from '../../services/veterinarianService';
import {
  Stethoscope,
  X,
  User,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Send
} from 'lucide-react';

export const CaseDetailModal = ({ caseData, onClose, onCaseUpdated }) => {
  const { token } = useAuth();

  const [notes, setNotes] = useState(caseData.veterinarianNotes || '');
  const [recommendation, setRecommendation] = useState(caseData.veterinarianRecommendation || '');
  const [reviewStatus, setReviewStatus] = useState(caseData.veterinarianReviewStatus || 'review_completed');
  const [followUp, setFollowUp] = useState(caseData.followUpRequired || false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const result = await veterinarianService.reviewCase(
        caseData._id,
        {
          veterinarianNotes: notes,
          veterinarianRecommendation: recommendation,
          reviewStatus,
          followUpRequired: followUp
        },
        token
      );

      setSuccessMsg('Veterinarian review recorded successfully!');
      if (onCaseUpdated) {
        onCaseUpdated(result.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Clinical Case Review</h2>
            <span className="text-xs text-slate-500">
              Case ID: #{caseData._id?.slice(-8)} • Submitted {new Date(caseData.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-bold">
            {successMsg}
          </div>
        )}

        {/* Two-Column Grid: Left (Farmer & AI Info), Right (Veterinarian Form) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Case Information */}
          <div className="space-y-4 text-xs">
            {/* Farmer Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Farmer Information</span>
              <p className="font-bold text-slate-900 text-sm">{caseData.farmer?.name || 'Farmer'}</p>
              <div className="flex items-center space-x-3 text-slate-600">
                <span className="flex items-center space-x-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{caseData.farmer?.phone}</span>
                </span>
                {caseData.farmer?.email && (
                  <span className="flex items-center space-x-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{caseData.farmer?.email}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Animal & Image */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Cattle Image ({caseData.animalType.toUpperCase()})</span>
                <span className="text-[11px] font-mono text-slate-500">{caseData.animalIdTag}</span>
              </div>
              <img
                src={caseData.imageUrl}
                alt="Scanned cattle"
                className="w-full h-48 object-cover rounded-xl border border-slate-200"
              />
            </div>

            {/* AI Screening Result */}
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider block">AI Screening Result</span>
              <p className="font-extrabold text-blue-950">{caseData.detectedCondition}</p>
              <p className="text-slate-600">Confidence: <strong className="text-blue-700">{caseData.confidence}%</strong></p>
              <p className="text-slate-600 pt-1">
                <strong>Reported Symptoms:</strong> {caseData.symptoms || 'None reported.'}
              </p>
            </div>
          </div>

          {/* Right Column: Veterinarian Clinical Form */}
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Veterinary Clinical Assessment
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Review Status
              </label>
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="under_review">Under Clinical Review</option>
                <option value="review_completed">Review Completed (Confirmed)</option>
                <option value="info_requested">Additional Information Required</option>
                <option value="closed">Case Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Examination Notes
              </label>
              <textarea
                rows="3"
                placeholder="Enter professional clinical observations, diagnosis verification, or notes for the farmer..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Treatment & Medication Recommendation
              </label>
              <textarea
                rows="3"
                placeholder="Specify recommended treatment, prescribed medicine, or hygiene protocol..."
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                required
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                id="followup-check"
                type="checkbox"
                checked={followUp}
                onChange={(e) => setFollowUp(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <label htmlFor="followup-check" className="text-xs font-semibold text-slate-700">
                Follow-up physical examination required
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Saving...' : 'Submit Review'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
