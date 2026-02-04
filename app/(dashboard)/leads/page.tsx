"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getLeads, createLead, exportToCSV, printDocument, importFromCSV } from "@/lib/services/erpnext";
import { LeadForm } from "@/components/forms";
import {
  Search, UserPlus, Mail, Phone, Plus, TrendingUp,
  Download, Upload, Printer, FileSpreadsheet, ChevronLeft, ChevronRight
} from "lucide-react";

interface Lead {
  name: string;
  lead_name: string;
  company_name: string;
  email_id: string;
  mobile_no: string;
  source: string;
  status: string;
}

const columns = [
  { key: "lead_name", label: "Nom" },
  { key: "company_name", label: "Entreprise" },
  { key: "email_id", label: "Email" },
  { key: "mobile_no", label: "Telephone" },
  { key: "source", label: "Source" },
  { key: "status", label: "Statut" },
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageSize = 12;

  const fetchLeads = async () => {
    setLoading(true);
    const data = await getLeads();
    setLeads(data);
    setFilteredLeads(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    let filtered = leads.filter(
      (lead) =>
        lead.lead_name?.toLowerCase().includes(search.toLowerCase()) ||
        (lead.company_name && lead.company_name.toLowerCase().includes(search.toLowerCase()))
    );

    if (statusFilter !== "all") {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
    }

    setFilteredLeads(filtered);
    setCurrentPage(1);
  }, [search, statusFilter, leads]);

  const statuses = Array.from(new Set(leads.map((l) => l.status).filter(Boolean)));
  const totalPages = Math.ceil(filteredLeads.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + pageSize);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreateLead = async (data: {
    lead_name: string;
    company_name?: string;
    email_id?: string;
    mobile_no?: string;
    source?: string;
    status?: string;
  }) => {
    try {
      await createLead(data);
      showToast("Lead cree avec succes", "success");
      fetchLeads();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erreur lors de la creation", "error");
      throw error;
    }
  };

  const handleExportCSV = () => {
    exportToCSV(filteredLeads, columns, "leads-maos");
    showToast("Export CSV telecharge", "success");
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importFromCSV<{
      lead_name: string;
      company_name?: string;
      email_id?: string;
      mobile_no?: string;
      source?: string;
      status?: string;
    }>(file, createLead);

    if (result.success > 0) {
      showToast(`${result.success} lead(s) importe(s) avec succes`, "success");
      fetchLeads();
    }
    if (result.errors.length > 0) {
      showToast(`${result.errors.length} erreur(s) lors de l'import`, "error");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePrint = () => {
    printDocument(filteredLeads, columns, "Pipeline des Leads");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      Open: "secondary",
      Replied: "default",
      Opportunity: "default",
      Interested: "default",
      Converted: "default",
      Lost: "outline",
    };
    const colors: Record<string, string> = {
      Open: "",
      Replied: "bg-blue-500",
      Opportunity: "bg-yellow-500",
      Interested: "bg-purple-500",
      Converted: "bg-success-400",
      Lost: "",
    };
    return (
      <Badge variant={variants[status] || "secondary"} className={`rounded-lg ${colors[status] || ""}`}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Chargement des leads...
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
          <h2 className="text-3xl font-bold tracking-tight">Leads / Prospects</h2>
          <p className="text-muted-foreground">
            Gestion du pipeline commercial ({leads.length} leads)
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Lead
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ouverts</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads.filter((l) => l.status === "Open" || l.status === "Lead").length}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Opportunites</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads.filter((l) => l.status === "Opportunity").length}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Convertis</CardTitle>
            <TrendingUp className="h-4 w-4 text-success-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success-400">
              {leads.filter((l) => l.status === "Converted").length}
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
              placeholder="Rechercher un lead..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className="rounded-xl"
            >
              Tous
            </Button>
            {statuses.slice(0, 4).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="rounded-xl"
              >
                {status}
              </Button>
            ))}
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

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {paginatedLeads.map((lead) => (
          <Card
            key={lead.name}
            className="hover:shadow-lg transition-shadow cursor-pointer rounded-2xl"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{lead.lead_name}</CardTitle>
                  {lead.company_name && (
                    <CardDescription className="text-sm">{lead.company_name}</CardDescription>
                  )}
                  <div className="text-xs text-muted-foreground">{lead.name}</div>
                </div>
                {getStatusBadge(lead.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {lead.email_id && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground truncate">{lead.email_id}</span>
                </div>
              )}
              {lead.mobile_no && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{lead.mobile_no}</span>
                </div>
              )}
              <div className="text-xs text-muted-foreground pt-2 border-t">
                Source: {lead.source || "-"}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredLeads.length === 0 && (
        <div className="text-center py-12">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-semibold">Aucun lead trouve</h3>
          <p className="text-muted-foreground">Essayez une autre recherche</p>
          <Button onClick={() => setFormOpen(true)} className="mt-4 rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau Lead
          </Button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            {startIndex + 1}-{Math.min(startIndex + pageSize, filteredLeads.length)} sur{" "}
            {filteredLeads.length}
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
      <LeadForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreateLead} />
    </div>
  );
}
