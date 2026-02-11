"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAssetsDashboard, AssetsDashboardData } from "@/lib/services/erpnext";
import {
  Landmark, TrendingDown, DollarSign, Package,
  AlertTriangle, RefreshCw, BarChart3, ArrowRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#6bbc8e", "#4f9cf7", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

const STATUS_COLORS: Record<string, string> = {
  "Submitted": "bg-success-400",
  "Draft": "bg-yellow-500 text-white",
  "Scrapped": "bg-gray-400",
  "Sold": "bg-blue-500 text-white",
};

export default function AssetsDashboardPage() {
  const [data, setData] = useState<AssetsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    setError(null);
    try {
      const result = await getAssetsDashboard();
      if (result) {
        setData(result);
      } else {
        setError("Impossible de charger les donnees des actifs");
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
          <p className="text-lg text-muted-foreground">Chargement des actifs...</p>
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

  const { kpis, categoryDistribution, statusDistribution, locationDistribution, depreciationMethods, topAssets, recentAssets } = data;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Actifs / Immobilisations</h2>
          <p className="text-muted-foreground">
            Tableau de bord des immobilisations
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/assets">
            <Button variant="outline" className="rounded-xl">
              <Landmark className="mr-2 h-4 w-4" />
              Actifs
            </Button>
          </Link>
          <Link href="/depreciation">
            <Button variant="outline" className="rounded-xl">
              <TrendingDown className="mr-2 h-4 w-4" />
              Amortissements
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/assets">
          <Card className="rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Actifs</CardTitle>
              <Landmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.totalAssets}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.submittedAssets} actifs, {kpis.draftAssets} brouillons
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/assets">
          <Card className="rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Valeur Brute</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success-400">
                {kpis.totalGrossValue.toLocaleString("fr-FR")} MAD
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Cout d&apos;acquisition total
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/assets">
          <Card className="rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Valeur Nette</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpis.totalNetValue.toLocaleString("fr-FR")} MAD
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Apres amortissements
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/depreciation">
          <Card className="rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Amortissements</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-danger-400">
                {kpis.totalDepreciation.toLocaleString("fr-FR")} MAD
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.scrappedAssets} mis au rebut, {kpis.soldAssets} vendus
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts Row 1: Category + Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Valeur par Categorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full" style={{ minWidth: 0 }}>
              {categoryDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={categoryDistribution} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      className="text-muted-foreground"
                    />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" width={100} />
                    <Tooltip formatter={(value) => [`${Number(value).toLocaleString("fr-FR")} MAD`]} />
                    <Bar dataKey="value" name="Valeur" fill="#4f9cf7" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucun actif
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Landmark className="h-4 w-4" />
              Statuts des Actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full" style={{ minWidth: 0 }}>
              {statusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="count"
                      nameKey="status"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {statusDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucun actif
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Locations + Depreciation Methods */}
      <div className="grid gap-4 md:grid-cols-2">
        {locationDistribution.length > 0 && (
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4" />
                Repartition par Emplacement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full" style={{ minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={locationDistribution} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" width={80} />
                    <Tooltip />
                    <Bar dataKey="count" name="Actifs" fill="#6bbc8e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {depreciationMethods.length > 0 && (
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingDown className="h-4 w-4" />
                Methodes d&apos;Amortissement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full" style={{ minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={depreciationMethods}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {depreciationMethods.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Assets Table */}
      {topAssets.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5" />
              Top Actifs par Valeur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 px-3 font-medium">Reference</th>
                    <th className="text-left py-2 px-3 font-medium">Nom</th>
                    <th className="text-left py-2 px-3 font-medium">Categorie</th>
                    <th className="text-right py-2 px-3 font-medium">Valeur Brute</th>
                    <th className="text-right py-2 px-3 font-medium">Valeur Nette</th>
                    <th className="text-center py-2 px-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {topAssets.map((asset) => (
                    <tr key={asset.name} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-2 px-3 font-mono text-xs">{asset.name}</td>
                      <td className="py-2 px-3 font-semibold">{asset.asset_name}</td>
                      <td className="py-2 px-3">{asset.category || "—"}</td>
                      <td className="py-2 px-3 text-right">{asset.gross_value.toLocaleString("fr-FR")} MAD</td>
                      <td className="py-2 px-3 text-right">{asset.net_value.toLocaleString("fr-FR")} MAD</td>
                      <td className="py-2 px-3 text-center">
                        <Badge className={`rounded-lg text-xs ${STATUS_COLORS[asset.status] || "bg-gray-400"}`}>
                          {asset.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Assets */}
      {recentAssets.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5" />
                Acquisitions Recentes
              </CardTitle>
              <Link href="/assets">
                <Button variant="ghost" size="sm" className="text-xs">
                  Voir tout <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentAssets.map((asset) => (
                <div
                  key={asset.name}
                  className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{asset.name}</span>
                      <Badge className={`rounded-lg text-xs ${STATUS_COLORS[asset.status] || "bg-gray-400"}`}>
                        {asset.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {asset.asset_name} {asset.category ? `— ${asset.category}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{asset.gross_value.toLocaleString("fr-FR")} MAD</p>
                    <p className="text-xs text-muted-foreground">
                      {asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString("fr-FR") : "—"}
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
