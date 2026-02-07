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

// Monthly chart data — empty until real data available from API
const EMPTY_MONTHLY_DATA = [
  "Jan", "Fev", "Mar", "Avr", "Mai", "Jun",
  "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"
].map(month => ({ month, ventes: 0, achats: 0, marge: 0 }));

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
    } catch {
      // Silent refresh failed
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
      {error && (
        <ErrorMessage
          title="Erreur de chargement"
          message={error}
          onRetry={() => fetchKPIs(false)}
        />
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="py-2">
          <CardHeader className="flex flex-row items-center justify-between py-1 px-4">
            <CardTitle className="text-xs font-medium">Chiffre d&apos;Affaires</CardTitle>
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="py-1 px-4">
            <div className="text-xl font-bold text-success-400">
              {kpis?.revenue?.toLocaleString() || 0} MAD
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[10px] text-muted-foreground">Total des ventes</p>
              <div className="flex items-center gap-0.5">
                <TrendingUp className="h-2.5 w-2.5 text-success-400" />
                <span className="text-[10px] text-success-400 font-medium">ce mois</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="py-2">
          <CardHeader className="flex flex-row items-center justify-between py-1 px-4">
            <CardTitle className="text-xs font-medium">Factures Impayees</CardTitle>
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="py-1 px-4">
            <div className="text-xl font-bold text-yellow-600">
              {kpis?.unpaidInvoices || 0}
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[10px] text-muted-foreground">A recouvrer</p>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">En attente</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="py-2">
          <CardHeader className="flex flex-row items-center justify-between py-1 px-4">
            <CardTitle className="text-xs font-medium">Stock Critique</CardTitle>
            <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="py-1 px-4">
            <div className="text-xl font-bold text-danger-400">
              {kpis?.criticalStock || 0}
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[10px] text-muted-foreground">Articles sous seuil</p>
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Alerte</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="py-2">
          <CardHeader className="flex flex-row items-center justify-between py-1 px-4">
            <CardTitle className="text-xs font-medium">Clients Actifs</CardTitle>
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="py-1 px-4">
            <div className="text-xl font-bold text-primary">
              {kpis?.customers || 0}
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[10px] text-muted-foreground">Base clients</p>
              <div className="flex items-center gap-0.5">
                <TrendingUp className="h-2.5 w-2.5 text-primary" />
                <span className="text-[10px] text-primary font-medium">actifs</span>
              </div>
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
        <CardContent className="pb-2">
          <div className="h-[140px] w-full" style={{ minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={EMPTY_MONTHLY_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v / 1000}k`} className="text-muted-foreground" />
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
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Top Produits
                </CardTitle>
                <CardDescription>Meilleurs ventes</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">CA Aujourd&apos;hui</p>
                <p className="text-lg font-bold text-success-400">
                  {(kpis?.todayRevenue || 0).toLocaleString('fr-FR')} MAD
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {kpis?.topProducts && kpis.topProducts.length > 0 ? (
              kpis.topProducts.slice(0, 5).map((product, index) => (
                <div
                  key={product.name}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                >
                  <span className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold",
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* MAOS Insights - Briefing proactif dynamique */}
        <MaosInsights />
      </div>

      <Card className="py-2">
        <CardContent className="py-1 px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Link href="/invoices">
              <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                Ventes
              </Button>
            </Link>
            <Link href="/purchase-orders">
              <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                Achats
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                <Package className="mr-1.5 h-3.5 w-3.5" />
                Stock
              </Button>
            </Link>
            <Link href="/clients">
              <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                <Users className="mr-1.5 h-3.5 w-3.5" />
                CRM
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


