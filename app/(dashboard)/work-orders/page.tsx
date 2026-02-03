"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getWorkOrders, getBOMs, getItems, createWorkOrder, exportToCSV, printDocument } from "@/lib/services/erpnext";
import { WorkOrderForm } from "@/components/forms";
import {
  Factory, Plus, Clock, CheckCircle, Search,
  Download, Printer, FileSpreadsheet, ChevronLeft, ChevronRight, AlertCircle
} from "lucide-react";

interface WorkOrder {
  name: string;
  production_item: string;
  item_name?: string;
  qty: number;
  produced_qty: number;
  status: string;
  planned_start_date: string;
  planned_end_date?: string;
  bom_no?: string;
}

interface BOM {
  name: string;
  item: string;
  item_name: string;
}

interface Item {
  item_code: string;
  item_name: string;
}

const columns = [
  { key: "name", label: "Reference" },
  { key: "item_name", label: "Article" },
  { key: "qty", label: "Quantite" },
  { key: "produced_qty", label: "Produit" },
  { key: "status", label: "Statut" },
  { key: "planned_start_date", label: "Date debut" },
];

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<WorkOrder[]>([]);
  const [boms, setBoms] = useState<BOM[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const pageSize = 10;

  const fetchData = async () => {
    setLoading(true);
    const [ordersData, bomsData, itemsData] = await Promise.all([
      getWorkOrders(),
      getBOMs(),
      getItems(),
    ]);
    setWorkOrders(ordersData);
    setFilteredOrders(ordersData);
    setBoms(bomsData);
    setItems(itemsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = workOrders.filter(
      (wo) =>
        wo.name?.toLowerCase().includes(search.toLowerCase()) ||
        wo.item_name?.toLowerCase().includes(search.toLowerCase()) ||
        wo.production_item?.toLowerCase().includes(search.toLowerCase())
    );

    if (statusFilter !== "all") {
      filtered = filtered.filter((wo) => wo.status === statusFilter);
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [search, statusFilter, workOrders]);

  const inProgress = workOrders.filter((wo) => wo.status === "In Process").length;
  const completed = workOrders.filter((wo) => wo.status === "Completed").length;
  const notStarted = workOrders.filter((wo) => wo.status === "Not Started").length;
  const statuses = Array.from(new Set(workOrders.map((wo) => wo.status).filter(Boolean)));
  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + pageSize);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreateWorkOrder = async (data: {
    production_item: string;
    qty: number;
    bom_no?: string;
    planned_start_date: string;
  }) => {
    try {
      await createWorkOrder(data);
      showToast("Ordre de fabrication cree avec succes", "success");
      fetchData();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erreur lors de la creation", "error");
      throw error;
    }
  };

  const handleExportCSV = () => {
    exportToCSV(filteredOrders, columns, "ordres-fabrication-maos");
    showToast("Export CSV telecharge", "success");
  };

  const handlePrint = () => {
    printDocument(filteredOrders, columns, "Ordres de Fabrication");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      "Not Started": "secondary",
      "In Process": "default",
      "Completed": "default",
      "Stopped": "destructive",
      "Cancelled": "outline",
    };
    const labels: Record<string, string> = {
      "Not Started": "Non demarre",
      "In Process": "En cours",
      "Completed": "Termine",
      "Stopped": "Arrete",
      "Cancelled": "Annule",
    };
    const colors: Record<string, string> = {
      "In Process": "bg-yellow-500",
      "Completed": "bg-green-500",
    };
    return (
      <Badge variant={variants[status] || "secondary"} className={`rounded-lg ${colors[status] || ""}`}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Chargement des ordres de fabrication...
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
              ? "border-green-200 bg-green-50/90 text-green-900 dark:border-green-800 dark:bg-green-950/90 dark:text-green-100"
              : "border-red-200 bg-red-50/90 text-red-900 dark:border-red-800 dark:bg-red-950/90 dark:text-red-100"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ordres de Fabrication</h2>
          <p className="text-muted-foreground">
            Gerez votre production ({workOrders.length} ordres)
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Nouvel Ordre
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Ordres</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workOrders.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notStarted}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En Production</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{inProgress}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Termines</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un ordre..."
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
            {statuses.slice(0, 3).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="rounded-xl"
              >
                {status === "In Process" ? "En cours" : status === "Completed" ? "Termines" : status}
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

      {/* Table */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Liste des ordres de fabrication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {paginatedOrders.map((order) => (
              <div
                key={order.name}
                className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{order.name}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {order.item_name || order.production_item}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Debut: {new Date(order.planned_start_date).toLocaleDateString("fr-FR")}</span>
                    {order.bom_no && <span>BOM: {order.bom_no}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {order.produced_qty || 0} / {order.qty}
                  </div>
                  <div className="text-xs text-muted-foreground">unites produites</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-semibold">Aucun ordre de fabrication</h3>
          <p className="text-muted-foreground">Creez votre premier ordre de fabrication</p>
          <Button onClick={() => setFormOpen(true)} className="mt-4 rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Nouvel Ordre
          </Button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            {startIndex + 1}-{Math.min(startIndex + pageSize, filteredOrders.length)} sur{" "}
            {filteredOrders.length}
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
      <WorkOrderForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateWorkOrder}
        items={items}
        boms={boms}
      />
    </div>
  );
}
