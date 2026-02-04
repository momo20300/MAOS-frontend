"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getBOMs, getItems, createBOM, exportToCSV, printDocument } from "@/lib/services/erpnext";
import { BOMForm } from "@/components/forms";
import {
  ClipboardList, Plus, Package, Search,
  Download, Printer, FileSpreadsheet, ChevronLeft, ChevronRight, CheckCircle
} from "lucide-react";

interface BOM {
  name: string;
  item: string;
  item_name: string;
  quantity: number;
  is_active: boolean;
  is_default: boolean;
  total_cost: number;
}

interface Item {
  item_code: string;
  item_name: string;
  standard_rate: number;
}

const columns = [
  { key: "name", label: "Reference" },
  { key: "item_name", label: "Article fabrique" },
  { key: "quantity", label: "Quantite" },
  { key: "total_cost", label: "Cout total (MAD)" },
  { key: "is_active", label: "Actif" },
  { key: "is_default", label: "Par defaut" },
];

export default function BOMPage() {
  const [boms, setBoms] = useState<BOM[]>([]);
  const [filteredBoms, setFilteredBoms] = useState<BOM[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const pageSize = 10;

  const fetchData = async () => {
    setLoading(true);
    const [bomsData, itemsData] = await Promise.all([
      getBOMs(),
      getItems(),
    ]);
    setBoms(bomsData);
    setFilteredBoms(bomsData);
    setItems(itemsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = boms.filter(
      (bom) =>
        bom.name?.toLowerCase().includes(search.toLowerCase()) ||
        bom.item_name?.toLowerCase().includes(search.toLowerCase()) ||
        bom.item?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredBoms(filtered);
    setCurrentPage(1);
  }, [search, boms]);

  const activeBoms = boms.filter((b) => b.is_active).length;
  const defaultBoms = boms.filter((b) => b.is_default).length;
  const totalCost = boms.reduce((sum, b) => sum + (b.total_cost || 0), 0);
  const totalPages = Math.ceil(filteredBoms.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedBoms = filteredBoms.slice(startIndex, startIndex + pageSize);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreateBOM = async (data: {
    item: string;
    quantity: number;
    items: Array<{ item_code: string; qty: number; rate?: number }>;
    is_active?: boolean;
    is_default?: boolean;
  }) => {
    try {
      await createBOM(data);
      showToast("Nomenclature creee avec succes", "success");
      fetchData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erreur lors de la creation", "error");
      throw error;
    }
  };

  const handleExportCSV = () => {
    exportToCSV(filteredBoms, columns, "nomenclatures-maos");
    showToast("Export CSV telecharge", "success");
  };

  const handlePrint = () => {
    printDocument(filteredBoms, columns, "Nomenclatures (BOM)");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Chargement des nomenclatures...
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
          <h2 className="text-3xl font-bold tracking-tight">Nomenclatures (BOM)</h2>
          <p className="text-muted-foreground">
            Gerez vos nomenclatures de fabrication ({boms.length} nomenclatures)
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle Nomenclature
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Nomenclatures</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{boms.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Actives</CardTitle>
            <CheckCircle className="h-4 w-4 text-success-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success-400">{activeBoms}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Par defaut</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{defaultBoms}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cout Total</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCost.toLocaleString()} MAD</div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une nomenclature..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-muted/50 border-0 focus-visible:ring-1"
            />
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

      {/* Table */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Liste des nomenclatures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {paginatedBoms.map((bom) => (
              <div
                key={bom.name}
                className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{bom.name}</span>
                    {bom.is_active && (
                      <Badge variant="default" className="rounded-lg bg-success-400">Actif</Badge>
                    )}
                    {bom.is_default && (
                      <Badge variant="secondary" className="rounded-lg">Par defaut</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {bom.item_name || bom.item}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Quantite: {bom.quantity || 1} unite(s)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {(bom.total_cost || 0).toLocaleString()} MAD
                  </div>
                  <div className="text-xs text-muted-foreground">cout de fabrication</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredBoms.length === 0 && (
        <div className="text-center py-12">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-semibold">Aucune nomenclature</h3>
          <p className="text-muted-foreground">Creez votre premiere nomenclature de fabrication</p>
          <Button onClick={() => setFormOpen(true)} className="mt-4 rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Nomenclature
          </Button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            {startIndex + 1}-{Math.min(startIndex + pageSize, filteredBoms.length)} sur{" "}
            {filteredBoms.length}
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
      <BOMForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateBOM}
        items={items}
      />
    </div>
  );
}
