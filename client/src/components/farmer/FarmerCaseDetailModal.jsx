import { useState } from 'react';
import {
  Stethoscope,
  X,
  User,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Pill,
  ShieldCheck,
  Activity,
  AlertTriangle,
  RotateCw,
  Info,
  CheckCircle,
  ShoppingBag
} from 'lucide-react';
import { PrescriptionProcurementModal } from './PrescriptionProcurementModal';

export const FarmerCaseDetailModal = ({ requestItem, onClose }) => {
  const [activeTab, setActiveTab] = useState('clinical_summary'); // 'clinical_summary' | 'prescription' | 'timeline'
  const [showProcurementModal, setShowProcurementModal] = useState(false);

  const hasDiagnosis = Boolean(requestItem.finalDiagnosis?.diagnosis);
  const hasPrescription = Boolean(requestItem.prescription?.medicines?.length > 0 || requestItem.prescription?.generalInstructions);

  const getStepStatus = (stepName) => {
    const s = requestItem.status;
    const order = ['accepted', 'examination', 'diagnosed', 'prescription_created', 'completed'];
    const currentIndex = order.indexOf(s === 'pending' ? 'accepted' : s);
    const stepIndex = order.indexOf(stepName);
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-6 space-y-6 shadow-2xl relative my-6 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 shrink-0 pr-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-slate-900">Veterinary Clinical Case Record</h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                  {requestItem.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cattle Tag: <strong>{requestItem.cattle?.nameTag || 'Animal'}</strong> • Assigned Doctor: <strong>Dr. {requestItem.veterinarian?.name || 'Veterinarian'}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Stepper Progress */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shrink-0">
          <div className="grid grid-cols-5 gap-1 text-center text-[10px] sm:text-[11px]">
            {[
              { id: 'accepted', label: 'Accepted' },
              { id: 'examination', label: 'Exam' },
              { id: 'diagnosed', label: 'Diagnosis' },
              { id: 'prescription_created', label: 'Prescription' },
              { id: 'completed', label: 'Complete' }
            ].map(step => {
              const st = getStepStatus(step.id);
              return (
                <div
                  key={step.id}
                  className={`py-1.5 px-1 rounded-lg font-bold transition flex items-center justify-center space-x-1 ${
                    st === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : st === 'current'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-400 border border-slate-200'
                  }`}
                >
                  {st === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                  <span className="truncate">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center space-x-1 border-b border-slate-200 pb-2 shrink-0">
          <button
            onClick={() => setActiveTab('clinical_summary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'clinical_summary'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Doctor Diagnosis & Findings</span>
          </button>
          <button
            onClick={() => setActiveTab('prescription')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'prescription'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>Prescription & Medicines</span>
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'timeline'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Case Audit History</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto space-y-5 pr-1 flex-1 text-xs">
          {activeTab === 'clinical_summary' && (
            <div className="space-y-4">
              {/* Doctor Final Diagnosis Section (If available) */}
              {hasDiagnosis ? (
                <div className="p-4 bg-emerald-50/80 border border-emerald-300 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="p-1.5 bg-emerald-600 text-white rounded-lg font-bold">👨‍⚕️</span>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block">Verified Veterinarian Diagnosis</span>
                        <h3 className="text-base font-extrabold text-slate-900">{requestItem.finalDiagnosis.diagnosis}</h3>
                      </div>
                    </div>
                    {requestItem.finalDiagnosis.severity && (
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                        requestItem.finalDiagnosis.severity === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        Severity: {requestItem.finalDiagnosis.severity}
                      </span>
                    )}
                  </div>

                  {requestItem.finalDiagnosis.notes && (
                    <div className="p-3 bg-white rounded-xl border border-emerald-100 text-slate-700 space-y-1">
                      <strong className="text-slate-900 block font-bold">Doctor Clinical Observations & Notes:</strong>
                      <p className="leading-relaxed">{requestItem.finalDiagnosis.notes}</p>
                    </div>
                  )}

                  {requestItem.finalDiagnosis.treatmentAdvice && (
                    <div className="p-3 bg-white rounded-xl border border-emerald-100 text-slate-700 space-y-1">
                      <strong className="text-slate-900 block font-bold">Treatment Protocol:</strong>
                      <p className="leading-relaxed">{requestItem.finalDiagnosis.treatmentAdvice}</p>
                    </div>
                  )}

                  {requestItem.finalDiagnosis.additionalAdvice && (
                    <div className="p-3 bg-white rounded-xl border border-emerald-100 text-slate-700 space-y-1">
                      <strong className="text-slate-900 block font-bold">Care Advice for Farmer:</strong>
                      <p className="leading-relaxed">{requestItem.finalDiagnosis.additionalAdvice}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <h4 className="font-bold">Doctor Final Diagnosis Pending</h4>
                    <p className="text-slate-600 mt-0.5">Dr. {requestItem.veterinarian?.name || 'Veterinarian'} has accepted your case and is conducting clinical examination.</p>
                  </div>
                </div>
              )}

              {/* Physical Clinical Examination Findings */}
              {requestItem.clinicalExamination?.physicalSymptoms && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <h4 className="font-extrabold text-slate-900 flex items-center space-x-1.5">
                    <Activity className="w-4 h-4 text-teal-600" />
                    <span>Doctor Examination Findings</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    <p>Temperature: <strong className="text-slate-800">{requestItem.clinicalExamination.temperature || 'Recorded'}</strong></p>
                    <p>Appetite: <strong className="text-slate-800">{requestItem.clinicalExamination.appetite || 'Recorded'}</strong></p>
                  </div>
                  <p className="text-slate-700 pt-1">
                    <strong>Physical Findings:</strong> {requestItem.clinicalExamination.physicalSymptoms}
                  </p>
                </div>
              )}

              {/* Preliminary AI Screening Banner */}
              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-3">
                <div className="flex items-start space-x-2.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-blue-950">Preliminary AI Photo Scan Reference</h4>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      <em>Note: The AI scan below was used for initial screening. The final diagnosis above is provided directly by Dr. {requestItem.veterinarian?.name}.</em>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {requestItem.diseaseScan?.imageUrl && (
                    <img
                      src={requestItem.diseaseScan.imageUrl}
                      alt="Cattle scan photo"
                      className="w-full h-28 object-cover rounded-xl border border-blue-200"
                    />
                  )}
                  <div className="sm:col-span-2 space-y-1 text-slate-700">
                    <p>AI Suggested Condition: <strong className="text-slate-900">{requestItem.aiCondition || requestItem.diseaseScan?.detectedCondition}</strong></p>
                    <p>Confidence: <strong className="text-blue-700">{requestItem.diseaseScan?.confidence}%</strong></p>
                    <p>Reported Symptoms: <span>{requestItem.symptoms || 'None'}</span></p>
                  </div>
                </div>
              </div>

              {/* Follow-up Section */}
              {requestItem.followUp?.required && (
                <div className="p-4 bg-blue-50 border border-blue-300 rounded-2xl space-y-1 text-blue-950">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <h4 className="font-extrabold">Scheduled Follow-Up Examination</h4>
                  </div>
                  <p>Follow-Up Date: <strong>{requestItem.followUp.date ? new Date(requestItem.followUp.date).toLocaleDateString() : 'To be arranged'}</strong></p>
                  {requestItem.followUp.instructions && (
                    <p className="text-slate-700 pt-1"><strong>Doctor Instructions:</strong> {requestItem.followUp.instructions}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'prescription' && (
            <div className="space-y-4">
              {hasPrescription ? (
                <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-4">
                  <div className="flex items-center space-x-2 text-purple-950">
                    <Pill className="w-5 h-5 text-purple-600 shrink-0" />
                    <div>
                      <h3 className="font-extrabold text-sm">Official Veterinary Prescription</h3>
                      <p className="text-[11px] text-purple-700">Issued by Dr. {requestItem.veterinarian?.name}</p>
                    </div>
                  </div>

                  {requestItem.prescription?.medicines?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-slate-900">Prescribed Medicines</h4>
                      <div className="space-y-2">
                        {requestItem.prescription.medicines.map((m, i) => (
                          <div key={i} className="p-3 bg-white rounded-xl border border-purple-100 space-y-1">
                            <div className="flex items-center justify-between">
                              <h5 className="font-extrabold text-slate-900">{m.medicineName}</h5>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                                {m.frequency || 'As directed'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                              <p>Dosage: <strong className="text-slate-800">{m.dosage || 'N/A'}</strong></p>
                              <p>Duration: <strong className="text-slate-800">{m.duration || 'N/A'}</strong></p>
                            </div>
                            {m.instructions && (
                              <p className="text-[11px] text-slate-700 italic pt-0.5">
                                Instructions: "{m.instructions}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {requestItem.prescription?.generalInstructions && (
                    <div className="p-3 bg-white rounded-xl border border-purple-100 space-y-1">
                      <strong className="text-slate-900 block font-bold">General Treatment Instructions:</strong>
                      <p className="text-slate-700 leading-relaxed">{requestItem.prescription.generalInstructions}</p>
                    </div>
                  )}

                  {requestItem.prescription?.dietaryAdvice && (
                    <div className="p-3 bg-white rounded-xl border border-purple-100 space-y-1">
                      <strong className="text-slate-900 block font-bold">Dietary & Feed Advice:</strong>
                      <p className="text-slate-700 leading-relaxed">{requestItem.prescription.dietaryAdvice}</p>
                    </div>
                  )}

                  {/* Phase 24 Procurement Action Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => setShowProcurementModal(true)}
                      className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Find & Compare Prescribed Medicines in Registered Stores</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-slate-500">
                  <Pill className="w-8 h-8 text-slate-400 mx-auto" />
                  <h4 className="font-bold text-slate-800">No Prescription Issued Yet</h4>
                  <p>Prescribed medications will appear here once Dr. {requestItem.veterinarian?.name || 'Veterinarian'} completes clinical evaluation.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">
                Clinical Progression Audit History
              </div>

              {requestItem.escalationHistory && requestItem.escalationHistory.length > 0 && (
                <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1 text-indigo-950">
                  <h4 className="font-bold flex items-center space-x-1">
                    <RotateCw className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Referral History</span>
                  </h4>
                  {requestItem.escalationHistory.map((h, i) => (
                    <p key={i} className="text-[11px] text-slate-700">
                      • Reassigned from Dr. {h.veterinarian?.name || 'Doctor'} ({h.reason || 'Unavailable'})
                    </p>
                  ))}
                </div>
              )}

              <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {requestItem.clinicalTimeline && requestItem.clinicalTimeline.length > 0 ? (
                  requestItem.clinicalTimeline.map((item, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white" />
                      <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{item.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {item.notes && <p className="text-slate-600 text-[11px]">{item.notes}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-400">Request pending doctor response.</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            Close Record
          </button>
        </div>
      </div>

      {/* Phase 24 Prescription Procurement & Comparison Modal */}
      {showProcurementModal && (
        <PrescriptionProcurementModal
          vetRequestItem={requestItem}
          onClose={() => setShowProcurementModal(false)}
        />
      )}
    </div>
  );
};
