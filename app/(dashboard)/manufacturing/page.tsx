"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getManufacturingDashboard, ManufacturingDashboardData } from "@/lib/services/erpnext";
import {
  Factory, ClipboardList, Package, CheckCircle,
  AlertTriangle, RefreshCw, BarChart3, ArrowRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#6bbc8e", "#4f9cf7", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

const STATUS_COLORS: Record<string, string> = {
  "Not Started": "bg-gray-500",
  "In Process": "bg-blue-500 text-white",
  "Completed": "bg-success-400",
  "Stopped": "bg-danger-400 text-white",
  "Cancelled": "bg-red-300",
};

export default function ManufacturingDashboardPage() {
  const [data, setData] = useState<ManufacturingDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    setError(null);
    try {
      const result = await getManufacturingDashboard();
      if (result) {
        setData(result);
      } else {
        setError("Impossible de charger les donnees de production");
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
          <p className="text-lg text-muted-foreground">Chargement de la production...</p>
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

  const { kpis, woStatusDistribution, stockEntryTypes, monthlyProduction, topItems, recentWOs } = data;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Production</h2>
          <p className="text-muted-foreground">
            Tableau de bord manufacturing
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/work-orders">
            <Button variant="outline" className="rounded-xl">
              <Factory className="mr-2 h-4 w-4" />
              Ordres
            </Button>
          </Link>
          <Link href="/bom">
            <Button variant="outline" className="rounded-xl">
              <ClipboardList className="mr-2 h-4 w-4" />
              Nomenclatures
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/work-orders">
          <Card className="rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ordres de Fabrication</CardTitle>
              <Factory className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.totalWorkOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.openWO} en cours, {kpis.completedWO} termines
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/work-orders">
          <Card className="rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Taux de Completion</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpis.completionRate >= 80 ? "text-success-400" : kpis.completionRate >= 50 ? "text-yellow-500" : "text-danger-400"}`}>
                {kpis.completionRate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.totalProduced.toLocaleString("fr-FR")} / {kpis.totalPlanned.toLocaleString("fr-FR")} unites
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/bom">
          <Card className="rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Nomenclatures</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.totalBOMs}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.activeBOMs} active(s)
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/stock-entries">
          <Card className="rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mouvements Stock</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.stockEntryCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ecritures de stock
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts Row 1: WO Status + Stock Entry Types */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Factory className="h-4 w-4" />
              Statuts des Ordres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full" style={{ minWidth: 0 }}>
              {woStatusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={woStatusDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="count"
                      nameKey="status"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {woStatusDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucun ordre de fabrication
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" />
              Types de Mouvements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full" style={{ minWidth: 0 }}>
              {stockEntryTypes.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={stockEntryTypes} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" width={100} />
                    <Tooltip />
                    <Bar dataKey="count" name="Mouvements" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucun mouvement
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Production Chart */}
      {monthlyProduction.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Production Mensuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full" style={{ minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={monthlyProduction} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="planned" name="Planifie" fill="#4f9cf7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="produced" name="Produit" fill="#6bbc8e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Items by Production */}
      {topItems.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Top Articles Produits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 px-3 font-medium">Code</th>
                    <th className="text-left py-2 px-3 font-medium">Article</th>
                    <th className="text-right py-2 px-3 font-medium">Planifie</th>
                    <th className="text-right py-2 px-3 font-medium">Produit</th>
                    <th className="text-right py-2 px-3 font-medium">Taux</th>
                  </tr>
                </thead>
                <tbody>
                  {topItems.map((item) => {
                    const rate = item.planned > 0 ? Math.round((item.produced / item.planned) * 100) : 0;
                    return (
                      <Link key={item.code} href="/products" className="contents">
                      <tr className="border-b hover:bg-muted/50 transition-colors cursor-pointer">
                        <td className="py-2 px-3 font-mono text-xs">{item.code}</td>
                        <td className="py-2 px-3 font-semibold">{item.name}</td>
                        <td className="py-2 px-3 text-right">{item.planned.toLocaleString("fr-FR")}</td>
                        <td className="py-2 px-3 text-right">{item.produced.toLocaleString("fr-FR")}</td>
                        <td className="py-2 px-3 text-right">
                          <span className={rate >= 80 ? "text-success-400" : rate >= 50 ? "text-yellow-500" : "text-danger-400"}>
                            {rate}%
                          </span>
                        </td>
                      </tr>
                      </Link>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Work Orders */}
      {recentWOs.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Ordres Recents
              </CardTitle>
              <Link href="/work-orders">
                <Button variant="ghost" size="sm" className="text-xs">
                  Voir tout <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentWOs.map((wo) => (
                <Link key={wo.name} href="/work-orders" className="block">
                <div
                  className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{wo.name}</span>
                      <Badge
                        className={`rounded-lg text-xs ${STATUS_COLORS[wo.status] || "bg-gray-400"}`}
                      >
                        {wo.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{wo.item_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      {wo.produced_qty || 0} / {wo.qty}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {wo.planned_start_date ? new Date(wo.planned_start_date).toLocaleDateString("fr-FR") : "—"}
                    </p>
                  </div>
                </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
