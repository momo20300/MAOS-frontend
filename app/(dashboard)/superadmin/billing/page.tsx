"use client";

import { useState, useEffect } from "react";
import { TrendingUp, DollarSign, FileText, AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/services/auth";

interface Invoice {
    id: string;
    invoiceNumber: string;
    amount: number;
    status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
    period: string;
    dueDate: string;
    paidAt?: string;
    tenant: {
        id: string;
        name: string;
        pack: string;
    };
}

export default function SuperAdminBillingPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");

    useEffect(() => {
        fetchInvoices();
    }, [filter]);

    const fetchInvoices = async () => {
        try {
            const params = new URLSearchParams();
            if (filter !== "all") params.append("status", filter);

            const res = await authFetch(`/api/superadmin/billing/invoices?${params}`);
            if (!res.ok) throw new Error(`Erreur ${res.status}`);
            const data = await res.json();
            setInvoices(data);
        } catch (error) {
            console.error("Failed to fetch invoices:", error);
        } finally {
            setLoading(false);
        }
    };

    const generateBulkInvoices = async () => {
        try {
            await authFetch("/api/superadmin/billing/invoices/generate-bulk", {
                method: "POST",
            });
            fetchInvoices();
            alert("Factures générées avec succès!");
        } catch (error) {
            console.error("Failed to generate invoices:", error);
            alert("Erreur lors de la génération");
        }
    };

    const downloadPDF = async (invoiceId: string, invoiceNumber: string) => {
        try {
            const response = await authFetch(`/api/superadmin/billing/invoices/${invoiceId}/download`);
            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${invoiceNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to download PDF:', error);
            alert('Erreur lors du téléchargement du PDF');
        }
    };

    const stats = {
        totalRevenue: invoices
            .filter((i) => i.status === "PAID")
            .reduce((sum, i) => sum + i.amount, 0),
        pending: invoices.filter((i) => i.status === "PENDING").length,
        overdue: invoices.filter((i) => i.status === "OVERDUE").length,
        paid: invoices.filter((i) => i.status === "PAID").length,
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
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Facturation</h1>
                    <p className="text-gray-600 mt-1">Gestion des factures MAOS</p>
                </div>
                <Button onClick={generateBulkInvoices} className="gap-2">
                    <FileText className="w-4 h-4" />
                    Générer Factures Mensuelles
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-6 rounded-lg border">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                        <DollarSign className="w-5 h-5" />
                        <span className="text-sm font-medium">Revenu Total</span>
                    </div>
                    <div className="text-3xl font-bold">
                        {stats.totalRevenue.toLocaleString()} Dirhams
                    </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                        <FileText className="w-5 h-5" />
                        <span className="text-sm font-medium">En Attente</span>
                    </div>
                    <div className="text-3xl font-bold text-blue-700">{stats.pending}</div>
                </div>

                <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="text-sm font-medium">En Retard</span>
                    </div>
                    <div className="text-3xl font-bold text-red-700">{stats.overdue}</div>
                </div>

                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                        <TrendingUp className="w-5 h-5" />
                        <span className="text-sm font-medium">Payées</span>
                    </div>
                    <div className="text-3xl font-bold text-green-700">{stats.paid}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                {["all", "PENDING", "PAID", "OVERDUE"].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${filter === status
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        {status === "all" ? "Toutes" : status}
                    </button>
                ))}
            </div>

            {/* Invoices Table */}
            <div className="bg-white rounded-lg border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left p-4 font-medium">N° Facture</th>
                            <th className="text-left p-4 font-medium">Tenant</th>
                            <th className="text-left p-4 font-medium">Pack</th>
                            <th className="text-left p-4 font-medium">Période</th>
                            <th className="text-left p-4 font-medium">Montant</th>
                            <th className="text-left p-4 font-medium">Échéance</th>
                            <th className="text-left p-4 font-medium">Statut</th>
                            <th className="text-left p-4 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map((invoice) => (
                            <tr key={invoice.id} className="border-b hover:bg-gray-50">
                                <td className="p-4 font-mono text-sm">{invoice.invoiceNumber}</td>
                                <td className="p-4">
                                    <div className="font-medium">{invoice.tenant.name}</div>
                                </td>
                                <td className="p-4">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                        {invoice.tenant.pack}
                                    </span>
                                </td>
                                <td className="p-4 text-sm">{invoice.period}</td>
                                <td className="p-4 font-semibold">
                                    {invoice.amount.toLocaleString()} Dirhams
                                </td>
                                <td className="p-4 text-sm">
                                    {new Date(invoice.dueDate).toLocaleDateString("fr-FR")}
                                </td>
                                <td className="p-4">
                                    <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${invoice.status === "PAID"
                                            ? "bg-green-100 text-green-700"
                                            : invoice.status === "OVERDUE"
                                                ? "bg-red-100 text-red-700"
                                                : invoice.status === "PENDING"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-gray-100 text-gray-700"
                                            }`}
                                    >
                                        {invoice.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <button
                                        onClick={() => downloadPDF(invoice.id, invoice.invoiceNumber)}
                                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                                    >
                                        <Download className="w-4 h-4" />
                                        PDF
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {invoices.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    Aucune facture trouvée
                </div>
            )}
        </div>
    );
}
