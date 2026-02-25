import { ReactNode } from 'react';
import { usePackFeatures } from '@/hooks/usePackFeatures';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import type { PackFeatures } from '@/lib/pack-features';

interface PackGateProps {
    feature: keyof PackFeatures;
    children: ReactNode;
    fallback?: ReactNode;
    showUpgradeCTA?: boolean;
}

/**
 * PackGate - Conditionally render content based on pack features
 * 
 * Usage:
 * <PackGate feature="aiPredictions">
 *   <PredictiveChart data={forecast} />
 * </PackGate>
 */
export function PackGate({
    feature,
    children,
    fallback,
    showUpgradeCTA = true
}: PackGateProps) {
    const { hasFeature, pack } = usePackFeatures();

    if (hasFeature(feature)) {
        return <>{children}</>;
    }

    // Feature not available for current pack
    if (fallback) {
        return <>{fallback}</>;
    }

    // Show upgrade CTA by default
    if (showUpgradeCTA) {
        return (
            <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
                <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-3">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Lock className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>

                    <h3 className="font-semibold text-blue-900 mb-1">
                        Fonctionnalité {pack === 'STANDARD' ? 'PRO' : 'PRO+'}
                    </h3>

                    <p className="text-sm text-blue-700 mb-4">
                        {getFeatureDescription(feature)}
                    </p>

                    <Link
                        href="/settings/billing"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        <Sparkles className="w-4 h-4" />
                        Passer à {pack === 'STANDARD' ? 'PRO' : 'PRO+'}
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return null;
}

function getFeatureDescription(feature: keyof PackFeatures): string {
    const descriptions: Record<string, string> = {
        aiPredictions: 'Prévisions à 6 mois basées sur l\'IA pour anticiper vos performances',
        aiRecommendations: 'Recommandations personnalisées pour optimiser votre activité',
        aiScenarios: 'Scénarios "Et si..." pour simuler l\'impact de vos décisions',
        aiInsights: 'Insights proactifs pour détecter opportunités et risques',
        trendAnalysis: 'Analyse des tendances sur 3 mois pour comprendre votre évolution',
        advancedAnalytics: 'Analytics avancées avec segmentations et comparaisons',
        customReports: 'Créez vos propres rapports personnalisés',
        smartAlerts: 'Alertes intelligentes détectant les anomalies automatiquement',
        predictiveAlerts: 'Alertes prédictives vous avertissant avant les problèmes',
        exportData: 'Exportez vos données en CSV/Excel pour analyses externes',
        apiAccess: 'Accès API pour intégrer MAOS à vos outils',
        teams: 'Fonctionnalités de collaboration en équipe',
    };

    return descriptions[feature] || 'Cette fonctionnalité avancée n\'est pas disponible dans votre pack actuel';
}

/**
 * Inline feature gate (no UI, just conditional render)
 */
export function FeatureGuard({ feature, children }: { feature: keyof PackFeatures; children: ReactNode }) {
    const { hasFeature } = usePackFeatures();
    return hasFeature(feature) ? <>{children}</> : null;
}
