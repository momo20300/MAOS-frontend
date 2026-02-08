"use client";

import { useEffect, useState } from "react";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Wallet, Sparkles, LineChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isModuleEnabled } from "@/lib/module-config";
import { PackGate } from "@/components/pack/pack-gate";

interface FinanceMetrics {
    revenue: number;
    expenses: number;
    profit: number;
    cashFlow: number;
    accountsReceivable: number;
    accountsPayable: number;
    topExpenses: Array<{ category: string; amount: number }>;
    recentTransactions: Array<{ description: string; amount: number; type: 'income' | 'expense'; date: string }>;
}

export default function DashboardFinancesPage() {
    const { tenant, loading: tenantLoading } = useActiveTenant();
    const [metrics, setMetrics] = useState<FinanceMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tenant) return;

        const financeEnabled = isModuleEnabled(tenant.metier, tenant.pack, 'finance');
        if (!financeEnabled) {
            window.location.href = '/dashboard';
            return;
        }

        fetchFinanceMetrics();
    }, [tenant]);

    const fetchFinanceMetrics = async () => {
        try {
            const res = await fetch('/api/dashboard/finance/metrics');
            const data = await res.json();
            setMetrics(data);
        } catch (error) {
            console.error('Failed to fetch finance metrics:', error);
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

    const profitMargin = metrics ? ((metrics.profit / metrics.revenue) * 100).toFixed(1) : '0';

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Finances</h1>
                <p className="text-gray-600 mt-1">Vue d'ensemble de votre santé financière</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Chiffre d'Affaires
                        </CardTitle>
                        <DollarSign className="w-4 h-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {(metrics?.revenue || 0).toLocaleString()} Dirhams
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Ce mois</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Dépenses
                        </CardTitle>
                        <TrendingDown className="w-4 h-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {(metrics?.expenses || 0).toLocaleString()} Dirhams
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Ce mois</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Bénéfice Net
                        </CardTitle>
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {(metrics?.profit || 0).toLocaleString()} Dirhams
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Marge: {profitMargin}%
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Trésorerie
                        </CardTitle>
                        <Wallet className="w-4 h-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(metrics?.cashFlow || 0).toLocaleString()} Dirhams
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Disponible</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Créances Clients</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-orange-600">
                            {(metrics?.accountsReceivable || 0).toLocaleString()} Dirhams
                        </div>
                        <p className="text-sm text-gray-500 mt-2">À recevoir</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Dettes Fournisseurs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-600">
                            {(metrics?.accountsPayable || 0).toLocaleString()} Dirhams
                        </div>
                        <p className="text-sm text-gray-500 mt-2">À payer</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Principales Dépenses</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {(metrics?.topExpenses || []).map((expense, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="font-medium">{expense.category}</div>
                                <div className="text-red-600 font-semibold">
                                    {expense.amount.toLocaleString()} Dirhams
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Transactions Récentes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {(metrics?.recentTransactions || []).map((transaction, index) => (
                            <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                                <div className="flex items-center gap-3">
                                    {transaction.type === 'income' ? (
                                        <TrendingUp className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <TrendingDown className="w-4 h-4 text-red-600" />
                                    )}
                                    <div>
                                        <div className="font-medium">{transaction.description}</div>
                                        <div className="text-xs text-gray-500">{transaction.date}</div>
                                    </div>
                                </div>
                                <div className={transaction.type === 'income' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                    {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toLocaleString()} Dirhams
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* PRO Feature: Profit Trend Analysis */}
            <PackGate feature="trendAnalysis">
                <Card className="border-blue-200 bg-blue-50/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <LineChart className="h-5 w-5 text-blue-600" />
                            Analyse de Rentabilité (90 jours)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="p-6 bg-white rounded-lg text-center">
                            <p className="text-2xl font-bold text-blue-600 mb-2">Marge nette: +2.3%</p>
                            <p className="text-sm text-gray-600">
                                Amélioration continue depuis 3 mois
                            </p>
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                <div>
                                    <p className="text-xs text-gray-500">Janvier</p>
                                    <p className="font-semibold">36.2%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Février</p>
                                    <p className="font-semibold">37.8%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Mars (proj.)</p>
                                    <p className="font-semibold text-green-600">38.5%</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </PackGate>

            {/* PRO_PLUS Feature: Cashflow Forecasting */}
            <PackGate feature="aiPredictions">
                <Card className="border-green-200 bg-green-50/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-green-600" />
                            Prévisions de Trésorerie (6 mois)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-white rounded-lg text-center">
                                    <p className="text-sm text-gray-600">Mars 2026</p>
                                    <p className="text-2xl font-bold text-green-600">712K Dirhams</p>
                                    <p className="text-xs text-gray-500">±45K</p>
                                </div>
                                <div className="p-4 bg-white rounded-lg text-center">
                                    <p className="text-sm text-gray-600">Avril 2026</p>
                                    <p className="text-2xl font-bold text-green-600">758K Dirhams</p>
                                    <p className="text-xs text-gray-500">±50K</p>
                                </div>
                                <div className="p-4 bg-white rounded-lg text-center">
                                    <p className="text-sm text-gray-600">Mai 2026</p>
                                    <p className="text-2xl font-bold text-orange-600">623K Dirhams</p>
                                    <p className="text-xs text-gray-500">±55K</p>
                                </div>
                            </div>

                            <div className="p-4 bg-white rounded-lg border border-orange-100">
                                <p className="text-sm font-semibold text-orange-900">
                                    ⚠️ Alerte Prédictive
                                </p>
                                <p className="text-xs text-orange-700 mt-1">
                                    Baisse de trésorerie attendue en mai (-18%).
                                    Recommandation: Négocier délais fournisseurs ou prévoir ligne de crédit.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </PackGate>
        </div>
    );
}
