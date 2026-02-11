"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/context/auth-context";
import { useSidebar } from "@/src/context/SidebarContext";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileText,
  ShoppingCart,
  Building2,
  Package,
  Warehouse,
  ExternalLink,
  Settings,
  LogOut,
  Building,
  Loader2,
  Receipt,
  Truck,
  ClipboardList,
  Calculator,
  BarChart3,
  DollarSign,
  CreditCard,
  UserCog,
  CalendarDays,
  FileBarChart,
  TrendingUp,
  Target,
  Factory,
  CheckCircle,
  FolderKanban,
  Headphones,
  Wrench,
  Plug,
  Landmark,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Types pour le RBAC
type UserRole = 'SUPERADMIN' | 'OWNER' | 'ADMIN' | 'MANAGER' | 'USER';

// Définition des accès par rôle
// SUPERADMIN/OWNER/ADMIN: Tout
// MANAGER: Opérationnel (CRM, Ventes, Achats, Stock, Projets, Support)
// USER: Métier de base (CRM clients, Ventes commandes, Stock articles)
const roleAccessMap: Record<UserRole, string[]> = {
  SUPERADMIN: ['crm', 'ventes', 'achats', 'stock', 'comptabilite', 'actifs', 'production', 'qualite', 'projets', 'support', 'rh', 'rapports', 'billing', 'superadmin', 'systeme'],
  OWNER: ['crm', 'ventes', 'achats', 'stock', 'comptabilite', 'actifs', 'production', 'qualite', 'projets', 'support', 'rh', 'rapports', 'billing', 'systeme'],
  ADMIN: ['crm', 'ventes', 'achats', 'stock', 'comptabilite', 'actifs', 'production', 'qualite', 'projets', 'support', 'rh', 'rapports', 'systeme'],
  MANAGER: ['crm', 'ventes', 'achats', 'stock', 'projets', 'support', 'rapports'],
  USER: ['crm', 'ventes', 'stock'],
};

// Navigation structurée par sections
const navigationSections = [
  {
    id: "crm",
    title: "CRM",
    items: [
      { name: "Dashboard CRM", href: "/crm", icon: BarChart3 },
      { name: "Clients", href: "/clients", icon: Users },
      { name: "Leads", href: "/leads", icon: UserPlus, minRole: 'MANAGER' as UserRole },
      { name: "Opportunités", href: "/opportunities", icon: Target, minRole: 'MANAGER' as UserRole },
    ],
  },
  {
    id: "ventes",
    title: "Ventes",
    items: [
      { name: "Dashboard Ventes", href: "/sales", icon: TrendingUp },
      { name: "Devis", href: "/quotations", icon: ClipboardList, minRole: 'MANAGER' as UserRole },
      { name: "Commandes", href: "/orders", icon: ShoppingCart },
      { name: "Livraisons", href: "/deliveries", icon: Truck },
      { name: "Factures Ventes", href: "/invoices", icon: FileText },
    ],
  },
  {
    id: "achats",
    title: "Achats",
    items: [
      { name: "Dashboard Achats", href: "/purchases", icon: BarChart3 },
      { name: "Fournisseurs", href: "/suppliers", icon: Building2 },
      { name: "Commandes Achats", href: "/purchase-orders", icon: ShoppingCart },
      { name: "Réceptions", href: "/purchase-receipts", icon: Truck },
      { name: "Factures Achats", href: "/purchase-invoices", icon: Receipt },
    ],
  },
  {
    id: "stock",
    title: "Stock",
    items: [
      { name: "Dashboard Stock", href: "/stock", icon: BarChart3 },
      { name: "Articles", href: "/products", icon: Package },
      { name: "Entrepôts", href: "/warehouses", icon: Warehouse, minRole: 'MANAGER' as UserRole },
      { name: "Mouvements", href: "/stock-entries", icon: BarChart3, minRole: 'MANAGER' as UserRole },
    ],
  },
  {
    id: "comptabilite",
    title: "Comptabilité",
    items: [
      { name: "Dashboard Compta", href: "/accounting", icon: BarChart3 },
      { name: "Plan Comptable", href: "/accounts", icon: Calculator },
      { name: "Écritures", href: "/journal-entries", icon: FileBarChart },
      { name: "Paiements", href: "/payments", icon: CreditCard },
      { name: "Trésorerie", href: "/treasury", icon: DollarSign },
    ],
  },
  {
    id: "actifs",
    title: "Actifs/Immo.",
    items: [
      { name: "Actifs", href: "/assets", icon: Landmark },
      { name: "Amortissements", href: "/depreciation", icon: TrendingUp },
    ],
  },
  {
    id: "production",
    title: "Production",
    items: [
      { name: "Ordres Fabrication", href: "/work-orders", icon: Factory },
      { name: "Nomenclatures", href: "/bom", icon: ClipboardList },
    ],
  },
  {
    id: "qualite",
    title: "Qualité",
    items: [
      { name: "Inspections", href: "/quality-inspections", icon: CheckCircle },
      { name: "Non-conformités", href: "/non-conformance", icon: FileText },
    ],
  },
  {
    id: "projets",
    title: "Projets",
    items: [
      { name: "Projets", href: "/projects", icon: FolderKanban },
      { name: "Tâches", href: "/tasks", icon: ClipboardList },
    ],
  },
  {
    id: "support",
    title: "Support",
    items: [
      { name: "Tickets", href: "/tickets", icon: Headphones },
      { name: "Base Connaissances", href: "/knowledge-base", icon: FileText },
    ],
  },
  {
    id: "rh",
    title: "RH",
    items: [
      { name: "Dashboard RH", href: "/hr", icon: BarChart3 },
      { name: "Employés", href: "/employees", icon: UserCog },
      { name: "Présences", href: "/attendance", icon: CalendarDays },
    ],
  },
  {
    id: "billing",
    title: "Abonnement",
    items: [
      { name: "Facturation", href: "/billing", icon: CreditCard },
    ],
  },
  {
    id: "superadmin",
    title: "SuperAdmin",
    items: [
      { name: "Clients MAOS", href: "/superadmin/customers", icon: Building2 },
      { name: "Facturation", href: "/superadmin/billing", icon: Receipt },
      { name: "Analytics", href: "/superadmin/analytics", icon: BarChart3 },
    ],
  },
  {
    id: "rapports",
    title: "Rapports",
    items: [
      { name: "Rapport d'Exploitation", href: "/reports/exploitation", icon: TrendingUp },
      { name: "Analyse Produit", href: "/reports/product-analysis", icon: Package },
      { name: "Tous les Rapports", href: "/reports", icon: FileBarChart },
    ],
  },
  {
    id: "systeme",
    title: "Système",
    items: [
      { name: "Paramètres", href: "/settings", icon: Settings },
      { name: "Outils", href: "/tools", icon: Wrench },
      { name: "Intégrations", href: "/integrations", icon: Plug },
    ],
  },
];

// Hiérarchie des rôles pour le filtrage des items
const roleHierarchy: Record<UserRole, number> = {
  SUPERADMIN: 5,
  OWNER: 4,
  ADMIN: 3,
  MANAGER: 2,
  USER: 1,
};

// Fonction pour vérifier si un rôle a accès à un niveau minimum
function hasMinRole(userRole: UserRole, minRole?: UserRole): boolean {
  if (!minRole) return true;
  return roleHierarchy[userRole] >= roleHierarchy[minRole];
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();
  const mountedRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  // Determine the user's effective role
  const userRole: UserRole = useMemo(() => {
    if (user?.isSuperAdmin) return 'SUPERADMIN';
    const tenantRole = user?.currentTenant?.role?.toUpperCase();
    if (tenantRole && tenantRole in roleHierarchy) {
      return tenantRole as UserRole;
    }
    return 'USER'; // Default to USER if no role defined
  }, [user]);

  // Filter navigation sections based on user role
  const filteredSections = useMemo(() => {
    const accessibleSections = roleAccessMap[userRole] || [];
    return navigationSections
      .filter(section => accessibleSections.includes(section.id))
      .map(section => ({
        ...section,
        items: section.items.filter(item => hasMinRole(userRole, item.minRole)),
      }))
      .filter(section => section.items.length > 0);
  }, [userRole]);

  // Calculate initial open sections based on current pathname
  const initialOpenSections = useMemo(() => {
    const sections: Record<string, boolean> = {};
    const activeSection = filteredSections.find(section =>
      section.items.some(item => pathname === item.href)
    );
    if (activeSection) {
      sections[activeSection.id] = true;
    }
    return sections;
  }, [pathname, filteredSections]);

  // État pour les sections ouvertes
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(initialOpenSections);

  // Avoid hydration mismatch - use ref to track first mount
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      setMounted(true);
    }
  }, []);

  // Auto-open section only when navigating to a new page
  useEffect(() => {
    if (mountedRef.current) {
      const activeSection = filteredSections.find(section =>
        section.items.some(item => pathname === item.href)
      );
      if (activeSection) {
        setOpenSections(prev => ({ ...prev, [activeSection.id]: true }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Toggle section ouverte/fermée
  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Determine logo based on theme
  const logoSrc = mounted && resolvedTheme === 'dark'
    ? '/logo_darkmode.png'
    : '/logo_lightmode.png';

  const handleLogout = async () => {
    await logout();
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (!user) return "?";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  // Close mobile sidebar when navigating
  const handleLinkClick = () => {
    if (isMobileOpen) {
      toggleMobileSidebar();
    }
  };

  // Sidebar content - reused for both desktop and mobile
  const sidebarContent = (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt="MAOS"
              className="h-8 w-auto"
            />
            <Badge variant="secondary" className="text-xs">
              v1.0
            </Badge>
          </div>
        </Link>
      </div>

      {/* User Info Section */}
      {user && (
        <div className="px-4 py-3 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.firstName} {user.lastName}
              </p>
              {user.currentTenant && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Building className="h-3 w-3" />
                  <span className="truncate">{user.currentTenant.name}</span>
                </div>
              )}
            </div>
          </div>
          <Badge variant="outline" className="mt-2 text-xs">
            {user.currentTenant?.role || userRole}
          </Badge>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {/* Dashboard (toujours visible) */}
          <Link
            href="/dashboard"
            onClick={handleLinkClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
              pathname === "/dashboard"
                ? "bg-muted text-primary font-medium"
                : "text-muted-foreground hover:bg-muted/50"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>

          {/* Sections rétractables (filtrées par rôle) */}
          {filteredSections.map((section) => {
            const isOpen = openSections[section.id] || false;
            const hasActiveItem = section.items.some(item => pathname === item.href);

            return (
              <div key={section.id} className="mt-1">
                {/* Header de section (cliquable) */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2 rounded-lg transition-all",
                    "text-xs font-semibold uppercase tracking-wider",
                    hasActiveItem
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <span>{section.title}</span>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {/* Items de la section (visibles si ouverte) */}
                {isOpen && (
                  <div className="ml-2 border-l border-muted pl-2 mt-1 space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={handleLinkClick}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                            isActive
                              ? "bg-muted text-primary font-medium"
                              : "text-muted-foreground hover:bg-muted/50"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-sm"
          onClick={handleLogout}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          Deconnexion
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden border-r bg-muted/40 md:block w-64">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r bg-background transform transition-transform duration-300 ease-in-out md:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </div>
    </>
  );
}
