"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getJournalEntries, getAccounts, createJournalEntry,
  exportToCSV, printDocument
} from "@/lib/services/erpnext";
import { JournalEntryForm } from "@/components/forms";
import {
  BookOpen, DollarSign, Search, Plus, Download, Printer,
  FileSpreadsheet, ChevronLeft, ChevronRight, Calendar
} from "lucide-react";

interface JournalEntry {
  name: string;
  voucher_type: string;
  posting_date: string;
  total_debit: number;
  total_credit: number;
  docstatus: number;
  user_remark: string;
}

interface Account { name: string; account_name?: string; }

const columns = [
  { key: "name", label: "Reference" },
  { key: "voucher_type", label: "Type" },
  { key: "posting_date", label: "Date" },
  { key: "total_debit", label: "Debit (MAD)" },
  { key: "total_credit", label: "Credit (MAD)" },
  { key: "user_remark", label: "Libelle" },
];

export default function JournalEntriesPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const pageSize = 10;

  const fetchData = async () => {
    setLoading(true);
    const [entriesData, accountsData] = await Promise.all([
      getJournalEntries(),
      getAccounts(),
    ]);
    setEntries(entriesData);
    setFilteredEntries(entriesData);
    setAccounts(accountsData);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    let filtered = entries.filter(
      e => e.name?.toLowerCase().includes(search.toLowerCase()) ||
           e.user_remark?.toLowerCase().includes(search.toLowerCase()) ||
           e.voucher_type?.toLowerCase().includes(search.toLowerCase())
    );
    if (typeFilter !== "all") {
      filtered = filtered.filter(e => e.voucher_type === typeFilter);
    }
    setFilteredEntries(filtered);
    setCurrentPage(1);
  }, [search, typeFilter, entries]);

  const totalDebit = entries.reduce((sum, e) => sum + (e.total_debit || 0), 0);
  const journalCount = entries.filter(e => e.voucher_type === "Journal Entry").length;
  const bankCount = entries.filter(e => e.voucher_type === "Bank Entry").length;
  const totalPages = Math.ceil(filteredEntries.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = filteredEntries.slice(startIndex, startIndex + pageSize);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreate = async (data: {
    posting_date: string;
    voucher_type: string;
    accounts: Array<{ account: string; debit_in_account_currency: number; credit_in_account_currency: number }>;
    user_remark: string;
  }) => {
    try {
      await createJournalEntry(data);
      showToast("Ecriture comptable creee avec succes", "success");
      fetchData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erreur lors de la creation", "error");
      throw error;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      "Journal Entry": "default", "Bank Entry": "secondary", "Cash Entry": "outline",
      "Depreciation Entry": "outline",
    };
    const labels: Record<string, string> = {
      "Journal Entry": "Journal", "Bank Entry": "Banque", "Cash Entry": "Caisse",
      "Depreciation Entry": "Amortissement",
    };
    return <Badge variant={variants[type] || "secondary"} className="rounded-lg">{labels[type] || type}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Chargement des ecritures...
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
          <h2 className="text-3xl font-bold tracking-tight">Ecritures Comptables</h2>
          <p className="text-muted-foreground">Gestion des ecritures de journal ({entries.length} ecritures)</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" /> Nouvelle Ecriture
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Ecritures</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entries.length}</div>
            <p className="text-xs text-muted-foreground">Ecritures</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
            <DollarSign className="h-4 w-4 text-success-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDebit.toLocaleString()} MAD</div>
            <p className="text-xs text-muted-foreground">Total debit</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Journal</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{journalCount}</div>
            <p className="text-xs text-muted-foreground">Journal Entry</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Banque</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bankCount}</div>
            <p className="text-xs text-muted-foreground">Bank Entry</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher une ecriture..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-muted/50 border-0 focus-visible:ring-1" />
          </div>
          <div className="flex gap-2">
            {[
              { key: "all", label: "Toutes" },
              { key: "Journal Entry", label: "Journal" },
              { key: "Bank Entry", label: "Banque" },
              { key: "Cash Entry", label: "Caisse" },
            ].map(f => (
              <Button key={f.key} variant={typeFilter === f.key ? "default" : "outline"} size="sm"
                onClick={() => setTypeFilter(f.key)} className="rounded-xl">{f.label}</Button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { exportToCSV(filteredEntries, columns, "ecritures-comptables-maos"); showToast("Export CSV telecharge", "success"); }} className="rounded-xl">
            <Download className="h-4 w-4 mr-2" /> Exporter CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => printDocument(filteredEntries, columns, "Liste des Ecritures Comptables")} className="rounded-xl">
            <Printer className="h-4 w-4 mr-2" /> Imprimer
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Liste des ecritures ({filteredEntries.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {paginated.map(entry => (
              <div key={entry.name} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{entry.name}</span>
                    {getTypeBadge(entry.voucher_type)}
                  </div>
                  {entry.user_remark && <div className="text-sm text-muted-foreground">{entry.user_remark}</div>}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(entry.posting_date).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{(entry.total_debit || 0).toLocaleString()} MAD</div>
                  <div className="text-xs text-muted-foreground">Debit = Credit</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {filteredEntries.length === 0 && (
        <div className="text-center py-12">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-semibold">Aucune ecriture trouvee</h3>
          <p className="text-muted-foreground">Essayez une autre recherche</p>
          <Button onClick={() => setFormOpen(true)} className="mt-4 rounded-xl">
            <Plus className="mr-2 h-4 w-4" /> Nouvelle Ecriture
          </Button>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">{startIndex + 1}-{Math.min(startIndex + pageSize, filteredEntries.length)} sur {filteredEntries.length}</p>
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

      <JournalEntryForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreate} accounts={accounts} />
    </div>
  );
}
