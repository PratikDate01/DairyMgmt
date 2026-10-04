import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dairyFarmerService } from '../../services/dairyFarmerService';
import { paymentService } from '../../services/paymentService';
import { PageHeader } from '../../components/common/PageHeader';
import { SectionCard } from '../../components/common/SectionCard';
import { StatCard } from '../../components/common/StatCard';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Wallet,
  User,
  CheckSquare,
  Square,
  PlusCircle,
  History,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Filter,
  CreditCard,
  XCircle,
  Eye
} from 'lucide-react';

export const Payments = () => {
  const { token } = useAuth();

  // Active Farmers
  const [activeFarmers, setActiveFarmers] = useState([]);
  const [loadingFarmers, setLoadingFarmers] = useState(true);

  // Active Tab: 'new' or 'history'
  const [activeTab, setActiveTab] = useState('new');

  // Settlement Entry State
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [unpaidCollections, setUnpaidCollections] = useState([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState([]);
  const [loadingUnpaid, setLoadingUnpaid] = useState(false);

  // Form input fields
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Payment History State
  const [payments, setPayments] = useState([]);
  const [metrics, setMetrics] = useState({ totalGross: 0, totalPaid: 0, totalPending: 0 });
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [filterFarmerId, setFilterFarmerId] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Selected payment details modal
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState(null);

  // Global Messages
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch Connected Farmers
  const fetchFarmers = useCallback(async () => {
    try {
      setLoadingFarmers(true);
      const connections = await dairyFarmerService.getDairyFarmers(token);
      const active = connections
        .filter((c) => c.status === 'active' && c.farmer)
        .map((c) => c.farmer);
      setActiveFarmers(active);
      if (active.length > 0 && !selectedFarmerId) {
        setSelectedFarmerId(active[0]._id);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch connected farmers');
    } finally {
      setLoadingFarmers(false);
    }
  }, [token, selectedFarmerId]);

  // Fetch Payment History
  const fetchHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const res = await paymentService.getDairyOwnerPayments(token, {
        farmerId: filterFarmerId !== 'all' ? filterFarmerId : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined
      });
      setPayments(res.payments || []);
      if (res.metrics) {
        setMetrics(res.metrics);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  }, [token, filterFarmerId, filterStatus]);

  useEffect(() => {
    fetchFarmers();
    fetchHistory();
  }, [fetchFarmers, fetchHistory]);

  // Fetch Unpaid Collections for selected farmer & dates
  const handleFetchUnpaid = async (e) => {
    if (e) e.preventDefault();
    if (!selectedFarmerId) {
      setError('Please select a farmer');
      return;
    }

    try {
      setLoadingUnpaid(true);
      setError('');
      const res = await paymentService.getUnpaidCollections(
        selectedFarmerId,
        startDate,
        endDate,
        token
      );
      setUnpaidCollections(res.collections || []);
      // Select all by default
      const allIds = (res.collections || []).map((c) => c._id);
      setSelectedCollectionIds(allIds);

      // Default paid amount to total gross
      setPaidAmount(res.totalUnsettledAmount ? res.totalUnsettledAmount.toString() : '0');
    } catch (err) {
      setError(err.message || 'Failed to fetch unpaid collections');
      setUnpaidCollections([]);
      setSelectedCollectionIds([]);
      setPaidAmount('0');
    } finally {
      setLoadingUnpaid(false);
    }
  };

  // Toggle selection of a collection item
  const toggleSelectCollection = (id) => {
    setSelectedCollectionIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];

      // Auto recalculate default paid amount based on newly selected collections
      const selectedDocs = unpaidCollections.filter((c) => next.includes(c._id));
      const newGross = selectedDocs.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
      setPaidAmount((Math.round(newGross * 100) / 100).toString());

      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedCollectionIds.length === unpaidCollections.length) {
      setSelectedCollectionIds([]);
      setPaidAmount('0');
    } else {
      const allIds = unpaidCollections.map((c) => c._id);
      setSelectedCollectionIds(allIds);
      const newGross = unpaidCollections.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
      setPaidAmount((Math.round(newGross * 100) / 100).toString());
    }
  };

  // Calculated preview metrics for current selection
  const selectedDocs = useMemo(() => {
    return unpaidCollections.filter((c) => selectedCollectionIds.includes(c._id));
  }, [unpaidCollections, selectedCollectionIds]);

  const grossAmountPreview = useMemo(() => {
    const sum = selectedDocs.reduce((acc, c) => acc + (c.totalAmount || 0), 0);
    return Math.round(sum * 100) / 100;
  }, [selectedDocs]);

  const totalQuantityPreview = useMemo(() => {
    const sum = selectedDocs.reduce((acc, c) => acc + (c.quantityLiters || 0), 0);
    return Math.round(sum * 10) / 10;
  }, [selectedDocs]);

  const remainingAmountPreview = useMemo(() => {
    const paid = parseFloat(paidAmount) || 0;
    const rem = grossAmountPreview - paid;
    return rem > 0 ? Math.round(rem * 100) / 100 : 0;
  }, [grossAmountPreview, paidAmount]);

  // Handle Form Submission -> Open Confirmation Modal
  const handleOpenConfirmation = (e) => {
    e.preventDefault();
    setError('');

    if (selectedCollectionIds.length === 0) {
      setError('Please select at least one milk collection record for settlement.');
      return;
    }

    const paid = parseFloat(paidAmount);
    if (isNaN(paid) || paid < 0) {
      setError('Please enter a valid non-negative paid amount.');
      return;
    }

    if (paid > grossAmountPreview) {
      setError(`Paid amount (₹${paid}) cannot exceed total settlement gross amount (₹${grossAmountPreview}).`);
      return;
    }

    setShowConfirmModal(true);
  };

  // Execute Payment Submission
  const handleConfirmSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');

      // Derived period start/end from selected collections if not explicitly set
      let pStart = startDate;
      let pEnd = endDate;

      if (!pStart && selectedDocs.length > 0) {
        const sortedDates = [...selectedDocs].sort(
          (a, b) => new Date(a.collectionDate) - new Date(b.collectionDate)
        );
        pStart = sortedDates[0].collectionDate.split('T')[0];
      }

      if (!pEnd && selectedDocs.length > 0) {
        const sortedDates = [...selectedDocs].sort(
          (a, b) => new Date(b.collectionDate) - new Date(a.collectionDate)
        );
        pEnd = sortedDates[0].collectionDate.split('T')[0];
      }

      const res = await paymentService.createPayment(
        {
          farmerId: selectedFarmerId,
          collectionIds: selectedCollectionIds,
          paymentPeriodStart: pStart || new Date().toISOString().split('T')[0],
          paymentPeriodEnd: pEnd || new Date().toISOString().split('T')[0],
          paidAmount: parseFloat(paidAmount),
          paymentMethod,
          paymentDate,
          referenceNumber,
          remarks
        },
        token
      );

      setSuccessMsg(res.message || 'Payment settlement created successfully!');
      setShowConfirmModal(false);

      // Reset form
      setUnpaidCollections([]);
      setSelectedCollectionIds([]);
      setPaidAmount('0');
      setReferenceNumber('');
      setRemarks('');

      // Refresh history
      await fetchHistory();
      setActiveTab('history');
    } catch (err) {
      setError(err.message || 'Failed to create payment settlement.');
      setShowConfirmModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Settlement & Ledger"
        description="Calculate settlements, issue payments, and manage farmer payment history."
        breadcrumbs={['Home', 'Dairy Console', 'Payments']}
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-800 font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-green-600 hover:text-green-800 font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs Header */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('new')}
          className={`py-3 px-5 font-semibold text-xs border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'new'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Settlement Entry</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`py-3 px-5 font-semibold text-xs border-b-2 flex items-center space-x-2 transition ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Settlement Ledger History ({payments.length})</span>
        </button>
      </div>

      {/* TAB 1: NEW SETTLEMENT ENTRY */}
      {activeTab === 'new' && (
        <div className="space-y-6">
          <SectionCard
            title="Step 1: Select Farmer & Date Range"
            subtitle="Fetch unsettled milk collection records"
          >
            {loadingFarmers ? (
              <div className="py-6 text-center text-slate-500 text-sm">Loading connected farmers...</div>
            ) : activeFarmers.length === 0 ? (
              <EmptyState
                title="No Active Farmers"
                description="Connect with farmers first before recording payment settlements."
                icon={User}
              />
            ) : (
              <form onSubmit={handleFetchUnpaid} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-xs font-semibold text-slate-700">Select Active Farmer *</label>
                  <select
                    value={selectedFarmerId}
                    onChange={(e) => setSelectedFarmerId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  >
                    {activeFarmers.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.name} ({f.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">From Date (Optional)</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">To Date (Optional)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loadingUnpaid}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingUnpaid ? 'animate-spin' : ''}`} />
                    <span>{loadingUnpaid ? 'Fetching...' : 'Fetch Unpaid Records'}</span>
                  </button>
                </div>
              </form>
            )}
          </SectionCard>

          {/* Step 2: Unpaid Records List & Settlement Form */}
          {unpaidCollections.length > 0 && (
            <form onSubmit={handleOpenConfirmation} className="space-y-6">
              <SectionCard
                title={`Step 2: Unsettled Collections (${unpaidCollections.length})`}
                subtitle="Select collections to include in this settlement"
                action={
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1"
                  >
                    {selectedCollectionIds.length === unpaidCollections.length ? (
                      <>
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                        <span>Deselect All</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4 text-slate-400" />
                        <span>Select All ({unpaidCollections.length})</span>
                      </>
                    )}
                  </button>
                }
              >
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {unpaidCollections.map((c) => {
                    const isSelected = selectedCollectionIds.includes(c._id);
                    return (
                      <div
                        key={c._id}
                        onClick={() => toggleSelectCollection(c._id)}
                        className={`p-3 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-300 text-slate-900 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 shrink-0" />
                          )}
                          <div>
                            <span className="font-mono font-bold text-slate-800">
                              {new Date(c.collectionDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-700">
                              {c.session}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <span className="font-mono text-slate-600">{c.quantityLiters} L</span>
                          <span className="font-mono text-slate-500">Fat: {c.fatPercentage}%</span>
                          <span className="font-mono text-slate-500">₹{c.ratePerLiter}/L</span>
                          <span className="font-mono font-bold text-emerald-700 text-sm">
                            ₹{c.totalAmount?.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>

              {/* Live Preview & Payment Input Form */}
              <SectionCard title="Step 3: Settlement & Payment Details" subtitle="Review authoritative totals and payment mode">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Authoritative Calculation Preview */}
                  <div className="lg:col-span-1 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Settlement Preview
                    </span>

                    <div className="flex justify-between text-xs py-1 border-b border-slate-200">
                      <span className="text-slate-600">Selected Records</span>
                      <span className="font-bold text-slate-900">{selectedCollectionIds.length} Records</span>
                    </div>

                    <div className="flex justify-between text-xs py-1 border-b border-slate-200">
                      <span className="text-slate-600">Total Milk Volume</span>
                      <span className="font-mono font-bold text-slate-900">{totalQuantityPreview} Liters</span>
                    </div>

                    <div className="flex justify-between text-xs py-1 border-b border-slate-200">
                      <span className="text-slate-600 font-semibold">Gross Total Amount</span>
                      <span className="font-mono font-bold text-slate-900 text-base">₹{grossAmountPreview.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-xs py-1 border-b border-slate-200">
                      <span className="text-emerald-700 font-semibold">Amount Being Paid</span>
                      <span className="font-mono font-bold text-emerald-700 text-base">
                        ₹{(parseFloat(paidAmount) || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs py-1">
                      <span className="text-amber-800 font-semibold">Remaining Balance</span>
                      <span className="font-mono font-bold text-amber-800 text-base">
                        ₹{remainingAmountPreview.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Input Controls */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Amount Being Paid */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-semibold text-slate-700">Amount Paid (₹) *</label>
                          <button
                            type="button"
                            onClick={() => setPaidAmount(grossAmountPreview.toString())}
                            className="text-[10px] text-blue-600 font-bold hover:underline"
                          >
                            Pay Full (₹{grossAmountPreview})
                          </button>
                        </div>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={grossAmountPreview}
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          required
                        />
                      </div>

                      {/* Payment Method */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Payment Method *</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="cash">Cash Payment</option>
                          <option value="upi">UPI / GPay / PhonePe</option>
                          <option value="bankTransfer">Bank Transfer / NEFT</option>
                          <option value="other">Other Method</option>
                        </select>
                      </div>

                      {/* Payment Date */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Payment Date *</label>
                        <input
                          type="date"
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                          required
                        />
                      </div>

                      {/* Reference Number */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Ref / UTR / Transaction No.</label>
                        <input
                          type="text"
                          placeholder="e.g. UTR1298401924"
                          value={referenceNumber}
                          onChange={(e) => setReferenceNumber(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Remarks */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Remarks / Notes</label>
                      <input
                        type="text"
                        placeholder="e.g. Weekly settlement for Oct 1st week"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={selectedCollectionIds.length === 0}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition disabled:opacity-50 flex items-center space-x-1.5"
                      >
                        <Wallet className="w-4 h-4" />
                        <span>Review & Confirm Settlement</span>
                      </button>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </form>
          )}

          {unpaidCollections.length === 0 && selectedFarmerId && !loadingUnpaid && (
            <EmptyState
              title="No Unsettled Collections"
              description="This farmer has no pending unpaid milk collections for the selected filter."
              icon={CheckCircle2}
            />
          )}
        </div>
      )}

      {/* TAB 2: SETTLEMENT LEDGER HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Total Settlement Volume"
              value={`₹ ${metrics.totalGross.toFixed(2)}`}
              icon={Wallet}
              badgeText="All Settled Periods"
              badgeType="neutral"
            />
            <StatCard
              title="Total Paid Out"
              value={`₹ ${metrics.totalPaid.toFixed(2)}`}
              icon={CheckCircle2}
              badgeText="Disbursed Amount"
              badgeType="success"
            />
            <StatCard
              title="Pending Outstanding"
              value={`₹ ${metrics.totalPending.toFixed(2)}`}
              icon={CreditCard}
              badgeText={metrics.totalPending > 0 ? 'Balance Unpaid' : 'Clear Ledger'}
              badgeType={metrics.totalPending > 0 ? 'amber' : 'success'}
            />
          </div>

          <SectionCard
            title="Payment Settlement History"
            subtitle="Past settlement ledger records"
            action={
              <button
                onClick={fetchHistory}
                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                title="Refresh History"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            }
          >
            {/* Filter Bar */}
            {activeFarmers.length > 0 && (
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span>Filter History:</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={filterFarmerId}
                    onChange={(e) => setFilterFarmerId(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="all">All Farmers</option>
                    {activeFarmers.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="paid">Paid</option>
                    <option value="partiallyPaid">Partially Paid</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            )}

            {loadingHistory ? (
              <div className="py-8 text-center text-slate-500 text-sm">Loading settlement ledger...</div>
            ) : payments.length === 0 ? (
              <EmptyState
                title="No Settlement Records Found"
                description="No payment settlement history matches the selected filters."
                icon={History}
              />
            ) : (
              <div>
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Payment Date</th>
                        <th className="py-3 px-4">Farmer</th>
                        <th className="py-3 px-4">Period</th>
                        <th className="py-3 px-4 text-right">Gross Total</th>
                        <th className="py-3 px-4 text-right">Paid Amount</th>
                        <th className="py-3 px-4 text-right">Remaining</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {payments.map((p) => (
                        <tr key={p._id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-mono font-medium text-slate-900">
                            {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{p.farmer?.name}</td>
                          <td className="py-3 px-4 text-[11px] text-slate-500 font-mono">
                            {new Date(p.paymentPeriodStart).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} – {new Date(p.paymentPeriodEnd).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">₹{p.grossAmount?.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">₹{p.paidAmount?.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-amber-800">₹{p.remainingAmount?.toFixed(2)}</td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                p.paymentStatus === 'paid'
                                  ? 'bg-green-100 text-green-800'
                                  : p.paymentStatus === 'partiallyPaid'
                                  ? 'bg-amber-100 text-amber-800'
                                  : p.paymentStatus === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {p.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => setSelectedPaymentDetail(p)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Cards */}
                <div className="md:hidden space-y-3">
                  {payments.map((p) => (
                    <div key={p._id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{p.farmer?.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.paymentStatus === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : p.paymentStatus === 'partiallyPaid'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {p.paymentStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-200 text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Gross</span>
                          <span className="font-mono font-bold text-slate-800">₹{p.grossAmount?.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Paid</span>
                          <span className="font-mono font-bold text-emerald-700">₹{p.paidAmount?.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Balance</span>
                          <span className="font-mono font-bold text-amber-800">₹{p.remainingAmount?.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 font-mono">
                        <span>
                          {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                        <button
                          onClick={() => setSelectedPaymentDetail(p)}
                          className="text-blue-600 font-bold hover:underline"
                        >
                          Details →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <span>Confirm Payment Settlement</span>
              </h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Selected Farmer:</span>
                <span className="font-bold text-slate-900">
                  {activeFarmers.find((f) => f._id === selectedFarmerId)?.name}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Collections Settled:</span>
                <span className="font-bold text-slate-900">{selectedCollectionIds.length} Records</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Gross Settlement:</span>
                <span className="font-bold text-slate-900">₹{grossAmountPreview.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-emerald-700 font-bold">Amount Being Paid:</span>
                <span className="font-bold text-emerald-700 text-sm">
                  ₹{(parseFloat(paidAmount) || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-amber-800 font-bold">Remaining Balance:</span>
                <span className="font-bold text-amber-800 text-sm">₹{remainingAmountPreview.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Please double check details before confirming. Authoritative calculation will be finalized on the backend.
            </p>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                <span>{submitting ? 'Creating...' : 'Confirm Payment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedPaymentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Settlement Record Details</h3>
              <button onClick={() => setSelectedPaymentDetail(null)} className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700 font-mono">
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Farmer:</span>
                <span className="font-bold text-slate-900">{selectedPaymentDetail.farmer?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Payment Date:</span>
                <span>{new Date(selectedPaymentDetail.paymentDate).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Payment Method:</span>
                <span className="capitalize font-semibold">{selectedPaymentDetail.paymentMethod}</span>
              </div>
              {selectedPaymentDetail.referenceNumber && (
                <div className="flex justify-between py-1 border-b">
                  <span className="text-slate-500">Ref / UTR:</span>
                  <span>{selectedPaymentDetail.referenceNumber}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-500">Gross Amount:</span>
                <span className="font-bold">₹{selectedPaymentDetail.grossAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-emerald-700 font-bold">Paid Amount:</span>
                <span className="font-bold text-emerald-700">₹{selectedPaymentDetail.paidAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-amber-800 font-bold">Remaining Balance:</span>
                <span className="font-bold text-amber-800">₹{selectedPaymentDetail.remainingAmount?.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedPaymentDetail(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
