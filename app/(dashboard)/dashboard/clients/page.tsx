"use client";

import { useEffect, useState } from "react";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { Users, UserPlus, TrendingUp, Mail, Phone, Sparkles, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isModuleEnabled } from "@/lib/module-config";
import { PackGate } from "@/components/pack/pack-gate";

interface CRMMetrics {
    totalCustomers: number;
    newThisMonth: number;
    activeCustomers: number;
    topCustomers: Array<{ name: string; company?: string; totalSpent: number; email: string }>;
    recentActivity: Array<{ customer: string; action: string; date: string }>;
}

export default function DashboardClientsPage() {
    const { tenant, loading: tenantLoading } = useActiveTenant();
    const [metrics, setMetrics] = useState<CRMMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tenant) return;

        const crmEnabled = isModuleEnabled(tenant.metier, tenant.pack, 'crm');
        if (!crmEnabled) {
            window.location.href = '/dashboard';
            return;
        }

        fetchCRMMetrics();
    }, [tenant]);

    const fetchCRMMetrics = async () => {
        try {
            const res = await fetch('/api/dashboard/crm/metrics');
            const data = await res.json();
            setMetrics(data);
        } catch (error) {
            console.error('Failed to fetch CRM metrics:', error);
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

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Clients (CRM)</h1>
                    <p className="text-gray-600 mt-1">Gestion de votre relation client</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Nouveau Client
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Total Clients
                        </CardTitle>
                        <Users className="w-4 h-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.totalCustomers || 0}</div>
                        <p className="text-xs text-gray-500 mt-1">Base complète</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Nouveaux Ce Mois
                        </CardTitle>
                        <UserPlus className="w-4 h-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {metrics?.newThisMonth || 0}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Croissance</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Clients Actifs
                        </CardTitle>
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.activeCustomers || 0}</div>
                        <p className="text-xs text-gray-500 mt-1">Activité récente</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Meilleurs Clients</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {(metrics?.topCustomers || []).map((customer, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                                        {customer.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-medium">{customer.name}</div>
                                        {customer.company && (
                                            <div className="text-sm text-gray-500">{customer.company}</div>
                                        )}
                                        <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                                            <Mail className="w-3 h-3" />
                                            {customer.email}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-green-600">
                                        {customer.totalSpent.toLocaleString()} Dirhams
                                    </div>
                                    <div className="text-xs text-gray-500">CA Total</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Activité Récente</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {(metrics?.recentActivity || []).map((activity, index) => (
                            <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                                <div>
                                    <div className="font-medium">{activity.customer}</div>
                                    <div className="text-sm text-gray-500">{activity.action}</div>
                                </div>
                                <div className="text-xs text-gray-400">{activity.date}</div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* PRO Feature: RFM Scoring */}
            <PackGate feature="advancedAnalytics">
                <Card className="border-purple-200 bg-purple-50/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-purple-600" />
                            Scoring RFM (Recency, Frequency, Monetary)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-white rounded-lg text-center">
                                <p className="text-sm text-gray-600 mb-2">Champions</p>
                                <p className="text-3xl font-bold text-green-600">42</p>
                                <p className="text-xs text-gray-500 mt-1">Score RFM: 9-10</p>
                            </div>
                            <div className="p-4 bg-white rounded-lg text-center">
                                <p className="text-sm text-gray-600 mb-2">À Risque</p>
                                <p className="text-3xl font-bold text-orange-600">18</p>
                                <p className="text-xs text-gray-500 mt-1">Inactifs 60+ jours</p>
                            </div>
                            <div className="p-4 bg-white rounded-lg text-center">
                                <p className="text-sm text-gray-600 mb-2">Perdus</p>
                                <p className="text-3xl font-bold text-red-600">9</p>
                                <p className="text-xs text-gray-500 mt-1">Inactifs 120+ jours</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </PackGate>

            {/* PRO_PLUS Feature: Churn Prediction */}
            <PackGate feature="aiPredictions">
                <Card className="border-red-200 bg-red-50/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-red-600" />
                            Prédiction de Churn (Risque de Perte)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="p-4 bg-white rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-semibold">Client A SARL</p>
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                        Risque élevé 87%
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Aucun achat depuis 45 jours | Pattern detecté
                                </p>
                                <p className="text-xs text-purple-600 mt-2">
                                    💡 Recommandation: Offre de réactivation -15%
                                </p>
                            </div>
                            <div className="p-4 bg-white rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-semibold">Client D Ltd</p>
                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                                        Risque moyen 52%
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Fréquence d'achat en baisse (-35%)
                                </p>
                                <p className="text-xs text-purple-600 mt-2">
                                    💡 Recommandation: Appel de fidélisation
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </PackGate>
        </div>
    );
}
