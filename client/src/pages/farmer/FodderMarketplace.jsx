import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getStatusLabel } from '../../i18n/statusMap';
import { useAuth } from '../../context/AuthContext';
import { fodderListingService } from '../../services/fodderListingService';
import { PageHeader } from '../../components/common/PageHeader';
import { SectionCard } from '../../components/common/SectionCard';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Store,
  Plus,
  Search,
  Filter,
  MapPin,
  Calendar,
  Phone,
  User,
  Tag,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  Info,
  Wheat,
  Clock,
  Layers
} from 'lucide-react';

const FODDER_TYPES = [
  'All',
  'Green Fodder',
  'Dry Fodder',
  'Maize Fodder',
  'Hay',
  'Silage',
  'Grass',
  'Crop Residue',
  'Other'
];

export const FodderMarketplace = () => {
  const { t } = useTranslation(['farmer', 'common']);
  const { user, token } = useAuth();

  // State variables
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'my_listings'
  const [marketplaceListings, setMarketplaceListings] = useState([]);
  const [farmerListings, setFarmerListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [selectedType, setSelectedType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [selectedDetailListing, setSelectedDetailListing] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    fodderType: 'Green Fodder',
    customFodderType: '',
    description: '',
    price: '',
    quantity: '',
    quantityUnit: 'kg',
    availableDate: new Date().toISOString().split('T')[0],
    imageUrl: '',
    locationArea: '',
    locationCity: '',
    locationDistrict: '',
    locationState: '',
    contactPhone: ''
  });
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Load Listings
  const loadListings = async () => {
    setLoading(true);
    setError('');
    try {
      if (token) {
        const [marketRes, myRes] = await Promise.all([
          fodderListingService.getMarketplaceListings(token, { fodderType: selectedType, search: searchQuery }),
          fodderListingService.getFarmerListings(token)
        ]);
        setMarketplaceListings(marketRes.listings || []);
        setFarmerListings(myRes.listings || []);
      }
    } catch (err) {
      console.error('Failed to load fodder listings:', err);
      setError(err.message || 'Failed to load fodder marketplace listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, [token, selectedType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadListings();
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingListing(null);
    setFormData({
      title: '',
      fodderType: 'Green Fodder',
      customFodderType: '',
      description: '',
      price: '',
      quantity: '',
      quantityUnit: 'kg',
      availableDate: new Date().toISOString().split('T')[0],
      imageUrl: '',
      locationArea: user?.village || '',
      locationCity: user?.city || '',
      locationDistrict: '',
      locationState: '',
      contactPhone: user?.phone || ''
    });
    setImagePreview('');
    setFormError('');
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (listing) => {
    setEditingListing(listing);
    setFormData({
      title: listing.title || '',
      fodderType: listing.fodderType || 'Green Fodder',
      customFodderType: listing.customFodderType || '',
      description: listing.description || '',
      price: listing.price || '',
      quantity: listing.quantity || '',
      quantityUnit: listing.quantityUnit || 'kg',
      availableDate: listing.availableDate ? new Date(listing.availableDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      imageUrl: listing.imageUrl || '',
      locationArea: listing.location?.area || '',
      locationCity: listing.location?.city || '',
      locationDistrict: listing.location?.district || '',
      locationState: listing.location?.state || '',
      contactPhone: listing.contactPhone || user?.phone || ''
    });
    setImagePreview(listing.imageUrl || '');
    setFormError('');
    setIsCreateModalOpen(true);
  };

  // Handle Image File Selection
  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
        setFormError('Please select a valid image file (JPG, PNG, or WEBP)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData((prev) => ({ ...prev, imageUrl: reader.result }));
        setFormError('');
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Listing Form (Create or Update)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Field Validations
    if (!formData.title.trim()) {
      setFormError('Please enter a listing title.');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('Please enter a description for your fodder.');
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      setFormError('Please enter a valid price greater than 0.');
      return;
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setFormError('Please enter a valid quantity greater than 0.');
      return;
    }
    if (!formData.locationArea.trim() || !formData.locationCity.trim()) {
      setFormError('Please enter both village/area and city/town location details.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title: formData.title,
        fodderType: formData.fodderType,
        customFodderType: formData.fodderType === 'Other' ? formData.customFodderType : '',
        description: formData.description,
        price: Number(formData.price),
        quantity: Number(formData.quantity),
        quantityUnit: formData.quantityUnit,
        availableDate: formData.availableDate,
        imageUrl: formData.imageUrl,
        location: {
          area: formData.locationArea,
          city: formData.locationCity,
          district: formData.locationDistrict,
          state: formData.locationState
        },
        contactPhone: formData.contactPhone || user?.phone
      };

      if (editingListing) {
        await fodderListingService.updateListing(token, editingListing._id, payload);
        setSuccessMsg('Fodder listing updated successfully!');
      } else {
        await fodderListingService.createListing(token, payload);
        setSuccessMsg('Fodder listing published successfully!');
      }

      setIsCreateModalOpen(false);
      loadListings();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to submit listing:', err);
      setFormError(err.message || 'Failed to save fodder listing. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  // Status Change Handler for Farmer's Listings
  const handleStatusChange = async (listingId, newStatus) => {
    try {
      await fodderListingService.updateListing(token, listingId, { status: newStatus });
      setSuccessMsg(`Listing status marked as ${newStatus.toUpperCase()}`);
      loadListings();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to update listing status');
    }
  };

  // Delete Listing Handler
  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this fodder listing? This action cannot be undone.')) {
      return;
    }
    try {
      await fodderListingService.deleteListing(token, listingId);
      setSuccessMsg('Fodder listing deleted successfully.');
      loadListings();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to delete listing');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('farmer:fodderMarket.title', 'Fodder Marketplace')}
        description={t('farmer:fodder.subtitle', 'Farmer-to-Farmer fodder marketplace. Buy, sell, and list available green & dry cattle fodder directly with neighboring farmers.')}
        breadcrumbs={[t('common:nav.home', 'Home'), t('common:roles.farmer', 'Farmer'), t('farmer:fodderMarket.title', 'Fodder Marketplace')]}
        backFallback="/farmer/dashboard"
        actions={
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('farmer:fodderMarket.postListingBtn', 'Post Fodder Listing')}</span>
          </button>
        }
      />

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center space-x-2 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-2xl flex items-center space-x-2 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Mode Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === 'browse'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>{t('farmer:fodderMarket.browseTab', 'Browse Fodder Marketplace')} ({marketplaceListings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('my_listings')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === 'my_listings'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t('farmer:fodderMarket.myListingsTab', 'My Fodder Listings')} ({farmerListings.length})</span>
          </button>
        </div>

        {/* Refresh button */}
        <button
          onClick={loadListings}
          disabled={loading}
          className="px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition self-end sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{t('farmer:fodderMarket.refreshListings', 'Refresh Listings')}</span>
        </button>
      </div>

      {/* TAB 1: BROWSE MARKETPLACE */}
      {activeTab === 'browse' && (
        <div className="space-y-6">
          {/* Category Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder={t('farmer:fodderMarket.searchPlaceholder', 'Search by title, description, or village/city...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                {t('common:actions.search', 'Search')}
              </button>
            </form>

            {/* Fodder Category Chips */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center">
                <Filter className="w-3.5 h-3.5 mr-1" /> {t('farmer:fodderMarket.filterType', 'Type')}:
              </span>
              {FODDER_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition ${
                    selectedType === type
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div className="py-12 text-center space-y-2">
              <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-semibold">{t('farmer:fodderMarket.loadingListings', 'Loading fodder listings from nearby farmers...')}</p>
            </div>
          ) : marketplaceListings.length === 0 ? (
            <EmptyState
              title={t('farmer:fodderMarket.noListingsFound', 'No Fodder Listings Available')}
              description={t('farmer:fodderMarket.noListingsDesc', 'No active fodder listings match your search or selected filter. Post a listing to get started!')}
              icon={Wheat}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {marketplaceListings.map((listing) => (
                <div
                  key={listing._id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group"
                >
                  <div>
                    {/* Image Header */}
                    <div className="relative h-44 bg-slate-100 overflow-hidden">
                      {listing.imageUrl ? (
                        <img
                          src={listing.imageUrl}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                          <Wheat className="w-10 h-10 mb-1 text-slate-300" />
                          <span className="text-[11px] font-bold">{t('farmer:fodder.fodderPhoto', 'Fodder Photo')}</span>
                        </div>
                      )}

                      <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-md text-slate-800 border border-white/50 text-[10px] font-extrabold rounded-lg shadow-xs">
                        {listing.fodderType === 'Other' && listing.customFodderType ? listing.customFodderType : listing.fodderType}
                      </span>

                      <span className="absolute top-3 right-3 px-2.5 py-1 bg-emerald-600 text-white font-mono font-bold text-xs rounded-lg shadow-xs">
                        ₹{listing.price} <span className="text-[10px] font-sans font-normal">/ {listing.quantityUnit}</span>
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition line-clamp-1">
                          {listing.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                          {listing.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase block">{t('common:labels.quantity', 'Quantity')}</span>
                          <span className="font-bold text-slate-800">{listing.quantity} {listing.quantityUnit}s</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase block">{t('farmer:fodder.availableFrom', 'Available From')}</span>
                          <span className="font-semibold text-slate-700 flex items-center">
                            <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                            {new Date(listing.availableDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Location & Honest Distance Disclosure */}
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center text-slate-700 font-medium truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
                          <span className="truncate">{listing.location?.area}, {listing.location?.city}</span>
                        </div>

                        {/* Mandated Honest Distance Display */}
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md font-semibold text-[10px]">
                            {t('farmer:fodder.distanceUnavailable', 'Distance unavailable')}
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            {t('farmer:fodder.seller', 'Seller:')} <span className="font-semibold text-slate-700">{listing.farmer?.name || t('common:roles.farmer', 'Farmer')}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="p-4 pt-0">
                    <button
                      onClick={() => setSelectedDetailListing(listing)}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t('farmer:fodder.viewFullDetailsContact', 'View Full Details & Contact')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY FODDER LISTINGS */}
      {activeTab === 'my_listings' && (
        <div className="space-y-6">
          <SectionCard
            title={t('farmer:fodder.myPublishedListings', 'My Published Fodder Listings')}
            subtitle={t('farmer:fodder.myListingsSubtitle', 'Manage your listed fodder inventory, mark items as sold, edit, or deactivate listings.')}
            action={
              <button
                onClick={openCreateModal}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('farmer:fodder.addNewListing', 'Add New Listing')}</span>
              </button>
            }
          >
            {farmerListings.length === 0 ? (
              <EmptyState
                title={t('farmer:fodder.emptyMyListingsTitle', "You Haven't Published Any Fodder Listings Yet")}
                description={t('farmer:fodder.emptyMyListingsDesc', "Click 'Add New Listing' to list green/dry fodder, hay, or silage for neighboring farmers to purchase.")}
                icon={Plus}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {farmerListings.map((listing) => (
                  <div
                    key={listing._id}
                    className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 pr-2">
                          <h4 className="font-bold text-slate-900 text-sm truncate">{listing.title}</h4>
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                            {listing.fodderType}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full shrink-0 ${
                            listing.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : listing.status === 'sold'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {listing.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2">{listing.description}</p>

                      <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex justify-between text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-slate-400 font-sans block">{t('common:labels.price', 'Price')}</span>
                          <span className="font-bold text-emerald-700">₹{listing.price} / {listing.quantityUnit}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-sans block">{t('common:labels.quantity', 'Quantity')}</span>
                          <span className="font-bold text-slate-800">{listing.quantity} {listing.quantityUnit}s</span>
                        </div>
                      </div>
                    </div>

                    {/* Owner Management Buttons */}
                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs gap-2">
                        {listing.status === 'active' ? (
                          <button
                            onClick={() => handleStatusChange(listing._id, 'sold')}
                            className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] transition text-center"
                          >
                            {t('farmer:fodder.markSold', 'Mark Sold')}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(listing._id, 'active')}
                            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition text-center"
                          >
                            {t('farmer:fodder.reactivate', 'Re-activate')}
                          </button>
                        )}

                        <button
                          onClick={() => openEditModal(listing)}
                          className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-bold text-[11px] transition flex items-center space-x-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>{t('common:actions.edit', 'Edit')}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteListing(listing._id)}
                          className="px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold text-[11px] transition"
                          title={t('common:actions.delete', 'Delete Listing')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* CREATE / EDIT FODDER LISTING MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 my-auto max-h-[90vh] overflow-y-auto modal-animate">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingListing ? t('farmer:fodder.editListing', 'Edit Fodder Listing') : t('farmer:fodder.postNewListing', 'Post New Fodder Listing')}
                </h3>
                <p className="text-xs text-slate-500">{t('farmer:fodder.fillListingDetails', 'Fill in details to list fodder for neighboring farmers')}</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Photo Upload Section */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('farmer:fodder.fodderPhotoOptional', 'Fodder Photo (Optional)')}</label>
                <div className="flex items-center space-x-4">
                  {imagePreview ? (
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-300 shrink-0">
                      <img src={imagePreview} alt="Fodder Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview('');
                          setFormData((prev) => ({ ...prev, imageUrl: '' }));
                        }}
                        className="absolute top-1 right-1 bg-slate-900/70 text-white rounded-full p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full p-4 border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition text-center">
                      <Upload className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs font-bold text-slate-700">{t('farmer:fodder.clickSelectFodderPhoto', 'Click to Select Fodder Photo')}</span>
                      <span className="text-[10px] text-slate-400">{t('farmer:fodder.imageLimit5mb', 'JPG, PNG, WEBP (Max 5MB)')}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Title & Fodder Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('farmer:fodder.listingTitle', 'Listing Title *')}</label>
                  <input
                    type="text"
                    required
                    placeholder={t('farmer:fodder.titlePlaceholder', 'e.g. Fresh Green Maize Fodder')}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('farmer:fodder.fodderTypeRequired', 'Fodder Type *')}</label>
                  <select
                    value={formData.fodderType}
                    onChange={(e) => setFormData({ ...formData, fodderType: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    {FODDER_TYPES.filter((t) => t !== 'All').map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.fodderType === 'Other' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('farmer:fodder.specifyCustomType', 'Specify Custom Fodder Type *')}</label>
                  <input
                    type="text"
                    placeholder={t('farmer:fodder.customTypePlaceholder', 'e.g. Organic Mustard Straw')}
                    value={formData.customFodderType}
                    onChange={(e) => setFormData({ ...formData, customFodderType: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('farmer:fodder.fodderDescription', 'Fodder Description *')}</label>
                <textarea
                  rows={3}
                  required
                  placeholder={t('farmer:fodder.descriptionPlaceholder', 'Describe quality, moisture content, feeding suitability for cows/buffaloes...')}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Price, Quantity, Unit, Date */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('farmer:fodder.priceRequired', 'Price (₹) *')}</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="500"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('farmer:fodder.quantityRequired', 'Quantity *')}</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="100"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('farmer:fodder.unitRequired', 'Unit *')}</label>
                  <select
                    value={formData.quantityUnit}
                    onChange={(e) => setFormData({ ...formData, quantityUnit: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="kg">kg</option>
                    <option value="quintal">{t('farmer:fodder.quintal', 'quintal')}</option>
                    <option value="ton">{t('farmer:fodder.ton', 'ton')}</option>
                    <option value="bundle">{t('farmer:fodder.bundle', 'bundle')}</option>
                    <option value="acre">{t('farmer:fodder.acre', 'acre')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('farmer:fodder.availableDate', 'Available Date *')}</label>
                  <input
                    type="date"
                    required
                    value={formData.availableDate}
                    onChange={(e) => setFormData({ ...formData, availableDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Location Information */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-slate-800 flex items-center">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 mr-1" /> {t('farmer:fodder.locationInfo', 'Location Information')}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t('farmer:fodder.villageArea', 'Village / Area *')}</label>
                    <input
                      type="text"
                      required
                      placeholder={t('farmer:fodder.villagePlaceholder', 'e.g. Rampur Village')}
                      value={formData.locationArea}
                      onChange={(e) => setFormData({ ...formData, locationArea: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t('farmer:fodder.cityTown', 'City / Town *')}</label>
                    <input
                      type="text"
                      required
                      placeholder={t('farmer:fodder.cityPlaceholder', 'e.g. Anand')}
                      value={formData.locationCity}
                      onChange={(e) => setFormData({ ...formData, locationCity: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('farmer:fodder.contactPhone', 'Contact Phone Number')}</label>
                <input
                  type="text"
                  placeholder={t('farmer:fodder.phonePlaceholder', 'e.g. +91 9876543210')}
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl"
                >
                  {t('common:actions.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t('farmer:fodder.savingListing', 'Saving Listing...')}</span>
                    </>
                  ) : (
                    <span>{editingListing ? t('farmer:fodder.updateListing', 'Update Listing') : t('farmer:fodder.publishListing', 'Publish Listing')}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL LISTING DETAIL & CONTACT MODAL */}
      {selectedDetailListing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-auto max-h-[90vh] overflow-y-auto modal-animate">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                  {selectedDetailListing.fodderType}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedDetailListing.title}</h3>
              </div>
              <button
                onClick={() => setSelectedDetailListing(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* High Res Image */}
            <div className="h-56 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center">
              {selectedDetailListing.imageUrl ? (
                <img
                  src={selectedDetailListing.imageUrl}
                  alt={selectedDetailListing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-slate-400">
                  <Wheat className="w-12 h-12 mx-auto mb-1 text-slate-300" />
                  <span className="text-xs font-bold">{t('farmer:fodder.noImageAttached', 'No Image Attached')}</span>
                </div>
              )}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">{t('common:labels.price', 'Price')}</span>
                <span className="font-bold text-emerald-700 text-base font-mono">
                  ₹{selectedDetailListing.price} / {selectedDetailListing.quantityUnit}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">{t('farmer:fodder.availableStock', 'Available Stock')}</span>
                <span className="font-bold text-slate-800 text-sm">
                  {selectedDetailListing.quantity} {selectedDetailListing.quantityUnit}s
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">{t('farmer:fodder.availableDate', 'Available Date *')}</span>
                <span className="font-semibold text-slate-700">
                  {new Date(selectedDetailListing.availableDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">{t('farmer:fodder.distance', 'Distance')}</span>
                <span className="font-semibold text-slate-500">{t('farmer:fodder.distanceUnavailable', 'Distance unavailable')}</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-800 block">{t('farmer:fodder.fodderDetailsQuality', 'Fodder Details & Quality:')}</span>
              <p className="text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                {selectedDetailListing.description}
              </p>
            </div>

            {/* Location */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-800 flex items-center">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 mr-1" /> {t('farmer:fodder.pickupLocation', 'Pickup Location:')}
              </span>
              <p className="text-slate-700 font-medium pl-4">
                {selectedDetailListing.location?.area}, {selectedDetailListing.location?.city}
                {selectedDetailListing.location?.district ? `, ${selectedDetailListing.location?.district}` : ''}
              </p>
            </div>

            {/* Seller Contact Card */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">{t('farmer:fodder.sellerFarmer', 'Seller Farmer')}</span>
                  <p className="text-sm font-bold text-slate-900">{selectedDetailListing.farmer?.name || 'Farmer Seller'}</p>
                  <p className="text-xs text-slate-600 font-mono">{selectedDetailListing.contactPhone || selectedDetailListing.farmer?.phone || 'Phone unavailable'}</p>
                </div>
              </div>

              {(selectedDetailListing.contactPhone || selectedDetailListing.farmer?.phone) && (
                <a
                  href={`tel:${selectedDetailListing.contactPhone || selectedDetailListing.farmer?.phone}`}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{t('farmer:fodder.callSeller', 'Call Seller')}</span>
                </a>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedDetailListing(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                {t('common:actions.close', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
