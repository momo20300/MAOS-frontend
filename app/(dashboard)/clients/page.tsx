"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCustomers, createCustomer, exportToCSV, printDocument, importFromCSV } from "@/lib/services/erpnext";
import { CustomerForm } from "@/components/forms";
import {
  Search, Users, Building2, MapPin, Mail, Phone, Plus,
  Download, Upload, Printer, FileSpreadsheet, ChevronLeft, ChevronRight
} from "lucide-react";

interface Customer {
  name: string;
  customer_name: string;
  customer_type: string;
  customer_group: string;
  territory: string;
  mobile_no?: string;
  email_id?: string;
}

const columns = [
  { key: "customer_name", label: "Nom" },
  { key: "customer_type", label: "Type" },
  { key: "customer_group", label: "Groupe" },
  { key: "territory", label: "Territoire" },
  { key: "email_id", label: "Email" },
  { key: "mobile_no", label: "Telephone" },
];

export default function ClientsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageSize = 12;

  const fetchCustomers = async () => {
    setLoading(true);
    const data = await getCustomers();
    setCustomers(data);
    setFilteredCustomers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    let filtered = customers.filter(
      (c) =>
        c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    if (typeFilter !== "all") {
      filtered = filtered.filter((c) => c.customer_type === typeFilter);
    }

    setFilteredCustomers(filtered);
    setCurrentPage(1);
  }, [search, typeFilter, customers]);

  const totalPages = Math.ceil(filteredCustomers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + pageSize);

  const stats = {
    total: customers.length,
    companies: customers.filter((c) => c.customer_type === "Company").length,
    individuals: customers.filter((c) => c.customer_type === "Individual").length,
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreateCustomer = async (data: {
    customer_name: string;
    customer_type: "Company" | "Individual";
    customer_group?: string;
    territory?: string;
    mobile_no?: string;
    email_id?: string;
  }) => {
    try {
      await createCustomer(data);
      showToast("Client cree avec succes", "success");
      fetchCustomers();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erreur lors de la creation", "error");
      throw error;
    }
  };

  const handleExportCSV = () => {
    exportToCSV(filteredCustomers, columns, "clients-maos");
    showToast("Export CSV telecharge", "success");
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importFromCSV<{
      customer_name: string;
      customer_type: "Company" | "Individual";
      customer_group?: string;
      territory?: string;
      mobile_no?: string;
      email_id?: string;
    }>(file, createCustomer);

    if (result.success > 0) {
      showToast(`${result.success} client(s) importe(s) avec succes`, "success");
      fetchCustomers();
    }
    if (result.errors.length > 0) {
      showToast(`${result.errors.length} erreur(s) lors de l'import`, "error");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePrint = () => {
    printDocument(filteredCustomers, columns, "Liste des Clients");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Chargement des clients...
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
          <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">
            Gerez votre base clients ({customers.length} clients)
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Client
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Entreprises</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.companies}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Particuliers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.individuals}</div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={typeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("all")}
              className="rounded-xl"
            >
              Tous
            </Button>
            <Button
              variant={typeFilter === "Company" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("Company")}
              className="rounded-xl"
            >
              Entreprises
            </Button>
            <Button
              variant={typeFilter === "Individual" ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter("Individual")}
              className="rounded-xl"
            >
              Particuliers
            </Button>
          </div>
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

      {/* Results count */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="rounded-lg">
          {filteredCustomers.length} resultat(s)
        </Badge>
      </div>

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {paginatedCustomers.map((customer) => (
          <Card
            key={customer.name}
            className="hover:shadow-lg transition-shadow cursor-pointer rounded-2xl"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{customer.customer_name}</CardTitle>
                  <CardDescription className="text-xs">{customer.name}</CardDescription>
                </div>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Type:</span>
                <Badge
                  variant={customer.customer_type === "Company" ? "default" : "secondary"}
                  className="rounded-lg"
                >
                  {customer.customer_type === "Company" ? "Entreprise" : "Particulier"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{customer.territory || "-"}</span>
              </div>
              {customer.email_id && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground truncate">
                    {customer.email_id}
                  </span>
                </div>
              )}
              {customer.mobile_no && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{customer.mobile_no}</span>
                </div>
              )}
              <div className="text-xs text-muted-foreground pt-2 border-t">
                Groupe: {customer.customer_group || "-"}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-semibold">Aucun client trouve</h3>
          <p className="text-muted-foreground">
            Essayez une autre recherche ou ajoutez un nouveau client
          </p>
          <Button onClick={() => setFormOpen(true)} className="mt-4 rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau Client
          </Button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            {startIndex + 1}-{Math.min(startIndex + pageSize, filteredCustomers.length)} sur{" "}
            {filteredCustomers.length}
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
      <CustomerForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateCustomer}
      />
    </div>
  );
}
