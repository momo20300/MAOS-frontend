"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getStockItems, getItems, createStockEntry, exportToCSV, printDocument } from "@/lib/services/erpnext";
import { StockEntryForm } from "@/components/forms";
import {
  Package, AlertTriangle, TrendingUp, Plus, Search,
  Download, Printer, FileSpreadsheet, ChevronLeft, ChevronRight, Warehouse
} from "lucide-react";

interface StockItem {
  name: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  actual_qty?: number;
  warehouse?: string;
}

const columns = [
  { key: "item_name", label: "Nom" },
  { key: "name", label: "Code" },
  { key: "item_group", label: "Categorie" },
  { key: "actual_qty", label: "Quantite" },
  { key: "stock_uom", label: "Unite" },
  { key: "warehouse", label: "Entrepot" },
];

interface AvailableItem {
  item_code: string;
  item_name: string;
}

export default function StockPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<StockItem[]>([]);
  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([]);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const pageSize = 12;

  const fetchItems = async () => {
    setLoading(true);
    const [stockData, itemsData] = await Promise.all([
      getStockItems(),
      getItems(),
    ]);
    setItems(stockData);
    setFilteredItems(stockData);
    setAvailableItems(itemsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    let filtered = items.filter(
      (item) =>
        item.item_name?.toLowerCase().includes(search.toLowerCase()) ||
        item.name?.toLowerCase().includes(search.toLowerCase())
    );

    if (groupFilter !== "all") {
      filtered = filtered.filter((item) => item.item_group === groupFilter);
    }

    setFilteredItems(filtered);
    setCurrentPage(1);
  }, [search, groupFilter, items]);

  const groups = Array.from(new Set(items.map((item) => item.item_group).filter(Boolean)));
  const criticalItems = items.filter((i) => (i.actual_qty || 0) < 10);
  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleExportCSV = () => {
    exportToCSV(filteredItems, columns, "stock-maos");
    showToast("Export CSV telecharge", "success");
  };

  const handlePrint = () => {
    printDocument(filteredItems, columns, "Inventaire du Stock");
  };

  const handleCreateStockEntry = async (data: {
    stock_entry_type: "Material Receipt" | "Material Issue" | "Material Transfer";
    items: Array<{ item_code: string; qty: number; s_warehouse?: string; t_warehouse?: string }>;
    posting_date: string;
  }) => {
    try {
      await createStockEntry(data);
      showToast("Mouvement de stock enregistre avec succes", "success");
      fetchItems();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erreur lors de l'enregistrement", "error");
      throw error;
    }
  };

  const getStockBadge = (qty: number | undefined) => {
    const value = qty || 0;
    if (value <= 0) {
      return <Badge variant="destructive" className="rounded-lg">Rupture</Badge>;
    }
    if (value < 10) {
      return <Badge className="rounded-lg bg-yellow-500">Critique</Badge>;
    }
    if (value < 50) {
      return <Badge variant="secondary" className="rounded-lg">Bas</Badge>;
    }
    return <Badge variant="default" className="rounded-lg bg-success-400">OK</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Chargement du stock...
        </div>
      </div>
    );
  }

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
          <h2 className="text-3xl font-bold tracking-tight">Gestion du Stock</h2>
          <p className="text-muted-foreground">
            Inventaire et mouvements ({items.length} articles)
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Mouvement Stock
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Articles en Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stock Critique</CardTitle>
            <AlertTriangle className="h-4 w-4 text-danger-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger-400">{criticalItems.length}</div>
            <p className="text-xs text-muted-foreground">Articles sous seuil</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Entrepots</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(items.map((i) => i.warehouse).filter(Boolean)).size || 1}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un article..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={groupFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setGroupFilter("all")}
              className="rounded-xl"
            >
              Tous
            </Button>
            {groups.slice(0, 4).map((group) => (
              <Button
                key={group}
                variant={groupFilter === group ? "default" : "outline"}
                size="sm"
                onClick={() => setGroupFilter(group)}
                className="rounded-xl"
              >
                {group}
              </Button>
            ))}
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

      {/* Results count */}
      <div className="flex items-center">
        <Badge variant="secondary" className="rounded-lg">
          {filteredItems.length} article(s)
        </Badge>
      </div>

      {/* Table */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Articles en stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {paginatedItems.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex-1">
                  <div className="font-medium">{item.item_name}</div>
                  <div className="text-xs text-muted-foreground">{item.name}</div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="rounded-lg">
                    {item.item_group}
                  </Badge>
                  <div className="text-right min-w-[80px]">
                    <div className="font-semibold">
                      {item.actual_qty !== undefined ? item.actual_qty.toLocaleString() : "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">{item.stock_uom}</div>
                  </div>
                  {getStockBadge(item.actual_qty)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-semibold">Aucun article en stock</h3>
          <p className="text-muted-foreground">Ajoutez des articles stockables</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            {startIndex + 1}-{Math.min(startIndex + pageSize, filteredItems.length)} sur{" "}
            {filteredItems.length}
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

      {/* Stock Entry Form Dialog */}
      <StockEntryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateStockEntry}
        items={availableItems}
      />
    </div>
  );
}
