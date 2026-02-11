"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getReportsDashboard, ReportsDashboardData } from "@/lib/services/erpnext";
import { authFetch } from "@/lib/services/auth";
import {
  FileBarChart, FolderOpen, CheckCircle, AlertTriangle,
  RefreshCw, ArrowRight, TrendingUp, Package,
  FileText, Download, Loader2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#6bbc8e", "#4f9cf7", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

const CATEGORY_COLORS: Record<string, string> = {
  Ventes: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  Achats: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Stock: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  Finance: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  General: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
};

export default function ReportsDashboardPage() {
  const [data, setData] = useState<ReportsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  const generateReport = async (reportId: string) => {
    setGenerating(reportId);
    try {
      const res = await authFetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, filters: { startDate: new Date().toISOString().split("T")[0] } }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (e) {
      console.error("Report generation failed:", e);
      alert("Erreur lors de la generation du rapport.");
    } finally {
      setGenerating(null);
    }
  };

  const fetchData = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    setError(null);
    try {
      const result = await getReportsDashboard();
      if (result) {
        setData(result);
      } else {
        setError("Impossible de charger les donnees des rapports");
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
          <p className="text-lg text-muted-foreground">Chargement des rapports...</p>
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

  const { kpis, categories, dataCounts } = data;
  const categoryChartData = categories.map(c => ({ name: c.name, count: c.count }));

  const dataAvailability = [
    { name: "Factures", available: dataCounts.invoices > 0 },
    { name: "Commandes", available: dataCounts.purchaseOrders > 0 },
    { name: "Articles", available: dataCounts.items > 0 },
    { name: "Clients", available: dataCounts.customers > 0 },
    { name: "Fournisseurs", available: dataCounts.suppliers > 0 },
    { name: "Employes", available: dataCounts.employees > 0 },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Rapports</h2>
          <p className="text-muted-foreground">
            Centre de rapports et analyses
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/reports">
            <Button variant="outline" className="rounded-xl">
              <FileBarChart className="mr-2 h-4 w-4" />
              Tous les Rapports
            </Button>
          </Link>
          <Link href="/reports/exploitation">
            <Button variant="outline" className="rounded-xl">
              <TrendingUp className="mr-2 h-4 w-4" />
              Exploitation
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rapports Disponibles</CardTitle>
            <FileBarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalReports}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.categoryCount} categories
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Donnees</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${kpis.hasData ? "text-success-400" : "text-danger-400"}`}>
              {kpis.hasData ? "Disponibles" : "Vides"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dataAvailability.filter(d => d.available).length}/{dataAvailability.length} sources actives
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Acces Rapide</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap mt-1">
              <Link href="/reports/exploitation">
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">Exploitation</Badge>
              </Link>
              <Link href="/reports/product-analysis">
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">Produits</Badge>
              </Link>
              <Link href="/reports">
                <Badge variant="outline" className="cursor-pointer hover:bg-muted">Catalogue</Badge>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Availability */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="h-4 w-4" />
            Disponibilite des Donnees
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {dataAvailability.map((item) => (
              <div
                key={item.name}
                className={`flex items-center gap-3 p-3 rounded-xl border ${item.available ? "border-success-400/30 bg-success-400/5" : "border-muted"}`}
              >
                <div className={`w-3 h-3 rounded-full ${item.available ? "bg-success-400" : "bg-muted"}`} />
                <span className="text-sm font-medium">{item.name}</span>
                <span className={`text-xs ml-auto ${item.available ? "text-success-400" : "text-muted-foreground"}`}>
                  {item.available ? "Actif" : "Vide"}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts: Category Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileBarChart className="h-4 w-4" />
              Rapports par Categorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full" style={{ minWidth: 0 }}>
              {categoryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="count"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {categoryChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucune categorie
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderOpen className="h-4 w-4" />
              Volume par Categorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full" style={{ minWidth: 0 }}>
              {categoryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={categoryChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <Tooltip />
                    <Bar dataKey="count" name="Rapports" fill="#4f9cf7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucune donnee
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Categories with reports list */}
      {categories.map((category) => (
        <Card key={category.name} className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                {category.name}
                <Badge className={`rounded-lg text-xs ml-2 ${CATEGORY_COLORS[category.name] || "bg-gray-100 text-gray-800"}`}>
                  {category.count} rapport(s)
                </Badge>
              </CardTitle>
              <Link href="/reports">
                <Button variant="ghost" size="sm" className="text-xs">
                  Voir tout <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              {category.reports.map((report) => {
                const isGen = generating === report.id;
                return (
                  <div
                    key={report.id}
                    onClick={() => !isGen && generateReport(report.id)}
                    className="p-3 border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{report.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
                    </div>
                    <div className="ml-2 shrink-0">
                      {isGen ? (
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                      ) : (
                        <Download className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
