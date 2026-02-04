"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { getDashboardKPIs, DashboardKPIs } from "@/lib/services/api";
import { useAuth } from "@/lib/context/auth-context";
import {
  DollarSign, FileText, Package, Users, TrendingUp,
  AlertCircle, RefreshCw, ShoppingCart, Trophy, BarChart3
} from "lucide-react";
import MaosInsights from "@/components/maos/MaosInsights";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Donnees mensuelles pour le graphique
const monthlyData = [
  { month: "Jan", ventes: 45000, achats: 32000, marge: 13000 },
  { month: "Fev", ventes: 52000, achats: 38000, marge: 14000 },
  { month: "Mar", ventes: 48000, achats: 35000, marge: 13000 },
  { month: "Avr", ventes: 61000, achats: 42000, marge: 19000 },
  { month: "Mai", ventes: 55000, achats: 40000, marge: 15000 },
  { month: "Jun", ventes: 67000, achats: 45000, marge: 22000 },
  { month: "Jul", ventes: 72000, achats: 48000, marge: 24000 },
  { month: "Aou", ventes: 58000, achats: 41000, marge: 17000 },
  { month: "Sep", ventes: 63000, achats: 44000, marge: 19000 },
  { month: "Oct", ventes: 75000, achats: 52000, marge: 23000 },
  { month: "Nov", ventes: 82000, achats: 55000, marge: 27000 },
  { month: "Dec", ventes: 95000, achats: 62000, marge: 33000 },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Initial load
  const fetchKPIs = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setInitialLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);
    try {
      const data = await getDashboardKPIs();
      setKpis(data);
      setLastUpdate(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de connexion au serveur';
      setError(message);
      console.error("Erreur KPIs:", err);
    }
    setInitialLoading(false);
    setIsRefreshing(false);
  }, []);

  // Silent background refresh
  const silentRefresh = async () => {
    try {
      const data = await getDashboardKPIs();
      setKpis(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Erreur KPIs (silent):", error);
    }
  };

  useEffect(() => {
    fetchKPIs(true);
    // Silent refresh every minute (no visible loading)
    const interval = setInterval(silentRefresh, 60000);
    return () => clearInterval(interval);
  }, []);

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Chargement des KPIs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Bonjour{user ? `, ${user.firstName}` : ''} !
          </h2>
          <p className="text-muted-foreground">
            {user?.currentTenant
              ? `${user.currentTenant.name} - Vue d'ensemble`
              : "Vue d'ensemble de votre entreprise"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchKPIs(false)} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>
        </div>
      </div>

      {error && (
        <ErrorMessage
          title="Erreur de chargement"
          message={error}
          onRetry={() => fetchKPIs(false)}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d&apos;Affaires</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success-400">
              {kpis?.revenue?.toLocaleString() || 0} MAD
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total des ventes</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-3 w-3 text-success-400" />
              <span className="text-xs text-success-400 font-medium">+12.5%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Factures Impayees</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {kpis?.unpaidInvoices || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">A recouvrer</p>
            <Badge variant="outline" className="mt-2 text-xs">En attente</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stock Critique</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger-400">
              {kpis?.criticalStock || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Articles sous seuil</p>
            <Badge variant="destructive" className="mt-2 text-xs">Alerte</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {kpis?.customers || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Base clients</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-3 w-3 text-primary" />
              <span className="text-xs text-primary font-medium">+8.2%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique Ventes / Achats / Marge */}
      <Card className="h-[200px]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Performance {new Date().getFullYear()}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[140px] pb-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v/1000}k`} className="text-muted-foreground" />
              <Tooltip
                formatter={(value) => [`${Number(value).toLocaleString()} MAD`]}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="ventes" name="Ventes" stroke="#6bbc8e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="achats" name="Achats" stroke="#c3758c" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="marge" name="Marge Net" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Top Produits
                </CardTitle>
                <CardDescription>Meilleurs ventes par revenu</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">CA Aujourd&apos;hui</p>
                <p className="text-lg font-bold text-success-400">
                  {(kpis?.todayRevenue || 0).toLocaleString('fr-FR')} MAD
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {kpis?.topProducts && kpis.topProducts.length > 0 ? (
              kpis.topProducts.slice(0, 5).map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                >
                  <span className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    index === 0 ? "bg-yellow-500/20 text-yellow-600" :
                    index === 1 ? "bg-gray-400/20 text-gray-500" :
                    index === 2 ? "bg-orange-500/20 text-orange-500" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.qty} vendus</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-success-400">
                      {product.revenue.toLocaleString('fr-FR')} MAD
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">Aucune vente enregistree</p>
                <p className="text-xs mt-1">Les donnees apparaitront ici</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* MAOS Insights - Briefing proactif dynamique */}
        <MaosInsights />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Accès Rapide</CardTitle>
          <CardDescription>Liens vers les modules MAOS</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Link href="/invoices">
              <Button variant="outline" className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                Ventes
              </Button>
            </Link>
            <Link href="/purchase-orders">
              <Button variant="outline" className="w-full">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Achats
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="outline" className="w-full">
                <Package className="mr-2 h-4 w-4" />
                Stock
              </Button>
            </Link>
            <Link href="/clients">
              <Button variant="outline" className="w-full">
                <Users className="mr-2 h-4 w-4" />
                CRM
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


