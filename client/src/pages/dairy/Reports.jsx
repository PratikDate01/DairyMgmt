import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { reportService } from '../../services/reportService';
import { PageHeader } from '../../components/common/PageHeader';
import { SectionCard } from '../../components/common/SectionCard';
import { StatCard } from '../../components/common/StatCard';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Milk,
  Wallet,
  Users,
  Calendar,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  CreditCard
} from 'lucide-react';

export const DairyOwnerReports = () => {
  const { t } = useTranslation(['dairyOwner', 'common']);
  const { token } = useAuth();

  // Date Filter State
  const [preset, setPreset] = useState('thisMonth');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Data States
  const [milkSummary, setMilkSummary] = useState({
    totalCollectionRecords: 0,
    totalMilkQuantity: 0,
    averageMilkQuantity: 0,
    totalMilkValue: 0,
    averageFat: 0,
    averageRate: 0
  });

  const [paymentSummary, setPaymentSummary] = useState({
    totalPaymentRecords: 0,
    totalGrossAmount: 0,
    totalPaidAmount: 0,
    totalOutstandingAmount: 0,
    paidCount: 0,
    partiallyPaidCount: 0,
    pendingCount: 0
  });

  const [farmerSummaries, setFarmerSummaries] = useState([]);
  const [dateWiseMilk, setDateWiseMilk] = useState([]);
  const [dateWisePayments, setDateWisePayments] = useState([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const queryParams = { preset };
      if (preset === 'custom') {
        if (!customStart || !customEnd) {
          setLoading(false);
          return;
        }
        queryParams.startDate = customStart;
        queryParams.endDate = customEnd;
      }

      const [milkRes, payRes, farmerRes, dateMilkRes, datePayRes] = await Promise.all([
        reportService.getMilkSummary(token, queryParams),
        reportService.getPaymentSummary(token, queryParams),
        reportService.getFarmerSummary(token),
        reportService.getDateWiseMilk(token, queryParams),
        reportService.getDateWisePayments(token, queryParams)
      ]);

      if (milkRes.summary) setMilkSummary(milkRes.summary);
      if (payRes.summary) setPaymentSummary(payRes.summary);
      if (farmerRes.farmers) setFarmerSummaries(farmerRes.farmers);
      if (dateMilkRes.records) setDateWiseMilk(dateMilkRes.records);
      if (datePayRes.records) setDateWisePayments(datePayRes.records);
    } catch (err) {
      setError(err.message || 'Failed to generate report analytics');
    } finally {
      setLoading(false);
    }
  }, [token, preset, customStart, customEnd]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleApplyCustomFilter = (e) => {
    e.preventDefault();
    if (!customStart || !customEnd) {
      setError('Please select both start and end dates for custom date range');
      return;
    }
    if (new Date(customStart) > new Date(customEnd)) {
      setError('Start date cannot be later than end date');
      return;
    }
    fetchReports();
  };

  // Max value for CSS progress bars
  const maxDailyMilk = dateWiseMilk.length > 0
    ? Math.max(...dateWiseMilk.map((d) => d.totalLiters), 1)
    : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('dairyOwner:reports.title', 'Reports & Summary Analytics')}
        description={t('dairyOwner:reports.subtitle', 'Comprehensive intelligence on milk collection intake, farmer performance, and payment settlements.')}
        breadcrumbs={[t('common:nav.home', 'Home'), t('common:roles.dairyOwner', 'Dairy Owner'), t('dairyOwner:reports.title', 'Reports')]}
        actions={
          <button
            onClick={fetchReports}
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('dairyOwner:reportsPage.refreshAnalytics', 'Refresh Analytics')}</span>
          </button>
        }
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

      {/* Date Filter Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>{t('dairyOwner:reportsPage.reportPeriod', 'Report Time Period')}:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'today', label: t('common:datePresets.today', 'Today') },
              { id: 'last7days', label: t('common:datePresets.last7days', 'Last 7 Days') },
              { id: 'thisMonth', label: t('common:datePresets.thisMonth', 'This Month') },
              { id: 'lastMonth', label: t('common:datePresets.lastMonth', 'Last Month') },
              { id: 'custom', label: t('farmer:milkCollections.customRange', 'Custom Range') }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setPreset(btn.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  preset === btn.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {preset === 'custom' && (
          <form onSubmit={handleApplyCustomFilter} className="flex flex-wrap items-end gap-3 pt-2 border-t border-slate-100">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600">{t('dairyOwner:reports.startDate', 'Start Date')}</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600">{t('dairyOwner:reports.endDate', 'End Date')}</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="py-1.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition"
            >
              Apply Filter
            </button>
          </form>
        )}
      </div>

      {/* High-Level Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dairyOwner:reportsPage.volumeIntake', 'Total Milk Intake')}
          value={loading ? '...' : `${milkSummary.totalMilkQuantity.toFixed(1)} L`}
          icon={Milk}
          badgeText={`${milkSummary.totalCollectionRecords} Intake Logs`}
          badgeType="success"
        />
        <StatCard
          title={t('dairyOwner:reportsPage.totalValuation', 'Total Milk Value')}
          value={loading ? '...' : `₹ ${milkSummary.totalMilkValue.toFixed(2)}`}
          icon={TrendingUp}
          badgeText={`Avg Rate ₹${milkSummary.averageRate}/L`}
          badgeType="neutral"
        />
        <StatCard
          title={t('dairyOwner:reports.totalDisbursedPaid', 'Total Disbursed Paid')}
          value={loading ? '...' : `₹ ${paymentSummary.totalPaidAmount.toFixed(2)}`}
          icon={Wallet}
          badgeText={`${paymentSummary.paidCount} Paid Settlements`}
          badgeType="success"
        />
        <StatCard
          title={t('dairyOwner:reports.pendingOutstanding', 'Pending Outstanding')}
          value={loading ? '...' : `₹ ${paymentSummary.totalOutstandingAmount.toFixed(2)}`}
          icon={CreditCard}
          badgeText={paymentSummary.totalOutstandingAmount > 0 ? t('dairyOwner:reports.unsettledBalance', 'Unsettled Balance') : t('dairyOwner:reports.clearLedger', 'Clear Ledger')}
          badgeType={paymentSummary.totalOutstandingAmount > 0 ? 'amber' : 'success'}
        />
      </div>

      {/* Milk Collection Analytics */}
      <SectionCard title={t('dairyOwner:reports.milkPerformanceTitle', 'Milk Collection Performance Summary')} subtitle={t('dairyOwner:reports.milkPerformanceSubtitle', 'Key metrics on volume, fat content, and rate averages')}>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 py-2">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{t('dairyOwner:reports.totalVolume', 'Total Volume')}</span>
            <span className="font-mono font-bold text-slate-900 text-base">{milkSummary.totalMilkQuantity} L</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{t('dairyOwner:reports.averageShiftIntake', 'Average Shift Intake')}</span>
            <span className="font-mono font-bold text-slate-900 text-base">{milkSummary.averageMilkQuantity} L</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{t('dairyOwner:reports.averageFatPercent', 'Average Fat %')}</span>
            <span className="font-mono font-bold text-blue-700 text-base">{milkSummary.averageFat}%</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{t('dairyOwner:reports.averageRate', 'Average Rate')}</span>
            <span className="font-mono font-bold text-emerald-700 text-base">₹{milkSummary.averageRate}/L</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{t('dairyOwner:reports.totalValuation', 'Total Valuation')}</span>
            <span className="font-mono font-bold text-emerald-700 text-base">₹{milkSummary.totalMilkValue.toFixed(2)}</span>
          </div>
        </div>
      </SectionCard>

      {/* Farmer Performance Breakdown Table */}
      <SectionCard
        title={t('dairyOwner:reports.farmerPerformanceTitle', 'Connected Farmer Performance Summary')}
        subtitle={t('dairyOwner:reports.farmerPerformanceSubtitle', 'Individual supplier contributions, valuation, payments, and outstanding balances')}
      >
        {loading ? (
          <div className="py-6 text-center text-slate-500 text-xs">{t('dairyOwner:reports.loadingFarmerAnalytics', 'Loading farmer analytics...')}</div>
        ) : farmerSummaries.length === 0 ? (
          <EmptyState
            title={t('dairyOwner:reports.noFarmerActivity', 'No Farmer Activity Found')}
            description={t('dairyOwner:reports.noFarmerActivityDesc', 'No active connected farmers have recorded collection history in this system.')}
            icon={Users}
          />
        ) : (
          <div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">{t('common:roles.farmer', 'Farmer')}</th>
                    <th className="py-3 px-4 text-right">{t('dairyOwner:reports.milkQuantity', 'Milk Quantity')}</th>
                    <th className="py-3 px-4 text-right">{t('dairyOwner:reports.milkValuation', 'Milk Valuation')}</th>
                    <th className="py-3 px-4 text-right">{t('dairyOwner:reports.totalPaid', 'Total Paid')}</th>
                    <th className="py-3 px-4 text-right">{t('dairyOwner:reports.outstanding', 'Outstanding')}</th>
                    <th className="py-3 px-4 text-center">{t('dairyOwner:reports.collectionsCount', 'Collections')}</th>
                    <th className="py-3 px-4 text-center">{t('dairyOwner:reports.lastIntakeDate', 'Last Intake Date')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {farmerSummaries.map((item) => (
                    <tr key={item.farmer._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.farmer.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.farmer.phone}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                        {item.totalMilkQuantity} L
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                        ₹{item.totalMilkValue.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        ₹{item.totalPaid.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-800">
                        ₹{item.outstandingAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {item.collectionCount} Logs
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-500">
                        {item.lastCollectionDate
                          ? new Date(item.lastCollectionDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View Cards */}
            <div className="md:hidden space-y-3">
              {farmerSummaries.map((item) => (
                <div key={item.farmer._id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">{item.farmer.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">{item.farmer.phone}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-200 text-center font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-sans">{t('dairyOwner:reports.supplied', 'Supplied')}</span>
                      <span className="font-bold text-slate-800">{item.totalMilkQuantity} L</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-sans">{t('dairyOwner:reports.paid', 'Paid')}</span>
                      <span className="font-bold text-emerald-700">₹{item.totalPaid.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-sans">{t('dairyOwner:reports.pending', 'Pending')}</span>
                      <span className="font-bold text-amber-800">₹{item.outstandingAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* Date-Wise Milk Collection History */}
      <SectionCard title={t('dairyOwner:reports.dateWiseMilkTitle', 'Date-Wise Milk Collection History')} subtitle={t('dairyOwner:reports.dateWiseMilkSubtitle', 'Aggregated daily collection metrics')}>
        {loading ? (
          <div className="py-6 text-center text-slate-500 text-xs">{t('dairyOwner:reports.loadingDateWise', 'Loading date-wise data...')}</div>
        ) : dateWiseMilk.length === 0 ? (
          <EmptyState title={t('dairyOwner:reports.noDailyCollection', 'No Daily Collection Data')} description={t('dairyOwner:reports.noDailyCollectionDesc', 'No collection logs found for selected period.')} icon={Milk} />
        ) : (
          <div className="space-y-3">
            {dateWiseMilk.map((d) => {
              const barWidth = Math.min(100, Math.round((d.totalLiters / maxDailyMilk) * 100));
              return (
                <div key={d.date} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-slate-900">{d.date}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">
                        {d.collectionCount} Logs
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 font-mono">
                      <span className="text-slate-500">Fat: {d.averageFat}%</span>
                      <span className="text-slate-500">₹{d.averageRate}/L</span>
                      <span className="font-bold text-slate-900">{d.totalLiters} L</span>
                      <span className="font-bold text-emerald-700">₹{d.totalValue.toFixed(2)}</span>
                    </div>
                  </div>
                  {/* Visual Progress Indicator */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${barWidth}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Date-Wise Payment Settlement History */}
      <SectionCard title={t('dairyOwner:reports.dateWisePaymentTitle', 'Date-Wise Payment Settlement History')} subtitle={t('dairyOwner:reports.dateWisePaymentSubtitle', 'Daily aggregated payment disbursements and remaining balances')}>
        {loading ? (
          <div className="py-6 text-center text-slate-500 text-xs">{t('dairyOwner:reports.loadingPaymentRecords', 'Loading payment records...')}</div>
        ) : dateWisePayments.length === 0 ? (
          <EmptyState title={t('dairyOwner:reports.noSettlementStatements', 'No Settlement Statements')} description={t('dairyOwner:reports.noSettlementStatementsDesc', 'No payment settlements found for selected period.')} icon={Wallet} />
        ) : (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">{t('common:labels.date', 'Date')}</th>
                  <th className="py-3 px-4 text-center">{t('dairyOwner:reports.settlementsIssued', 'Settlements Issued')}</th>
                  <th className="py-3 px-4 text-right">{t('dairyOwner:reports.grossTotal', 'Gross Total')}</th>
                  <th className="py-3 px-4 text-right">{t('dairyOwner:reports.paidDisbursed', 'Paid Disbursed')}</th>
                  <th className="py-3 px-4 text-right">{t('dairyOwner:reports.outstandingBalance', 'Outstanding Balance')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-mono">
                {dateWisePayments.map((p) => (
                  <tr key={p.date} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{p.date}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 font-bold border border-blue-100">
                        {p.paymentCount} Payments
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">₹{p.grossAmount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">₹{p.paidAmount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-amber-800">₹{p.outstandingAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
};
