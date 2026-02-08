"use client";

import { useEffect, useState } from "react";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { Package, AlertTriangle, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isModuleEnabled } from "@/lib/module-config";
import { PackGate } from "@/components/pack/pack-gate";

interface InventoryMetrics {
    totalItems: number;
    lowStockItems: number;
    stockValue: number;
    topItems: Array<{ name: string; quantity: number; value: number }>;
    recentMovements: Array<{ item: string; type: 'IN' | 'OUT'; quantity: number; date: string }>;
}

export default function DashboardStockPage() {
    const { tenant, loading: tenantLoading } = useActiveTenant();
    const [metrics, setMetrics] = useState<InventoryMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tenant) return;

        const inventoryEnabled = isModuleEnabled(tenant.metier, tenant.pack, 'inventory');
        if (!inventoryEnabled) {
            window.location.href = '/dashboard';
            return;
        }

        fetchInventoryMetrics();
    }, [tenant]);

    const fetchInventoryMetrics = async () => {
        try {
            const res = await fetch('/api/dashboard/inventory/metrics');
            const data = await res.json();
            setMetrics(data);
        } catch (error) {
            console.error('Failed to fetch inventory metrics:', error);
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
            <div>
                <h1 className="text-3xl font-bold">Gestion de Stock</h1>
                <p className="text-gray-600 mt-1">Suivi de votre inventaire en temps réel</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Articles en Stock
                        </CardTitle>
                        <Package className="w-4 h-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics?.totalItems || 0}</div>
                        <p className="text-xs text-gray-500 mt-1">Références actives</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Alertes Stock Bas
                        </CardTitle>
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {metrics?.lowStockItems || 0}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Nécessite réapprovisionnement</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Valeur du Stock
                        </CardTitle>
                        <TrendingUp className="w-4 h-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(metrics?.stockValue || 0).toLocaleString()} Dirhams
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Valorisation totale</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Articles Principaux</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {(metrics?.topItems || []).map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <div className="font-medium">{item.name}</div>
                                    <div className="text-sm text-gray-500">{item.quantity} unités</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold">{item.value.toLocaleString()} Dirhams</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Mouvements Récents</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {(metrics?.recentMovements || []).map((movement, index) => (
                            <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                                <div className="flex items-center gap-3">
                                    {movement.type === 'IN' ? (
                                        <TrendingUp className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <TrendingDown className="w-4 h-4 text-red-600" />
                                    )}
                                    <div>
                                        <div className="font-medium">{movement.item}</div>
                                        <div className="text-xs text-gray-500">{movement.date}</div>
                                    </div>
                                </div>
                                <div className={movement.type === 'IN' ? 'text-green-600' : 'text-red-600'}>
                                    {movement.type === 'IN' ? '+' : '-'}{movement.quantity}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* PRO Feature: Smart Alerts */}
            <PackGate feature="smartAlerts">
                <Card className="border-orange-200 bg-orange-50/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                            Alertes Intelligentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="p-3 bg-white rounded-lg">
                                <p className="text-sm font-medium">⚠️ Rupture probable "Item A"</p>
                                <p className="text-xs text-gray-600 mt-1">
                                    Stock actuel: 15 unités | Ventes moyennes: 12/jour
                                </p>
                            </div>
                            <div className="p-3 bg-white rounded-lg">
                                <p className="text-sm font-medium">📊 Surstock détecté "Item C"</p>
                                <p className="text-xs text-gray-600 mt-1">
                                    68 jours de stock vs 30 jours recommandés
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </PackGate>

            {/* PRO_PLUS Feature: Stockout Predictions */}
            <PackGate feature="aiPredictions">
                <Card className="border-blue-200 bg-blue-50/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-blue-600" />
                            Prévisions de Rupture
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="p-4 bg-white rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-semibold">Item A</p>
                                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                        Risque élevé
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">Rupture estimée: 12 mars 2026</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Recommandation: Commander 150 unités avant le 8 mars
                                </p>
                            </div>
                            <div className="p-4 bg-white rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="font-semibold">Item D</p>
                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                                        Risque moyen
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">Rupture estimée: 25 mars 2026</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Point de commande optimal: 18 mars
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </PackGate>
        </div>
    );
}
