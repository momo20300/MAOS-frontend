"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getQualityDashboard, QualityDashboardData } from "@/lib/services/erpnext";
import {
  CheckCircle, XCircle, ShieldCheck, AlertTriangle,
  RefreshCw, BarChart3, FileText, ArrowRight, ClipboardCheck,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#6bbc8e", "#ef4444", "#4f9cf7", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export default function QualityDashboardPage() {
  const [data, setData] = useState<QualityDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    setError(null);
    try {
      const result = await getQualityDashboard();
      if (result) {
        setData(result);
      } else {
        setError("Impossible de charger les donnees qualite");
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
          <p className="text-lg text-muted-foreground">Chargement de la qualite...</p>
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

  const { kpis, inspectionTypes, inspectionStatusDistribution, severityDistribution, ncStatusDistribution, monthlyInspections, topInspectedItems, recentInspections, recentNC } = data;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Qualite</h2>
          <p className="text-muted-foreground">
            Tableau de bord qualite et conformite
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/quality-inspections">
            <Button variant="outline" className="rounded-xl">
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Inspections
            </Button>
          </Link>
          <Link href="/non-conformance">
            <Button variant="outline" className="rounded-xl">
              <FileText className="mr-2 h-4 w-4" />
              Non-conformites
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/quality-inspections">
          <Card className="rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Inspections</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.totalInspections}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.acceptedInspections} acceptees, {kpis.rejectedInspections} rejetees
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/quality-inspections">
          <Card className="rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Taux Acceptation</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpis.acceptanceRate >= 90 ? "text-success-400" : kpis.acceptanceRate >= 70 ? "text-yellow-500" : "text-danger-400"}`}>
                {kpis.acceptanceRate}%
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full ${kpis.acceptanceRate >= 90 ? "bg-success-400" : kpis.acceptanceRate >= 70 ? "bg-yellow-500" : "bg-danger-400"}`}
                  style={{ width: `${kpis.acceptanceRate}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/non-conformance">
          <Card className="rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Non-Conformites</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.totalNC}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.openNC} ouvertes, {kpis.resolvedNC} resolues
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/non-conformance">
          <Card className="rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">NC Ouvertes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpis.openNC > 0 ? "text-danger-400" : "text-success-400"}`}>
                {kpis.openNC}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                A traiter
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts Row 1: Inspection Status + NC Severity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="h-4 w-4" />
              Statuts Inspections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full" style={{ minWidth: 0 }}>
              {inspectionStatusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={inspectionStatusDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="count"
                      nameKey="status"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {inspectionStatusDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucune inspection
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              Severite Non-Conformites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full" style={{ minWidth: 0 }}>
              {severityDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={severityDistribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <Tooltip />
                    <Bar dataKey="count" name="NC" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucune non-conformite
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Monthly Inspections + Inspection Types */}
      <div className="grid gap-4 md:grid-cols-2">
        {monthlyInspections.length > 0 && (
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                Inspections Mensuelles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full" style={{ minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={monthlyInspections} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="accepted" name="Acceptees" fill="#6bbc8e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="rejected" name="Rejetees" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {inspectionTypes.length > 0 && (
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="h-4 w-4" />
                Types d&apos;Inspections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full" style={{ minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={inspectionTypes}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="count"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {inspectionTypes.map((_, index) => (
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

      {/* Top Inspected Items */}
      {topInspectedItems.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Top Articles Inspectes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 px-3 font-medium">Code</th>
                    <th className="text-left py-2 px-3 font-medium">Article</th>
                    <th className="text-right py-2 px-3 font-medium">Total</th>
                    <th className="text-right py-2 px-3 font-medium">Acceptees</th>
                    <th className="text-right py-2 px-3 font-medium">Rejetees</th>
                    <th className="text-right py-2 px-3 font-medium">Taux</th>
                  </tr>
                </thead>
                <tbody>
                  {topInspectedItems.map((item) => {
                    const rate = item.total > 0 ? Math.round((item.accepted / item.total) * 100) : 0;
                    return (
                      <tr key={item.code} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-2 px-3 font-mono text-xs">{item.code}</td>
                        <td className="py-2 px-3 font-semibold">{item.name}</td>
                        <td className="py-2 px-3 text-right">{item.total}</td>
                        <td className="py-2 px-3 text-right text-success-400">{item.accepted}</td>
                        <td className="py-2 px-3 text-right text-danger-400">{item.rejected}</td>
                        <td className="py-2 px-3 text-right">
                          <span className={rate >= 90 ? "text-success-400" : rate >= 70 ? "text-yellow-500" : "text-danger-400"}>
                            {rate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Inspections + Recent NC */}
      <div className="grid gap-4 md:grid-cols-2">
        {recentInspections.length > 0 && (
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardCheck className="h-4 w-4" />
                  Inspections Recentes
                </CardTitle>
                <Link href="/quality-inspections">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Voir tout <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentInspections.map((insp) => (
                  <div
                    key={insp.name}
                    className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{insp.name}</span>
                        <Badge
                          className={`rounded-lg text-xs ${insp.status === "Accepted" ? "bg-success-400" : insp.status === "Rejected" ? "bg-danger-400 text-white" : "bg-gray-400"}`}
                        >
                          {insp.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{insp.item_name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {insp.inspection_date ? new Date(insp.inspection_date).toLocaleDateString("fr-FR") : "—"}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {recentNC.length > 0 && (
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <XCircle className="h-4 w-4" />
                  Non-Conformites Recentes
                </CardTitle>
                <Link href="/non-conformance">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Voir tout <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentNC.map((nc) => (
                  <div
                    key={nc.name}
                    className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{nc.name}</span>
                        <Badge
                          className={`rounded-lg text-xs ${nc.status === "Open" ? "bg-danger-400 text-white" : nc.status === "Resolved" ? "bg-success-400" : "bg-gray-400"}`}
                        >
                          {nc.status}
                        </Badge>
                        {nc.severity && (
                          <span className={`text-xs font-medium ${nc.severity === "High" || nc.severity === "Critical" ? "text-danger-400" : nc.severity === "Medium" ? "text-yellow-500" : "text-blue-500"}`}>
                            {nc.severity}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{nc.subject}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {nc.opening_date ? new Date(nc.opening_date).toLocaleDateString("fr-FR") : "—"}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
