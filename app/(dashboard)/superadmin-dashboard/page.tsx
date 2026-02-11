"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSuperAdminDashboard, SuperAdminDashboardData } from "@/lib/services/erpnext";
import {
  Building2, Users, DollarSign, TrendingUp,
  AlertTriangle, RefreshCw, BarChart3, ArrowRight,
  Activity, Shield,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from "recharts";

const COLORS = ["#6bbc8e", "#4f9cf7", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

const PACK_COLORS: Record<string, string> = {
  STANDARD: "#4f9cf7",
  PRO: "#f59e0b",
  PRO_PLUS: "#8b5cf6",
};

export default function SuperAdminDashboardPage() {
  const [data, setData] = useState<SuperAdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    setError(null);
    try {
      const result = await getSuperAdminDashboard();
      if (result) {
        setData(result);
      } else {
        setError("Impossible de charger les donnees plateforme");
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
          <p className="text-lg text-muted-foreground">Chargement de la plateforme...</p>
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

  const { overview, packDistribution, metierDistribution, growth, revenueByMonth } = data;

  const packChartData = [
    { name: "Standard", count: packDistribution.STANDARD },
    { name: "Pro", count: packDistribution.PRO },
    { name: "Pro+", count: packDistribution.PRO_PLUS },
  ].filter(p => p.count > 0);

  const metierChartData = Object.entries(metierDistribution)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Plateforme MAOS</h2>
          <p className="text-muted-foreground">
            Tableau de bord SuperAdmin
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/superadmin/customers">
            <Button variant="outline" className="rounded-xl">
              <Building2 className="mr-2 h-4 w-4" />
              Clients
            </Button>
          </Link>
          <Link href="/superadmin/billing">
            <Button variant="outline" className="rounded-xl">
              <DollarSign className="mr-2 h-4 w-4" />
              Facturation
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalTenants}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.activeTenants} actifs
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sur l&apos;ensemble de la plateforme
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success-400">
              {overview.mrr.toLocaleString("fr-FR")} MAD
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Revenu mensuel recurrent
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ARR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.arr.toLocaleString("fr-FR")} MAD
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Revenu annuel recurrent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Growth KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl border-l-4 border-l-blue-500">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-muted-foreground">Nouveaux Tenants</p>
            <p className="text-xl font-bold">{growth.newTenantsThisMonth}</p>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-l-4 border-l-green-500">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-muted-foreground">Nouveaux Users</p>
            <p className="text-xl font-bold">{growth.newUsersThisMonth}</p>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-l-4 border-l-red-500">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-muted-foreground">Churn Rate</p>
            <p className="text-xl font-bold text-danger-400">{growth.churnRate}%</p>
            <p className="text-xs text-muted-foreground">Taux d&apos;attrition</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-l-4 border-l-green-500">
          <CardContent className="py-4">
            <p className="text-sm font-medium text-muted-foreground">Retention</p>
            <p className="text-xl font-bold text-success-400">{growth.retentionRate}%</p>
            <p className="text-xs text-muted-foreground">Taux de retention</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1: Revenue + Pack Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Evolution du Revenu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full" style={{ minWidth: 0 }}>
              {revenueByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <LineChart data={revenueByMonth} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      className="text-muted-foreground"
                    />
                    <Tooltip formatter={(value) => [`${Number(value).toLocaleString("fr-FR")} MAD`]} />
                    <Line type="monotone" dataKey="revenue" name="Revenu" stroke="#6bbc8e" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucune donnee
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Distribution des Packs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full" style={{ minWidth: 0 }}>
              {packChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={packChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="count"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {packChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={Object.values(PACK_COLORS)[index] || COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucun tenant
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metier Distribution */}
      {metierChartData.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              Distribution par Metier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full" style={{ minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={metierChartData} layout="vertical" margin={{ top: 5, right: 20, left: 120, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" width={120} />
                  <Tooltip />
                  <Bar dataKey="count" name="Tenants" fill="#4f9cf7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pack Pricing Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-t-4 border-t-blue-500">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-muted-foreground">Standard</p>
            <p className="text-3xl font-bold mt-1">{packDistribution.STANDARD}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {packDistribution.STANDARD * 499} MAD/mois
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-t-4 border-t-yellow-500">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-muted-foreground">Pro</p>
            <p className="text-3xl font-bold mt-1">{packDistribution.PRO}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {packDistribution.PRO * 999} MAD/mois
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-t-4 border-t-purple-500">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-muted-foreground">Pro+</p>
            <p className="text-3xl font-bold mt-1">{packDistribution.PRO_PLUS}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {packDistribution.PRO_PLUS * 1999} MAD/mois
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
