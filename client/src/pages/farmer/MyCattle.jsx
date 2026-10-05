import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cattleService } from '../../services/cattleService';
import { diseaseScanService } from '../../services/diseaseScanService';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { SectionCard } from '../../components/common/SectionCard';
import { EmptyState } from '../../components/common/EmptyState';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Stethoscope, 
  HeartPulse, 
  ShieldAlert, 
  Activity, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  Calendar,
  RefreshCw
} from 'lucide-react';

export const MyCattle = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [cattleList, setCattleList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Active cattle selection for edit/detail/delete
  const [selectedCattle, setSelectedCattle] = useState(null);
  const [cattleScans, setCattleScans] = useState([]);
  const [loadingScans, setLoadingScans] = useState(false);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    nameTag: '',
    breed: 'Gir',
    gender: 'female',
    ageYears: 3,
    healthStatus: 'healthy',
    imageUrl: '',
    notes: ''
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // System file upload handler
  const handleCattleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, imageUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // Fetch Cattle List
  const fetchCattle = async () => {
    try {
      setLoading(true);
      setError('');
      if (token) {
        const res = await cattleService.getFarmerCattle(token);
        setCattleList(res.cattle || []);
      }
    } catch (err) {
      console.error('Error fetching cattle:', err);
      setError(err.message || 'Failed to load cattle records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCattle();
  }, [token]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormData({
      nameTag: '',
      breed: 'Gir',
      gender: 'female',
      ageYears: 3,
      healthStatus: 'healthy',
      imageUrl: '',
      notes: ''
    });
    setFormError('');
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (cattle) => {
    setSelectedCattle(cattle);
    setFormData({
      nameTag: cattle.nameTag || '',
      breed: cattle.breed || 'Gir',
      gender: cattle.gender || 'female',
      ageYears: cattle.ageYears !== undefined ? cattle.ageYears : 3,
      healthStatus: cattle.healthStatus || 'healthy',
      imageUrl: cattle.imageUrl || '',
      notes: cattle.notes || ''
    });
    setFormError('');
    setShowEditModal(true);
  };

  // Open Detail Modal
  const handleOpenDetail = async (cattle) => {
    setSelectedCattle(cattle);
    setShowDetailModal(true);
    setLoadingScans(true);
    try {
      const scans = await diseaseScanService.getFarmerScans(token, cattle._id);
      setCattleScans(scans);
    } catch (err) {
      console.error('Failed to fetch cattle health scans:', err);
      setCattleScans([]);
    } finally {
      setLoadingScans(false);
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (cattle) => {
    setSelectedCattle(cattle);
    setShowDeleteDialog(true);
  };

  // Submit Add Cattle
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.nameTag.trim() || !formData.breed.trim()) {
      setFormError('Cattle name/tag number and breed are required.');
      return;
    }

    try {
      setFormLoading(true);
      await cattleService.createCattle(token, formData);
      setSuccessMsg('Cattle record registered successfully!');
      setShowAddModal(false);
      fetchCattle();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setFormError(err.message || 'Failed to create cattle record.');
    } finally {
      setFormLoading(false);
    }
  };

  // Submit Edit Cattle
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.nameTag.trim() || !formData.breed.trim()) {
      setFormError('Cattle name/tag number and breed are required.');
      return;
    }

    try {
      setFormLoading(true);
      await cattleService.updateCattle(token, selectedCattle._id, formData);
      setSuccessMsg('Cattle record updated successfully!');
      setShowEditModal(false);
      fetchCattle();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setFormError(err.message || 'Failed to update cattle record.');
    } finally {
      setFormLoading(false);
    }
  };

  // Submit Delete Cattle
  const handleDeleteConfirm = async () => {
    if (!selectedCattle) return;
    try {
      setFormLoading(true);
      await cattleService.deleteCattle(token, selectedCattle._id);
      setSuccessMsg('Cattle record deleted successfully.');
      setShowDeleteDialog(false);
      fetchCattle();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to delete cattle record.');
    } finally {
      setFormLoading(false);
    }
  };

  // Navigate to Health Check (Phase 19 preparation)
  const handleHealthCheck = (cattleId) => {
    navigate(`/farmer/ai-scanner?cattleId=${cattleId}`);
  };

  // Filtered List
  const filteredCattle = cattleList.filter((item) => {
    const matchesSearch =
      item.nameTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.breed.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.healthStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Health Status Badge Renderer
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'healthy':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 flex items-center w-fit">
            <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" /> Healthy
          </span>
        );
      case 'sick':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 flex items-center w-fit">
            <ShieldAlert className="w-3 h-3 mr-1 text-red-600" /> Sick
          </span>
        );
      case 'under_observation':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center w-fit">
            <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" /> Under Observation
          </span>
        );
      case 'treatment_ongoing':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center w-fit">
            <Activity className="w-3 h-3 mr-1 text-blue-600" /> Treatment Ongoing
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const healthyCount = cattleList.filter((c) => c.healthStatus === 'healthy').length;
  const sickCount = cattleList.filter((c) => c.healthStatus === 'sick' || c.healthStatus === 'treatment_ongoing').length;
  const observationCount = cattleList.filter((c) => c.healthStatus === 'under_observation').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Cattle"
        description="Manage your cattle records, track individual health status, and initiate AI health checks."
        breadcrumbs={['Home', 'Farmer', 'My Cattle']}
        actions={
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Cattle</span>
          </button>
        }
      />

      {/* Global Alerts */}
      {successMsg && (
        <div className="p-3.5 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        </div>
      )}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Cattle"
          value={loading ? '...' : cattleList.length}
          icon={HeartPulse}
          badgeText="Active Livestock"
          badgeType="success"
        />
        <StatCard
          title="Healthy Cattle"
          value={loading ? '...' : healthyCount}
          icon={CheckCircle2}
          badgeText={healthyCount === cattleList.length ? '100% Healthy' : 'Normal State'}
          badgeType="success"
        />
        <StatCard
          title="Sick / In Treatment"
          value={loading ? '...' : sickCount}
          icon={ShieldAlert}
          badgeText={sickCount > 0 ? 'Requires Attention' : 'None'}
          badgeType={sickCount > 0 ? 'amber' : 'neutral'}
        />
        <StatCard
          title="Under Observation"
          value={loading ? '...' : observationCount}
          icon={Activity}
          badgeText={observationCount > 0 ? 'Monitoring' : 'None'}
          badgeType="neutral"
        />
      </div>

      {/* Main Catalog Card */}
      <SectionCard
        title="Cattle Directory"
        subtitle="Search and manage your cattle"
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search name or breed..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-60"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            </div>

            {/* Filter Dropdown */}
            <div className="relative flex items-center">
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 capitalize"
              >
                <option value="all">All Statuses</option>
                <option value="healthy">Healthy</option>
                <option value="sick">Sick</option>
                <option value="under_observation">Under Observation</option>
                <option value="treatment_ongoing">Treatment Ongoing</option>
              </select>
            </div>
          </div>
        }
      >
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs font-medium">
            Loading your cattle records...
          </div>
        ) : filteredCattle.length === 0 ? (
          <EmptyState
            title="No Cattle Found"
            description={
              searchTerm || statusFilter !== 'all'
                ? 'No cattle match your search filters.'
                : 'You have not added any cattle to your livestock directory yet.'
            }
            icon={HeartPulse}
            actionLabel={!searchTerm && statusFilter === 'all' ? '+ Add Your First Cattle' : ''}
            onAction={handleOpenAdd}
          />
        ) : (
          /* Cattle Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCattle.map((cattle) => (
              <div
                key={cattle._id}
                className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-2xl flex items-center justify-center shrink-0">
                        {cattle.imageUrl ? (
                          <img
                            src={cattle.imageUrl}
                            alt={cattle.nameTag}
                            className="w-full h-full object-cover rounded-xl"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          '🐄'
                        )}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900 leading-tight">
                          {cattle.nameTag}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">{cattle.breed}</p>
                      </div>
                    </div>
                    {renderStatusBadge(cattle.healthStatus)}
                  </div>

                  {/* Attributes Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs py-2.5 px-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Gender</span>
                      <span className="font-semibold text-slate-700 capitalize">{cattle.gender}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Age</span>
                      <span className="font-semibold text-slate-700">{cattle.ageYears} Years</span>
                    </div>
                  </div>

                  {cattle.notes && (
                    <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 italic">
                      "{cattle.notes}"
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <button
                    onClick={() => handleHealthCheck(cattle._id)}
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center justify-center space-x-1.5"
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Run AI Health Check</span>
                  </button>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => handleOpenDetail(cattle)}
                      className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition flex items-center justify-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => handleOpenEdit(cattle)}
                      className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-blue-700 text-xs font-medium rounded-lg border border-slate-200 transition flex items-center justify-center space-x-1"
                    >
                      <Edit className="w-3.5 h-3.5 text-blue-600" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleOpenDelete(cattle)}
                      className="py-1.5 px-2 bg-slate-50 hover:bg-red-50 text-red-600 text-xs font-medium rounded-lg border border-slate-200 hover:border-red-200 transition flex items-center justify-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ADD CATTLE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Add Cattle Record</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cattle Name / Tag Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gauri / TAG-104"
                  value={formData.nameTag}
                  onChange={(e) => setFormData({ ...formData, nameTag: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Breed <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Gir, Sahiwal"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="female">Female (Cow)</option>
                    <option value="male">Male (Bull)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={formData.ageYears}
                    onChange={(e) => setFormData({ ...formData, ageYears: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Health Status</label>
                  <select
                    value={formData.healthStatus}
                    onChange={(e) => setFormData({ ...formData, healthStatus: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="healthy">Healthy</option>
                    <option value="sick">Sick</option>
                    <option value="under_observation">Under Observation</option>
                    <option value="treatment_ongoing">Treatment Ongoing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cattle Photo (Upload from System)</label>
                <div className="flex items-center space-x-3">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Cattle preview" className="w-12 h-12 object-cover rounded-xl border border-slate-200" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl text-slate-400">
                      🐄
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCattleImageUpload}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Medical History</label>
                <textarea
                  rows="2"
                  placeholder="Vaccination details, mark, or notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : 'Save Cattle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CATTLE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Edit Cattle Record</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cattle Name / Tag Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nameTag}
                  onChange={(e) => setFormData({ ...formData, nameTag: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Breed</label>
                  <input
                    type="text"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    value={formData.ageYears}
                    onChange={(e) => setFormData({ ...formData, ageYears: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Health Status</label>
                  <select
                    value={formData.healthStatus}
                    onChange={(e) => setFormData({ ...formData, healthStatus: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="healthy">Healthy</option>
                    <option value="sick">Sick</option>
                    <option value="under_observation">Under Observation</option>
                    <option value="treatment_ongoing">Treatment Ongoing</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Update Cattle Photo (Upload from System)</label>
                <div className="flex items-center space-x-3">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Cattle preview" className="w-12 h-12 object-cover rounded-xl border border-slate-200" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl text-slate-400">
                      🐄
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCattleImageUpload}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {formLoading ? 'Updating...' : 'Update Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL CATTLE MODAL */}
      {showDetailModal && selectedCattle && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Cattle Profile & History</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-4 p-3 bg-blue-50/60 border border-blue-100 rounded-xl">
                <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-3xl shrink-0">
                  🐄
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{selectedCattle.nameTag}</h4>
                  <p className="text-xs text-slate-500 font-medium">Breed: {selectedCattle.breed}</p>
                  <div className="mt-1">{renderStatusBadge(selectedCattle.healthStatus)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">Gender</span>
                  <span className="font-semibold text-slate-800 capitalize">{selectedCattle.gender}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">Age</span>
                  <span className="font-semibold text-slate-800">{selectedCattle.ageYears} Years</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">Registered Owner</span>
                  <span className="font-semibold text-slate-800">{selectedCattle.farmer?.name || user?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">Last AI Health Check</span>
                  <span className="font-semibold text-slate-800">
                    {selectedCattle.lastHealthCheck
                      ? new Date(selectedCattle.lastHealthCheck).toLocaleDateString()
                      : 'No scans yet'}
                  </span>
                </div>
              </div>

              {selectedCattle.notes && (
                <div>
                  <h5 className="text-xs font-bold text-slate-700 mb-1">Notes / Characteristics</h5>
                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100">
                    {selectedCattle.notes}
                  </div>
                </div>
              )}

              {/* AI Health Checks & History */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                    <Stethoscope className="w-4 h-4 text-emerald-600" />
                    <span>AI Health Screening History</span>
                  </h5>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleHealthCheck(selectedCattle._id);
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Run Health Scan</span>
                  </button>
                </div>

                {loadingScans ? (
                  <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 text-center">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-emerald-600" />
                    Loading health screening records...
                  </div>
                ) : cattleScans.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 border border-slate-100 text-center space-y-2">
                    <p>No health screenings recorded yet for {selectedCattle.nameTag}.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {cattleScans.map((scan) => (
                      <div
                        key={scan._id}
                        className="p-3 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 rounded-xl transition flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={scan.imageUrl}
                            alt="Scan"
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block line-clamp-1">{scan.detectedCondition}</span>
                            <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{new Date(scan.createdAt).toLocaleDateString()}</span>
                              <span className="text-blue-600 font-semibold ml-1">({scan.confidence}% confidence)</span>
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setShowDetailModal(false);
                            navigate('/farmer/scan-history');
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[11px] rounded-lg transition"
                        >
                          View Result
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {showDeleteDialog && selectedCattle && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Delete Cattle Record?</h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to delete cattle <strong className="text-slate-900 font-bold">"{selectedCattle.nameTag}"</strong>? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteDialog(false)}
                className="w-1/2 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={formLoading}
                className="w-1/2 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
              >
                {formLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
