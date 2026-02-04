"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getSuppliers, createSupplier, exportToCSV, printDocument, importFromCSV } from "@/lib/services/erpnext";
import { SupplierForm } from "@/components/forms";
import {
  Search, Building2, Globe, Tag, Plus,
  Download, Upload, Printer, FileSpreadsheet, ChevronLeft, ChevronRight
} from "lucide-react";

interface Supplier {
  name: string;
  supplier_name: string;
  supplier_group: string;
  supplier_type: string;
  country: string;
}

const columns = [
  { key: "supplier_name", label: "Nom" },
  { key: "supplier_type", label: "Type" },
  { key: "supplier_group", label: "Groupe" },
  { key: "country", label: "Pays" },
];

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageSize = 12;

  const fetchSuppliers = async () => {
    setLoading(true);
    const data = await getSuppliers();
    setSuppliers(data);
    setFilteredSuppliers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const filtered = suppliers.filter(
      (s) =>
        (s.supplier_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (s.name?.toLowerCase() || "").includes(search.toLowerCase())
    );
    setFilteredSuppliers(filtered);
    setCurrentPage(1);
  }, [search, suppliers]);

  const totalPages = Math.ceil(filteredSuppliers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedSuppliers = filteredSuppliers.slice(startIndex, startIndex + pageSize);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreateSupplier = async (data: {
    supplier_name: string;
    supplier_type?: string;
    supplier_group?: string;
    country?: string;
  }) => {
    try {
      await createSupplier(data);
      showToast("Fournisseur cree avec succes", "success");
      fetchSuppliers();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erreur lors de la creation", "error");
      throw error;
    }
  };

  const handleExportCSV = () => {
    exportToCSV(filteredSuppliers, columns, "fournisseurs-maos");
    showToast("Export CSV telecharge", "success");
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importFromCSV<{
      supplier_name: string;
      supplier_type?: string;
      supplier_group?: string;
      country?: string;
    }>(file, createSupplier);

    if (result.success > 0) {
      showToast(`${result.success} fournisseur(s) importe(s) avec succes`, "success");
      fetchSuppliers();
    }
    if (result.errors.length > 0) {
      showToast(`${result.errors.length} erreur(s) lors de l'import`, "error");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePrint = () => {
    printDocument(filteredSuppliers, columns, "Liste des Fournisseurs");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Chargement des fournisseurs...
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
          <h2 className="text-3xl font-bold tracking-tight">Fournisseurs</h2>
          <p className="text-muted-foreground">
            Gerez vos fournisseurs ({suppliers.length} fournisseurs)
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Fournisseur
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Fournisseurs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Groupes</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(suppliers.map((s) => s.supplier_group)).size}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pays</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(suppliers.map((s) => s.country)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un fournisseur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
          <Badge variant="secondary" className="rounded-lg">
            {filteredSuppliers.length} resultat(s)
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl"
          >
            <Upload className="h-4 w-4 mr-2" />
            Importer CSV
          </Button>
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

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {paginatedSuppliers.map((supplier) => (
          <Card
            key={supplier.name}
            className="hover:shadow-lg transition-shadow cursor-pointer rounded-2xl"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    {supplier.supplier_name || supplier.name}
                  </CardTitle>
                  <CardDescription className="text-xs">{supplier.name}</CardDescription>
                </div>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Tag className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Type:</span>
                <Badge variant="outline" className="rounded-lg">
                  {supplier.supplier_type || "-"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Groupe:</span>
                <span className="text-sm">{supplier.supplier_group || "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm pt-2 border-t">
                <Globe className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{supplier.country || "-"}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredSuppliers.length === 0 && (
        <div className="text-center py-12">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-semibold">Aucun fournisseur trouve</h3>
          <p className="text-muted-foreground">Essayez une autre recherche</p>
          <Button onClick={() => setFormOpen(true)} className="mt-4 rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau Fournisseur
          </Button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            {startIndex + 1}-{Math.min(startIndex + pageSize, filteredSuppliers.length)} sur{" "}
            {filteredSuppliers.length}
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
      <SupplierForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateSupplier}
      />
    </div>
  );
}
