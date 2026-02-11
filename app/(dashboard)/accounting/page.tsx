"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAccountingDashboard, AccountingDashboardData } from "@/lib/services/erpnext";
import {
  DollarSign, TrendingUp, TrendingDown, FileText,
  AlertTriangle, RefreshCw, BarChart3, CreditCard,
  ArrowRight, Calculator, ArrowUpDown,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#6bbc8e", "#ef4444", "#4f9cf7", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export default function AccountingDashboardPage() {
  const [data, setData] = useState<AccountingDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    setError(null);
    try {
      const result = await getAccountingDashboard();
      if (result) {
        setData(result);
      } else {
        setError("Impossible de charger les donnees comptables");
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
          <p className="text-lg text-muted-foreground">Chargement de la comptabilite...</p>
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

  const { kpis, monthlyPL, paymentBreakdown, paymentByMode, recentPayments } = data;
  const revenueGrowth = kpis.lastMonthRevenue > 0
    ? Math.round((kpis.thisMonthRevenue - kpis.lastMonthRevenue) / kpis.lastMonthRevenue * 100)
    : 0;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Comptabilite</h2>
          <p className="text-muted-foreground">
            Tableau de bord financier
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/payments">
            <Button variant="outline" className="rounded-xl">
              <CreditCard className="mr-2 h-4 w-4" />
              Paiements
            </Button>
          </Link>
          <Link href="/journal-entries">
            <Button variant="outline" className="rounded-xl">
              <FileText className="mr-2 h-4 w-4" />
              Ecritures
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards — Row 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d&apos;Affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success-400">
              {kpis.totalRevenue.toLocaleString("fr-FR")} MAD
            </div>
            <div className="flex items-center gap-1 mt-1">
              {revenueGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-success-400" />
              ) : (
                <TrendingDown className="h-3 w-3 text-danger-400" />
              )}
              <span className={`text-xs font-medium ${revenueGrowth >= 0 ? "text-success-400" : "text-danger-400"}`}>
                {revenueGrowth > 0 ? "+" : ""}{revenueGrowth}%
              </span>
              <span className="text-xs text-muted-foreground">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Charges</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger-400">
              {kpis.totalExpenses.toLocaleString("fr-FR")} MAD
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Commandes fournisseurs cumul annee
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resultat Net</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${kpis.profit >= 0 ? "text-success-400" : "text-danger-400"}`}>
              {kpis.profit.toLocaleString("fr-FR")} MAD
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Marge: {kpis.margin}%
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">CA du Mois</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.thisMonthRevenue.toLocaleString("fr-FR")} MAD
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.paymentCount} paiement(s) cette annee
            </p>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards — Row 2: Receivables & Payables */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl border-l-4 border-l-blue-500">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-950">
              <ArrowUpDown className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Creances Clients</p>
              <p className="text-xl font-bold">{kpis.totalReceivable.toLocaleString("fr-FR")} MAD</p>
              <p className="text-xs text-muted-foreground">{kpis.receivableCount} facture(s) en attente</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-l-4 border-l-orange-500">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-950">
              <ArrowUpDown className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Dettes Fournisseurs</p>
              <p className="text-xl font-bold">{kpis.totalPayable.toLocaleString("fr-FR")} MAD</p>
              <p className="text-xs text-muted-foreground">{kpis.payableCount} facture(s) a payer</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly P&L Chart */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Compte de Resultat Mensuel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full" style={{ minWidth: 0 }}>
            {monthlyPL.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={monthlyPL} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toLocaleString("fr-FR")} MAD`]}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="Produits" fill="#6bbc8e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Charges" fill="#ef4444" radius={[4, 4, 0, 0]} />
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

      {/* Charts Row: Payment Breakdown + Payment by Mode */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4" />
              Flux de Tresorerie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full" style={{ minWidth: 0 }}>
              {paymentBreakdown.some(p => p.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={paymentBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {paymentBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${Number(value).toLocaleString("fr-FR")} MAD`]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucun paiement enregistre
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="h-4 w-4" />
              Paiements par Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full" style={{ minWidth: 0 }}>
              {paymentByMode.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={paymentByMode} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      className="text-muted-foreground"
                    />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" width={80} />
                    <Tooltip formatter={(value) => [`${Number(value).toLocaleString("fr-FR")} MAD`]} />
                    <Bar dataKey="amount" name="Montant" fill="#4f9cf7" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucun mode de paiement
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      {recentPayments.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Paiements Recents
              </CardTitle>
              <Link href="/payments">
                <Button variant="ghost" size="sm" className="text-xs">
                  Voir tout <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentPayments.map((payment) => (
                <div
                  key={payment.name}
                  className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{payment.name}</span>
                      <Badge
                        variant={payment.type === "Receive" ? "default" : "secondary"}
                        className={`rounded-lg text-xs ${payment.type === "Receive" ? "bg-success-400" : ""}`}
                      >
                        {payment.type === "Receive" ? "Encaissement" : "Decaissement"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {payment.party} {payment.mode ? `- ${payment.mode}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${payment.type === "Receive" ? "text-success-400" : "text-danger-400"}`}>
                      {payment.type === "Receive" ? "+" : "-"}{payment.amount.toLocaleString("fr-FR")} MAD
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.date).toLocaleDateString("fr-FR")}
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
