"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Download, Edit, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateTenantModal } from "@/components/superadmin/create-tenant-modal";
import { PackChangeModal } from "@/components/superadmin/pack-change-modal";
import { authFetch } from "@/lib/services/auth";

interface Tenant {
    id: string;
    name: string;
    slug: string;
    pack: "STANDARD" | "PRO" | "PRO_PLUS";
    metier: string;
    isActive: boolean;
    createdAt: string;
    _count?: { userTenants: number };
    userTenants?: Array<{
        user?: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    }>;
}

export default function SuperAdminCustomersPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterPack, setFilterPack] = useState<string | null>(null);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showPackModal, setShowPackModal] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            setError(null);
            const res = await authFetch("/api/superadmin/tenants");
            if (!res.ok) {
                throw new Error(`Erreur ${res.status}: ${res.statusText}`);
            }
            const data = await res.json();
            setTenants(Array.isArray(data) ? data : []);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Impossible de charger les tenants";
            setError(message);
            console.error("Failed to fetch tenants:", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleTenantStatus = async (tenantId: string, isActive: boolean) => {
        try {
            const res = await authFetch(`/api/superadmin/tenants/${tenantId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !isActive }),
            });
            if (!res.ok) {
                throw new Error(`Erreur ${res.status}`);
            }
            fetchTenants();
        } catch (err) {
            console.error("Failed to update tenant status:", err);
        }
    };

    const handlePackChange = (tenant: Tenant) => {
        setSelectedTenant(tenant);
        setShowPackModal(true);
    };

    const filteredTenants = tenants.filter((t) => {
        const matchesSearch =
            t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.slug.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPack = filterPack ? t.pack === filterPack : true;
        return matchesSearch && matchesPack;
    });

    const stats = {
        total: tenants.length,
        active: tenants.filter((t) => t.isActive).length,
        standard: tenants.filter((t) => t.pack === "STANDARD").length,
        pro: tenants.filter((t) => t.pack === "PRO").length,
        proPlus: tenants.filter((t) => t.pack === "PRO_PLUS").length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl">Chargement...</div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Error Banner */}
            {error && (
                <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <div className="flex-1">
                        <p className="text-red-700 font-medium">Erreur de chargement</p>
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchTenants}>
                        Réessayer
                    </Button>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Clients & Tenants</h1>
                    <p className="text-gray-600 mt-1">Gestion plateforme MAOS</p>
                </div>
                <Button className="gap-2" onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4" />
                    Nouveau Tenant
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-5 gap-4 mb-8">
                <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-gray-600">Total</div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="text-sm text-green-600">Actifs</div>
                    <div className="text-2xl font-bold text-green-700">{stats.active}</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-600">STANDARD</div>
                    <div className="text-2xl font-bold text-blue-700">{stats.standard}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="text-sm text-purple-600">PRO</div>
                    <div className="text-2xl font-bold text-purple-700">{stats.pro}</div>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <div className="text-sm text-amber-600">PRO+</div>
                    <div className="text-2xl font-bold text-amber-700">{stats.proPlus}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Rechercher un tenant..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <select
                    className="border rounded-lg px-4 py-2"
                    value={filterPack || ""}
                    onChange={(e) => setFilterPack(e.target.value || null)}
                >
                    <option value="">Tous les packs</option>
                    <option value="STANDARD">STANDARD</option>
                    <option value="PRO">PRO</option>
                    <option value="PRO_PLUS">PRO+</option>
                </select>
                <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export CSV
                </Button>
            </div>

            {/* Tenants Table */}
            <div className="bg-white rounded-lg border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left p-4 font-medium">Tenant</th>
                            <th className="text-left p-4 font-medium">Propriétaire</th>
                            <th className="text-left p-4 font-medium">Pack</th>
                            <th className="text-left p-4 font-medium">Métier</th>
                            <th className="text-left p-4 font-medium">Utilisateurs</th>
                            <th className="text-left p-4 font-medium">Statut</th>
                            <th className="text-left p-4 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTenants.map((tenant) => (
                            <tr key={tenant.id} className="border-b hover:bg-gray-50">
                                <td className="p-4">
                                    <div className="font-medium">{tenant.name}</div>
                                    <div className="text-sm text-gray-500">{tenant.slug}</div>
                                </td>
                                <td className="p-4">
                                    {tenant.userTenants?.[0]?.user ? (
                                        <div>
                                            <div className="font-medium">
                                                {tenant.userTenants[0].user.firstName || ""}{" "}
                                                {tenant.userTenants[0].user.lastName || ""}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {tenant.userTenants[0].user.email}
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">—</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-medium ${tenant.pack === "STANDARD"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : tenant.pack === "PRO"
                                                        ? "bg-purple-100 text-purple-700"
                                                        : "bg-amber-100 text-amber-700"
                                                }`}
                                        >
                                            {tenant.pack}
                                        </span>
                                        <button
                                            onClick={() => handlePackChange(tenant)}
                                            className="text-gray-400 hover:text-blue-600"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                                <td className="p-4 text-sm">{tenant.metier}</td>
                                <td className="p-4 text-center">{tenant._count?.userTenants ?? 0}</td>
                                <td className="p-4">
                                    <button
                                        onClick={() => toggleTenantStatus(tenant.id, tenant.isActive)}
                                        className={`px-2 py-1 rounded text-xs font-medium ${tenant.isActive
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                            }`}
                                    >
                                        {tenant.isActive ? "Actif" : "Suspendu"}
                                    </button>
                                </td>
                                <td className="p-4">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => (window.location.href = `/superadmin/customers/${tenant.id}`)}
                                    >
                                        Détails
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredTenants.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    Aucun tenant trouvé
                </div>
            )}

            {/* Modals */}
            <CreateTenantModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={fetchTenants}
            />

            {selectedTenant && (
                <PackChangeModal
                    open={showPackModal}
                    onClose={() => {
                        setShowPackModal(false);
                        setSelectedTenant(null);
                    }}
                    onSuccess={fetchTenants}
                    tenant={{
                        id: selectedTenant.id,
                        name: selectedTenant.name,
                        pack: selectedTenant.pack,
                    }}
                />
            )}
        </div>
    );
}
