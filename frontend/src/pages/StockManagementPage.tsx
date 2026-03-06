import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Barcode,
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  History,
  Loader2,
  Package,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, cn } from '../utils';
import {
  getProductByCode,
  scanInbound,
  scanOutbound,
  getMovementHistory,
  ApiProduct,
  ApiMovement,
  PaginationMeta,
} from '../services/inventoryApi';

const StockManagementPage: React.FC = () => {
  const [barcode, setBarcode] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [movementType, setMovementType] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND');
  const [movements, setMovements] = useState<ApiMovement[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      const result = await getMovementHistory({ limit: 20 });
      setMovements(result.movements);
      setPagination(result.pagination);
    } catch {
      // silent — not critical
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;
    setIsSearching(true);
    try {
      const product = await getProductByCode(barcode.trim());
      setSelectedProduct(product);
      setBarcode('');
      toast.success(`Product found: ${product.productName}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Product not found';
      toast.error(msg);
      setSelectedProduct(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleScan = async () => {
    if (!selectedProduct) return;
    setIsSubmitting(true);
    try {
      const payload = { code: selectedProduct.productCode };

      const result =
        movementType === 'INBOUND'
          ? await scanInbound(payload)
          : await scanOutbound(payload);

      setSelectedProduct((prev) =>
        prev ? { ...prev, currentStock: result.product.currentStock } : null
      );

      const delta = movementType === 'INBOUND' ? '+1' : '-1';
      toast.success(`${delta} unit — Stock: ${result.product.currentStock}`);
      fetchHistory();
      barcodeInputRef.current?.focus();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Stock Management</h1>
        <p className="text-neutral-500">Scan a product code — each scan moves exactly 1 unit.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scanner & Product Details */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
            <form onSubmit={handleBarcodeSubmit} className="space-y-4">
              <label className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Barcode className="w-5 h-5 text-indigo-600" />
                Scan / Enter Product Code
              </label>
              <div className="relative">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Scan or type product code"
                  className="w-full pl-4 pr-12 py-4 bg-neutral-50 border-2 border-neutral-200 rounded-2xl focus:border-indigo-500 focus:ring-0 outline-none transition-all text-lg font-mono tracking-wider"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                >
                  {isSearching ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                </button>
              </div>
              <p className="text-xs text-neutral-400">
                Tip: Barcode scanners act as keyboard input. Keep this field focused.
              </p>
            </form>
          </div>

          {selectedProduct ? (
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="p-6 bg-indigo-600 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold">{selectedProduct.productName}</h2>
                    <p className="text-indigo-100 font-mono text-sm">#{selectedProduct.productCode}</p>
                  </div>
                  <div className={cn(
                    'px-3 py-1 rounded-lg backdrop-blur-sm',
                    selectedProduct.currentStock < 10 ? 'bg-red-500/40' : 'bg-white/20'
                  )}>
                    <span className="text-xs font-bold uppercase tracking-wider">Current Stock</span>
                    <p className="text-2xl font-bold">{selectedProduct.currentStock}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 gap-2 border-b border-neutral-100">
                <div>
                  <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider mb-1">Weight</p>
                  <p className="text-lg font-bold text-neutral-900">{selectedProduct.weight} g</p>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Movement Type Toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setMovementType('INBOUND')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all border-2',
                      movementType === 'INBOUND'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                    )}
                  >
                    <ArrowUpCircle className="w-5 h-5" /> Inbound
                  </button>
                  <button
                    onClick={() => setMovementType('OUTBOUND')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all border-2',
                      movementType === 'OUTBOUND'
                        ? 'bg-orange-50 border-orange-500 text-orange-700'
                        : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                    )}
                  >
                    <ArrowDownCircle className="w-5 h-5" /> Outbound
                  </button>
                </div>

                {movementType === 'OUTBOUND' && selectedProduct.currentStock <= 0 && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <p className="text-sm text-red-700 font-medium">Out of stock — cannot scan outbound</p>
                  </div>
                )}

                <button
                  onClick={handleScan}
                  disabled={isSubmitting || (movementType === 'OUTBOUND' && selectedProduct.currentStock <= 0)}
                  className={cn(
                    'w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70',
                    movementType === 'INBOUND'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                      : 'bg-orange-600 hover:bg-orange-700 shadow-orange-200'
                  )}
                >
                  {isSubmitting
                    ? <Loader2 className="w-6 h-6 animate-spin" />
                    : `Confirm ${movementType === 'INBOUND' ? 'Inbound' : 'Outbound'} (${movementType === 'INBOUND' ? '+1' : '-1'} unit)`}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-neutral-200 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-neutral-300" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900">No Product Selected</h3>
              <p className="text-neutral-500 max-w-xs mt-2">Scan a barcode or enter a product code to start managing stock.</p>
            </div>
          )}
        </div>

        {/* Recent Movements */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              Recent Movements
            </h2>
            {pagination && (
              <span className="text-xs text-neutral-400">{pagination.total} total</span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : movements.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-neutral-400 text-sm">
                No movements yet.
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider font-semibold z-10">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {movements.map((m) => {
                    const prod = m.product as { productName: string; productCode: string };
                    return (
                      <tr key={m._id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-neutral-900">{prod.productName}</p>
                          <p className="text-xs text-neutral-400 font-mono mt-0.5">{prod.productCode}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                            m.type === 'INBOUND' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                          )}>
                            {m.type === 'INBOUND' ? '+1' : '-1'} {m.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-xs text-neutral-400">
                            <Calendar className="w-3 h-3" />
                            {formatDate(m.createdAt).split(',')[0]}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockManagementPage;


