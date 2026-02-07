/**
 * Module Visibility Utility
 * Determines which modules and features are available based on tenant pack and metier
 */

// Local enums mirroring backend/prisma/schema.prisma — avoid @prisma/client in frontend
export enum Pack {
  STANDARD = 'STANDARD',
  PRO = 'PRO',
  PRO_PLUS = 'PRO_PLUS',
}

export enum Metier {
  GESTION_COMMERCIALE = 'GESTION_COMMERCIALE',
  RETAIL = 'RETAIL',
  RESTAURATION = 'RESTAURATION',
  APPART_HOTEL = 'APPART_HOTEL',
  SERVICES = 'SERVICES',
  ATELIER_PRODUCTION = 'ATELIER_PRODUCTION',
  BTP_CHANTIER = 'BTP_CHANTIER',
  TRANSPORT_LOGISTIQUE = 'TRANSPORT_LOGISTIQUE',
  BEAUTE_SALON = 'BEAUTE_SALON',
  FITNESS_WELLNESS = 'FITNESS_WELLNESS',
  IMMOBILIER = 'IMMOBILIER',
}

export interface ModuleConfig {
    sales: boolean;
    inventory: boolean;
    crm: boolean;
    finance: boolean;
    payroll: boolean;
    pos: boolean;
    manufacturing: boolean;
    projects: boolean;
    scheduling: boolean;
    documents: boolean;
    reports: boolean;
    alerts: boolean;
}

// Module activation matrix from PRODUCT_STRATEGY.md
const MODULE_ACTIVATION: Partial<Record<Metier, Record<Pack, ModuleConfig>>> = {
    [Metier.RETAIL]: {
        [Pack.STANDARD]: {
            sales: true,
            inventory: true,
            crm: true,
            finance: true,
            payroll: false,
            pos: true,
            manufacturing: false,
            projects: false,
            scheduling: false,
            documents: true,
            reports: true,
            alerts: false,
        },
        [Pack.PRO]: {
            sales: true,
            inventory: true,
            crm: true,
            finance: true,
            payroll: true,
            pos: true,
            manufacturing: false,
            projects: false,
            scheduling: true,
            documents: true,
            reports: true,
            alerts: true,
        },
        [Pack.PRO_PLUS]: {
            sales: true,
            inventory: true,
            crm: true,
            finance: true,
            payroll: true,
            pos: true,
            manufacturing: false,
            projects: true,
            scheduling: true,
            documents: true,
            reports: true,
            alerts: true,
        },
    },
    [Metier.RESTAURATION]: {
        [Pack.STANDARD]: {
            sales: true,
            inventory: true,
            crm: false,
            finance: true,
            payroll: false,
            pos: true,
            manufacturing: false,
            projects: false,
            scheduling: true,
            documents: false,
            reports: true,
            alerts: false,
        },
        [Pack.PRO]: {
            sales: true,
            inventory: true,
            crm: true,
            finance: true,
            payroll: true,
            pos: true,
            manufacturing: false,
            projects: false,
            scheduling: true,
            documents: true,
            reports: true,
            alerts: true,
        },
        [Pack.PRO_PLUS]: {
            sales: true,
            inventory: true,
            crm: true,
            finance: true,
            payroll: true,
            pos: true,
            manufacturing: false,
            projects: true,
            scheduling: true,
            documents: true,
            reports: true,
            alerts: true,
        },
    },
    // Add other metiers with same structure...
    [Metier.GESTION_COMMERCIALE]: {
        [Pack.STANDARD]: {
            sales: true,
            inventory: true,
            crm: true,
            finance: true,
            payroll: false,
            pos: false,
            manufacturing: false,
            projects: false,
            scheduling: false,
            documents: true,
            reports: true,
            alerts: false,
        },
        [Pack.PRO]: {
            sales: true,
            inventory: true,
            crm: true,
            finance: true,
            payroll: true,
            pos: false,
            manufacturing: false,
            projects: true,
            scheduling: true,
            documents: true,
            reports: true,
            alerts: true,
        },
        [Pack.PRO_PLUS]: {
            sales: true,
            inventory: true,
            crm: true,
            finance: true,
            payroll: true,
            pos: false,
            manufacturing: false,
            projects: true,
            scheduling: true,
            documents: true,
            reports: true,
            alerts: true,
        },
    },
};

/**
 * Get module configuration for a tenant
 */
export function getModuleConfig(metier: string, pack: string): ModuleConfig {
    return MODULE_ACTIVATION[metier as Metier]?.[pack as Pack] || MODULE_ACTIVATION[Metier.GESTION_COMMERCIALE]![Pack.STANDARD];
}

/**
 * Check if a specific module is enabled
 */
export function isModuleEnabled(metier: string, pack: string, module: keyof ModuleConfig): boolean {
    const config = getModuleConfig(metier, pack);
    return config[module];
}

/**
 * Get navigation items based on enabled modules
 */
export function getEnabledNavItems(metier: string, pack: string) {
    const config = getModuleConfig(metier, pack);

    const navItems: Array<{ name: string; path: string; icon: string; enabled: boolean }> = [
        { name: 'Ventes', path: '/dashboard/ventes', icon: 'TrendingUp', enabled: config.sales },
        { name: 'Stock', path: '/dashboard/stock', icon: 'Package', enabled: config.inventory },
        { name: 'Clients', path: '/dashboard/clients', icon: 'Users', enabled: config.crm },
        { name: 'Finances', path: '/dashboard/finances', icon: 'DollarSign', enabled: config.finance },
        { name: 'RH', path: '/dashboard/rh', icon: 'Briefcase', enabled: config.payroll },
        { name: 'POS', path: '/dashboard/pos', icon: 'ShoppingCart', enabled: config.pos },
        { name: 'Production', path: '/dashboard/production', icon: 'Factory', enabled: config.manufacturing },
        { name: 'Projets', path: '/dashboard/projets', icon: 'FolderKanban', enabled: config.projects },
        { name: 'Planning', path: '/dashboard/planning', icon: 'Calendar', enabled: config.scheduling },
        { name: 'Documents', path: '/dashboard/documents', icon: 'FileText', enabled: config.documents },
        { name: 'Rapports', path: '/dashboard/rapports', icon: 'BarChart', enabled: config.reports },
        { name: 'Alertes', path: '/dashboard/alertes', icon: 'Bell', enabled: config.alerts },
    ];

    return navItems.filter(item => item.enabled);
}
