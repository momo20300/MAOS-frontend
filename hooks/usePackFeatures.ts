import { useActiveTenant } from './useActiveTenant';
import { hasFeature, getFeatureValue, PACK_FEATURES } from '@/lib/pack-features';
import type { PackFeatures } from '@/lib/pack-features';

// Assuming 'Pack' type is intended to be a key of PACK_FEATURES for type safety.
// This type definition is added to ensure the resulting file is syntactically correct
// as per the instruction "Make sure to incorporate the change in a way so that the
// resulting file is syntactically correct."
type Pack = keyof typeof PACK_FEATURES;

export function usePackFeatures() {
    const { tenant, loading } = useActiveTenant();

    const pack = (tenant?.pack as Pack) || 'STANDARD';

    return {
        pack,
        loading,
        features: PACK_FEATURES[pack] || PACK_FEATURES.STANDARD,
        hasFeature: (feature: keyof PackFeatures) => hasFeature(pack, feature),
        getFeatureValue: <K extends keyof PackFeatures>(feature: K) =>
            getFeatureValue(pack, feature),
    };
}
