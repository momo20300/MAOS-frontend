/**
 * ERPNext Service
 * Provides data access through the authenticated backend API
 * All calls go through NestJS which handles ERPNext integration
 */

import { authFetch } from './auth';

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
  customer_type: 'Company' | 'Individual';
  customer_group?: string;
  territory?: string;
  mobile_no?: string;
  email_id?: string;
}) => {
  const response = await authFetch('/api/crm/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customer),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la creation du client');
  }
  return response.json();
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
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la mise a jour du client');
  }
  return response.json();
};

export const deleteCustomer = async (name: string) => {
  const response = await authFetch(`/api/crm/customers/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la suppression du client');
  }
  return response.json();
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
  const response = await authFetch('/api/purchase/suppliers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(supplier),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la creation du fournisseur');
  }
  return response.json();
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
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la mise a jour du fournisseur');
  }
  return response.json();
};

export const deleteSupplier = async (name: string) => {
  const response = await authFetch(`/api/purchase/suppliers/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la suppression du fournisseur');
  }
  return response.json();
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
  const response = await authFetch('/api/stock/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la creation du produit');
  }
  return response.json();
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
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la mise a jour du produit');
  }
  return response.json();
};

export const deleteItem = async (name: string) => {
  const response = await authFetch(`/api/stock/items/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la suppression du produit');
  }
  return response.json();
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
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la creation du lead');
  }
  return response.json();
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
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la creation de la commande');
  }
  return response.json();
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
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la creation de la facture');
  }
  return response.json();
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
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la creation du devis');
  }
  return response.json();
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
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la creation de la commande achat');
  }
  return response.json();
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
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la creation de l\'employe');
  }
  return response.json();
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
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la creation de l\'ordre de fabrication');
  }
  return response.json();
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
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la creation de la nomenclature');
  }
  return response.json();
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
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erreur lors de la creation du mouvement de stock');
  }
  return response.json();
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
      const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const results = { success: 0, errors: [] as string[] };

      for (let i = 1; i < lines.length; i++) {
        try {
          const currentLine = lines[i];
          if (!currentLine) continue;
          const values = currentLine.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const record: Record<string, string> = {};
          headers.forEach((header, idx) => {
            record[header] = values[idx] || '';
          });
          await createFn(record as T);
          results.success++;
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
