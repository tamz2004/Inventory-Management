import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Filter,
  AlertTriangle,
  TrendingUp,
  Package,
  Calendar as CalendarIcon,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { getDashboardSummary, DashboardSummary, getMovementsReport, getLowStockReport, exportReportToExcel, ApiMovement, ApiProduct, ReportSummary, PaginationMeta } from '../services/inventoryApi';

const ReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filterType, setFilterType] = useState<'INBOUND' | 'OUTBOUND' | ''>('');

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);
  const [movements, setMovements] = useState<ApiMovement[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<ApiProduct[]>([]);

  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingReport, setIsLoadingReport] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Overall stats (top cards)
  useEffect(() => {
    const fetch = async () => {
      try {
        setIsLoadingStats(true);
        const [dash, low] = await Promise.all([
          getDashboardSummary(),
          getLowStockReport(),
        ]);
        setSummary(dash.summary);
        setLowStockProducts(low.products);
      } catch {
        // silent
      } finally {
        setIsLoadingStats(false);
      }
    };
    fetch();
  }, []);

  const fetchReport = useCallback(async () => {
    try {
      setIsLoadingReport(true);
      const result = await getMovementsReport({
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
        type: filterType || undefined,
        limit: 50,
      });
      setMovements(result.movements);
      setPagination(result.pagination);
      setReportSummary(result.summary);
    } catch {
      // silent
    } finally {
      setIsLoadingReport(false);
    }
  }, [dateRange.start, dateRange.end, filterType]);

  // Load on mount only
  useEffect(() => { fetchReport(); }, []); // eslint-disable-line

  const handleApplyFilters = () => fetchReport();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportReportToExcel({
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
        type: filterType || undefined,
      });
    } catch {
      // browser handles download errors
    } finally {
      setIsExporting(false);
    }
  };

  const stats = [
    {
      label: 'Total Products',
      value: isLoadingStats ? '...' : summary?.totalProducts.toLocaleString() ?? '0',
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Low Stock Items',
      value: isLoadingStats ? '...' : `${summary?.lowStockCount ?? 0}`,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'Period Movements',
      value: isLoadingReport ? '...' : `${pagination?.total ?? 0}`,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Inventory Reports</h1>
          <p className="text-neutral-500">Analyze stock levels and movements over time.</p>
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          Export to Excel
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${s.color}`} />
              </div>
              <p className="text-sm font-medium text-neutral-500">{s.label}</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Period Summary (from filter) */}
      {reportSummary && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
            <ArrowUpRight className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs text-emerald-700 font-medium">Inbound Scans</p>
              <p className="text-xl font-bold text-emerald-800">+{reportSummary.inboundCount}</p>
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center gap-3">
            <ArrowDownRight className="w-8 h-8 text-orange-600 shrink-0" />
            <div>
              <p className="text-xs text-orange-700 font-medium">Outbound Scans</p>
              <p className="text-xl font-bold text-orange-800">-{reportSummary.outboundCount}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Movements Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Stock Movements
              {pagination && <span className="text-sm font-normal text-neutral-400 ml-1">({pagination.total})</span>}
            </h2>
          </div>
          {isLoadingReport ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : movements.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-neutral-400">
              No movements for the selected period.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider font-semibold">
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {movements.map((m) => {
                    const prod = m.product as { productName: string; productCode: string } | null;
                    return (
                      <tr key={m._id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-neutral-900">{prod?.productName ?? '—'}</p>
                          <p className="text-xs text-neutral-400 font-mono">{prod?.productCode ?? '—'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${m.type === 'INBOUND' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                            {m.type === 'INBOUND' ? '+1' : '-1'} {m.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-neutral-400">
                          {new Date(m.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Filters + Low Stock Sidebar */}
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
              <Filter className="w-5 h-5 text-indigo-600" />
              Report Filters
            </h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" /> Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" /> End Date
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">Movement Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                >
                  <option value="">All Types</option>
                  <option value="INBOUND">Inbound Only</option>
                  <option value="OUTBOUND">Outbound Only</option>
                </select>
              </div>
              <button
                onClick={handleApplyFilters}
                disabled={isLoadingReport}
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoadingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Apply Filters
              </button>
            </div>
          </div>

          {/* Low Stock */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-neutral-100">
              <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Low Stock Products
              </h2>
            </div>
            {isLoadingStats ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : lowStockProducts.length === 0 ? (
              <p className="p-6 text-sm text-neutral-400 text-center">All products well stocked ✅</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider font-semibold">
                      <th className="px-5 py-3">Product</th>
                      <th className="px-5 py-3">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {lowStockProducts.map((p) => (
                      <tr key={p._id}>
                        <td className="px-5 py-3">
                          <p className="text-sm font-bold text-neutral-900">{p.productName}</p>
                          <p className="text-xs text-neutral-400 font-mono">{p.productCode}</p>
                        </td>
                        <td className="px-5 py-3 text-sm font-bold text-red-600">{p.currentStock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
