import React, { useEffect, useState } from 'react';
import {
  Package,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  TrendingUp,
  Clock,
  Loader2,
} from 'lucide-react';
import { formatDate } from '../utils';
import {
  getDashboardSummary,
  DashboardSummary,
  ApiMovement,
  ApiProduct,
} from '../services/inventoryApi';

const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentMovements, setRecentMovements] = useState<ApiMovement[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<ApiProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getDashboardSummary();
        setSummary(data.summary);
        setRecentMovements(data.recentMovements);
        setLowStockProducts(data.lowStockProducts);
      } catch {
        setError('Failed to load dashboard. Is the backend running?');
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-neutral-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Products',
      value: summary?.totalProducts.toLocaleString() ?? '0',
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      name: 'Inbound Today',
      value: `+${summary?.inboundToday ?? 0}`,
      icon: ArrowUpRight,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      name: 'Outbound Today',
      value: `-${summary?.outboundToday ?? 0}`,
      icon: ArrowDownRight,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      name: 'Low Stock Alerts',
      value: `${summary?.lowStockCount ?? 0}`,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard Overview</h1>
        <p className="text-neutral-500">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={stat.bg + ' p-2.5 rounded-xl'}>
                  <Icon className={'w-6 h-6 ' + stat.color} />
                </div>
                <TrendingUp className="w-4 h-4 text-neutral-300" />
              </div>
              <p className="text-sm font-medium text-neutral-500">{stat.name}</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Movements */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Recent Movements
            </h2>
          </div>
          {recentMovements.length === 0 ? (
            <div className="p-12 text-center text-neutral-400">No movements yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider font-semibold">
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {recentMovements.map((m) => {
                    const prod = m.product as { productName: string; productCode: string } | null;
                    return (
                      <tr key={m._id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-neutral-900">{prod?.productName ?? '—'}</p>
                          <p className="text-xs text-neutral-400">#{prod?.productCode ?? '—'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ' +
                              (m.type === 'INBOUND'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-orange-100 text-orange-700')
                            }
                          >
                            {m.type === 'INBOUND' ? '+1' : '-1'} {m.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-400">{formatDate(m.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock Sidebar */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Low Stock Alert
          </h2>
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-6">All products are well stocked ✅</p>
          ) : (
            <div className="space-y-4">
              {lowStockProducts.map((item) => (
                <div key={item._id} className="p-4 rounded-xl bg-red-50 border border-red-100">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-bold text-neutral-900">{item.productName}</p>
                    <span className="text-xs font-bold text-red-600">{item.currentStock} left</span>
                  </div>
                  <div className="w-full bg-red-200 rounded-full h-1.5">
                    <div
                      className="bg-red-600 h-1.5 rounded-full"
                      style={{ width: `${Math.min((item.currentStock / 10) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-red-500 mt-2 font-medium uppercase tracking-wider">
                    Code: {item.productCode}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
