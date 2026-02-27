"use client";

import { useEffect, useState } from "react";
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
  getPaymentEntries, getCustomers, getSuppliers, createPaymentEntry,
  exportToCSV, printDocument
} from "@/lib/services/erpnext";
import { PaymentForm } from "@/components/forms";
import {
  CreditCard, TrendingUp, TrendingDown, Search, Plus, Download, Printer,
  FileSpreadsheet, ChevronLeft, ChevronRight, Calendar
} from "lucide-react";

interface Payment {
  name: string;
  party_name: string;
  party_type: string;
  payment_type: string;
  posting_date: string;
  paid_amount: number;
  status: string;
  reference_no: string;
  docstatus: number;
}

interface Customer { name: string; customer_name: string; }
interface Supplier { name: string; supplier_name: string; }

const columns = [
  { key: "name", label: "Reference" },
  { key: "party_name", label: "Tiers" },
  { key: "payment_type", label: "Type" },
  { key: "posting_date", label: "Date" },
  { key: "paid_amount", label: "Montant (MAD)" },
  { key: "status", label: "Statut" },
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const pageSize = 10;

  const { sortedData, sortKey, sortDir, toggleSort } = useSortableData<Payment>(
    filteredPayments,
    "posting_date",
    "desc"
  );

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [paymentsData, customersData, suppliersData] = await Promise.all([
        getPaymentEntries(),
        getCustomers(),
        getSuppliers(),
      ]);
      setPayments(paymentsData);
      setFilteredPayments(paymentsData);
      setCustomers(customersData);
      setSuppliers(suppliersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des paiements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    let filtered = payments.filter(
      p => p.party_name?.toLowerCase().includes(search.toLowerCase()) ||
           p.name?.toLowerCase().includes(search.toLowerCase()) ||
           p.reference_no?.toLowerCase().includes(search.toLowerCase())
    );
    if (statusFilter === "receive") {
      filtered = filtered.filter(p => p.payment_type === "Receive");
    } else if (statusFilter === "pay") {
      filtered = filtered.filter(p => p.payment_type === "Pay");
    }

    if (dateFrom) {
      filtered = filtered.filter((p) => p.posting_date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((p) => p.posting_date <= dateTo);
    }

    setFilteredPayments(filtered);
    setCurrentPage(1);
  }, [search, statusFilter, payments, dateFrom, dateTo]);

  const totalReceived = payments.filter(p => p.payment_type === "Receive").reduce((sum, p) => sum + (p.paid_amount || 0), 0);
  const totalPaid = payments.filter(p => p.payment_type === "Pay").reduce((sum, p) => sum + (p.paid_amount || 0), 0);
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = sortedData.slice(startIndex, startIndex + pageSize);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreate = async (data: {
    payment_type: "Receive" | "Pay";
    party_type: "Customer" | "Supplier";
    party: string;
    paid_amount: number;
    posting_date: string;
    reference_no: string;
  }) => {
    try {
      await createPaymentEntry(data);
      showToast("Paiement cree avec succes", "success");
      fetchData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erreur lors de la creation", "error");
      throw error;
    }
  };

  if (loading) return <PageSkeleton title="Paiements" kpiCount={3} />;

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
          <h2 className="text-3xl font-bold tracking-tight">Paiements</h2>
          <p className="text-muted-foreground">Gestion des encaissements et decaissements ({payments.length} paiements)</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" /> Nouveau Paiement
        </Button>
      </div>

      {/* Error State */}
      {error && <ErrorMessage message={error} onRetry={fetchData} />}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Paiements</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
            <p className="text-xs text-muted-foreground">Paiements</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Encaissements</CardTitle>
            <TrendingUp className="h-4 w-4 text-success-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success-400">{totalReceived.toLocaleString()} MAD</div>
            <p className="text-xs text-muted-foreground">Recus</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Decaissements</CardTitle>
            <TrendingDown className="h-4 w-4 text-danger-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger-400">{totalPaid.toLocaleString()} MAD</div>
            <p className="text-xs text-muted-foreground">Payes</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher un paiement..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-muted/50 border-0 focus-visible:ring-1" />
          </div>
          <div className="flex gap-2">
            {[{ key: "all", label: "Tous" }, { key: "receive", label: "Encaissements" }, { key: "pay", label: "Decaissements" }].map(f => (
              <Button key={f.key} variant={statusFilter === f.key ? "default" : "outline"} size="sm"
                onClick={() => setStatusFilter(f.key)} className="rounded-xl">{f.label}</Button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { exportToCSV(sortedData, columns, "paiements-maos"); showToast("Export CSV telecharge", "success"); }} className="rounded-xl">
            <Download className="h-4 w-4 mr-2" /> Exporter CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => printDocument(sortedData, columns, "Liste des Paiements")} className="rounded-xl">
            <Printer className="h-4 w-4 mr-2" /> Imprimer
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter from={dateFrom} to={dateTo} onChange={(f, t) => { setDateFrom(f); setDateTo(t); }} />

      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Historique des paiements ({sortedData.length})</CardTitle></CardHeader>
        {/* Sort Headers */}
        <div className="px-6 pb-2 flex items-center gap-4 border-b overflow-x-auto">
          <SortableHeader label="Reference" sortKey="name" active={sortKey === "name"} direction={sortDir} onClick={toggleSort} className="min-w-[100px]" />
          <SortableHeader label="Tiers" sortKey="party_name" active={sortKey === "party_name"} direction={sortDir} onClick={toggleSort} className="min-w-[100px]" />
          <SortableHeader label="Type" sortKey="payment_type" active={sortKey === "payment_type"} direction={sortDir} onClick={toggleSort} className="min-w-[80px]" />
          <SortableHeader label="Date" sortKey="posting_date" active={sortKey === "posting_date"} direction={sortDir} onClick={toggleSort} className="min-w-[80px]" />
          <SortableHeader label="Montant" sortKey="paid_amount" active={sortKey === "paid_amount"} direction={sortDir} onClick={toggleSort} className="min-w-[80px]" />
        </div>
        <CardContent>
          <div className="space-y-3">
            {paginated.map(payment => (
              <div key={payment.name} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{payment.name}</span>
                    <Badge variant={payment.payment_type === "Receive" ? "default" : "secondary"} className="rounded-lg">
                      {payment.payment_type === "Receive" ? "Encaissement" : "Decaissement"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{payment.party_name}</div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(payment.posting_date).toLocaleDateString("fr-FR")}
                    </span>
                    {payment.reference_no && <span>Ref: {payment.reference_no}</span>}
                  </div>
                </div>
                <div className={`text-lg font-bold ${payment.payment_type === "Receive" ? "text-success-400" : "text-danger-400"}`}>
                  {payment.payment_type === "Receive" ? "+" : "-"}{(payment.paid_amount || 0).toLocaleString()} MAD
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {sortedData.length === 0 && (
        <div className="text-center py-12">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-semibold">Aucun paiement trouve</h3>
          <p className="text-muted-foreground">Essayez une autre recherche</p>
          <Button onClick={() => setFormOpen(true)} className="mt-4 rounded-xl">
            <Plus className="mr-2 h-4 w-4" /> Nouveau Paiement
          </Button>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">{startIndex + 1}-{Math.min(startIndex + pageSize, sortedData.length)} sur {sortedData.length}</p>
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

      <PaymentForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreate} customers={customers} suppliers={suppliers} />
    </div>
  );
}
