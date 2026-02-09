/**
 * MAOS API Service
 * All frontend API calls go through the NestJS backend
 * The backend then handles ERPNext integration
 */

import { authFetch } from './auth';

// ============================================================================
// Dashboard & KPIs
// ============================================================================

export interface TopProduct {
  name: string;
  qty: number;
  revenue: number;
}

export interface DashboardKPIs {
  revenue: number;
  todayRevenue: number;
  topProducts: TopProduct[];
  unpaidInvoices: number;
  criticalStock: number;
  customers: number;
  orders: number;
  leads: number;
}

// ============================================================================
// MAOS Insights (Proactive Briefing)
// ============================================================================

export interface InsightAlert {
  type: 'STOCK_CRITIQUE' | 'IMPAYE_30J' | 'CLIENT_INACTIF' | 'MARGE_FAIBLE';
  priority: 'HIGH' | 'MEDIUM';
  title: string;
  detail: string;
  suggestedAction: string;
}

export interface InsightOpportunity {
  title: string;
  impact: string;
  effort: 'FACILE' | 'MOYEN' | 'COMPLEXE';
  detail: string;
}

export interface DashboardInsights {
  snapshot: {
    todayRevenue: number;
    totalCustomers: number;
    totalProducts: number;
    criticalStockCount: number;
    overdueInvoicesCount: number;
  };
  alerts: InsightAlert[];
  opportunities: InsightOpportunity[];
  generatedAt: string;
}

export async function getDashboardInsights(): Promise<DashboardInsights> {
  try {
    const response = await authFetch('/api/dashboard/insights');
    if (!response.ok) {
      // Endpoint not implemented yet - return empty data silently
      console.debug('Dashboard insights endpoint not available yet');
      return {
        snapshot: {
          todayRevenue: 0,
          totalCustomers: 0,
          totalProducts: 0,
          criticalStockCount: 0,
          overdueInvoicesCount: 0,
        },
        alerts: [],
        opportunities: [],
        generatedAt: new Date().toISOString(),
      };
    }
    const data = await response.json();
    return data.data || {
      snapshot: {},
      alerts: [],
      opportunities: [],
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    // Silently handle error - don't spam console
    console.debug('Dashboard insights not available:', error);
    return {
      snapshot: {
        todayRevenue: 0,
        totalCustomers: 0,
        totalProducts: 0,
        criticalStockCount: 0,
        overdueInvoicesCount: 0,
      },
      alerts: [],
      opportunities: [],
      generatedAt: new Date().toISOString(),
    };
  }
}

// ============================================================================
// Monthly Performance Chart Data
// ============================================================================

export interface MonthlyPerformanceData {
  month: string;
  ventes: number;
  achats: number;
  marge: number;
}

export async function getMonthlyPerformance(): Promise<{ data: MonthlyPerformanceData[]; year: number }> {
  const emptyData: MonthlyPerformanceData[] = [
    'Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'
  ].map(month => ({ month, ventes: 0, achats: 0, marge: 0 }));

  try {
    const response = await authFetch('/api/dashboard/monthly-performance');
    if (!response.ok) {
      console.debug('Monthly performance endpoint not available');
      return { data: emptyData, year: new Date().getFullYear() };
    }
    const result = await response.json();
    return { data: result.data || emptyData, year: result.year || new Date().getFullYear() };
  } catch (error) {
    console.debug('Monthly performance not available:', error);
    return { data: emptyData, year: new Date().getFullYear() };
  }
}

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  try {
    const response = await authFetch('/api/dashboard/kpis');
    if (!response.ok) {
      // Endpoint not fully implemented - return empty data silently
      console.debug('Dashboard KPIs endpoint not available yet');
      return {
        revenue: 0,
        todayRevenue: 0,
        topProducts: [],
        unpaidInvoices: 0,
        criticalStock: 0,
        customers: 0,
        orders: 0,
        leads: 0,
      };
    }
    const data = await response.json();
    return data.data || {
      revenue: 0,
      todayRevenue: 0,
      topProducts: [],
      unpaidInvoices: 0,
      criticalStock: 0,
      customers: 0,
      orders: 0,
      leads: 0,
    };
  } catch (error) {
    // Silently handle - backend may not be ready
    console.debug('Dashboard KPIs not available:', error);
    return {
      revenue: 0,
      todayRevenue: 0,
      topProducts: [],
      unpaidInvoices: 0,
      criticalStock: 0,
      customers: 0,
      orders: 0,
      leads: 0,
    };
  }
}

// ============================================================================
// Customers
// ============================================================================

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  territory?: string;
  customerGroup?: string;
  totalRevenue?: number;
  outstandingAmount?: number;
  createdAt?: string;
}

export async function getCustomers(filters?: Record<string, unknown>): Promise<Customer[]> {
  try {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const response = await authFetch(`/api/crm/customers?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch customers');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Get customers error:', error);
    return [];
  }
}

export async function getCustomer(id: string): Promise<Customer | null> {
  try {
    const response = await authFetch(`/api/crm/customers/${id}`);
    if (!response.ok) throw new Error('Failed to fetch customer');
    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('Get customer error:', error);
    return null;
  }
}

export async function createCustomer(customer: Partial<Customer>): Promise<Customer | null> {
  try {
    const response = await authFetch('/api/crm/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer),
    });
    if (!response.ok) throw new Error('Failed to create customer');
    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('Create customer error:', error);
    throw error;
  }
}

// ============================================================================
// Leads
// ============================================================================

export interface Lead {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  source?: string;
  status?: string;
  createdAt?: string;
}

export async function getLeads(filters?: Record<string, unknown>): Promise<Lead[]> {
  try {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const response = await authFetch(`/api/crm/leads?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch leads');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Get leads error:', error);
    return [];
  }
}

// ============================================================================
// Orders (Sales Orders)
// ============================================================================

export interface Order {
  id: string;
  name: string;
  customer: string;
  status: string;
  grandTotal: number;
  currency?: string;
  transactionDate?: string;
  deliveryDate?: string;
  items?: OrderItem[];
}

export interface OrderItem {
  itemCode: string;
  itemName: string;
  qty: number;
  rate: number;
  amount: number;
}

export async function getOrders(filters?: Record<string, unknown>): Promise<Order[]> {
  try {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const response = await authFetch(`/api/sales/orders?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch orders');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Get orders error:', error);
    return [];
  }
}

// ============================================================================
// Invoices (Sales Invoices)
// ============================================================================

export interface Invoice {
  id: string;
  name: string;
  customer: string;
  status: string;
  grandTotal: number;
  outstandingAmount?: number;
  currency?: string;
  postingDate?: string;
  dueDate?: string;
}

export async function getInvoices(filters?: Record<string, unknown>): Promise<Invoice[]> {
  try {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const response = await authFetch(`/api/sales/invoices?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch invoices');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Get invoices error:', error);
    return [];
  }
}

// ============================================================================
// Products (Items)
// ============================================================================

export interface Product {
  id: string;
  itemCode: string;
  itemName: string;
  itemGroup?: string;
  stockUom?: string;
  stockQty?: number;
  standardRate?: number;
  description?: string;
}

export async function getProducts(filters?: Record<string, unknown>): Promise<Product[]> {
  try {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const response = await authFetch(`/api/stock/items?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch products');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Get products error:', error);
    return [];
  }
}

// ============================================================================
// Stock
// ============================================================================

export interface StockItem {
  itemCode: string;
  itemName: string;
  warehouse: string;
  actualQty: number;
  projectedQty?: number;
  reservedQty?: number;
  valuationRate?: number;
}

export async function getStockLevels(filters?: Record<string, unknown>): Promise<StockItem[]> {
  try {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const response = await authFetch(`/api/stock/levels?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch stock levels');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Get stock levels error:', error);
    return [];
  }
}

// ============================================================================
// Suppliers
// ============================================================================

export interface Supplier {
  id: string;
  name: string;
  supplierGroup?: string;
  country?: string;
  email?: string;
  phone?: string;
}

export async function getSuppliers(filters?: Record<string, unknown>): Promise<Supplier[]> {
  try {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const response = await authFetch(`/api/purchase/suppliers?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch suppliers');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Get suppliers error:', error);
    return [];
  }
}

// ============================================================================
// MAOS AI - Talk/Chat
// ============================================================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ChatResponse {
  response: string;
  agent?: string;
  data?: Record<string, unknown>;
}

export async function sendChatMessage(
  message: string,
  conversationId?: string
): Promise<ChatResponse> {
  try {
    const response = await authFetch('/api/orchestrator/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conversationId }),
    });
    if (!response.ok) throw new Error('Failed to send message');
    const data = await response.json();
    return data.data || { response: 'Erreur de communication avec MAOS' };
  } catch (error) {
    console.error('Chat error:', error);
    throw error;
  }
}

// ============================================================================
// Journal de Bord
// ============================================================================

export interface JournalEntry {
  id: string;
  type: 'DECISION' | 'ALERT' | 'EVENT' | 'RECOMMENDATION' | 'ACTION' | 'ERROR';
  module: string;
  title: string;
  description: string;
  voiceReadable?: string;
  importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export async function getJournalEntries(
  limit = 50,
  offset = 0
): Promise<JournalEntry[]> {
  try {
    const response = await authFetch(
      `/api/journal/entries?limit=${limit}&offset=${offset}`
    );
    if (!response.ok) throw new Error('Failed to fetch journal entries');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Get journal entries error:', error);
    return [];
  }
}

export async function getJournalSummary(date?: string): Promise<string> {
  try {
    const params = date ? `?date=${date}` : '';
    const response = await authFetch(`/api/journal/summary${params}`);
    if (!response.ok) throw new Error('Failed to fetch journal summary');
    const data = await response.json();
    return data.data?.summary || 'Aucun evenement enregistre.';
  } catch (error) {
    console.error('Get journal summary error:', error);
    return 'Erreur lors de la recuperation du journal.';
  }
}

// ============================================================================
// Settings & Profile
// ============================================================================

export interface UserSettings {
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  dashboardLayout?: Record<string, unknown>;
}

export async function getUserSettings(): Promise<UserSettings | null> {
  try {
    const response = await authFetch('/api/users/settings');
    if (!response.ok) throw new Error('Failed to fetch settings');
    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('Get settings error:', error);
    return null;
  }
}

export async function updateUserSettings(
  settings: Partial<UserSettings>
): Promise<UserSettings | null> {
  try {
    const response = await authFetch('/api/users/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!response.ok) throw new Error('Failed to update settings');
    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('Update settings error:', error);
    throw error;
  }
}
