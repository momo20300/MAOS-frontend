"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStockDashboard, StockDashboardData } from "@/lib/services/erpnext";
import {
  Package, AlertTriangle, RefreshCw, BarChart3, DollarSign,
  ArrowRight, Warehouse, TrendingUp, ArrowDownUp,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#6bbc8e", "#4f9cf7", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#14b8a6"];
const ENTRY_COLORS: Record<string, string> = {
  "Material Receipt": "#6bbc8e",
  "Material Issue": "#ef4444",
  "Material Transfer": "#4f9cf7",
  Manufacture: "#f59e0b",
  Repack: "#8b5cf6",
};

export default function StockDashboardPage() {
  const [data, setData] = useState<StockDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    setError(null);
    try {
      const result = await getStockDashboard();
      if (result) {
        setData(result);
      } else {
        setError("Impossible de charger les donnees stock");
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
          <p className="text-lg text-muted-foreground">Chargement du stock...</p>
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

  const { kpis, warehouseValues, topItemsByValue, itemGroups, entryTypes, criticalItems, lowStockItems } = data;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Stock</h2>
          <p className="text-muted-foreground">
            Tableau de bord de l&apos;inventaire
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/products">
            <Button variant="outline" className="rounded-xl">
              <Package className="mr-2 h-4 w-4" />
              Articles
            </Button>
          </Link>
          <Link href="/stock-entries">
            <Button variant="outline" className="rounded-xl">
              <ArrowDownUp className="mr-2 h-4 w-4" />
              Mouvements
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/products">
          <Card className="rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Valeur Totale</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpis.totalStockValue.toLocaleString("fr-FR")} MAD
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.totalItems} article(s) stockables
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/products">
          <Card className="rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Articles Critiques</CardTitle>
              <AlertTriangle className="h-4 w-4 text-danger-400" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpis.criticalCount > 0 ? "text-danger-400" : "text-success-400"}`}>
                {kpis.criticalCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                En rupture de stock
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/products">
          <Card className="rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Stock Bas</CardTitle>
              <TrendingUp className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpis.lowStockCount > 0 ? "text-yellow-600" : "text-success-400"}`}>
                {kpis.lowStockCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Sous seuil de reserve
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/warehouses">
          <Card className="rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Entrepots</CardTitle>
              <Warehouse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.activeWarehouses}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.entriesThisMonth} mouvement(s) ce mois
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Critical Items Alert */}
      {kpis.criticalCount > 0 && (
        <Card className="rounded-2xl border-red-500/50 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {kpis.criticalCount} article(s) en rupture de stock
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">
                Action requise: verifiez les commandes fournisseurs pour ces articles.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row 1: Warehouse Values + Item Groups */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Warehouse className="h-4 w-4" />
              Valeur par Entrepot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full" style={{ minWidth: 0 }}>
              {warehouseValues.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={warehouseValues}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {warehouseValues.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${Number(value).toLocaleString("fr-FR")} MAD`, "Valeur"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucun entrepot
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" />
              Categories d&apos;Articles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full" style={{ minWidth: 0 }}>
              {itemGroups.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={itemGroups} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" width={80} />
                    <Tooltip formatter={(value) => [`${value}`, "Articles"]} />
                    <Bar dataKey="count" name="Articles" fill="#4f9cf7" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucune categorie
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Items by Value */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Top Articles par Valeur de Stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full" style={{ minWidth: 0 }}>
            {topItemsByValue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={topItemsByValue.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 20, left: 120, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    className="text-muted-foreground"
                  />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} className="text-muted-foreground" width={120} />
                  <Tooltip formatter={(value) => [`${Number(value).toLocaleString("fr-FR")} MAD`, "Valeur"]} />
                  <Bar dataKey="value" name="Valeur Stock" fill="#6bbc8e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Aucune donnee de stock
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Entry Types + Mouvements this month */}
      {entryTypes.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowDownUp className="h-4 w-4" />
              Mouvements de Stock (ce mois)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full" style={{ minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={entryTypes} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="type" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <Tooltip />
                  <Bar dataKey="count" name="Nombre" radius={[4, 4, 0, 0]}>
                    {entryTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ENTRY_COLORS[entry.type] || COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tables: Critical Items + Low Stock */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Critical Items (Rupture) */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-danger-400" />
                Articles en Rupture
              </CardTitle>
              <Link href="/products">
                <Button variant="ghost" size="sm" className="text-xs">
                  Voir tout <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {criticalItems.length > 0 ? (
              criticalItems.map((item) => (
                <Link href="/products" key={item.code} className="block">
                  <div
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.code} - {item.group}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{item.warehouse}</span>
                      <Badge variant="destructive" className="text-xs">
                        {item.qty}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-success-400" />
                <p className="text-sm font-medium">Aucune rupture</p>
                <p className="text-xs">Tous les articles sont en stock</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-yellow-500" />
                Stock Bas
              </CardTitle>
              <Link href="/products">
                <Button variant="ghost" size="sm" className="text-xs">
                  Voir tout <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item) => (
                <Link href="/products" key={item.code} className="block">
                  <div
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.code}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{item.warehouse}</span>
                      <Badge className="text-xs bg-yellow-500">
                        {item.qty} / {item.reserved}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">Stock OK</p>
                <p className="text-xs">Aucun article sous seuil</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
