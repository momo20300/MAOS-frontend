import { useEffect, useState } from 'react';

export interface TenantInfo {
    id: string;
    name: string;
    slug: string;
    pack: 'STANDARD' | 'PRO' | 'PRO_PLUS';
    metier: string;
    isActive: boolean;
}

export function useActiveTenant() {
    const [tenant, setTenant] = useState<TenantInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActiveTenant();
    }, []);

    const fetchActiveTenant = async () => {
        try {
            const res = await fetch('/api/tenant/active');
            const data = await res.json();
            setTenant(data);
        } catch (error) {
            console.error('Failed to fetch active tenant:', error);
        } finally {
            setLoading(false);
        }
    };

    return { tenant, loading, refetch: fetchActiveTenant };
}
