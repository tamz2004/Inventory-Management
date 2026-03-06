
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
}

export interface Product {
  id: string;
  name: string;
  code: string;
  weight: number;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'INBOUND' | 'OUTBOUND';
  date: string;
}

export interface StockSummary {
  totalProducts: number;
  totalStockUnits: number;
  lowStockCount: number;
  recentMovements: StockMovement[];
}

export interface AuthResponse {
  user: User;
  token: string;
}
