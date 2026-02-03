// 🏢 MAOS ERP - Service Backend Métier
const MAOS_ERP_URL = process.env.NEXT_PUBLIC_MAOS_ERP_URL || 'http://localhost:8080';
const API_KEY = process.env.NEXT_PUBLIC_MAOS_ERP_API_KEY || '';
const API_SECRET = process.env.NEXT_PUBLIC_MAOS_ERP_API_SECRET || '';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `token ${API_KEY}:${API_SECRET}`,
});

export async function getDashboardKPIs() {
  try {
    const [revenue, invoices, stock, customers] = await Promise.allSettled([
      getRevenue(),
      getUnpaidInvoices(),
      getCriticalStock(),
      getActiveCustomers(),
    ]);

    return {
      revenue: revenue.status === 'fulfilled' ? revenue.value : 0,
      unpaidInvoices: invoices.status === 'fulfilled' ? invoices.value : 0,
      criticalStock: stock.status === 'fulfilled' ? stock.value : 0,
      customers: customers.status === 'fulfilled' ? customers.value : 0,
    };
  } catch (error) {
    console.error('❌ MAOS ERP erreur:', error);
    return { revenue: 0, unpaidInvoices: 0, criticalStock: 0, customers: 0 };
  }
}

async function getRevenue(): Promise<number> {
  try {
    const response = await fetch(`${MAOS_ERP_URL}/api/resource/Sales Invoice`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Erreur');
    const data = await response.json();
    const paid = data.data?.filter((inv: any) => inv.status === 'Paid') || [];
    return paid.reduce((sum: number, inv: any) => sum + (inv.grand_total || 0), 0);
  } catch {
    return 0;
  }
}

async function getUnpaidInvoices(): Promise<number> {
  try {
    const response = await fetch(`${MAOS_ERP_URL}/api/resource/Sales Invoice`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Erreur');
    const data = await response.json();
    const unpaid = data.data?.filter(
      (inv: any) => inv.status !== 'Paid' && inv.status !== 'Cancelled'
    ) || [];
    return unpaid.length;
  } catch {
    return 0;
  }
}

async function getCriticalStock(): Promise<number> {
  try {
    const response = await fetch(`${MAOS_ERP_URL}/api/resource/Item`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Erreur');
    const data = await response.json();
    const critical = data.data?.filter(
      (item: any) => item.stock_qty < item.reorder_level
    ) || [];
    return critical.length;
  } catch {
    return 0;
  }
}

async function getActiveCustomers(): Promise<number> {
  try {
    const response = await fetch(`${MAOS_ERP_URL}/api/resource/Customer`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Erreur');
    const data = await response.json();
    return data.data?.length || 0;
  } catch {
    return 0;
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${MAOS_ERP_URL}/api/method/frappe.auth.get_logged_user`, {
      headers: getHeaders(),
    });
    return response.ok;
  } catch {
    return false;
  }
}
