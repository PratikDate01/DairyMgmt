import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getStatusLabel } from '../../i18n/statusMap';
import { useAuth } from '../../context/AuthContext';
import { vetRequestService } from '../../services/vetRequestService';
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
  Send,
  Plus,
  Trash2,
  FileText,
  Pill,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  Activity,
  ArrowRight
} from 'lucide-react';

export const ClinicalWorkspaceModal = ({ requestItem, onClose, onRequestUpdated }) => {
  const { t } = useTranslation(['veterinarian', 'common']);
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'examination' | 'diagnosis' | 'prescription' | 'followup' | 'timeline'

  const [currentReq, setCurrentReq] = useState(requestItem);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Examination Form State
  const [examForm, setExamForm] = useState({
    observations: requestItem.clinicalExamination?.observations || '',
    physicalSymptoms: requestItem.clinicalExamination?.physicalSymptoms || '',
    temperature: requestItem.clinicalExamination?.temperature || '',
    appetite: requestItem.clinicalExamination?.appetite || 'Normal',
    additionalNotes: requestItem.clinicalExamination?.additionalNotes || ''
  });

  // 2. Diagnosis Form State
  const [diagnosisForm, setDiagnosisForm] = useState({
    diagnosis: requestItem.finalDiagnosis?.diagnosis || '',
    notes: requestItem.finalDiagnosis?.notes || '',
    severity: requestItem.finalDiagnosis?.severity || 'Moderate',
    treatmentAdvice: requestItem.finalDiagnosis?.treatmentAdvice || '',
    additionalAdvice: requestItem.finalDiagnosis?.additionalAdvice || ''
  });

  // 3. Prescription Form State
  const [prescriptionForm, setPrescriptionForm] = useState({
    medicines: requestItem.prescription?.medicines?.length > 0
      ? requestItem.prescription.medicines
      : [{ medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    generalInstructions: requestItem.prescription?.generalInstructions || '',
    dietaryAdvice: requestItem.prescription?.dietaryAdvice || ''
  });

  // 4. Follow-Up & Physical Examination Form State
  const [followUpForm, setFollowUpForm] = useState({
    required: requestItem.followUp?.required || false,
    date: requestItem.followUp?.date ? new Date(requestItem.followUp.date).toISOString().split('T')[0] : '',
    instructions: requestItem.followUp?.instructions || '',
    notes: requestItem.followUp?.notes || '',
    conductExam: Boolean(requestItem.followUp?.physicalExamination?.conducted),
    examTemperature: requestItem.followUp?.physicalExamination?.temperature || '',
    examAppetite: requestItem.followUp?.physicalExamination?.appetite || 'Normal',
    physicalFindings: requestItem.followUp?.physicalExamination?.physicalFindings || '',
    recoveryStatus: requestItem.followUp?.physicalExamination?.recoveryStatus || 'improving',
    examObservations: requestItem.followUp?.physicalExamination?.observations || '',
    completeCase: requestItem.status === 'completed'
  });

  useEffect(() => {
    setCurrentReq(requestItem);
  }, [requestItem]);

  const handleSaveExam = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await vetRequestService.saveClinicalExamination(currentReq._id, examForm, token);
      setCurrentReq(res.data);
      setSuccessMsg('Clinical examination findings saved successfully!');
      if (onRequestUpdated) onRequestUpdated(res.data);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to save examination findings.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDiagnosis = async (e) => {
    e.preventDefault();
    if (!diagnosisForm.diagnosis.trim()) {
      setError('Please enter the doctor final diagnosis.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await vetRequestService.saveFinalDiagnosis(currentReq._id, diagnosisForm, token);
      setCurrentReq(res.data);
      setSuccessMsg('Veterinarian final diagnosis recorded successfully!');
      if (onRequestUpdated) onRequestUpdated(res.data);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to save diagnosis.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMedicineRow = () => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: [...prev.medicines, { medicineName: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    }));
  };

  const handleRemoveMedicineRow = (index) => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }));
  };

  const handleMedicineChange = (index, field, value) => {
    setPrescriptionForm(prev => {
      const updated = [...prev.medicines];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, medicines: updated };
    });
  };

  const handleSavePrescription = async (e) => {
    e.preventDefault();
    const validMeds = prescriptionForm.medicines.filter(m => m.medicineName.trim());
    if (validMeds.length === 0 && !prescriptionForm.generalInstructions.trim()) {
      setError('Please add at least one medicine or general treatment instruction.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await vetRequestService.savePrescription(currentReq._id, {
        ...prescriptionForm,
        medicines: validMeds
      }, token);
      setCurrentReq(res.data);
      setSuccessMsg('Prescription saved and issued successfully!');
      if (onRequestUpdated) onRequestUpdated(res.data);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to save prescription.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveFollowUp = async (e, completeCase = false) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      const payload = {
        required: followUpForm.required,
        date: followUpForm.date || null,
        instructions: followUpForm.instructions,
        notes: followUpForm.notes,
        completeCase,
        physicalExamination: followUpForm.conductExam ? {
          conducted: true,
          temperature: followUpForm.examTemperature,
          appetite: followUpForm.examAppetite,
          physicalFindings: followUpForm.physicalFindings,
          recoveryStatus: followUpForm.recoveryStatus,
          observations: followUpForm.examObservations,
          examinedAt: new Date()
        } : undefined
      };
      const res = await vetRequestService.saveFollowUp(currentReq._id, payload, token);
      setCurrentReq(res.data);
      setSuccessMsg(completeCase ? 'Case completed & released to farmer!' : 'Follow-up and physical examination details saved successfully!');
      if (onRequestUpdated) onRequestUpdated(res.data);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to save follow-up details.');
    } finally {
      setSubmitting(false);
    }
  };

  // Status Stepper Computation
  const getStepStatus = (stepName) => {
    const s = currentReq.status;
    const order = ['accepted', 'examination', 'diagnosed', 'prescription_created', 'completed'];
    const currentIndex = order.indexOf(s === 'pending' ? 'accepted' : s);
    const stepIndex = order.indexOf(stepName);
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-5 sm:p-6 space-y-6 shadow-2xl relative my-6 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 shrink-0 pr-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-slate-900">{t('veterinarian:clinicalWorkspace.workspaceTitle', 'Veterinary Clinical Case Workspace')}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 uppercase">
                  {getStatusLabel(currentReq.status, t)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Case ID: #{currentReq._id?.slice(-8)} • Patient Tag: <strong>{currentReq.cattle?.nameTag || 'Cattle'}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Status Stepper */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shrink-0">
          <div className="grid grid-cols-5 gap-1 text-center text-[11px]">
            {[
              { id: 'accepted', label: t('veterinarian:clinicalWorkspace.steps.accepted', '1. Accepted') },
              { id: 'examination', label: t('veterinarian:clinicalWorkspace.steps.exam', '2. Exam') },
              { id: 'diagnosed', label: t('veterinarian:clinicalWorkspace.steps.diagnosis', '3. Diagnosis') },
              { id: 'prescription_created', label: t('veterinarian:clinicalWorkspace.steps.prescription', '4. Prescription') },
              { id: 'completed', label: t('veterinarian:clinicalWorkspace.steps.complete', '5. Complete') }
            ].map(step => {
              const st = getStepStatus(step.id);
              return (
                <div
                  key={step.id}
                  className={`py-1.5 px-1 rounded-lg font-bold transition flex items-center justify-center space-x-1 ${
                    st === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : st === 'current'
                      ? 'bg-teal-600 text-white shadow-xs'
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

        {/* Feedback Messages */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center space-x-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Workspace Navigation Tabs */}
        <div className="flex items-center space-x-1 border-b border-slate-200 pb-2 overflow-x-auto shrink-0 scrollbar-none">
          {[
            { id: 'overview', label: t('veterinarian:clinicalWorkspace.tabs.overview', 'Overview & AI Screening'), icon: Info },
            { id: 'examination', label: t('veterinarian:clinicalWorkspace.tabs.exam', 'Clinical Exam'), icon: Activity },
            { id: 'diagnosis', label: t('veterinarian:clinicalWorkspace.tabs.diagnosis', 'Final Diagnosis'), icon: ShieldCheck },
            { id: 'prescription', label: t('veterinarian:clinicalWorkspace.tabs.prescription', 'Prescription'), icon: Pill },
            { id: 'followup', label: t('veterinarian:clinicalWorkspace.tabs.followup', 'Follow-Up & Close'), icon: Calendar },
            { id: 'timeline', label: t('veterinarian:clinicalWorkspace.tabs.timeline', 'Case Timeline'), icon: Clock }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Container */}
        <div className="overflow-y-auto space-y-6 pr-1 flex-1">
          {/* TAB 1: OVERVIEW & AI SCREENING */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Prominent Disclaimer Banner */}
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start space-x-3 text-amber-900 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h4 className="font-extrabold text-amber-950">{t('veterinarian:clinicalWorkspace.preliminaryAiDisclaimerTitle', 'Preliminary AI Health Screening Disclaimer')}</h4>
                  <p className="leading-relaxed">{t('veterinarian:clinicalWorkspace.preliminaryAiDisclaimerBody', 'Artificial Intelligence screening is strictly a preliminary diagnostic aid. AI results must never be presented as the final diagnosis. As the licensed veterinarian, you are required to conduct clinical evaluation and enter your explicit diagnosis and treatment protocol.')}</p>
                </div>
              </div>

              {/* Two-Column Grid: Farmer & Cattle Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Farmer Info Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <User className="w-3.5 h-3.5 text-teal-600" />
                      <span>{t('veterinarian:clinicalWorkspace.farmerInfo', 'Farmer Profile')}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                      Client Contact
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">{currentReq.farmer?.name || 'Farmer'}</h3>
                    {currentReq.farmer?.email && (
                      <p className="flex items-center space-x-1.5 text-[11px] text-slate-500 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{currentReq.farmer?.email}</span>
                      </p>
                    )}
                  </div>

                  {/* Active Call Section */}
                  <div className="p-3 bg-white border border-teal-200 rounded-xl space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-teal-900 uppercase tracking-wider flex items-center space-x-1">
                        <Phone className="w-3.5 h-3.5 text-teal-600" />
                        <span>Voice Tele-Consultation</span>
                      </span>
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold rounded-md border border-emerald-200">
                        Direct Call Active
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="font-mono font-bold text-slate-800 text-xs">
                        {currentReq.farmer?.phone || 'No phone number'}
                      </span>
                      {currentReq.farmer?.phone && (
                        <a
                          href={`tel:${currentReq.farmer.phone}`}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition flex items-center space-x-1.5 shadow-xs"
                          title="Call Farmer directly"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call Farmer</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {currentReq.farmerMessage && (
                    <div className="mt-2 p-2.5 bg-white border border-slate-200 rounded-xl italic text-slate-700 text-xs">
                      <strong>{t('veterinarian:pendingCasesPage.farmerMessage', 'Message from Farmer:')}</strong> "{currentReq.farmerMessage}"
                    </div>
                  )}
                </div>

                {/* Cattle Info Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">{t('veterinarian:clinicalWorkspace.cattleInfo', 'Cattle Information')}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      currentReq.cattle?.healthStatus === 'critical' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {getStatusLabel(currentReq.cattle?.healthStatus || 'healthy', t)}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900">{t('farmer:cattle.nameTag', 'Tag')}: {currentReq.cattle?.nameTag || 'N/A'}</h3>
                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    <p>{t('farmer:cattle.breed', 'Breed')}: <strong className="text-slate-800">{currentReq.cattle?.breed || 'N/A'}</strong></p>
                    <p>{t('farmer:cattle.gender', 'Gender')}: <strong className="text-slate-800">{currentReq.cattle?.gender || 'N/A'}</strong></p>
                    <p>{t('farmer:cattle.ageYears', 'Age')}: <strong className="text-slate-800">{currentReq.cattle?.ageYears ? `${currentReq.cattle.ageYears} yrs` : 'N/A'}</strong></p>
                  </div>
                </div>
              </div>

              {/* AI Preliminary Screening Breakdown */}
              <div className="p-5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold">AI</span>
                    <h3 className="text-sm font-bold text-blue-950">{t('veterinarian:dashboard.aiPreliminary', 'AI Diagnostic Preliminary Assessment')}</h3>
                  </div>
                  <span className="text-xs font-bold text-blue-800 bg-blue-100 px-3 py-1 rounded-full">
                    {t('farmer:aiScanner.confidence', 'Confidence')}: {currentReq.diseaseScan?.confidence || 85}%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Disease Image */}
                  <div>
                    {currentReq.diseaseScan?.imageUrl ? (
                      <img
                        src={currentReq.diseaseScan.imageUrl}
                        alt="Scanned cattle condition"
                        className="w-full h-36 object-cover rounded-xl border border-blue-200 shadow-xs"
                      />
                    ) : (
                      <div className="w-full h-36 bg-blue-100/50 rounded-xl flex items-center justify-center text-3xl">
                        🐄
                      </div>
                    )}
                  </div>

                  {/* AI Finding details */}
                  <div className="md:col-span-2 space-y-2">
                    <div className="p-3 bg-white rounded-xl border border-blue-200 space-y-1">
                      <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">{t('farmer:aiScanner.detectedCondition', 'AI Suggested Preliminary Condition')}</span>
                      <p className="text-sm font-extrabold text-slate-900">{currentReq.aiCondition || currentReq.diseaseScan?.detectedCondition}</p>
                      <p className="text-slate-600">
                        {t('common:status.risk', 'Risk Level')}: <strong className={currentReq.riskLevel === 'High' ? 'text-red-600' : 'text-amber-700'}>{currentReq.riskLevel || 'Moderate'}</strong>
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-blue-200 text-slate-700 space-y-1">
                      <strong className="text-slate-900 block">{t('farmer:aiScanner.describeSymptoms', 'Submitted Symptoms')}:</strong>
                      <p>{currentReq.symptoms || currentReq.diseaseScan?.symptoms || t('common:status.none', 'No specific symptoms submitted.')}</p>
                    </div>

                    {currentReq.diseaseScan?.recommendations && (
                      <div className="p-3 bg-white rounded-xl border border-blue-200 text-slate-700 space-y-1">
                        <strong className="text-slate-900 block">{t('farmer:aiScanner.recommendations', 'AI Initial Suggestions')}:</strong>
                        <p>{currentReq.diseaseScan.recommendations}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Prompt */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-slate-500">{t('veterinarian:clinicalWorkspace.proceedToExam', 'Ready to examine the cattle?')}</p>
                <button
                  onClick={() => setActiveTab('examination')}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5"
                >
                  <span>{t('veterinarian:clinicalWorkspace.proceedToExam', 'Proceed to Clinical Exam')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CLINICAL EXAMINATION */}
          {activeTab === 'examination' && (
            <form onSubmit={handleSaveExam} className="space-y-4 text-xs">
              <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-2xl space-y-1">
                <h3 className="font-extrabold text-teal-950 text-sm flex items-center space-x-1.5">
                  <Activity className="w-4 h-4 text-teal-600" />
                  <span>{t('veterinarian:clinicalWorkspace.step2Title', 'Step 2 — Record Clinical Examination Findings')}</span>
                </h3>
                <p className="text-slate-600">
                  {t('veterinarian:clinicalWorkspace.step2Subtitle', 'Document your physical observations, vital signs, temperature, and visible cattle symptoms.')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('veterinarian:clinicalWorkspace.temperature', 'Body Temperature (Optional)')}</label>
                  <input
                    type="text"
                    placeholder={t('veterinarian:clinicalWorkspace.tempPlaceholder', 'e.g. 102.5 °F (Normal is ~101.5 °F)')}
                    value={examForm.temperature}
                    onChange={(e) => setExamForm(prev => ({ ...prev, temperature: e.target.value }))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('veterinarian:clinicalWorkspace.appetite', 'Appetite / Feeding State')}</label>
                  <select
                    value={examForm.appetite}
                    onChange={(e) => setExamForm(prev => ({ ...prev, appetite: e.target.value }))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    <option value="Normal">{t('common:status.normal', 'Normal Appetite')}</option>
                    <option value="Reduced">{t('common:status.reduced', 'Reduced Feeding Intake')}</option>
                    <option value="Anorexic">{t('common:status.anorexic', 'Complete Loss of Appetite / Anorexic')}</option>
                    <option value="Weak">{t('common:status.weak', 'Weak / Lethargic')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('veterinarian:clinicalWorkspace.physicalSymptoms', 'Physical Symptoms / Clinical Findings')}</label>
                <textarea
                  rows="3"
                  placeholder={t('veterinarian:clinicalWorkspace.physicalSymptomsPlaceholder', 'Record visible physical signs e.g., skin lesions, udder swelling, nasal discharge, fever, lameness...')}
                  value={examForm.physicalSymptoms}
                  onChange={(e) => setExamForm(prev => ({ ...prev, physicalSymptoms: e.target.value }))}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('veterinarian:clinicalWorkspace.observationsNotes', 'General Clinical Observations')}</label>
                <textarea
                  rows="3"
                  placeholder={t('veterinarian:clinicalWorkspace.observationsPlaceholder', 'Detail overall health condition, hydration status, rumination activity, behavior...')}
                  value={examForm.observations}
                  onChange={(e) => setExamForm(prev => ({ ...prev, observations: e.target.value }))}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('common:fields.notes', 'Additional Examination Notes')}</label>
                <textarea
                  rows="2"
                  placeholder={t('veterinarian:clinicalWorkspace.additionalNotesPlaceholder', 'Any other relevant details or history provided by the farmer...')}
                  value={examForm.additionalNotes}
                  onChange={(e) => setExamForm(prev => ({ ...prev, additionalNotes: e.target.value }))}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  {t('common:actions.back', 'Back')}
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs transition disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    <span>{submitting ? t('common:status.loading', 'Saving...') : t('veterinarian:clinicalWorkspace.saveExamFindings', 'Save Examination Findings')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('diagnosis')}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-xs transition flex items-center space-x-1"
                  >
                    <span>{t('veterinarian:clinicalWorkspace.nextDiagnosis', 'Next: Final Diagnosis')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 3: VETERINARIAN FINAL DIAGNOSIS */}
          {activeTab === 'diagnosis' && (
            <form onSubmit={handleSaveDiagnosis} className="space-y-4 text-xs">
              <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-2xl space-y-1">
                <div className="flex items-center space-x-2 text-emerald-900">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <h3 className="font-extrabold text-sm">{t('veterinarian:clinicalWorkspace.step3Title', 'Step 3 — Veterinarian Final Diagnosis')}</h3>
                </div>
                <p className="text-slate-600">
                  {t('veterinarian:clinicalWorkspace.step3Subtitle', 'As the attending doctor, confirm and record your authoritative clinical diagnosis. This will overwrite preliminary AI estimates.')}
                </p>
              </div>

              <div>
                <label className="block font-extrabold text-slate-900 mb-1">
                  {t('veterinarian:clinicalWorkspace.diagnosisTitle', 'Veterinarian Final Diagnosis')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={t('veterinarian:clinicalWorkspace.diagnosisPlaceholder', 'e.g. Acute Mastitis (Left Hind Quarter), Lumpy Skin Disease, Foot & Mouth Disease...')}
                  value={diagnosisForm.diagnosis}
                  onChange={(e) => setDiagnosisForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('veterinarian:clinicalWorkspace.conditionSeverity', 'Clinical Condition Severity')}</label>
                <select
                  value={diagnosisForm.severity}
                  onChange={(e) => setDiagnosisForm(prev => ({ ...prev, severity: e.target.value }))}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="Mild">{t('common:status.mild', 'Mild Condition')}</option>
                  <option value="Moderate">{t('common:status.moderate', 'Moderate Condition')}</option>
                  <option value="Severe">{t('common:status.severe', 'Severe Condition')}</option>
                  <option value="Critical">{t('common:status.critical', 'Critical Emergency')}</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('veterinarian:clinicalWorkspace.observationsNotes', 'Diagnosis Notes & Clinical Findings')}</label>
                <textarea
                  rows="3"
                  placeholder={t('veterinarian:clinicalWorkspace.diagnosisNotesPlaceholder', 'Explain why this diagnosis was reached, pathological observations, laboratory findings...')}
                  value={diagnosisForm.notes}
                  onChange={(e) => setDiagnosisForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('veterinarian:clinicalWorkspace.treatmentProtocol', 'Clinical Treatment Advice')}</label>
                <textarea
                  rows="3"
                  placeholder={t('veterinarian:clinicalWorkspace.treatmentAdvicePlaceholder', 'Outline clinical treatment protocol, injection procedures, isolation requirements...')}
                  value={diagnosisForm.treatmentAdvice}
                  onChange={(e) => setDiagnosisForm(prev => ({ ...prev, treatmentAdvice: e.target.value }))}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('veterinarian:clinicalWorkspace.careAdviceForFarmer', 'Additional Advice for Farmer')}</label>
                <textarea
                  rows="2"
                  placeholder={t('veterinarian:clinicalWorkspace.careAdvicePlaceholder', 'Sanitation advice, milking hygiene, calf segregation, diet adjustments...')}
                  value={diagnosisForm.additionalAdvice}
                  onChange={(e) => setDiagnosisForm(prev => ({ ...prev, additionalAdvice: e.target.value }))}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('examination')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  {t('common:actions.back', 'Back')}
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{submitting ? t('common:status.loading', 'Confirming...') : t('veterinarian:clinicalWorkspace.confirmDiagnosis', 'Confirm Final Diagnosis')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('prescription')}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-xs transition flex items-center space-x-1"
                  >
                    <span>{t('veterinarian:clinicalWorkspace.nextPrescription', 'Next: Prescription')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 4: PRESCRIPTION */}
          {activeTab === 'prescription' && (
            <form onSubmit={handleSavePrescription} className="space-y-4 text-xs">
              <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-1">
                <div className="flex items-center space-x-2 text-purple-950">
                  <Pill className="w-5 h-5 text-purple-600 shrink-0" />
                  <h3 className="font-extrabold text-sm">{t('veterinarian:clinicalWorkspace.step4Title', 'Step 4 — Issue Veterinary Prescription')}</h3>
                </div>
                <p className="text-slate-600">
                  {t('veterinarian:clinicalWorkspace.step4Subtitle', 'Add prescribed medicines, dosages, frequencies, and administration instructions for the farmer.')}
                </p>
              </div>

              {/* Medicines Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-900">{t('veterinarian:clinicalWorkspace.medicinesList', 'Prescribed Medicines List')}</label>
                  <button
                    type="button"
                    onClick={handleAddMedicineRow}
                    className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold rounded-xl transition flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('veterinarian:clinicalWorkspace.addMedicineBtn', 'Add Medicine')}</span>
                  </button>
                </div>

                {prescriptionForm.medicines.map((med, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-600">{t('common:status.item', 'Item')} #{idx + 1}</span>
                      {prescriptionForm.medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicineRow(idx)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder={t('veterinarian:clinicalWorkspace.medicineNamePlaceholder', 'Medicine Name (e.g. Amoxicillin 500mg)')}
                          value={med.medicineName}
                          onChange={(e) => handleMedicineChange(idx, 'medicineName', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder={t('veterinarian:clinicalWorkspace.dosagePlaceholder', 'Dosage (e.g. 10 ml)')}
                          value={med.dosage}
                          onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder={t('veterinarian:clinicalWorkspace.frequencyPlaceholder', 'Frequency (e.g. Twice Daily)')}
                          value={med.frequency}
                          onChange={(e) => handleMedicineChange(idx, 'frequency', e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder={t('veterinarian:clinicalWorkspace.durationPlaceholder', 'Duration (e.g. 5 Days)')}
                        value={med.duration}
                        onChange={(e) => handleMedicineChange(idx, 'duration', e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                      <input
                        type="text"
                        placeholder={t('veterinarian:clinicalWorkspace.instructionsPlaceholder', 'Instructions (e.g. Administer after milking)')}
                        value={med.instructions}
                        onChange={(e) => handleMedicineChange(idx, 'instructions', e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('veterinarian:clinicalWorkspace.generalInstructions', 'General Treatment & Care Instructions')}</label>
                <textarea
                  rows="3"
                  placeholder={t('veterinarian:clinicalWorkspace.generalInstructionsPlaceholder', 'Detail instructions e.g. apply teat dip after milking, keep animal clean, complete full antibiotic course...')}
                  value={prescriptionForm.generalInstructions}
                  onChange={(e) => setPrescriptionForm(prev => ({ ...prev, generalInstructions: e.target.value }))}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('veterinarian:clinicalWorkspace.dietaryAdvice', 'Dietary & Nutrition Advice')}</label>
                <textarea
                  rows="2"
                  placeholder={t('veterinarian:clinicalWorkspace.dietaryAdvicePlaceholder', 'Feed modifications, fresh water intake, mineral mixture supplements...')}
                  value={prescriptionForm.dietaryAdvice}
                  onChange={(e) => setPrescriptionForm(prev => ({ ...prev, dietaryAdvice: e.target.value }))}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('diagnosis')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  {t('common:actions.back', 'Back')}
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs transition disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    <Pill className="w-4 h-4" />
                    <span>{submitting ? t('common:status.loading', 'Saving...') : t('veterinarian:clinicalWorkspace.saveIssuePrescription', 'Save & Issue Prescription')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('followup')}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-xs transition flex items-center space-x-1"
                  >
                    <span>{t('veterinarian:clinicalWorkspace.nextFollowUp', 'Next: Follow-Up')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 5: FOLLOW-UP & CASE COMPLETION */}
          {activeTab === 'followup' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1">
                <div className="flex items-center space-x-2 text-blue-950">
                  <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
                  <h3 className="font-extrabold text-sm">{t('veterinarian:clinicalWorkspace.step5Title', 'Step 5 — Follow-Up Advice & Case Closure')}</h3>
                </div>
                <p className="text-slate-600">
                  {t('veterinarian:clinicalWorkspace.step5Subtitle', 'Schedule an optional follow-up date and mark the clinical consultation as complete.')}
                </p>
              </div>

              {/* Card 1: Schedule Follow-Up & Farmer Instructions */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    id="followup-needed"
                    type="checkbox"
                    checked={followUpForm.required}
                    onChange={(e) => setFollowUpForm(prev => ({ ...prev, required: e.target.checked }))}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                  />
                  <label htmlFor="followup-needed" className="font-bold text-slate-900 cursor-pointer">
                    {t('veterinarian:clinicalWorkspace.followUpRequired', 'Follow-up consultation required for this cattle')}
                  </label>
                </div>

                {followUpForm.required && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('veterinarian:clinicalWorkspace.followUpDate', 'Recommended Follow-Up Date')}</label>
                    <input
                      type="date"
                      value={followUpForm.date}
                      onChange={(e) => setFollowUpForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full max-w-xs p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('veterinarian:clinicalWorkspace.followUpInstructions', 'Follow-Up Instructions for Farmer')}</label>
                  <textarea
                    rows="2"
                    placeholder={t('veterinarian:clinicalWorkspace.followUpPlaceholder', 'e.g. Schedule check-up if fever persists after 3 days, monitor milk yield recovery...')}
                    value={followUpForm.instructions}
                    onChange={(e) => setFollowUpForm(prev => ({ ...prev, instructions: e.target.value }))}
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* Card 2: Follow-up Physical Examination Findings */}
              <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-teal-600" />
                    <h4 className="font-extrabold text-teal-950 text-xs">
                      {t('veterinarian:clinicalWorkspace.followUpExamTitle', 'Follow-up Physical Examination (Clinical Visit)')}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      id="conduct-exam"
                      type="checkbox"
                      checked={followUpForm.conductExam}
                      onChange={(e) => setFollowUpForm(prev => ({ ...prev, conductExam: e.target.checked }))}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <label htmlFor="conduct-exam" className="font-bold text-teal-900 cursor-pointer">
                      {t('veterinarian:clinicalWorkspace.recordExamNow', 'Record Physical Exam Findings')}
                    </label>
                  </div>
                </div>

                {followUpForm.conductExam && (
                  <div className="space-y-4 pt-2 border-t border-teal-100">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          {t('veterinarian:clinicalWorkspace.recoveryStatus', 'Clinical Recovery Status')}
                        </label>
                        <select
                          value={followUpForm.recoveryStatus}
                          onChange={(e) => setFollowUpForm(prev => ({ ...prev, recoveryStatus: e.target.value }))}
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                        >
                          <option value="improving">🟢 {t('common:status.improving', 'Condition Improving / Positive Response')}</option>
                          <option value="fully_recovered">✅ {t('common:status.fullyRecovered', 'Fully Recovered / Healthy')}</option>
                          <option value="stagnant">🟡 {t('common:status.stagnant', 'Guarded / Slow Progress')}</option>
                          <option value="critical">🔴 {t('common:status.critical', 'Critical / Deteriorating')}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          {t('veterinarian:clinicalWorkspace.followUpTemp', 'Current Temperature (°F)')}
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 101.8 °F (Normal)"
                          value={followUpForm.examTemperature}
                          onChange={(e) => setFollowUpForm(prev => ({ ...prev, examTemperature: e.target.value }))}
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          {t('veterinarian:clinicalWorkspace.followUpAppetite', 'Current Appetite / Rumination')}
                        </label>
                        <select
                          value={followUpForm.examAppetite}
                          onChange={(e) => setFollowUpForm(prev => ({ ...prev, examAppetite: e.target.value }))}
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                        >
                          <option value="Normal">Normal Feeding & Rumination</option>
                          <option value="Improving">Appetite Improving</option>
                          <option value="Reduced">Reduced Feed Intake</option>
                          <option value="Anorexic">Loss of Appetite / Depressed</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        {t('veterinarian:clinicalWorkspace.physicalFindingsLabel', 'Physical Examination Observations & Healing Progress')}
                      </label>
                      <textarea
                        rows="3"
                        placeholder="Document physical symptoms observed: e.g. wound healing nicely, udder swelling reduced by 80%, rumination normalized, active gait..."
                        value={followUpForm.physicalFindings}
                        onChange={(e) => setFollowUpForm(prev => ({ ...prev, physicalFindings: e.target.value }))}
                        className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        {t('veterinarian:clinicalWorkspace.doctorDirectives', 'Additional Doctor Directives & Next Steps')}
                      </label>
                      <textarea
                        rows="2"
                        placeholder="Optional instructions for further management, vaccination date, or discharge note..."
                        value={followUpForm.examObservations}
                        onChange={(e) => setFollowUpForm(prev => ({ ...prev, examObservations: e.target.value }))}
                        className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('prescription')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  {t('common:actions.back', 'Back')}
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={(e) => handleSaveFollowUp(e, false)}
                    disabled={submitting}
                    className="px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition disabled:opacity-50"
                  >
                    <span>{submitting ? t('common:status.loading', 'Saving...') : t('veterinarian:clinicalWorkspace.saveFollowUpBtn', 'Save Follow-Up Advice')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSaveFollowUp(e, true)}
                    disabled={submitting}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{submitting ? t('common:status.loading', 'Closing...') : t('veterinarian:clinicalWorkspace.completeCaseClose', 'Complete Case & Close')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CLINICAL TIMELINE & ESCALATION HISTORY */}
          {activeTab === 'timeline' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span>{t('veterinarian:clinicalWorkspace.timelineTitle', 'Clinical Progression & Referral Timeline')}</span>
                </h3>
                <p className="text-slate-500">
                  {t('veterinarian:clinicalWorkspace.timelineSubtitle', 'Audit log of case creation, doctor assignment, referral history, examination, diagnosis, and prescription.')}
                </p>
              </div>

              {/* Escalation History Banner */}
              {currentReq.escalationHistory && currentReq.escalationHistory.length > 0 && (
                <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl space-y-2">
                  <h4 className="font-extrabold text-indigo-950 flex items-center space-x-1.5">
                    <RotateCw className="w-4 h-4 text-indigo-600" />
                    <span>{t('veterinarian:clinicalWorkspace.escalationHistoryTitle', 'Referral / Escalation History')}</span>
                  </h4>
                  <div className="space-y-2">
                    {currentReq.escalationHistory.map((item, i) => (
                      <div key={i} className="p-2.5 bg-white rounded-xl border border-indigo-100 text-slate-700 flex items-start justify-between">
                        <div>
                          <strong className="text-slate-900 font-bold block">Referred from Dr. {item.veterinarian?.name || 'Doctor'}</strong>
                          <span className="text-[11px] text-slate-500">Reason: "{item.reason || 'Unavailable'}"</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.respondedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clinical Timeline Entries */}
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {currentReq.clinicalTimeline && currentReq.clinicalTimeline.length > 0 ? (
                  currentReq.clinicalTimeline.map((log, idx) => (
                    <div key={idx} className="relative group">
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-teal-600 border-2 border-white shadow-xs" />
                      <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-900">{log.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {log.notes && <p className="text-slate-600">{log.notes}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-400">
                    No clinical timeline events recorded yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
