"use client";

import { useEffect, useState } from "react";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isModuleEnabled } from "@/lib/module-config";
import { PackGate } from "@/components/pack/pack-gate";

interface SalesMetrics {
    todaySales: number;
    monthlySales: number;
    ordersCount: number;
    avgOrderValue: number;
    topProducts: Array<{ name: string; quantity: number; revenue: number }>;
    salesTrend: Array<{ date: string; amount: number }>;
}

export default function DashboardVentesPage() {
    const { tenant, loading: tenantLoading } = useActiveTenant();
    const [metrics, setMetrics] = useState<SalesMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tenant) return;

        const salesEnabled = isModuleEnabled(tenant.metier, tenant.pack, 'sales');
        if (!salesEnabled) {
            window.location.href = '/dashboard';
            return;
        }

        fetchSalesMetrics();
    }, [tenant]);

    const fetchSalesMetrics = async () => {
        try {
            const res = await fetch('/api/dashboard/sales/metrics');
            const data = await res.json();
            setMetrics(data);
        } catch (error) {
            console.error('Failed to fetch sales metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (tenantLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl">Chargement...</div>
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl text-red-500">Erreur de chargement des données</div>
            </div>
        );
    }

    const salesGrowth = metrics.todaySales > 0
        ? ((metrics.monthlySales - metrics.todaySales * 30) / (metrics.todaySales * 30)) * 100
        : 0;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Ventes</h1>
                <p className="text-gray-600 mt-1">
                    Vue d'ensemble de vos performances commerciales
                </p>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Ventes Aujourd'hui
                        </CardTitle>
                        <DollarSign className="w-4 h-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {metrics.todaySales.toLocaleString()} Dirhams
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {salesGrowth > 0 ? '+' : ''}
                            {salesGrowth.toFixed(1)}% vs mois dernier
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Ventes Mensuelles
                        </CardTitle>
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {metrics.monthlySales.toLocaleString()} Dirhams
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {metrics.ordersCount} commandes
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Panier Moyen
                        </CardTitle>
                        <ShoppingCart className="w-4 h-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {metrics.avgOrderValue.toLocaleString()} Dirhams
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Par commande
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Commandes
                        </CardTitle>
                        <Package className="w-4 h-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.ordersCount}</div>
                        <p className="text-xs text-gray-500 mt-1">Ce mois</p>
                    </CardContent>
                </Card>
            </div>

            {/* Top Products */}
            <Card>
                <CardHeader>
                    <CardTitle>Produits les Plus Vendus</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {metrics.topProducts.map((product, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <div className="font-medium">{product.name}</div>
                                        <div className="text-sm text-gray-500">
                                            {product.quantity} unités vendues
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold">
                                        {product.revenue.toLocaleString()} Dirhams
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* PRO Feature: Trend Analysis — only with real data */}
            {metrics.monthlySales > 0 && (
                <PackGate feature="trendAnalysis">
                    <Card>
                        <CardHeader>
                            <CardTitle>Analyse de Tendance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="p-6 bg-purple-50 dark:bg-purple-950/30 rounded-lg text-center">
                                <TrendingUp className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                                <p className="font-semibold text-purple-900 dark:text-purple-200">
                                    Ventes mensuelles: {metrics.monthlySales.toLocaleString()} Dirhams
                                </p>
                                <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">
                                    {metrics.ordersCount} commandes | Panier moyen: {metrics.avgOrderValue.toLocaleString()} Dirhams
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </PackGate>
            )}

            {/* PRO Feature: AI Recommendations — only with real data */}
            {metrics.topProducts.length > 0 && (
                <PackGate feature="aiRecommendations">
                    <Card className="border-purple-200 bg-purple-50/30">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-purple-600" />
                                Recommandations
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {metrics.topProducts.slice(0, 2).map((product, i) => (
                                    <div key={i} className="p-3 bg-white dark:bg-muted rounded-lg">
                                        <p className="text-sm font-medium">
                                            {i === 0 ? "Meilleur produit" : "A suivre"}: {product.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {product.quantity} unites | {product.revenue.toLocaleString()} Dirhams
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </PackGate>
            )}
        </div>
    );
}
