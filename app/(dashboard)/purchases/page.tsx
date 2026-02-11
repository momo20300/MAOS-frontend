"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPurchaseDashboard, PurchaseDashboardData } from "@/lib/services/erpnext";
import {
  ShoppingCart, TrendingUp, TrendingDown, Building2,
  AlertTriangle, RefreshCw, BarChart3, DollarSign,
  ArrowRight, FileText, Receipt, Calendar, Truck,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#6bbc8e", "#4f9cf7", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];
const STATUS_COLORS: Record<string, string> = {
  "To Receive and Bill": "#4f9cf7",
  "To Bill": "#f59e0b",
  "To Receive": "#8b5cf6",
  Completed: "#6bbc8e",
  Closed: "#94a3b8",
  Cancelled: "#ef4444",
};

export default function PurchaseDashboardPage() {
  const [data, setData] = useState<PurchaseDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    setError(null);
    try {
      const result = await getPurchaseDashboard();
      if (result) {
        setData(result);
      } else {
        setError("Impossible de charger les donnees achats");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Chargement des achats...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
          <p className="text-lg">{error || "Donnees indisponibles"}</p>
          <Button onClick={() => fetchData(true)}>Reessayer</Button>
        </div>
      </div>
    );
  }

  const { kpis, topSuppliers, monthly, poStatusDistribution, supplierGroups, overduePINVs, recentPOs } = data;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Achats</h2>
          <p className="text-muted-foreground">
            Tableau de bord des approvisionnements
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/purchase-orders">
            <Button variant="outline" className="rounded-xl">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Commandes
            </Button>
          </Link>
          <Link href="/suppliers">
            <Button variant="outline" className="rounded-xl">
              <Building2 className="mr-2 h-4 w-4" />
              Fournisseurs
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Achats du Mois</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.thisMonthTotal.toLocaleString("fr-FR")} MAD
            </div>
            <div className="flex items-center gap-1 mt-1">
              {kpis.growth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-success-400" />
              ) : (
                <TrendingDown className="h-3 w-3 text-danger-400" />
              )}
              <span className={`text-xs font-medium ${kpis.growth >= 0 ? "text-success-400" : "text-danger-400"}`}>
                {kpis.growth > 0 ? "+" : ""}{kpis.growth}%
              </span>
              <span className="text-xs text-muted-foreground">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Achats Cumules</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.yearTotal.toLocaleString("fr-FR")} MAD
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.poCount} commandes cette annee
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Impaye Fournisseurs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger-400">
              {kpis.outstandingAmount.toLocaleString("fr-FR")} MAD
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.outstandingCount} facture(s) en attente
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fournisseurs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.supplierCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Commande moy: {kpis.avgPO.toLocaleString("fr-FR")} MAD
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Concentration Alert */}
      {kpis.concentration > 60 && (
        <Card className="rounded-2xl border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Dependance fournisseur elevee: {kpis.concentration}%
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                Les 3 premiers fournisseurs representent plus de 60% des achats.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Purchases Chart */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Achats Mensuels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full" style={{ minWidth: 0 }}>
            {monthly.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={monthly} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toLocaleString("fr-FR")} MAD`, "Achats"]}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="total" name="Achats" fill="#4f9cf7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Aucune donnee pour cette annee
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row: PO Status + Supplier Groups */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4" />
              Statut des Commandes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full" style={{ minWidth: 0 }}>
              {poStatusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={poStatusDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      nameKey="status"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {poStatusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucune commande enregistree
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Groupes Fournisseurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full" style={{ minWidth: 0 }}>
              {supplierGroups.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={supplierGroups} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" width={80} />
                    <Tooltip formatter={(value) => [`${value}`, "Fournisseurs"]} />
                    <Bar dataKey="count" name="Fournisseurs" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucun groupe defini
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables: Top Suppliers + Overdue PINVs */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top 10 Suppliers */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Top 10 Fournisseurs
              </CardTitle>
              <Link href="/suppliers">
                <Button variant="ghost" size="sm" className="text-xs">
                  Voir tout <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {topSuppliers.length > 0 ? (
              topSuppliers.map((supplier, index) => (
                <div
                  key={supplier.name}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? "bg-yellow-500/20 text-yellow-600" :
                    index === 1 ? "bg-gray-400/20 text-gray-500" :
                    index === 2 ? "bg-orange-500/20 text-orange-500" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{supplier.name}</p>
                    <p className="text-xs text-muted-foreground">{supplier.pct}% des achats</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {supplier.total.toLocaleString("fr-FR")} MAD
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">Aucune commande enregistree</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Purchase Invoices */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-danger-400" />
                Factures Achats en Retard
              </CardTitle>
              <Link href="/purchase-invoices">
                <Button variant="ghost" size="sm" className="text-xs">
                  Voir tout <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {overduePINVs.length > 0 ? (
              overduePINVs.slice(0, 8).map((inv) => (
                <div
                  key={inv.name}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{inv.name}</span>
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        {inv.daysOverdue}j
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{inv.supplier}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-danger-400">
                      {inv.amount.toLocaleString("fr-FR")} MAD
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                      <Calendar className="h-2.5 w-2.5" />
                      {new Date(inv.dueDate).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-success-400" />
                <p className="text-sm font-medium">Aucune facture en retard</p>
                <p className="text-xs">Paiements fournisseurs a jour</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent POs */}
      {recentPOs.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Commandes Recentes
              </CardTitle>
              <Link href="/purchase-orders">
                <Button variant="ghost" size="sm" className="text-xs">
                  Voir tout <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentPOs.map((po) => (
                <div
                  key={po.name}
                  className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{po.name}</span>
                      <Badge variant="secondary" className="rounded-lg text-xs">
                        {po.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{po.supplier_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      {(po.base_grand_total || 0).toLocaleString("fr-FR")} MAD
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(po.transaction_date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
