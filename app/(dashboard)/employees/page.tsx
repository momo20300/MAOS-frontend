"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorMessage } from "@/components/ui/error-message";
import { getEmployees, createEmployee, exportToCSV, printDocument, importFromCSV } from "@/lib/services/erpnext";
import { EmployeeForm } from "@/components/forms";
import {
  UserCog, Plus, Users, Search, Mail, Phone, Briefcase,
  Download, Upload, Printer, FileSpreadsheet, ChevronLeft, ChevronRight
} from "lucide-react";

interface Employee {
  name: string;
  employee_name: string;
  first_name?: string;
  last_name?: string;
  designation: string;
  department: string;
  status: string;
  company_email?: string;
  cell_number?: string;
  personal_email?: string;
}

const columns = [
  { key: "employee_name", label: "Nom" },
  { key: "designation", label: "Poste" },
  { key: "department", label: "Departement" },
  { key: "status", label: "Statut" },
  { key: "company_email", label: "Email" },
  { key: "cell_number", label: "Telephone" },
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageSize = 10;

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur de connexion au serveur";
      setError(message);
      console.error("Erreur chargement employes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
      emp.designation?.toLowerCase().includes(search.toLowerCase()) ||
      emp.department?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = employees.filter((e) => e.status === "Active").length;
  const totalPages = Math.ceil(filteredEmployees.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + pageSize);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreateEmployee = async (data: {
    first_name: string;
    last_name?: string;
    gender?: string;
    date_of_birth?: string;
    date_of_joining?: string;
    designation?: string;
    department?: string;
    cell_number?: string;
    personal_email?: string;
  }) => {
    try {
      await createEmployee(data);
      showToast("Employe cree avec succes", "success");
      fetchEmployees();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erreur lors de la creation", "error");
      throw error;
    }
  };

  const handleExportCSV = () => {
    exportToCSV(filteredEmployees, columns, "employes-maos");
    showToast("Export CSV telecharge", "success");
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importFromCSV<{
      first_name: string;
      last_name?: string;
      designation?: string;
      department?: string;
      cell_number?: string;
      personal_email?: string;
    }>(file, createEmployee);

    if (result.success > 0) {
      showToast(`${result.success} employe(s) importe(s) avec succes`, "success");
      fetchEmployees();
    }
    if (result.errors.length > 0) {
      showToast(`${result.errors.length} erreur(s) lors de l'import`, "error");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePrint = () => {
    printDocument(filteredEmployees, columns, "Liste des Employes");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Chargement des employes...
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
          <h2 className="text-3xl font-bold tracking-tight">Employes</h2>
          <p className="text-muted-foreground">
            Gerez vos ressources humaines ({employees.length} employes)
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Nouvel Employe
        </Button>
      </div>

      {/* Error */}
      {error && <ErrorMessage title="Erreur de chargement" message={error} onRetry={fetchEmployees} />}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Employes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            <UserCog className="h-4 w-4 text-success-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success-400">{activeCount}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Departements</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(employees.map((e) => e.department)).size}
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
              placeholder="Rechercher un employe..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
          <Badge variant="secondary" className="rounded-lg">
            {filteredEmployees.length} resultat(s)
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

      {/* Table */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Liste des employes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {paginatedEmployees.map((employee) => (
              <div
                key={employee.name}
                className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{employee.employee_name}</span>
                    <Badge
                      variant={employee.status === "Active" ? "default" : "secondary"}
                      className="rounded-lg"
                    >
                      {employee.status === "Active" ? "Actif" : employee.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {employee.designation || "-"} - {employee.department || "-"}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {(employee.company_email || employee.personal_email) && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {employee.company_email || employee.personal_email}
                      </span>
                    )}
                    {employee.cell_number && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {employee.cell_number}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {!error && filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-semibold">Aucun employe trouve</h3>
          <p className="text-muted-foreground">Ajoutez votre premier employe</p>
          <Button onClick={() => setFormOpen(true)} className="mt-4 rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Nouvel Employe
          </Button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            {startIndex + 1}-{Math.min(startIndex + pageSize, filteredEmployees.length)} sur{" "}
            {filteredEmployees.length}
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
      <EmployeeForm open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreateEmployee} />
    </div>
  );
}
