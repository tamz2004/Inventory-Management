import React, { useState } from 'react';
import { ArrowUpCircle, CheckCircle2, Package, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { inboundScan, ScanResult } from '../services/inventoryApi';
import ScanInput from '../components/ScanInput';
import { cn } from '../utils';

const InboundPage: React.FC = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [lastScan, setLastScan] = useState<ScanResult | null>(null);

    const handleScan = async (code: string) => {
        setIsScanning(true);
        try {
            const result = await inboundScan(code);
            setLastScan(result);
            toast.success(
                `✓ ${result.product.productName} — Stock: ${result.product.currentStock}`
            );
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? 'Scan failed';
            toast.error(msg);
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                    <ArrowUpCircle className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Inbound Scan</h1>
                    <p className="text-neutral-500 text-sm">Each scan adds 1 unit to stock.</p>
                </div>
            </div>

            {/* Scan Input */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 space-y-4">
                <label className="text-sm font-bold text-neutral-700 uppercase tracking-wider">
                    Scan barcode / Enter product code
                </label>
                <ScanInput
                    onScan={handleScan}
                    isLoading={isScanning}
                    placeholder="Focus here and scan…"
                />
                <p className="text-xs text-neutral-400 text-center">
                    Press <kbd className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 rounded text-xs font-mono">Enter</kbd> or let the scanner do it automatically
                </p>
            </div>

            {/* Last scan result */}
            {lastScan && (
                <div className={cn(
                    'bg-white rounded-2xl border shadow-sm p-6 flex items-center gap-5',
                    'border-emerald-200 animate-in fade-in slide-in-from-bottom-4 duration-300'
                )}>
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-neutral-900 truncate">
                            {lastScan.product.productName}
                        </p>
                        <p className="text-sm text-neutral-400 font-mono">
                            {lastScan.product.productCode}
                        </p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Current Stock</p>
                        <p className="text-3xl font-bold text-emerald-700">
                            {lastScan.product.currentStock}
                        </p>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!lastScan && !isScanning && (
                <div className="flex flex-col items-center justify-center py-16 text-neutral-300">
                    <Package className="w-16 h-16 mb-4" />
                    <p className="text-sm font-medium">Scan a product to see results here</p>
                </div>
            )}

            {isScanning && (
                <div className="flex items-center justify-center py-10 gap-3 text-indigo-600">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="font-medium">Processing scan…</span>
                </div>
            )}
        </div>
    );
};

export default InboundPage;
