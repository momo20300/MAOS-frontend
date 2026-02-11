/**
 * ERPNext Service
 * Provides data access through the authenticated backend API
 * All calls go through NestJS which handles ERPNext integration
 */

import { authFetch } from './auth';

// ============================================================================
// Helper: handle backend responses that return { success, data, error }
// Backend controllers return HTTP 200 even on errors, so we must check .success
// ============================================================================

const handleMutationResponse = async (response: Response, defaultError: string) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || data?.message || defaultError);
  }
  if (data.success === false) {
    throw new Error(data.error || defaultError);
  }
  return data;
};

// ============================================================================
// Sales Dashboard
// ============================================================================

export interface SalesDashboardData {
  kpis: {
    thisMonthCA: number;
    lastMonthCA: number;
    yearCA: number;
    growth: number;
    invoiceCount: number;
    unpaidAmount: number;
    unpaidCount: number;
    avgInvoice: number;
  };
  topClients: Array<{ name: string; total: number; pct: number }>;
  monthly: Array<{ month: string; total: number }>;
  overdue: Array<{
    name: string;
    customer: string;
    amount: number;
    dueDate: string;
    daysOverdue: number;
  }>;
  recentOrders: Array<{
    name: string;
    customer_name: string;
    transaction_date: string;
    base_grand_total: number;
    status: string;
  }>;
}

export const getSalesDashboard = async (): Promise<SalesDashboardData | null> => {
  try {
    const response = await authFetch('/api/sales/dashboard');
    if (!response.ok) throw new Error('Failed to fetch sales dashboard');
    const data = await response.json();
    if (data.success) return data.data;
    throw new Error(data.error || 'Erreur inconnue');
  } catch (error) {
    console.error('Sales dashboard error:', error);
    return null;
  }
};

// ============================================================================
// CRM Dashboard
// ============================================================================

export interface CrmDashboardData {
  kpis: {
    totalClients: number;
    newThisMonth: number;
    newLastMonth: number;
    activeLeads: number;
    openOpportunities: number;
    avgRevenuePerClient: number;
    concentration: number;
    yearCA: number;
  };
  typeDistribution: Array<{ name: string; value: number }>;
  territories: Array<{ name: string; count: number }>;
  topClients: Array<{ name: string; total: number; pct: number }>;
  leadPipeline: Array<{ status: string; count: number }>;
  monthlyNewClients: Array<{ month: string; count: number }>;
  recentLeads: Array<{
    name: string;
    lead_name: string;
    company_name: string;
    status: string;
    source: string;
  }>;
  inactiveClients: Array<{
    name: string;
    customer_name: string;
    customer_type: string;
    territory: string;
  }>;
}

export const getCrmDashboard = async (): Promise<CrmDashboardData | null> => {
  try {
    const response = await authFetch('/api/crm/dashboard');
    if (!response.ok) throw new Error('Failed to fetch CRM dashboard');
    const data = await response.json();
    if (data.success) return data.data;
    throw new Error(data.error || 'Erreur inconnue');
  } catch (error) {
    console.error('CRM dashboard error:', error);
    return null;
  }
};

// ============================================================================
// Purchase Dashboard
// ============================================================================

export interface PurchaseDashboardData {
  kpis: {
    yearTotal: number;
    thisMonthTotal: number;
    lastMonthTotal: number;
    growth: number;
    poCount: number;
    pinvCount: number;
    supplierCount: number;
    outstandingAmount: number;
    outstandingCount: number;
    avgPO: number;
    concentration: number;
  };
  topSuppliers: Array<{ name: string; total: number; pct: number }>;
  monthly: Array<{ month: string; total: number }>;
  poStatusDistribution: Array<{ status: string; count: number }>;
  supplierGroups: Array<{ name: string; count: number }>;
  overduePINVs: Array<{
    name: string;
    supplier: string;
    amount: number;
    dueDate: string;
    daysOverdue: number;
  }>;
  recentPOs: Array<{
    name: string;
    supplier_name: string;
    transaction_date: string;
    base_grand_total: number;
    status: string;
  }>;
}

export const getPurchaseDashboard = async (): Promise<PurchaseDashboardData | null> => {
  try {
    const response = await authFetch('/api/purchase/dashboard');
    if (!response.ok) throw new Error('Failed to fetch purchase dashboard');
    const data = await response.json();
    if (data.success) return data.data;
    throw new Error(data.error || 'Erreur inconnue');
  } catch (error) {
    console.error('Purchase dashboard error:', error);
    return null;
  }
};

// ============================================================================
// Stock Dashboard
// ============================================================================

export interface StockDashboardData {
  kpis: {
    totalItems: number;
    totalStockValue: number;
    criticalCount: number;
    lowStockCount: number;
    activeWarehouses: number;
    entriesThisMonth: number;
  };
  warehouseValues: Array<{ name: string; value: number }>;
  topItemsByValue: Array<{ code: string; name: string; value: number; qty: number }>;
  itemGroups: Array<{ name: string; count: number }>;
  entryTypes: Array<{ type: string; count: number; amount: number }>;
  criticalItems: Array<{
    code: string;
    name: string;
    group: string;
    qty: number;
    warehouse: string;
  }>;
  lowStockItems: Array<{
    code: string;
    name: string;
    qty: number;
    reserved: number;
    warehouse: string;
  }>;
}

export const getStockDashboard = async (): Promise<StockDashboardData | null> => {
  try {
    const response = await authFetch('/api/stock/dashboard');
    if (!response.ok) throw new Error('Failed to fetch stock dashboard');
    const data = await response.json();
    if (data.success) return data.data;
    throw new Error(data.error || 'Erreur inconnue');
  } catch (error) {
    console.error('Stock dashboard error:', error);
    return null;
  }
};

// ============================================================================
// Accounting Dashboard
// ============================================================================

export interface AccountingDashboardData {
  kpis: {
    totalRevenue: number;
    totalExpenses: number;
    profit: number;
    margin: number;
    thisMonthRevenue: number;
    lastMonthRevenue: number;
    totalReceivable: number;
    receivableCount: number;
    totalPayable: number;
    payableCount: number;
    paymentCount: number;
    journalCount: number;
  };
  monthlyPL: Array<{ month: string; revenue: number; expenses: number; profit: number }>;
  paymentBreakdown: Array<{ name: string; value: number }>;
  paymentByMode: Array<{ name: string; amount: number }>;
  recentPayments: Array<{
    name: string;
    type: string;
    party: string;
    amount: number;
    date: string;
    mode: string;
  }>;
}

export const getAccountingDashboard = async (): Promise<AccountingDashboardData | null> => {
  try {
    const response = await authFetch('/api/erp/accounting/dashboard');
    if (!response.ok) throw new Error('Failed to fetch accounting dashboard');
    const data = await response.json();
    if (data.success) return data.data;
    throw new Error(data.error || 'Erreur inconnue');
  } catch (error) {
    console.error('Accounting dashboard error:', error);
    return null;
  }
};

// ============================================================================
// HR Dashboard
// ============================================================================

export interface HrDashboardData {
  kpis: {
    totalEmployees: number;
    activeEmployees: number;
    leftEmployees: number;
    newHires: number;
    departmentCount: number;
  };
  departments: Array<{ name: string; count: number }>;
  genderDistribution: Array<{ name: string; count: number }>;
  designations: Array<{ name: string; count: number }>;
  statusDistribution: Array<{ status: string; count: number }>;
  monthlyJoining: Array<{ month: string; count: number }>;
  employeeList: Array<{
    name: string;
    employee_name: string;
    designation: string;
    department: string;
    gender: string;
    date_of_joining: string;
  }>;
}

export const getHrDashboard = async (): Promise<HrDashboardData | null> => {
  try {
    const response = await authFetch('/api/hr/dashboard');
    if (!response.ok) throw new Error('Failed to fetch HR dashboard');
    const data = await response.json();
    if (data.success) return data.data;
    throw new Error(data.error || 'Erreur inconnue');
  } catch (error) {
    console.error('HR dashboard error:', error);
    return null;
  }
};

export interface ManufacturingDashboardData {
  kpis: {
    totalWorkOrders: number;
    openWO: number;
    completedWO: number;
    totalBOMs: number;
    activeBOMs: number;
    totalProduced: number;
    totalPlanned: number;
    completionRate: number;
    stockEntryCount: number;
  };
  woStatusDistribution: Array<{ status: string; count: number }>;
  stockEntryTypes: Array<{ name: string; count: number }>;
  monthlyProduction: Array<{ month: string; planned: number; produced: number }>;
  topItems: Array<{ code: string; name: string; planned: number; produced: number }>;
  recentWOs: Array<{
    name: string;
    item_name: string;
    qty: number;
    produced_qty: number;
    status: string;
    planned_start_date: string;
  }>;
}

export const getManufacturingDashboard = async (): Promise<ManufacturingDashboardData | null> => {
  try {
    const response = await authFetch('/api/manufacturing/dashboard');
    if (!response.ok) throw new Error('Failed to fetch Manufacturing dashboard');
    const data = await response.json();
    if (data.success) return data.data;
    throw new Error(data.error || 'Erreur inconnue');
  } catch (error) {
    console.error('Manufacturing dashboard error:', error);
    return null;
  }
};

export interface ProjectsDashboardData {
  kpis: {
    totalProjects: number;
    openProjects: number;
    completedProjects: number;
    overdueProjects: number;
    totalTasks: number;
    openTasks: number;
    completedTasks: number;
    workingTasks: number;
    avgCompletion: number;
    totalEstimated: number;
    totalActual: number;
  };
  projectStatusDistribution: Array<{ status: string; count: number }>;
  taskStatusDistribution: Array<{ status: string; count: number }>;
  priorityDistribution: Array<{ name: string; count: number }>;
  projectTypes: Array<{ name: string; count: number }>;
  topProjectsByTasks: Array<{ name: string; total: number; completed: number }>;
  projectList: Array<{
    name: string;
    project_name: string;
    status: string;
    percent_complete: number;
    priority: string;
    expected_end_date: string;
  }>;
}

export const getProjectsDashboard = async (): Promise<ProjectsDashboardData | null> => {
  try {
    const response = await authFetch('/api/projects/dashboard');
    if (!response.ok) throw new Error('Failed to fetch Projects dashboard');
    const data = await response.json();
    if (data.success) return data.data;
    throw new Error(data.error || 'Erreur inconnue');
  } catch (error) {
    console.error('Projects dashboard error:', error);
    return null;
  }
};

export interface QualityDashboardData {
  kpis: {
    totalInspections: number;
    acceptedInspections: number;
    rejectedInspections: number;
    acceptanceRate: number;
    totalNC: number;
    openNC: number;
    resolvedNC: number;
  };
  inspectionTypes: Array<{ name: string; count: number }>;
  inspectionStatusDistribution: Array<{ status: string; count: number }>;
  severityDistribution: Array<{ name: string; count: number }>;
  ncStatusDistribution: Array<{ status: string; count: number }>;
  monthlyInspections: Array<{ month: string; accepted: number; rejected: number; total: number }>;
  topInspectedItems: Array<{ code: string; name: string; total: number; accepted: number; rejected: number }>;
  recentInspections: Array<{
    name: string;
    item_name: string;
    status: string;
    inspection_type: string;
    inspection_date: string;
  }>;
  recentNC: Array<{
    name: string;
    subject: string;
    status: string;
    severity: string;
    opening_date: string;
  }>;
}

export const getQualityDashboard = async (): Promise<QualityDashboardData | null> => {
  try {
    const response = await authFetch('/api/quality/dashboard');
    if (!response.ok) throw new Error('Failed to fetch Quality dashboard');
    const data = await response.json();
    if (data.success) return data.data;
    throw new Error(data.error || 'Erreur inconnue');
  } catch (error) {
    console.error('Quality dashboard error:', error);
    return null;
  }
};

export interface SupportDashboardData {
  kpis: {
    totalIssues: number;
    openIssues: number;
    repliedIssues: number;
    resolvedIssues: number;
    resolutionRate: number;
    avgResolutionDays: number;
  };
  statusDistribution: Array<{ status: string; count: number }>;
  priorityDistribution: Array<{ name: string; count: number }>;
  issueTypes: Array<{ name: string; count: number }>;
  monthlyIssues: Array<{ month: string; opened: number; resolved: number }>;
  topCustomers: Array<{ name: string; count: number }>;
  recentIssues: Array<{
    name: string;
    subject: string;
    status: string;
    priority: string;
    issue_type: string;
    opening_date: string;
    customer: string;
  }>;
}

export const getSupportDashboard = async (): Promise<SupportDashboardData | null> => {
  try {
    const response = await authFetch('/api/support/dashboard');
    if (!response.ok) throw new Error('Failed to fetch Support dashboard');
    const data = await response.json();
    if (data.success) return data.data;
    throw new Error(data.error || 'Erreur inconnue');
  } catch (error) {
    console.error('Support dashboard error:', error);
    return null;
  }
};

// ============================================================================
// Dashboard KPIs
// ============================================================================

export const getDashboardInsights = async () => {
  try {
    const response = await authFetch('/api/dashboard/insights');
    if (!response.ok) throw new Error('Failed to fetch insights');
    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    throw new Error(data.error || 'Erreur inconnue');
  } catch (error) {
    console.error('Dashboard insights error:', error);
    throw error;
  }
};

export const getDashboardKPIs = async () => {
  try {
    const response = await authFetch('/api/dashboard/kpis');
    if (!response.ok) throw new Error('Failed to fetch KPIs');
    const data = await response.json();
    return data.data || {
      revenue: 0,
      unpaidInvoices: 0,
      criticalStock: 0,
      customers: 0,
      items: 0,
      leads: 0,
      error: false,
    };
  } catch (error) {
    console.error('Dashboard KPIs error:', error);
    return {
      revenue: 0,
      unpaidInvoices: 0,
      criticalStock: 0,
      customers: 0,
      items: 0,
      leads: 0,
      error: true,
    };
  }
};

// ============================================================================
// Customers
// ============================================================================

export const getCustomers = async () => {
  try {
    const response = await authFetch('/api/crm/customers');
    if (!response.ok) throw new Error('Failed to fetch customers');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Get customers error:', error);
    return [];
  }
};

// ============================================================================
// Invoices
// ============================================================================

export const getInvoices = async () => {
  try {
    const response = await authFetch('/api/sales/invoices');
    if (!response.ok) throw new Error('Failed to fetch invoices');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Get invoices error:', error);
    return [];
  }
};

// ============================================================================
// Items/Products
// ============================================================================

export const getItems = async () => {
  try {
    const response = await authFetch('/api/stock/items');
    if (!response.ok) throw new Error('Failed to fetch items');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Get items error:', error);
    return [];
  }
};

// ============================================================================
// Suppliers
// ============================================================================

export const getSuppliers = async () => {
  try {
    const response = await authFetch('/api/purchase/suppliers');
    if (!response.ok) throw new Error('Failed to fetch suppliers');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Get suppliers error:', error);
    return [];
  }
};

// ============================================================================
// Leads
// ============================================================================

export const getLeads = async () => {
  try {
    const response = await authFetch('/api/crm/leads');
    if (!response.ok) throw new Error('Failed to fetch leads');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Get leads error:', error);
    return [];
  }
};

// ============================================================================
// Sales Orders
// ============================================================================

export const getSalesOrders = async () => {
  try {
    const response = await authFetch('/api/sales/orders');
    if (!response.ok) throw new Error('Failed to fetch sales orders');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Get sales orders error:', error);
    return [];
  }
};

// ============================================================================
// Stock Items
// ============================================================================

export const getStockItems = async () => {
  try {
    const response = await authFetch('/api/stock/levels');
    if (!response.ok) throw new Error('Failed to fetch stock items');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Get stock items error:', error);
    return [];
  }
};

// ============================================================================
// CRUD Operations - Customers
// ============================================================================

export const createCustomer = async (customer: {
  customer_name: string;
  customer_type?: 'Company' | 'Individual';
  customer_group?: string;
  territory?: string;
  mobile_no?: string;
  email_id?: string;
}) => {
  const payload = {
    ...customer,
    customer_type: customer.customer_type || 'Company',
    customer_name: (customer.customer_name || '').trim(),
  };
  if (!payload.customer_name) throw new Error('customer_name est obligatoire');
  const response = await authFetch('/api/crm/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleMutationResponse(response, 'Erreur lors de la creation du client');
};

export const updateCustomer = async (name: string, customer: Partial<{
  customer_name: string;
  customer_type: 'Company' | 'Individual';
  customer_group: string;
  territory: string;
  mobile_no: string;
  email_id: string;
}>) => {
  const response = await authFetch(`/api/crm/customers/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customer),
  });
  return handleMutationResponse(response, 'Erreur lors de la mise a jour du client');
};

export const deleteCustomer = async (name: string) => {
  const response = await authFetch(`/api/crm/customers/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });
  return handleMutationResponse(response, 'Erreur lors de la suppression du client');
};

// ============================================================================
// CRUD Operations - Suppliers
// ============================================================================

export const createSupplier = async (supplier: {
  supplier_name: string;
  supplier_type?: string;
  supplier_group?: string;
  country?: string;
}) => {
  const payload = {
    ...supplier,
    supplier_type: supplier.supplier_type || 'Company',
    supplier_name: (supplier.supplier_name || '').trim(),
  };
  if (!payload.supplier_name) throw new Error('supplier_name est obligatoire');
  const response = await authFetch('/api/purchase/suppliers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleMutationResponse(response, 'Erreur lors de la creation du fournisseur');
};

export const updateSupplier = async (name: string, supplier: Partial<{
  supplier_name: string;
  supplier_type: string;
  supplier_group: string;
  country: string;
}>) => {
  const response = await authFetch(`/api/purchase/suppliers/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(supplier),
  });
  return handleMutationResponse(response, 'Erreur lors de la mise a jour du fournisseur');
};

export const deleteSupplier = async (name: string) => {
  const response = await authFetch(`/api/purchase/suppliers/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });
  return handleMutationResponse(response, 'Erreur lors de la suppression du fournisseur');
};

// ============================================================================
// CRUD Operations - Items/Products
// ============================================================================

export const createItem = async (item: {
  item_code: string;
  item_name: string;
  item_group?: string;
  stock_uom?: string;
  standard_rate?: number;
  is_stock_item?: boolean;
  description?: string;
}) => {
  const payload = {
    ...item,
    item_code: (item.item_code || '').trim(),
    item_name: (item.item_name || item.item_code || '').trim(),
    stock_uom: item.stock_uom || 'Nos',
    standard_rate: Number(item.standard_rate) || 0,
  };
  if (!payload.item_code) throw new Error('item_code est obligatoire');
  const response = await authFetch('/api/stock/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleMutationResponse(response, 'Erreur lors de la creation du produit');
};

export const updateItem = async (name: string, item: Partial<{
  item_name: string;
  item_group: string;
  stock_uom: string;
  standard_rate: number;
  is_stock_item: boolean;
  description: string;
}>) => {
  const response = await authFetch(`/api/stock/items/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  return handleMutationResponse(response, 'Erreur lors de la mise a jour du produit');
};

export const deleteItem = async (name: string) => {
  const response = await authFetch(`/api/stock/items/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });
  return handleMutationResponse(response, 'Erreur lors de la suppression du produit');
};

// ============================================================================
// CRUD Operations - Leads
// ============================================================================

export const createLead = async (lead: {
  lead_name: string;
  company_name?: string;
  email_id?: string;
  mobile_no?: string;
  source?: string;
  status?: string;
}) => {
  const response = await authFetch('/api/crm/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
  });
  return handleMutationResponse(response, 'Erreur lors de la creation du lead');
};

// ============================================================================
// CRUD Operations - Sales Orders
// ============================================================================

export const createSalesOrder = async (order: {
  customer: string;
  delivery_date: string;
  items: Array<{
    item_code: string;
    qty: number;
    rate?: number;
  }>;
}) => {
  const response = await authFetch('/api/sales/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });
  return handleMutationResponse(response, 'Erreur lors de la creation de la commande');
};

// ============================================================================
// CRUD Operations - Invoices
// ============================================================================

export const createInvoice = async (invoice: {
  customer: string;
  due_date?: string;
  items: Array<{
    item_code: string;
    qty: number;
    rate?: number;
  }>;
}) => {
  const response = await authFetch('/api/sales/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoice),
  });
  return handleMutationResponse(response, 'Erreur lors de la creation de la facture');
};

// ============================================================================
// CRUD Operations - Quotations
// ============================================================================

export const getQuotations = async () => {
  try {
    const response = await authFetch('/api/sales/quotations');
    if (!response.ok) throw new Error('Failed to fetch quotations');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Get quotations error:', error);
    return [];
  }
};

export const createQuotation = async (quotation: {
  party_name: string;
  valid_till?: string;
  items: Array<{
    item_code: string;
    qty: number;
    rate?: number;
  }>;
}) => {
  const response = await authFetch('/api/sales/quotations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quotation),
  });
  return handleMutationResponse(response, 'Erreur lors de la creation du devis');
};

// ============================================================================
// CRUD Operations - Purchase Orders
// ============================================================================

export const getPurchaseOrders = async () => {
  try {
    const response = await authFetch('/api/purchase/orders');
    if (!response.ok) throw new Error('Failed to fetch purchase orders');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Get purchase orders error:', error);
    return [];
  }
};

export const createPurchaseOrder = async (order: {
  supplier: string;
  schedule_date: string;
  items: Array<{
    item_code: string;
    qty: number;
    rate?: number;
  }>;
}) => {
  const response = await authFetch('/api/purchase/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });
  return handleMutationResponse(response, 'Erreur lors de la creation de la commande achat');
};

// ============================================================================
// Delivery Notes
// ============================================================================

export const getDeliveryNotes = async () => {
  try {
    const response = await authFetch('/api/sales/delivery-notes');
    if (!response.ok) throw new Error('Failed to fetch delivery notes');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Get delivery notes error:', error);
    return [];
  }
};

export const createDeliveryNote = async (note: {
  customer: string;
  posting_date?: string;
  items: Array<{
    item_code: string;
    qty: number;
    rate?: number;
  }>;
}) => {
  const response = await authFetch('/api/sales/delivery-notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  });
  return handleMutationResponse(response, 'Erreur lors de la creation du bon de livraison');
};

// ============================================================================
// Purchase Invoices
// ============================================================================

export const getPurchaseInvoices = async () => {
  try {
    const response = await authFetch('/api/purchase/invoices');
    if (!response.ok) throw new Error('Failed to fetch purchase invoices');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Get purchase invoices error:', error);
    return [];
  }
};

export const createPurchaseInvoice = async (invoice: {
  supplier: string;
  due_date?: string;
  items: Array<{
    item_code: string;
    qty: number;
    rate?: number;
  }>;
}) => {
  const response = await authFetch('/api/purchase/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoice),
  });
  return handleMutationResponse(response, 'Erreur lors de la creation de la facture achat');
};

// ============================================================================
// Purchase Receipts
// ============================================================================

export const getPurchaseReceipts = async () => {
  try {
    const response = await authFetch('/api/purchase/receipts');
    if (!response.ok) throw new Error('Failed to fetch purchase receipts');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Get purchase receipts error:', error);
    return [];
  }
};

export const createPurchaseReceipt = async (receipt: {
  supplier: string;
  posting_date?: string;
  items: Array<{
    item_code: string;
    qty: number;
    rate?: number;
  }>;
}) => {
  const response = await authFetch('/api/purchase/receipts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(receipt),
  });
  return handleMutationResponse(response, 'Erreur lors de la creation de la reception');
};

// ============================================================================
// Payment Entries
// ============================================================================

export const getPaymentEntries = async () => {
  try {
    const response = await authFetch('/api/erp/accounting/payments');
    if (!response.ok) throw new Error('Failed to fetch payment entries');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Get payment entries error:', error);
    return [];
  }
};

export const createPaymentEntry = async (payment: {
  payment_type: 'Receive' | 'Pay';
  party_type: 'Customer' | 'Supplier';
  party: string;
  paid_amount: number;
  posting_date?: string;
  reference_no?: string;
  reference_date?: string;
  paid_from?: string;
  paid_to?: string;
}) => {
  const response = await authFetch('/api/erp/accounting/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payment),
  });
  return handleMutationResponse(response, 'Erreur lors de la creation du paiement');
};

// ============================================================================
// Journal Entries (Ecritures Comptables)
// ============================================================================

export const getJournalEntries = async () => {
  try {
    const response = await authFetch('/api/erp/accounting/journal-entries');
    if (!response.ok) throw new Error('Failed to fetch journal entries');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Get journal entries error:', error);
    return [];
  }
};

export const createJournalEntry = async (entry: {
  posting_date?: string;
  voucher_type?: string;
  accounts: Array<{
    account: string;
    debit_in_account_currency?: number;
    credit_in_account_currency?: number;
  }>;
  user_remark?: string;
}) => {
  const response = await authFetch('/api/erp/accounting/journal-entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  return handleMutationResponse(response, 'Erreur lors de la creation de l\'ecriture comptable');
};

// ============================================================================
// Accounts (Plan Comptable)
// ============================================================================

export const getAccounts = async () => {
  try {
    const response = await authFetch('/api/erp/accounting/accounts');
    if (!response.ok) throw new Error('Failed to fetch accounts');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Get accounts error:', error);
    return [];
  }
};

// ============================================================================
// CRUD Operations - Employees
// ============================================================================

export const getEmployees = async () => {
  try {
    const response = await authFetch('/api/hr/employees');
    if (!response.ok) throw new Error('Failed to fetch employees');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Get employees error:', error);
    return [];
  }
};

export const createEmployee = async (employee: {
  first_name: string;
  last_name?: string;
  company?: string;
  gender?: string;
  date_of_birth?: string;
  date_of_joining?: string;
  designation?: string;
  department?: string;
  cell_number?: string;
  personal_email?: string;
}) => {
  const response = await authFetch('/api/hr/employees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employee),
  });
  return handleMutationResponse(response, 'Erreur lors de la creation de l\'employe');
};

// ============================================================================
// Manufacturing - Work Orders
// ============================================================================

export const getWorkOrders = async () => {
  try {
    const response = await authFetch('/api/manufacturing/work-orders');
    if (!response.ok) throw new Error('Failed to fetch work orders');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Get work orders error:', error);
    return [];
  }
};

export const createWorkOrder = async (workOrder: {
  production_item: string;
  qty: number;
  bom_no?: string;
  planned_start_date?: string;
}) => {
  const response = await authFetch('/api/manufacturing/work-orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workOrder),
  });
  return handleMutationResponse(response, 'Erreur lors de la creation de l\'ordre de fabrication');
};

// ============================================================================
// Manufacturing - BOM (Nomenclatures)
// ============================================================================

export const getBOMs = async () => {
  try {
    const response = await authFetch('/api/manufacturing/bom');
    if (!response.ok) throw new Error('Failed to fetch BOMs');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Get BOMs error:', error);
    return [];
  }
};

export const createBOM = async (bom: {
  item: string;
  quantity: number;
  items: Array<{
    item_code: string;
    qty: number;
    rate?: number;
  }>;
  is_active?: boolean;
  is_default?: boolean;
}) => {
  const response = await authFetch('/api/manufacturing/bom', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bom),
  });
  return handleMutationResponse(response, 'Erreur lors de la creation de la nomenclature');
};

// ============================================================================
// Manufacturing - Stock Entries
// ============================================================================

export const getStockEntries = async () => {
  try {
    const response = await authFetch('/api/manufacturing/stock-entries');
    if (!response.ok) throw new Error('Failed to fetch stock entries');
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Get stock entries error:', error);
    return [];
  }
};

export const createStockEntry = async (entry: {
  stock_entry_type: 'Material Receipt' | 'Material Issue' | 'Material Transfer';
  items: Array<{
    item_code: string;
    qty: number;
    s_warehouse?: string;
    t_warehouse?: string;
  }>;
  posting_date?: string;
}) => {
  const response = await authFetch('/api/manufacturing/stock-entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  return handleMutationResponse(response, 'Erreur lors de la creation du mouvement de stock');
};

// ============================================================================
// Rename Document
// ============================================================================

export const renameDocument = async (doctype: string, oldName: string, newName: string) => {
  const response = await authFetch('/api/erp/rename', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doctype, old_name: oldName, new_name: newName }),
  });
  return handleMutationResponse(response, 'Erreur lors du renommage');
};

// ============================================================================
// CSV Import/Export Utilities
// ============================================================================

export const importFromCSV = async <T extends Record<string, unknown>>(
  file: File,
  createFn: (data: T) => Promise<unknown>
): Promise<{ success: number; errors: string[] }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        resolve({ success: 0, errors: ['Fichier CSV vide ou invalide'] });
        return;
      }

      const headerLine = lines[0];
      if (!headerLine) {
        resolve({ success: 0, errors: ['Fichier CSV vide'] });
        return;
      }

      // Auto-detect separator: semicolon (;) or comma (,)
      const sep = headerLine.includes(';') ? ';' : ',';
      const headers = headerLine.split(sep).map(h => (h || '').trim().replace(/^"|"$/g, ''));
      const results = { success: 0, errors: [] as string[] };

      for (let i = 1; i < lines.length; i++) {
        try {
          const currentLine = lines[i];
          if (!currentLine || !currentLine.trim()) continue;
          const values = currentLine.split(sep).map(v => (v || '').trim().replace(/^"|"$/g, ''));
          const record: Record<string, string> = {};
          headers.forEach((header, idx) => {
            if (header) record[header] = values[idx] || '';
          });

          // Skip rows where the first column (usually name) is empty
          const firstHeader = headers[0] ?? '';
          const firstVal = record[firstHeader];
          if (!firstVal || !firstVal.trim()) {
            results.errors.push(`Ligne ${i + 1}: Champ obligatoire "${firstHeader}" vide`);
            continue;
          }

          await createFn(record as T);
          results.success++;

          // Throttle: 150ms delay between requests to avoid rate limiting
          if (i < lines.length - 1) {
            await new Promise(r => setTimeout(r, 150));
          }
        } catch (err) {
          results.errors.push(`Ligne ${i + 1}: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
        }
      }

      resolve(results);
    };
    reader.readAsText(file);
  });
};

export const exportToCSV = <T>(
  data: T[],
  columns: { key: keyof T | string; label: string }[],
  filename: string
) => {
  const headers = columns.map(col => col.label).join(',');
  const rows = data.map(item =>
    columns.map(col => {
      const key = col.key as string;
      const itemAny = item as Record<string, unknown>;
      const value = key.includes('.')
        ? key.split('.').reduce((obj: unknown, k) => (obj as Record<string, unknown>)?.[k], item)
        : itemAny[key];
      const strValue = String(value ?? '');
      if (strValue.includes(',') || strValue.includes('"')) {
        return `"${strValue.replace(/"/g, '""')}"`;
      }
      return strValue;
    }).join(',')
  );

  const csv = [headers, ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

// ============================================================================
// Print Utilities
// ============================================================================

export const printDocument = <T>(
  data: T[],
  columns: { key: keyof T | string; label: string }[],
  title: string
) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const tableHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - MAOS</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap');
          body {
            font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            padding: 40px;
            color: #1a1a1a;
          }
          h1 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 8px;
          }
          .date {
            color: #666;
            font-size: 14px;
            margin-bottom: 24px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          th {
            background: #f5f5f7;
            padding: 12px 16px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #e5e5e5;
          }
          td {
            padding: 12px 16px;
            border-bottom: 1px solid #e5e5e5;
          }
          tr:hover {
            background: #fafafa;
          }
          .footer {
            margin-top: 32px;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="date">Genere le ${new Date().toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}</div>
        <table>
          <thead>
            <tr>
              ${columns.map(col => `<th>${col.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(item => {
              const itemAny = item as Record<string, unknown>;
              return `<tr>${columns.map(col => {
                const key = col.key as string;
                const value = key.includes('.')
                  ? key.split('.').reduce((obj: unknown, k) => (obj as Record<string, unknown>)?.[k], item)
                  : itemAny[key];
                return `<td>${value ?? '-'}</td>`;
              }).join('')}</tr>`;
            }).join('')}
          </tbody>
        </table>
        <div class="footer">
          Total: ${data.length} enregistrement(s) | MAOS - Multi-Agent Operating System
        </div>
        <script>window.onload = () => window.print();</script>
      </body>
    </html>
  `;

  printWindow.document.write(tableHtml);
  printWindow.document.close();
};

// ============================================================================
// PDF Document Print (Professional PDF via backend)
// ============================================================================

export const printDocumentPDF = async (doctype: string, name: string) => {
  try {
    const response = await authFetch('/api/reports/document-print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctype, name }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => null);
      throw new Error(err?.error || 'Erreur lors de la generation du PDF');
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  } catch (error) {
    console.error('PDF print error:', error);
    throw error;
  }
};
