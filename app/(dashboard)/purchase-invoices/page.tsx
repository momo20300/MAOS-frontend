"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getPurchaseInvoices, getSuppliers, getItems, createPurchaseInvoice,
  exportToCSV, printDocument
} from "@/lib/services/erpnext";
import { PurchaseInvoiceForm } from "@/components/forms";
import {
  FileText, TrendingDown, Search, Plus, Download, Printer,
  FileSpreadsheet, ChevronLeft, ChevronRight, Calendar
} from "lucide-react";

interface PurchaseInvoice {
  name: string;
  supplier_name: string;
  posting_date: string;
  due_date: string;
  grand_total: number;
  status: string;
  outstanding_amount: number;
  docstatus: number;
}

interface Supplier { name: string; supplier_name: string; }
interface Item { item_code: string; item_name: string; standard_rate: number; }

const columns = [
  { key: "name", label: "Reference" },
  { key: "supplier_name", label: "Fournisseur" },
  { key: "posting_date", label: "Date" },
  { key: "due_date", label: "Echeance" },
  { key: "grand_total", label: "Montant (MAD)" },
  { key: "outstanding_amount", label: "Reste (MAD)" },
  { key: "status", label: "Statut" },
];

export default function PurchaseInvoicesPage() {
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<PurchaseInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const pageSize = 10;

  const fetchData = async () => {
    setLoading(true);
    const [invoicesData, suppliersData, itemsData] = await Promise.all([
      getPurchaseInvoices(),
      getSuppliers(),
      getItems(),
    ]);
    setInvoices(invoicesData);
    setFilteredInvoices(invoicesData);
    setSuppliers(suppliersData);
    setItems(itemsData);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    let filtered = invoices.filter(
      inv => inv.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
             inv.name?.toLowerCase().includes(search.toLowerCase())
    );
    if (statusFilter !== "all") {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }
    setFilteredInvoices(filtered);
    setCurrentPage(1);
  }, [search, statusFilter, invoices]);

  const submittedInvoices = invoices.filter(inv => inv.docstatus === 1);
  const totalAmount = submittedInvoices.reduce((sum, inv) => sum + (inv.grand_total || 0), 0);
  const totalOutstanding = submittedInvoices.reduce((sum, inv) => sum + (inv.outstanding_amount || 0), 0);
  const unpaidCount = submittedInvoices.filter(inv => inv.status === "Unpaid").length;
  const totalPages = Math.ceil(filteredInvoices.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = filteredInvoices.slice(startIndex, startIndex + pageSize);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreate = async (data: { supplier: string; due_date: string; items: Array<{ item_code: string; qty: number; rate?: number }> }) => {
    try {
      await createPurchaseInvoice(data);
      showToast("Facture d'achat creee avec succes", "success");
      fetchData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erreur lors de la creation", "error");
      throw error;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      Paid: "default", Unpaid: "destructive", Overdue: "destructive",
      Draft: "secondary", Cancelled: "outline", Return: "outline",
    };
    const labels: Record<string, string> = {
      Paid: "Payee", Unpaid: "Impayee", Overdue: "En retard",
      Draft: "Brouillon", Cancelled: "Annulee", Return: "Avoir",
    };
    return <Badge variant={variants[status] || "secondary"} className="rounded-lg">{labels[status] || status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Chargement des factures achats...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm animate-in slide-in-from-bottom-5 ${
          toast.type === "success"
            ? "border-success-100 bg-success-50/90 text-green-900 dark:border-green-800 dark:bg-green-950/90 dark:text-green-100"
            : "border-danger-100 bg-red-50/90 text-red-900 dark:border-red-800 dark:bg-red-950/90 dark:text-red-100"
        }`}>{toast.message}</div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Factures Achats</h2>
          <p className="text-muted-foreground">Gestion des factures fournisseurs ({invoices.length} factures)</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" /> Nouvelle Facture
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Factures</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAmount.toLocaleString()} MAD</div>
            <p className="text-xs text-muted-foreground">{submittedInvoices.length} factures</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">A Payer</CardTitle>
            <TrendingDown className="h-4 w-4 text-danger-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger-400">{totalOutstanding.toLocaleString()} MAD</div>
            <p className="text-xs text-muted-foreground">En attente</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Impayees</CardTitle>
            <FileText className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unpaidCount}</div>
            <p className="text-xs text-muted-foreground">Factures</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taux de Paiement</CardTitle>
            <FileText className="h-4 w-4 text-success-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {submittedInvoices.length > 0 ? Math.round(((submittedInvoices.length - unpaidCount) / submittedInvoices.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Factures payees</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher une facture..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-muted/50 border-0 focus-visible:ring-1" />
          </div>
          <div className="flex gap-2">
            {[{ key: "all", label: "Toutes" }, { key: "Paid", label: "Payees" }, { key: "Unpaid", label: "Impayees" }].map(f => (
              <Button key={f.key} variant={statusFilter === f.key ? "default" : "outline"} size="sm"
                onClick={() => setStatusFilter(f.key)} className="rounded-xl">{f.label}</Button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { exportToCSV(filteredInvoices, columns, "factures-achats-maos"); showToast("Export CSV telecharge", "success"); }} className="rounded-xl">
            <Download className="h-4 w-4 mr-2" /> Exporter CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => printDocument(filteredInvoices, columns, "Liste des Factures Achats")} className="rounded-xl">
            <Printer className="h-4 w-4 mr-2" /> Imprimer
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Liste des factures ({filteredInvoices.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {paginated.map(invoice => (
              <div key={invoice.name} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{invoice.name}</span>
                    {getStatusBadge(invoice.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">{invoice.supplier_name}</div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(invoice.posting_date).toLocaleDateString("fr-FR")}
                    </span>
                    <span>Echeance: {new Date(invoice.due_date).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-lg font-bold">{(invoice.grand_total || 0).toLocaleString()} MAD</div>
                  {invoice.outstanding_amount > 0 && (
                    <div className="text-sm text-danger-400">Reste: {invoice.outstanding_amount.toLocaleString()} MAD</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {filteredInvoices.length === 0 && (
        <div className="text-center py-12">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-semibold">Aucune facture trouvee</h3>
          <p className="text-muted-foreground">Essayez une autre recherche</p>
          <Button onClick={() => setFormOpen(true)} className="mt-4 rounded-xl">
            <Plus className="mr-2 h-4 w-4" /> Nouvelle Facture
          </Button>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">{startIndex + 1}-{Math.min(startIndex + pageSize, filteredInvoices.length)} sur {filteredInvoices.length}</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 w-8 p-0 rounded-lg">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm font-medium">{currentPage} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8 w-8 p-0 rounded-lg">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <PurchaseInvoiceForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreate} suppliers={suppliers} items={items} />
    </div>
  );
}
