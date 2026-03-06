import api from './api';

// ─── Types (matching backend responses) ──────────────────────────────────────

export interface ApiProduct {
    _id: string;
    productName: string;
    productCode: string;
    weight: number;
    currentStock: number;
    createdAt: string;
    updatedAt: string;
}

export interface ApiMovement {
    _id: string;
    product: {
        _id: string;
        productName: string;
        productCode: string;
    };
    type: 'INBOUND' | 'OUTBOUND';
    createdAt: string;
    updatedAt: string;
}

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardSummary {
    totalProducts: number;
    totalStockUnits: number;
    lowStockCount: number;
    inboundToday: number;
    outboundToday: number;
}

export const getDashboardSummary = async () => {
    const res = await api.get('/dashboard/summary');
    return res.data.data as {
        summary: DashboardSummary;
        recentMovements: ApiMovement[];
        lowStockProducts: ApiProduct[];
    };
};

// ─── Products ─────────────────────────────────────────────────────────────────

export interface GetProductsParams {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export const getProducts = async (params?: GetProductsParams) => {
    const res = await api.get('/products', { params });
    return {
        products: res.data.data.products as ApiProduct[],
        pagination: res.data.pagination as PaginationMeta,
    };
};

export const getProductByCode = async (code: string) => {
    const res = await api.get(`/products/${code}`);
    return res.data.data.product as ApiProduct;
};

export interface CreateProductPayload {
    productName: string;
    productCode: string;
    weight: number;
    currentStock?: number;
}

export const createProduct = async (payload: CreateProductPayload) => {
    const res = await api.post('/products', payload);
    return res.data.data.product as ApiProduct;
};

export interface UpdateProductPayload {
    productName?: string;
    weight?: number;
}

export const updateProduct = async (code: string, payload: UpdateProductPayload) => {
    const res = await api.put(`/products/${code}`, payload);
    return res.data.data.product as ApiProduct;
};

export const deleteProduct = async (code: string) => {
    await api.delete(`/products/${code}`);
};

// ─── Stock ────────────────────────────────────────────────────────────────────

/** Payload for a single barcode/QR scan event */
export interface ScanPayload {
    code: string;
}

export interface ScanResult {
    movement: ApiMovement;
    product: {
        productCode: string;
        productName: string;
        currentStock: number;
    };
}

/** Scan a product code for inbound (+1 unit) */
export const inboundScan = async (code: string): Promise<ScanResult> => {
    const res = await api.post('/stock/inbound/scan', { code });
    return res.data.data as ScanResult;
};

/** Scan a product code for outbound (-1 unit) */
export const outboundScan = async (code: string): Promise<ScanResult> => {
    const res = await api.post('/stock/outbound/scan', { code });
    return res.data.data as ScanResult;
};

// Aliases kept for backwards compatibility
export const scanInbound = (payload: ScanPayload) => inboundScan(payload.code);
export const scanOutbound = (payload: ScanPayload) => outboundScan(payload.code);

export interface GetMovementHistoryParams {
    productCode?: string;
    type?: 'INBOUND' | 'OUTBOUND';
    page?: number;
    limit?: number;
}

export const getMovementHistory = async (params?: GetMovementHistoryParams) => {
    const res = await api.get('/stock/history', { params });
    return {
        movements: res.data.data.movements as ApiMovement[],
        pagination: res.data.pagination as PaginationMeta,
    };
};

// ─── Reports ──────────────────────────────────────────────────────────────────

export interface GetReportParams {
    startDate?: string;
    endDate?: string;
    type?: 'INBOUND' | 'OUTBOUND';
    productCode?: string;
    page?: number;
    limit?: number;
}

export interface ReportSummary {
    inboundCount: number;
    outboundCount: number;
}

export const getMovementsReport = async (params?: GetReportParams) => {
    const res = await api.get('/reports/movements', { params });
    return {
        movements: res.data.data.movements as ApiMovement[],
        pagination: res.data.pagination as PaginationMeta,
        summary: res.data.summary as ReportSummary,
    };
};

export const getLowStockReport = async (threshold?: number) => {
    const res = await api.get('/reports/low-stock', { params: { threshold } });
    return {
        products: res.data.data.products as ApiProduct[],
        threshold: res.data.threshold as number,
    };
};

/**
 * Triggers a file download from the server for the Excel export.
 * Uses browser anchor trick to handle binary response.
 */
export const exportReportToExcel = async (params?: { startDate?: string; endDate?: string; type?: string }) => {
    const res = await api.get('/reports/export', {
        params,
        responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Stock_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};
