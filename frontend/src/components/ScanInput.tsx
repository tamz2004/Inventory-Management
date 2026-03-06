import React, { useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ScanInputProps {
    /** Called with the trimmed barcode value on Enter */
    onScan: (code: string) => void;
    /** Show spinner while a scan is being processed */
    isLoading?: boolean;
    placeholder?: string;
    disabled?: boolean;
}

/**
 * Warehouse-optimised barcode input.
 * - Auto-focuses on mount
 * - Triggers onScan on Enter key (not form submit)
 * - Clears itself after every scan attempt
 * - Ignores empty / whitespace-only values
 */
const ScanInput: React.FC<ScanInputProps> = ({
    onScan,
    isLoading = false,
    placeholder = 'Scan or type product code…',
    disabled = false,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus on mount and whenever loading finishes (ready for next scan)
    useEffect(() => {
        if (!isLoading) {
            inputRef.current?.focus();
        }
    }, [isLoading]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();

        const value = inputRef.current?.value.trim() ?? '';
        if (!value) return;

        // Clear immediately so the scanner can keep firing
        if (inputRef.current) inputRef.current.value = '';

        onScan(value);
    };

    return (
        <div className="relative">
            <input
                ref={inputRef}
                type="text"
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled || isLoading}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
                className="w-full px-6 py-5 text-2xl font-mono tracking-widest bg-neutral-50 border-2 border-neutral-200 rounded-2xl focus:border-indigo-500 focus:ring-0 outline-none transition-all disabled:opacity-60 disabled:cursor-wait pr-14"
            />
            {isLoading && (
                <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-7 h-7 text-indigo-500 animate-spin" />
            )}
        </div>
    );
};

export default ScanInput;
