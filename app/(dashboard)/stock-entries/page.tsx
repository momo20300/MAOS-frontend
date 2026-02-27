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
import { getStockEntries, getItems, createStockEntry, exportToCSV, printDocument, submitStockEntry, cancelStockEntry } from "@/lib/services/erpnext";
import { StockEntryForm } from "@/components/forms";
import {
  BarChart3, Plus, ArrowUpCircle, ArrowDownCircle, Search,
  Download, Printer, FileSpreadsheet, ChevronLeft, ChevronRight, ArrowLeftRight,
  CheckCircle, XCircle,
} from "lucide-react";

interface StockEntry {
  name: string;
  stock_entry_type: string;
  posting_date: string;
  total_amount: number;
  docstatus: number;
  from_warehouse?: string;
  to_warehouse?: string;
}

interface Item {
  item_code: string;
  item_name: string;
}

const columns = [
  { key: "name", label: "Reference" },
  { key: "stock_entry_type", label: "Type" },
  { key: "posting_date", label: "Date" },
  { key: "from_warehouse", label: "Entrepot source" },
  { key: "to_warehouse", label: "Entrepot destination" },
  { key: "total_amount", label: "Montant (MAD)" },
];

export default function StockEntriesPage() {
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<StockEntry[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const pageSize = 10;

  const { sortedData, sortKey, sortDir, toggleSort } = useSortableData<StockEntry>(
    filteredEntries,
    "posting_date",
    "desc"
  );

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [entriesData, itemsData] = await Promise.all([
        getStockEntries(),
        getItems(),
      ]);
      setEntries(entriesData);
      setFilteredEntries(entriesData);
      setItems(itemsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des mouvements de stock");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = entries.filter(
      (entry) =>
        entry.name?.toLowerCase().includes(search.toLowerCase()) ||
        entry.stock_entry_type?.toLowerCase().includes(search.toLowerCase())
    );

    if (typeFilter !== "all") {
      filtered = filtered.filter((e) => e.stock_entry_type === typeFilter);
    }

    if (dateFrom) {
      filtered = filtered.filter((e) => e.posting_date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((e) => e.posting_date <= dateTo);
    }

    setFilteredEntries(filtered);
    setCurrentPage(1);
  }, [search, typeFilter, entries, dateFrom, dateTo]);

  const receipts = entries.filter((e) => e.stock_entry_type === "Material Receipt").length;
  const issues = entries.filter((e) => e.stock_entry_type === "Material Issue").length;
  const transfers = entries.filter((e) => e.stock_entry_type === "Material Transfer").length;
  const types = Array.from(new Set(entries.map((e) => e.stock_entry_type).filter(Boolean)));
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedEntries = sortedData.slice(startIndex, startIndex + pageSize);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreateStockEntry = async (data: {
    stock_entry_type: "Material Receipt" | "Material Issue" | "Material Transfer";
    items: Array<{ item_code: string; qty: number; s_warehouse?: string; t_warehouse?: string }>;
    posting_date: string;
  }) => {
    try {
      await createStockEntry(data);
      showToast("Mouvement de stock enregistre avec succes", "success");
      fetchData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erreur lors de l'enregistrement", "error");
      throw error;
    }
  };

  const handleExportCSV = () => {
    exportToCSV(sortedData, columns, "mouvements-stock-maos");
    showToast("Export CSV telecharge", "success");
  };

  const handlePrint = () => {
    printDocument(sortedData, columns, "Mouvements de Stock");
  };

  const handleSubmitEntry = async (name: string) => {
    if (!confirm(`Valider le mouvement de stock ${name} ?`)) return;
    setActionLoading(name);
    try {
      await submitStockEntry(name);
      showToast("Mouvement valide avec succes", "success");
      fetchData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erreur lors de la validation", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelEntry = async (name: string) => {
    if (!confirm(`Annuler le mouvement de stock ${name} ?`)) return;
    setActionLoading(name);
    try {
      await cancelStockEntry(name);
      showToast("Mouvement annule", "success");
      fetchData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erreur lors de l'annulation", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const getTypeBadge = (type: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive"; label: string; color?: string }> = {
      "Material Receipt": { variant: "default", label: "Entree", color: "bg-success-400" },
      "Material Issue": { variant: "destructive", label: "Sortie" },
      "Material Transfer": { variant: "secondary", label: "Transfert" },
    };
    const cfg = config[type] || { variant: "secondary" as const, label: type };
    return (
      <Badge variant={cfg.variant} className={`rounded-lg ${cfg.color || ""}`}>
        {cfg.label}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Material Receipt":
        return <ArrowUpCircle className="h-5 w-5 text-success-400" />;
      case "Material Issue":
        return <ArrowDownCircle className="h-5 w-5 text-danger-400" />;
      case "Material Transfer":
        return <ArrowLeftRight className="h-5 w-5 text-blue-600" />;
      default:
        return <BarChart3 className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (loading) return <PageSkeleton title="Mouvements de Stock" kpiCount={4} />;

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
          <h2 className="text-3xl font-bold tracking-tight">Mouvements de Stock</h2>
          <p className="text-muted-foreground">
            Gerez vos entrees et sorties de stock ({entries.length} mouvements)
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Mouvement
        </Button>
      </div>

      {/* Error State */}
      {error && <ErrorMessage message={error} onRetry={fetchData} />}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Mouvements</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entries.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Entrees</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-success-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success-400">{receipts}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sorties</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-danger-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger-400">{issues}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Transferts</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{transfers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un mouvement..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={typeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("all")}
              className="rounded-xl"
            >
              Tous
            </Button>
            <Button
              variant={typeFilter === "Material Receipt" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("Material Receipt")}
              className="rounded-xl"
            >
              Entrees
            </Button>
            <Button
              variant={typeFilter === "Material Issue" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("Material Issue")}
              className="rounded-xl"
            >
              Sorties
            </Button>
            <Button
              variant={typeFilter === "Material Transfer" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("Material Transfer")}
              className="rounded-xl"
            >
              Transferts
            </Button>
          </div>
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

      {/* Date Range Filter */}
      <DateRangeFilter from={dateFrom} to={dateTo} onChange={(f, t) => { setDateFrom(f); setDateTo(t); }} />

      {/* Table */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Historique des mouvements</CardTitle>
        </CardHeader>
        {/* Sort Headers */}
        <div className="px-6 pb-2 flex items-center gap-4 border-b overflow-x-auto">
          <SortableHeader label="Reference" sortKey="name" active={sortKey === "name"} direction={sortDir} onClick={toggleSort} className="min-w-[100px]" />
          <SortableHeader label="Type" sortKey="stock_entry_type" active={sortKey === "stock_entry_type"} direction={sortDir} onClick={toggleSort} className="min-w-[80px]" />
          <SortableHeader label="Entrepot Source" sortKey="from_warehouse" active={sortKey === "from_warehouse"} direction={sortDir} onClick={toggleSort} className="min-w-[120px]" />
          <SortableHeader label="Entrepot Dest" sortKey="to_warehouse" active={sortKey === "to_warehouse"} direction={sortDir} onClick={toggleSort} className="min-w-[120px]" />
          <SortableHeader label="Date" sortKey="posting_date" active={sortKey === "posting_date"} direction={sortDir} onClick={toggleSort} className="min-w-[80px]" />
          <SortableHeader label="Statut" sortKey="docstatus" active={sortKey === "docstatus"} direction={sortDir} onClick={toggleSort} className="min-w-[70px]" />
        </div>
        <CardContent>
          <div className="space-y-3">
            {paginatedEntries.map((entry) => (
              <div
                key={entry.name}
                className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  {getTypeIcon(entry.stock_entry_type)}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{entry.name}</span>
                      {getTypeBadge(entry.stock_entry_type)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(entry.posting_date).toLocaleDateString("fr-FR", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    {(entry.from_warehouse || entry.to_warehouse) && (
                      <div className="text-xs text-muted-foreground">
                        {entry.from_warehouse && <span>De: {entry.from_warehouse}</span>}
                        {entry.from_warehouse && entry.to_warehouse && <span> → </span>}
                        {entry.to_warehouse && <span>Vers: {entry.to_warehouse}</span>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-2">
                    <div className="text-lg font-bold">
                      {(entry.total_amount || 0).toLocaleString()} MAD
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {entry.docstatus === 1 ? "Valide" : "Brouillon"}
                    </div>
                  </div>
                  {entry.docstatus === 0 && (
                    <Button
                      variant="default"
                      size="sm"
                      className="rounded-lg bg-green-600 hover:bg-green-700 text-white h-8"
                      disabled={actionLoading === entry.name}
                      onClick={(e) => { e.stopPropagation(); handleSubmitEntry(entry.name); }}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Valider
                    </Button>
                  )}
                  {entry.docstatus === 1 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="rounded-lg h-8"
                      disabled={actionLoading === entry.name}
                      onClick={(e) => { e.stopPropagation(); handleCancelEntry(entry.name); }}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Annuler
                    </Button>
                  )}
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
          <h3 className="mt-4 text-lg font-semibold">Aucun mouvement de stock</h3>
          <p className="text-muted-foreground">Enregistrez votre premier mouvement de stock</p>
          <Button onClick={() => setFormOpen(true)} className="mt-4 rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau Mouvement
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

      {/* Form Dialog */}
      <StockEntryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateStockEntry}
        items={items}
      />
    </div>
  );
}
