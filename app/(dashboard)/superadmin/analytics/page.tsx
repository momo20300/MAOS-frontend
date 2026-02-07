"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Users, TrendingUp, DollarSign, Activity, PieChart, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PlatformAnalytics {
    overview: {
        totalTenants: number;
        activeTenants: number;
        totalUsers: number;
        mrr: number;
        arr: number;
    };
    packDistribution: {
        STANDARD: number;
        PRO: number;
        PRO_PLUS: number;
    };
    metierDistribution: Record<string, number>;
    growth: {
        newTenantsThisMonth: number;
        newUsersThisMonth: number;
        churnRate: number;
        retentionRate: number;
    };
    revenueByMonth: Array<{ month: string; revenue: number }>;
}

export default function SuperAdminAnalyticsPage() {
    const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch('/api/superadmin/analytics');
            const data = await res.json();
            setAnalytics(data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl">Chargement...</div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl text-red-500">Erreur de chargement</div>
            </div>
        );
    }

    const totalRevenue = Object.values(analytics.packDistribution).reduce(
        (acc, count, idx) => {
            const prices = [499, 999, 1999]; // STANDARD, PRO, PRO_PLUS
            return acc + count * (prices[idx] ?? 0);
        },
        0
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link href="/superadmin/customers">
                    <Button variant="ghost" className="mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Retour aux Tenants
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold">Analytics Plateforme</h1>
                <p className="text-gray-600 mt-1">Vue d'ensemble des métriques MAOS</p>
            </div>

            {/* Overview KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Total Tenants
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-bold">{analytics.overview.totalTenants}</div>
                            <div className="text-xs text-green-600">
                                +{analytics.growth.newTenantsThisMonth} ce mois
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Tenants Actifs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-bold text-green-600">
                                {analytics.overview.activeTenants}
                            </div>
                            <div className="text-xs text-gray-500">
                                {((analytics.overview.activeTenants / analytics.overview.totalTenants) * 100).toFixed(1)}%
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Utilisateurs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-bold">{analytics.overview.totalUsers}</div>
                            <div className="text-xs text-green-600">
                                +{analytics.growth.newUsersThisMonth} ce mois
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            MRR
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {totalRevenue.toLocaleString()} Dirhams
                        </div>
                        <div className="text-xs text-gray-500">Revenu mensuel récurrent</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            ARR
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {(totalRevenue * 12).toLocaleString()} Dirhams
                        </div>
                        <div className="text-xs text-gray-500">Revenu annuel récurrent</div>
                    </CardContent>
                </Card>
            </div>

            {/* Pack Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="w-5 h-5" />
                            Distribution des Packs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded bg-blue-500"></div>
                                    <span className="font-medium">STANDARD</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl font-bold">{analytics.packDistribution.STANDARD}</span>
                                    <span className="text-sm text-gray-500">
                                        ({((analytics.packDistribution.STANDARD / analytics.overview.totalTenants) * 100).toFixed(0)}%)
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded bg-purple-500"></div>
                                    <span className="font-medium">PRO</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl font-bold">{analytics.packDistribution.PRO}</span>
                                    <span className="text-sm text-gray-500">
                                        ({((analytics.packDistribution.PRO / analytics.overview.totalTenants) * 100).toFixed(0)}%)
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded bg-amber-500"></div>
                                    <span className="font-medium">PRO+</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl font-bold">{analytics.packDistribution.PRO_PLUS}</span>
                                    <span className="text-sm text-gray-500">
                                        ({((analytics.packDistribution.PRO_PLUS / analytics.overview.totalTenants) * 100).toFixed(0)}%)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Visual Bar */}
                        <div className="mt-6 h-4 rounded-full overflow-hidden flex">
                            <div
                                className="bg-blue-500"
                                style={{ width: `${(analytics.packDistribution.STANDARD / analytics.overview.totalTenants) * 100}%` }}
                            ></div>
                            <div
                                className="bg-purple-500"
                                style={{ width: `${(analytics.packDistribution.PRO / analytics.overview.totalTenants) * 100}%` }}
                            ></div>
                            <div
                                className="bg-amber-500"
                                style={{ width: `${(analytics.packDistribution.PRO_PLUS / analytics.overview.totalTenants) * 100}%` }}
                            ></div>
                        </div>
                    </CardContent>
                </Card>

                {/* Metier Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            Distribution par Métier
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Object.entries(analytics.metierDistribution)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 6)
                                .map(([metier, count]) => (
                                    <div key={metier} className="flex items-center justify-between">
                                        <span className="text-sm font-medium">{metier}</span>
                                        <div className="flex items-center gap-3">
                                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-600 rounded-full"
                                                    style={{ width: `${(count / analytics.overview.totalTenants) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-bold w-8 text-right">{count}</span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Growth Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Croissance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                <span className="font-medium">Nouveaux Tenants (30j)</span>
                                <span className="text-2xl font-bold text-green-600">
                                    +{analytics.growth.newTenantsThisMonth}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <span className="font-medium">Nouveaux Users (30j)</span>
                                <span className="text-2xl font-bold text-blue-600">
                                    +{analytics.growth.newUsersThisMonth}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                <span className="font-medium">Taux de Rétention</span>
                                <span className="text-2xl font-bold text-purple-600">
                                    {analytics.growth.retentionRate}%
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                                <span className="font-medium">Taux de Churn</span>
                                <span className="text-2xl font-bold text-orange-600">
                                    {analytics.growth.churnRate}%
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Revenue Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Évolution MRR (6 mois)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {analytics.revenueByMonth.map((item, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{item.month}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-600 rounded-full"
                                                style={{
                                                    width: `${(item.revenue / Math.max(...analytics.revenueByMonth.map(r => r.revenue))) * 100}%`
                                                }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-bold w-24 text-right">
                                            {item.revenue.toLocaleString()} Dirhams
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
