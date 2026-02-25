/**
 * Pack Features Matrix
 * Defines which features are available for each pack tier
 * Based on PRODUCT_STRATEGY.md AI tiers
 */

// Local type definition (frontend doesn't have access to Prisma client)
export type Pack = 'STANDARD' | 'PRO' | 'PRO_PLUS';

export interface PackFeatures {
    // AI Capabilities
    aiPredictions: boolean;        // Forecasting, predictions
    aiRecommendations: boolean;     // Controlled suggestions
    aiScenarios: boolean;           // "What-if" scenarios
    aiInsights: boolean;            // Proactive insights

    // Analytics
    basicMetrics: boolean;          // Current numbers
    trendAnalysis: boolean;         // Historical trends
    advancedAnalytics: boolean;     // Complex analysis
    customReports: boolean;         // Report builder

    // Alerts
    basicAlerts: boolean;           // Simple threshold alerts
    smartAlerts: boolean;           // Anomaly detection
    predictiveAlerts: boolean;      // Pre-emptive warnings

    // Data Access
    historyDays: number;            // How far back data is shown
    exportData: boolean;            // CSV/Excel export
    apiAccess: boolean;             // REST API access

    // Collaboration
    teams: boolean;                 // Team features
    channels: number;               // Max channels (0 = none)

    // Support
    supportLevel: 'email' | 'priority' | 'dedicated';
}

export const PACK_FEATURES: Record<Pack, PackFeatures> = {
    'STANDARD': {
        // AI ESSENTIAL (60-65%)
        aiPredictions: false,
        aiRecommendations: false,
        aiScenarios: false,
        aiInsights: false,

        // Analytics
        basicMetrics: true,
        trendAnalysis: false,
        advancedAnalytics: false,
        customReports: false,

        // Alerts
        basicAlerts: true,
        smartAlerts: false,
        predictiveAlerts: false,

        // Data
        historyDays: 30,
        exportData: false,
        apiAccess: false,

        // Collaboration
        teams: false,
        channels: 0,

        // Support
        supportLevel: 'email',
    },

    'PRO': {
        // AI OPERATIONAL (≈80%)
        aiPredictions: false,           // Still no predictions
        aiRecommendations: true,        // Controlled recommendations
        aiScenarios: false,
        aiInsights: true,               // Basic insights

        // Analytics
        basicMetrics: true,
        trendAnalysis: true,            // 3 months trends
        advancedAnalytics: true,
        customReports: true,

        // Alerts
        basicAlerts: true,
        smartAlerts: true,              // Anomaly detection
        predictiveAlerts: false,

        // Data
        historyDays: 90,
        exportData: true,
        apiAccess: true,

        // Collaboration
        teams: true,
        channels: 5,

        // Support
        supportLevel: 'priority',
    },

    'PRO_PLUS': {
        // AI STRATEGIC (100%)
        aiPredictions: true,            // Full forecasting
        aiRecommendations: true,
        aiScenarios: true,              // "What-if" analysis
        aiInsights: true,               // Advanced insights

        // Analytics
        basicMetrics: true,
        trendAnalysis: true,
        advancedAnalytics: true,
        customReports: true,

        // Alerts
        basicAlerts: true,
        smartAlerts: true,
        predictiveAlerts: true,         // Pre-emptive warnings

        // Data
        historyDays: 365,
        exportData: true,
        apiAccess: true,

        // Collaboration
        teams: true,
        channels: -1,                   // Unlimited

        // Support
        supportLevel: 'dedicated',
    },
};

/**
 * Check if a pack has a specific feature
 */
export function hasFeature(pack: Pack, feature: keyof PackFeatures): boolean {
    const features = PACK_FEATURES[pack];
    const value = features[feature];

    // Handle boolean features
    if (typeof value === 'boolean') {
        return value;
    }

    // Handle numeric features (consider > 0 as "has feature")
    if (typeof value === 'number') {
        return value > 0;
    }

    // Handle string features (always true if defined)
    return true;
}

/**
 * Get feature value for a pack
 */
export function getFeatureValue<K extends keyof PackFeatures>(
    pack: Pack,
    feature: K
): PackFeatures[K] {
    return PACK_FEATURES[pack][feature];
}

/**
 * Compare if packA has more features than packB
 */
export function isUpgrade(from: Pack, to: Pack): boolean {
    const order: Pack[] = ['STANDARD', 'PRO', 'PRO_PLUS'];
    return order.indexOf(to) > order.indexOf(from);
}

/**
 * Get upgrade path for a pack
 */
export function getUpgradePath(currentPack: Pack): Pack | null {
    if (currentPack === 'STANDARD') return 'PRO';
    if (currentPack === 'PRO') return 'PRO_PLUS';
    return null; // Already at highest tier
}

