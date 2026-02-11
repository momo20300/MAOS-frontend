"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSalesDashboard, SalesDashboardData } from "@/lib/services/erpnext";
import {
  DollarSign, TrendingUp, TrendingDown, FileText, Users,
  AlertTriangle, RefreshCw, BarChart3, ShoppingCart, Calendar,
  ArrowRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function SalesDashboardPage() {
  const [data, setData] = useState<SalesDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    setError(null);
    try {
      const result = await getSalesDashboard();
      if (result) {
        setData(result);
      } else {
        setError("Impossible de charger les donnees commerciales");
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
          <p className="text-lg text-muted-foreground">Chargement du tableau de bord...</p>
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

  const { kpis, topClients, monthly, overdue, recentOrders } = data;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ventes</h2>
          <p className="text-muted-foreground">
            Tableau de bord commercial
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/invoices">
            <Button variant="outline" className="rounded-xl">
              <FileText className="mr-2 h-4 w-4" />
              Factures
            </Button>
          </Link>
          <Link href="/orders">
            <Button variant="outline" className="rounded-xl">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Commandes
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">CA du Mois</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success-400">
              {kpis.thisMonthCA.toLocaleString("fr-FR")} MAD
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
            <CardTitle className="text-sm font-medium">CA Cumule</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.yearCA.toLocaleString("fr-FR")} MAD
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.invoiceCount} factures cette annee
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Impaye Total</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger-400">
              {kpis.unpaidAmount.toLocaleString("fr-FR")} MAD
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.unpaidCount} factures en attente
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Facture Moyenne</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpis.avgInvoice.toLocaleString("fr-FR")} MAD
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Montant moyen par facture
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Chart */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Chiffre d&apos;Affaires Mensuel
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
                    formatter={(value) => [`${Number(value).toLocaleString("fr-FR")} MAD`, "CA"]}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="total" name="Chiffre d'Affaires" fill="#6bbc8e" radius={[4, 4, 0, 0]} />
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

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top 10 Clients */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Top 10 Clients
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {topClients.length > 0 ? (
              topClients.map((client, index) => (
                <div
                  key={client.name}
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
                    <p className="text-sm font-medium truncate">{client.name}</p>
                    <p className="text-xs text-muted-foreground">{client.pct.toFixed(1)}% du CA</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {client.total.toLocaleString("fr-FR")} MAD
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">Aucun client trouve</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Invoices */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-danger-400" />
                Factures en Retard
              </CardTitle>
              <Link href="/invoices">
                <Button variant="ghost" size="sm" className="text-xs">
                  Voir tout <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {overdue.length > 0 ? (
              overdue.slice(0, 8).map((inv) => (
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
                    <p className="text-xs text-muted-foreground truncate">{inv.customer}</p>
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
                <p className="text-xs">Tous les paiements sont a jour</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Commandes Recentes
              </CardTitle>
              <Link href="/orders">
                <Button variant="ghost" size="sm" className="text-xs">
                  Voir tout <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <div
                  key={order.name}
                  className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{order.name}</span>
                      <Badge variant="secondary" className="rounded-lg text-xs">
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{order.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      {(order.base_grand_total || 0).toLocaleString("fr-FR")} MAD
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.transaction_date).toLocaleDateString("fr-FR")}
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
