"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { authFetch } from "@/lib/services/auth";
import {
  FileBarChart, CalendarDays, TrendingUp, Users, Package, FileCheck,
  Truck, Clock, PackageCheck, Warehouse, DollarSign, ArrowLeftRight,
  AlertCircle, CreditCard, BarChart3, Wallet, FileWarning, Gauge,
  Activity, Trophy, PieChart, Loader2, Download, Eye,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface ReportItem {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  filters: string[];
}

const ICON_MAP: Record<string, any> = {
  CalendarDays, TrendingUp, Users, Package, FileCheck,
  Truck, Clock, PackageCheck, Warehouse, DollarSign, ArrowLeftRight,
  AlertCircle, CreditCard, BarChart3, Wallet, FileWarning, Gauge,
  Activity, Trophy, PieChart,
};

const CATEGORY_ORDER = ["Ventes", "Achats", "Stock", "Finance", "Gestion"];
const CATEGORY_COLORS: Record<string, string> = {
  Ventes: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  Achats: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Stock: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  Finance: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  Gestion: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
};

export default function ReportsPage() {
  const [catalog, setCatalog] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  // Filter state
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [month, setMonth] = useState(() => String(new Date().getMonth() + 1));
  const [year, setYear] = useState(() => String(new Date().getFullYear()));
  const [customer, setCustomer] = useState("");
  const [supplier, setSupplier] = useState("");
  const [item, setItem] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [filterType, setFilterType] = useState("both");

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      const res = await authFetch("/api/reports/catalog");
      if (res.ok) {
        const data = await res.json();
        setCatalog(data.data || []);
      }
    } catch (e) {
      console.error("Failed to load catalog:", e);
    } finally {
      setLoading(false);
    }
  };

  const openFilterDialog = (report: ReportItem) => {
    setSelectedReport(report);
    setFilterDialogOpen(true);
  };

  const generateReport = async (reportId: string, filters: Record<string, any> = {}) => {
    setGenerating(reportId);
    setFilterDialogOpen(false);

    try {
      const res = await authFetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, filters }),
      });

      if (!res.ok) throw new Error(`Erreur ${res.status}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (e) {
      console.error("Report generation failed:", e);
      alert("Erreur lors de la generation du rapport. Verifiez la connexion ERPNext.");
    } finally {
      setGenerating(null);
    }
  };

  const handleGenerateWithFilters = () => {
    if (!selectedReport) return;
    const filters: Record<string, any> = {};
    const f = selectedReport.filters;

    if (f.includes("date")) {
      filters.startDate = startDate;
      filters.endDate = startDate;
    }
    if (f.includes("period")) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }
    if (f.includes("month")) {
      filters.month = parseInt(month);
      filters.year = parseInt(year);
    }
    if (f.includes("year")) {
      filters.year = parseInt(year);
    }
    if (f.includes("customer") && customer) filters.customer = customer;
    if (f.includes("supplier") && supplier) filters.supplier = supplier;
    if (f.includes("item") && item) filters.item = item;
    if (f.includes("warehouse") && warehouse) filters.warehouse = warehouse;
    if (f.includes("type")) filters.type = filterType;

    generateReport(selectedReport.id, filters);
  };

  const quickGenerate = (report: ReportItem) => {
    if (report.filters.length === 0 || (report.filters.length === 1 && report.filters[0] === "date")) {
      generateReport(report.id, { startDate: new Date().toISOString().split("T")[0] });
    } else {
      openFilterDialog(report);
    }
  };

  // Group by category
  const grouped: Record<string, ReportItem[]> = {};
  for (const r of catalog) {
    if (!grouped[r.category]) grouped[r.category] = [];
    grouped[r.category].push(r);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileBarChart className="h-7 w-7 text-emerald-500" />
            Rapports & Etats
          </h1>
          <p className="text-muted-foreground mt-1">
            {catalog.length} rapports professionnels generes par MAOS AI
          </p>
        </div>
      </div>

      {/* Category sections */}
      {CATEGORY_ORDER.map((cat) => {
        const reports = grouped[cat];
        if (!reports || reports.length === 0) return null;

        return (
          <div key={cat} className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge className={CATEGORY_COLORS[cat]}>{cat}</Badge>
              <span className="text-sm text-muted-foreground">{reports.length} rapports</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {reports.map((report) => {
                const IconComp = ICON_MAP[report.icon] || FileBarChart;
                const isGenerating = generating === report.id;

                return (
                  <Card
                    key={report.id}
                    className="hover:shadow-md transition-shadow border-border/50 group"
                  >
                    <CardContent className="p-5 flex flex-col h-full">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                          <IconComp className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm leading-tight">{report.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {report.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-auto pt-3 flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => quickGenerate(report)}
                          disabled={isGenerating}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {isGenerating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          ) : (
                            <Download className="h-3.5 w-3.5 mr-1" />
                          )}
                          {isGenerating ? "Generation..." : "Generer"}
                        </Button>

                        {report.filters.length > 1 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openFilterDialog(report)}
                            disabled={isGenerating}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedReport && ICON_MAP[selectedReport.icon] && (
                (() => {
                  const Icon = ICON_MAP[selectedReport.icon];
                  return <Icon className="h-5 w-5 text-emerald-500" />;
                })()
              )}
              {selectedReport?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedReport?.filters.includes("date") && (
              <div>
                <Label>Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
            )}

            {selectedReport?.filters.includes("period") && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date debut</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <Label>Date fin</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
            )}

            {selectedReport?.filters.includes("month") && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Mois</Label>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"].map((m, i) => (
                        <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Annee</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026].map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {selectedReport?.filters.includes("customer") && (
              <div>
                <Label>Client (optionnel)</Label>
                <Input
                  placeholder="Nom du client..."
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                />
              </div>
            )}

            {selectedReport?.filters.includes("supplier") && (
              <div>
                <Label>Fournisseur (optionnel)</Label>
                <Input
                  placeholder="Nom du fournisseur..."
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                />
              </div>
            )}

            {selectedReport?.filters.includes("item") && (
              <div>
                <Label>Article (optionnel)</Label>
                <Input
                  placeholder="Code article..."
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                />
              </div>
            )}

            {selectedReport?.filters.includes("warehouse") && (
              <div>
                <Label>Entrepot (optionnel)</Label>
                <Input
                  placeholder="Nom de l'entrepot..."
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                />
              </div>
            )}

            {selectedReport?.filters.includes("type") && (
              <div>
                <Label>Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Tous</SelectItem>
                    <SelectItem value="sales">Ventes</SelectItem>
                    <SelectItem value="purchase">Achats</SelectItem>
                    <SelectItem value="clients">Clients</SelectItem>
                    <SelectItem value="fournisseurs">Fournisseurs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFilterDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleGenerateWithFilters}
              disabled={generating !== null}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Generer le rapport
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
