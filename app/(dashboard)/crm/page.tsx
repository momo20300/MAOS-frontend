"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCrmDashboard, CrmDashboardData } from "@/lib/services/erpnext";
import {
  Users, UserPlus, Target, TrendingUp, TrendingDown,
  AlertTriangle, RefreshCw, BarChart3, DollarSign,
  ArrowRight, Building2, MapPin, Activity,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#6bbc8e", "#4f9cf7", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];
const LEAD_COLORS: Record<string, string> = {
  Open: "#4f9cf7",
  Replied: "#6bbc8e",
  Opportunity: "#f59e0b",
  Converted: "#10b981",
  "Do Not Contact": "#ef4444",
  Interested: "#8b5cf6",
  Lost: "#94a3b8",
};

export default function CrmDashboardPage() {
  const [data, setData] = useState<CrmDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    setError(null);
    try {
      const result = await getCrmDashboard();
      if (result) {
        setData(result);
      } else {
        setError("Impossible de charger les donnees CRM");
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
          <p className="text-lg text-muted-foreground">Chargement du CRM...</p>
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

  const { kpis, typeDistribution, territories, topClients, leadPipeline, monthlyNewClients, recentLeads, inactiveClients } = data;
  const clientGrowth = kpis.newLastMonth > 0
    ? Math.round((kpis.newThisMonth - kpis.newLastMonth) / kpis.newLastMonth * 100)
    : kpis.newThisMonth > 0 ? 100 : 0;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">CRM</h2>
          <p className="text-muted-foreground">
            Gestion de la relation client
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/clients">
            <Button variant="outline" className="rounded-xl">
              <Users className="mr-2 h-4 w-4" />
              Clients
            </Button>
          </Link>
          <Link href="/leads">
            <Button variant="outline" className="rounded-xl">
              <UserPlus className="mr-2 h-4 w-4" />
              Leads
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/clients">
          <Card className="rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.totalClients}</div>
              <div className="flex items-center gap-1 mt-1">
                <UserPlus className="h-3 w-3 text-primary" />
                <span className="text-xs text-primary font-medium">+{kpis.newThisMonth}</span>
                <span className="text-xs text-muted-foreground">ce mois</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/clients">
          <Card className="rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Nouveaux Clients</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success-400">{kpis.newThisMonth}</div>
              <div className="flex items-center gap-1 mt-1">
                {clientGrowth >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-success-400" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-danger-400" />
                )}
                <span className={`text-xs font-medium ${clientGrowth >= 0 ? "text-success-400" : "text-danger-400"}`}>
                  {clientGrowth > 0 ? "+" : ""}{clientGrowth}%
                </span>
                <span className="text-xs text-muted-foreground">vs mois dernier ({kpis.newLastMonth})</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/leads">
          <Card className="rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Leads Actifs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{kpis.activeLeads}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.openOpportunities} opportunite(s) ouvertes
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/clients">
          <Card className="rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">CA Moyen / Client</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpis.avgRevenuePerClient.toLocaleString("fr-FR")} MAD
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                CA annuel: {kpis.yearCA.toLocaleString("fr-FR")} MAD
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Concentration Alert */}
      {kpis.concentration > 50 && (
        <Card className="rounded-2xl border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Concentration client elevee: {kpis.concentration}%
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                Les 3 premiers clients representent plus de 50% du CA. Diversifiez votre portefeuille.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row 1: Type Distribution + Lead Pipeline */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Repartition par Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full" style={{ minWidth: 0 }}>
              {typeDistribution.some(t => t.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {typeDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucun client enregistre
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              Pipeline des Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full" style={{ minWidth: 0 }}>
              {leadPipeline.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={leadPipeline} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="status" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <Tooltip />
                    <Bar dataKey="count" name="Leads" radius={[4, 4, 0, 0]}>
                      {leadPipeline.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={LEAD_COLORS[entry.status] || COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucun lead enregistre
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Monthly New Clients + Territory */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Nouveaux Clients par Mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full" style={{ minWidth: 0 }}>
              {monthlyNewClients.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={monthlyNewClients} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <Tooltip formatter={(value) => [`${value}`, "Nouveaux clients"]} />
                    <Bar dataKey="count" name="Nouveaux Clients" fill="#4f9cf7" radius={[4, 4, 0, 0]} />
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

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              Repartition Geographique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full" style={{ minWidth: 0 }}>
              {territories.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={territories} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" width={60} />
                    <Tooltip formatter={(value) => [`${value}`, "Clients"]} />
                    <Bar dataKey="count" name="Clients" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucun territoire defini
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Row: Top Clients + Recent Leads */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top 10 Clients by Revenue */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-success-400" />
                Top 10 Clients (CA)
              </CardTitle>
              <Link href="/clients">
                <Button variant="ghost" size="sm" className="text-xs">
                  Voir tout <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {topClients.length > 0 ? (
              topClients.map((client, index) => (
                <Link href="/crm" key={client.name} className="block">
                  <div
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer"
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
                      <p className="text-sm font-medium truncate">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.pct}% du CA</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {client.total.toLocaleString("fr-FR")} MAD
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">Aucune facture enregistree</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Leads Recents
              </CardTitle>
              <Link href="/leads">
                <Button variant="ghost" size="sm" className="text-xs">
                  Voir tout <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {recentLeads.length > 0 ? (
              recentLeads.map((lead) => (
                <Link href="/leads" key={lead.name} className="block">
                  <div
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{lead.lead_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {lead.company_name || "Particulier"} {lead.source ? `- ${lead.source}` : ""}
                      </p>
                    </div>
                    <Badge
                      variant={
                        lead.status === "Converted" ? "default" :
                        lead.status === "Open" ? "secondary" :
                        lead.status === "Replied" ? "outline" :
                        "destructive"
                      }
                      className="text-xs ml-2"
                    >
                      {lead.status}
                    </Badge>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun lead enregistre</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inactive Clients */}
      {inactiveClients.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Clients Inactifs (sans facture cette annee)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {inactiveClients.map((client) => (
                <Link href="/clients" key={client.name} className="block">
                  <div
                    className="flex items-center gap-3 p-3 border rounded-xl hover:bg-muted/80 transition-colors cursor-pointer"
                  >
                    <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{client.customer_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {client.customer_type === "Company" ? "Entreprise" : "Particulier"}
                        {client.territory ? ` - ${client.territory}` : ""}
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
