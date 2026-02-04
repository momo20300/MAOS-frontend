/**
 * MAOS Backend Service
 *
 * IMPORTANT: Toutes les donnees transitent via le backend MAOS (port 4000)
 * JAMAIS d'appels directs vers d'autres services (port 8080, etc.)
 *
 * Ce fichier etait anciennement connecte directement a ERPNext.
 * Maintenant il utilise le backend MAOS comme seul point d'entree.
 */

import { authFetch } from './auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function getDashboardKPIs() {
  try {
    const response = await authFetch('/api/dashboard/kpis');
    if (!response.ok) throw new Error('Failed to fetch KPIs');
    const data = await response.json();
    return data.data || {
      revenue: 0,
      unpaidInvoices: 0,
      criticalStock: 0,
      customers: 0,
    };
  } catch (error) {
    console.error('MAOS Backend erreur:', error);
    return { revenue: 0, unpaidInvoices: 0, criticalStock: 0, customers: 0 };
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    const response = await authFetch('/api/health');
    return response.ok;
  } catch {
    return false;
  }
}

// NOTE: Ces fonctions utilisent maintenant le backend MAOS
// et non plus des appels directs vers d'autres services
