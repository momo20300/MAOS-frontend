"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageSkeleton } from "@/components/ui/skeleton";
import { ErrorMessage } from "@/components/ui/error-message";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { SortableHeader } from "@/components/ui/sortable-header";
import { useSortableData } from "@/lib/hooks/use-sortable-data";
import {
  getInvoices, getCustomers, getItems, createInvoice,
  exportToCSV, printDocument, printDocumentPDF,
  submitSalesInvoice, cancelSalesDocument,
  recordPaymentForInvoice,
} from "@/lib/services/erpnext";
import { OrderForm } from "@/components/forms";
import {
  FileText, TrendingUp, TrendingDown, Search, Plus, Download, Printer,
  FileSpreadsheet, ChevronLeft, ChevronRight, Calendar, CheckCircle, XCircle, CreditCard
} from "lucide-react";

interface Invoice {
  name: string;
  customer_name: string;
  posting_date: string;
  due_date: string;
  grand_total: number;
  status: string;
  outstanding_amount: number;
  docstatus: number;
}

interface Customer {
  name: string;
  customer_name: string;
}

interface Item {
  item_code: string;
  item_name: string;
  standard_rate: number;
}

const columns = [
  { key: "name", label: "Reference" },
  { key: "customer_name", label: "Client" },
  { key: "posting_date", label: "Date" },
  { key: "due_date", label: "Echeance" },
  { key: "grand_total", label: "Montant (MAD)" },
  { key: "outstanding_amount", label: "Reste (MAD)" },
  { key: "status", label: "Statut" },
];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const pageSize = 10;

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const [invoicesData, customersData, itemsData] = await Promise.all([
        getInvoices(),
        getCustomers(),
        getItems(),
      ]);
      setInvoices(invoicesData);
      setFilteredInvoices(invoicesData);
      setCustomers(customersData);
      setItems(itemsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    let filtered = invoices.filter(
      (inv) =>
        inv.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        inv.name?.toLowerCase().includes(search.toLowerCase())
    );

    if (statusFilter !== "all") {
      filtered = filtered.filter((inv) => inv.status === statusFilter);
    }

    if (dateFrom) filtered = filtered.filter(d => d.posting_date >= dateFrom);
    if (dateTo) filtered = filtered.filter(d => d.posting_date <= dateTo);

    setFilteredInvoices(filtered);
    setCurrentPage(1);
  }, [search, statusFilter, invoices, dateFrom, dateTo]);

  const { sortedData, sortKey, sortDir, toggleSort } = useSortableData(
    filteredInvoices as unknown as Record<string, unknown>[],
    "posting_date",
    "desc"
  );

  const submittedInvoices = invoices.filter((inv) => inv.docstatus === 1);
  const totalAmount = submittedInvoices.reduce((sum, inv) => sum + (inv.grand_total || 0), 0);
  const totalOutstanding = submittedInvoices.reduce((sum, inv) => sum + (inv.outstanding_amount || 0), 0);
  const unpaidCount = submittedInvoices.filter((inv) => inv.status === "Unpaid").length;
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedInvoices = sortedData.slice(startIndex, startIndex + pageSize) as unknown as Invoice[];

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreateInvoice = async (data: {
    customer: string;
    delivery_date: string;
    items: Array<{ item_code: string; qty: number; rate?: number }>;
  }) => {
    try {
      await createInvoice({
        customer: data.customer,
        due_date: data.delivery_date,
        items: data.items,
      });
      showToast("Facture creee avec succes", "success");
      fetchInvoices();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erreur lors de la creation", "error");
      throw error;
    }
  };

  const handleExportCSV = () => {
    exportToCSV(filteredInvoices, columns, "factures-maos");
    showToast("Export CSV telecharge", "success");
  };

  const handlePrint = () => {
    printDocument(filteredInvoices, columns, "Liste des Factures");
  };

  const handleSubmitInvoice = async (name: string) => {
    if (!confirm(`Soumettre la facture ${name} ?`)) return;
    setActionLoading(name);
    try {
      await submitSalesInvoice(name);
      showToast("Facture soumise avec succes", "success");
      fetchInvoices();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erreur lors de la soumission", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelInvoice = async (name: string) => {
    if (!confirm(`Annuler la facture ${name} ?`)) return;
    setActionLoading(name);
    try {
      await cancelSalesDocument("invoices", name);
      showToast("Facture annulee", "success");
      fetchInvoices();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erreur lors de l'annulation", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRecordPayment = async (invoice: Invoice) => {
    const amount = prompt(
      `Enregistrer un paiement pour ${invoice.name}\nClient: ${invoice.customer_name}\nMontant restant: ${(invoice.outstanding_amount || 0).toLocaleString()} MAD\n\nMontant a payer (MAD):`,
      String(invoice.outstanding_amount || invoice.grand_total)
    );
    if (!amount) return;
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast("Montant invalide", "error");
      return;
    }
    setActionLoading(invoice.name);
    try {
      await recordPaymentForInvoice({
        payment_type: "Receive",
        party_type: "Customer",
        party: invoice.customer_name,
        paid_amount: parsedAmount,
        reference_doctype: "Sales Invoice",
        reference_name: invoice.name,
      });
      showToast(`Paiement de ${parsedAmount.toLocaleString()} MAD enregistre`, "success");
      fetchInvoices();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erreur lors du paiement", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      Paid: "default",
      Unpaid: "destructive",
      Overdue: "destructive",
      Draft: "secondary",
      Cancelled: "outline",
      Return: "outline",
    };
    const labels: Record<string, string> = {
      Paid: "Payee",
      Unpaid: "Impayee",
      Overdue: "En retard",
      Draft: "Brouillon",
      Cancelled: "Annulee",
      Return: "Avoir",
    };
    return (
      <Badge variant={variants[status] || "secondary"} className="rounded-lg">
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) return <PageSkeleton title="Factures" kpiCount={4} />;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm animate-in slide-in-from-bottom-5 ${
            toast.type === "success"
              ? "border-success-100 bg-success-50/90 text-green-900 dark:border-green-800 dark:bg-green-950/90 dark:text-green-100"
              : "border-danger-100 bg-red-50/90 text-red-900 dark:border-red-800 dark:bg-red-950/90 dark:text-red-100"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Factures</h2>
          <p className="text-muted-foreground">
            Gestion des factures clients ({invoices.length} factures)
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle Facture
        </Button>
      </div>

      {/* Error */}
      {error && !invoices.length && (
        <ErrorMessage message={error} onRetry={fetchInvoices} />
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Facture</CardTitle>
            <TrendingUp className="h-4 w-4 text-success-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success-400">
              {totalAmount.toLocaleString()} MAD
            </div>
            <p className="text-xs text-muted-foreground">{submittedInvoices.length} factures</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">A Recouvrer</CardTitle>
            <TrendingDown className="h-4 w-4 text-danger-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger-400">
              {totalOutstanding.toLocaleString()} MAD
            </div>
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
            <TrendingUp className="h-4 w-4 text-success-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {submittedInvoices.length > 0
                ? Math.round(((submittedInvoices.length - unpaidCount) / submittedInvoices.length) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Factures payees</p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une facture..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className="rounded-xl"
            >
              Toutes
            </Button>
            <Button
              variant={statusFilter === "Paid" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("Paid")}
              className="rounded-xl"
            >
              Payees
            </Button>
            <Button
              variant={statusFilter === "Unpaid" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("Unpaid")}
              className="rounded-xl"
            >
              Impayees
            </Button>
          </div>
          <DateRangeFilter from={dateFrom} to={dateTo} onChange={(f, t) => { setDateFrom(f); setDateTo(t); }} />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="rounded-xl">
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-xl">
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Liste des factures ({sortedData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Sort header bar */}
          <div className="hidden md:flex items-center gap-4 px-4 pb-2 border-b text-xs font-medium text-muted-foreground">
            <SortableHeader label="Reference" sortKey="name" active={sortKey === "name"} direction={sortDir} onClick={toggleSort} className="w-32" />
            <SortableHeader label="Client" sortKey="customer_name" active={sortKey === "customer_name"} direction={sortDir} onClick={toggleSort} className="flex-1" />
            <SortableHeader label="Date" sortKey="posting_date" active={sortKey === "posting_date"} direction={sortDir} onClick={toggleSort} className="w-24" />
            <SortableHeader label="Echeance" sortKey="due_date" active={sortKey === "due_date"} direction={sortDir} onClick={toggleSort} className="w-24" />
            <SortableHeader label="Montant" sortKey="grand_total" active={sortKey === "grand_total"} direction={sortDir} onClick={toggleSort} className="w-28 text-right" />
            <SortableHeader label="Reste" sortKey="outstanding_amount" active={sortKey === "outstanding_amount"} direction={sortDir} onClick={toggleSort} className="w-24 text-right" />
            <span className="w-20">Statut</span>
            <span className="w-32">Actions</span>
          </div>

          <div className="space-y-3 mt-3">
            {paginatedInvoices.map((invoice) => (
              <div
                key={invoice.name}
                className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{invoice.name}</span>
                    {getStatusBadge(invoice.status)}
                    {invoice.docstatus === 0 && (
                      <Badge variant="outline" className="rounded-lg">
                        Brouillon
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">{invoice.customer_name}</div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(invoice.posting_date).toLocaleDateString("fr-FR")}
                    </span>
                    <span>Echeance: {new Date(invoice.due_date).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right space-y-1 mr-2">
                    <div className="text-lg font-bold">
                      {(invoice.grand_total || 0).toLocaleString()} MAD
                    </div>
                    {invoice.outstanding_amount > 0 && (
                      <div className="text-sm text-danger-400">
                        Reste: {invoice.outstanding_amount.toLocaleString()} MAD
                      </div>
                    )}
                  </div>
                  {invoice.docstatus === 0 && (
                    <Button
                      variant="default"
                      size="sm"
                      className="rounded-lg bg-green-600 hover:bg-green-700 text-white h-8"
                      disabled={actionLoading === invoice.name}
                      onClick={(e) => { e.stopPropagation(); handleSubmitInvoice(invoice.name); }}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Soumettre
                    </Button>
                  )}
                  {invoice.docstatus === 1 && invoice.outstanding_amount > 0 && (
                    <Button
                      variant="default"
                      size="sm"
                      className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white h-8"
                      disabled={actionLoading === invoice.name}
                      onClick={(e) => { e.stopPropagation(); handleRecordPayment(invoice); }}
                    >
                      <CreditCard className="h-3.5 w-3.5 mr-1" />
                      Payer
                    </Button>
                  )}
                  {invoice.docstatus === 1 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="rounded-lg h-8"
                      disabled={actionLoading === invoice.name}
                      onClick={(e) => { e.stopPropagation(); handleCancelInvoice(invoice.name); }}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Annuler
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-lg"
                    title="Imprimer PDF"
                    onClick={(e) => {
                      e.stopPropagation();
                      printDocumentPDF('Sales Invoice', invoice.name)
                        .catch(() => showToast("Erreur lors de la generation du PDF", "error"));
                    }}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {sortedData.length === 0 && (
        <div className="text-center py-12">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-semibold">Aucune facture trouvee</h3>
          <p className="text-muted-foreground">Essayez une autre recherche</p>
          <Button onClick={() => setFormOpen(true)} className="mt-4 rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Facture
          </Button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            {startIndex + 1}-{Math.min(startIndex + pageSize, sortedData.length)} sur{" "}
            {sortedData.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0 rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm font-medium">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0 rounded-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Form Dialog - Using OrderForm for invoice creation */}
      <OrderForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateInvoice}
        customers={customers}
        items={items}
        type="invoice"
      />
    </div>
  );
}
