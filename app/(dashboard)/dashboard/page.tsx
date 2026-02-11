"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ErrorMessage } from "@/components/ui/error-message";
import { getHomeDashboard, HomeDashboardData } from "@/lib/services/erpnext";
import { useAuth } from "@/lib/context/auth-context";
import {
  DollarSign, FileText, Package, Users, TrendingUp, TrendingDown,
  AlertCircle, RefreshCw, ShoppingCart, Trophy, BarChart3,
  Factory, FolderKanban, CheckCircle, Headphones, Calculator,
  UserPlus, Target, ArrowRight, AlertTriangle, Boxes
} from "lucide-react";
import MaosInsights from "@/components/maos/MaosInsights";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const EMPTY_MONTHLY = [
  "Jan", "Fev", "Mar", "Avr", "Mai", "Jun",
  "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"
].map(month => ({ month, ventes: 0, achats: 0, marge: 0, stock: 0 }));

const MODULE_CARDS = [
  { key: "sales", label: "Ventes", icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", link: "/sales" },
  { key: "purchases", label: "Achats", icon: ShoppingCart, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30", link: "/purchases" },
  { key: "stock", label: "Stock", icon: Package, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30", link: "/stock" },
  { key: "accounting", label: "Comptabilite", icon: Calculator, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30", link: "/accounting" },
  { key: "crm", label: "CRM", icon: UserPlus, color: "text-pink-600", bg: "bg-pink-50 dark:bg-pink-950/30", link: "/crm" },
  { key: "hr", label: "RH", icon: Users, color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-950/30", link: "/hr" },
  { key: "manufacturing", label: "Production", icon: Factory, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", link: "/manufacturing" },
  { key: "projects", label: "Projets", icon: FolderKanban, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30", link: "/projects-dashboard" },
  { key: "quality", label: "Qualite", icon: CheckCircle, color: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-950/30", link: "/quality" },
  { key: "support", label: "Support", icon: Headphones, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/30", link: "/support-dashboard" },
  { key: "assets", label: "Actifs", icon: Boxes, color: "text-slate-600", bg: "bg-slate-50 dark:bg-slate-950/30", link: "/assets-dashboard" },
  { key: "reports", label: "Rapports", icon: BarChart3, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30", link: "/reports-dashboard" },
] as const;

function fmtK(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString("fr-FR");
}

function getModuleMetric(data: HomeDashboardData, key: string): string {
  switch (key) {
    case "sales": return `${data.sales.invoiceCount} factures`;
    case "purchases": return `${data.purchases.poCount} commandes`;
    case "stock": return `${data.stock.totalItems} articles`;
    case "accounting": return `${fmtK(data.finance.revenue)} MAD CA`;
    case "crm": return `${data.crm.totalCustomers} clients`;
    case "hr": return `${data.hr.activeEmployees} employes`;
    case "manufacturing": return `${data.manufacturing.totalWO} OF`;
    case "projects": return `${data.projects.totalProjects} projets`;
    case "quality": return `${data.quality.acceptanceRate}% accepte`;
    case "support": return `${data.support.openIssues} ouverts`;
    case "assets": return "Voir actifs";
    case "reports": return "Voir rapports";
    default: return "";
  }
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<HomeDashboardData | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setInitialLoading(true);
    else setIsRefreshing(true);
    setError(null);
    try {
      const result = await getHomeDashboard();
      if (result) setData(result);
      else setError("Impossible de charger les donnees");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    }
    setInitialLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(async () => {
      try {
        const result = await getHomeDashboard();
        if (result) setData(result);
      } catch { /* silent */ }
    }, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  const monthly = data?.monthly && data.monthly.length > 0 ? data.monthly : EMPTY_MONTHLY;
  const hasChartData = monthly.some(d => d.ventes > 0 || d.achats > 0);
  const margin = data?.finance.margin || 0;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tableau de Bord</h2>
          <p className="text-sm text-muted-foreground">Vue globale de votre activite</p>
        </div>
        <button
          onClick={() => fetchData(false)}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {error && (
        <ErrorMessage
          title="Erreur de chargement"
          message={error}
          onRetry={() => fetchData(false)}
        />
      )}

      {/* Row 1: Primary KPI Cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {/* CA Annuel */}
        <Link href="/sales">
          <Card className="py-2 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between py-1 px-4">
              <CardTitle className="text-xs font-medium">CA Annuel</CardTitle>
              <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
            </CardHeader>
            <CardContent className="py-1 px-4">
              <div className="text-xl font-bold text-emerald-600">
                {fmtK(data?.finance.revenue || 0)} MAD
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px] text-muted-foreground">12 derniers mois</p>
                {data?.sales.thisMonthCA ? (
                  <div className="flex items-center gap-0.5">
                    <TrendingUp className="h-2.5 w-2.5 text-emerald-500" />
                    <span className="text-[10px] text-emerald-600 font-medium">{fmtK(data.sales.thisMonthCA)} ce mois</span>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Marge Nette */}
        <Link href="/accounting">
          <Card className="py-2 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between py-1 px-4">
              <CardTitle className="text-xs font-medium">Marge Nette</CardTitle>
              <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
            </CardHeader>
            <CardContent className="py-1 px-4">
              <div className={`text-xl font-bold ${margin >= 10 ? "text-blue-600" : "text-orange-600"}`}>
                {fmtK(data?.finance.profit || 0)} MAD
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px] text-muted-foreground">Benefice cumule</p>
                <Badge variant={margin >= 10 ? "default" : "destructive"} className="text-[10px] px-1.5 py-0">
                  {margin.toFixed(1)}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Factures Impayees */}
        <Link href="/invoices">
          <Card className="py-2 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between py-1 px-4">
              <CardTitle className="text-xs font-medium">Factures Impayees</CardTitle>
              <FileText className="h-3.5 w-3.5 text-yellow-500" />
            </CardHeader>
            <CardContent className="py-1 px-4">
              <div className={`text-xl font-bold ${(data?.sales.unpaidCount || 0) > 0 ? "text-yellow-600" : "text-muted-foreground"}`}>
                {data?.sales.unpaidCount || 0}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px] text-muted-foreground">
                  {data?.sales.unpaidAmount ? `${fmtK(data.sales.unpaidAmount)} MAD` : "A recouvrer"}
                </p>
                {(data?.sales.unpaidCount || 0) > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-yellow-600 border-yellow-300">En attente</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Stock Critique */}
        <Link href="/stock">
          <Card className="py-2 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between py-1 px-4">
              <CardTitle className="text-xs font-medium">Stock Critique</CardTitle>
              <AlertCircle className="h-3.5 w-3.5 text-red-500" />
            </CardHeader>
            <CardContent className="py-1 px-4">
              <div className={`text-xl font-bold ${(data?.stock.criticalCount || 0) > 0 ? "text-red-600" : "text-muted-foreground"}`}>
                {data?.stock.criticalCount || 0}
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px] text-muted-foreground">Articles sous seuil</p>
                {(data?.stock.criticalCount || 0) > 0 && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Alerte</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Row 2: Monthly Performance Chart */}
      <Link href="/reports/exploitation">
      <Card className="h-[220px] cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Performance {data?.year || new Date().getFullYear()}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="h-[150px] w-full" style={{ minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={monthly} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-muted-foreground" />
                <Tooltip
                  formatter={(value) => [`${Number(value).toLocaleString()} MAD`]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="ventes" name="Ventes" stroke="#6bbc8e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="achats" name="Achats" stroke="#c3758c" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="marge" name="Marge" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="stock" name="Stock" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      </Link>

      {/* Row 3: Module Summary Grid */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Modules</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {MODULE_CARDS.map((mod) => {
            const Icon = mod.icon;
            const metric = data ? getModuleMetric(data, mod.key) : "...";
            return (
              <Link key={mod.key} href={mod.link}>
                <Card className="py-3 px-4 hover:shadow-md transition-shadow cursor-pointer group h-full">
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg ${mod.bg}`}>
                      <Icon className={`h-4 w-4 ${mod.color}`} />
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-semibold">{mod.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{metric}</p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Row 4: Top Products + MAOS Insights */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Top Produits
                </CardTitle>
                <CardDescription>Meilleures ventes</CardDescription>
              </div>
              {data?.sales.thisMonthCA ? (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">CA du Mois</p>
                  <p className="text-lg font-bold text-emerald-600">
                    {fmtK(data.sales.thisMonthCA)} MAD
                  </p>
                </div>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {data?.sales.topProducts && data.sales.topProducts.length > 0 ? (
              data.sales.topProducts.slice(0, 5).map((product, index) => (
                <Link key={product.name} href="/reports/product-analysis" className="block">
                <div
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer"
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? "bg-yellow-500/20 text-yellow-600" :
                    index === 1 ? "bg-gray-400/20 text-gray-500" :
                    index === 2 ? "bg-orange-500/20 text-orange-500" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.qty} vendus</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-600">
                      {product.revenue.toLocaleString("fr-FR")} MAD
                    </p>
                  </div>
                </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">Aucune vente enregistree</p>
              </div>
            )}
          </CardContent>
        </Card>

        <MaosInsights />
      </div>

      {/* Row 5: Alerts */}
      {data?.alerts && data.alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Alertes</h3>
          <div className="grid gap-2 md:grid-cols-2">
            {data.alerts.map((alert, idx) => (
              <Link key={idx} href={alert.link}>
                <Card className={`py-2.5 px-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 ${
                  alert.priority === "HIGH" ? "border-l-red-500" : "border-l-yellow-500"
                }`}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                      alert.priority === "HIGH" ? "text-red-500" : "text-yellow-500"
                    }`} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.detail}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
