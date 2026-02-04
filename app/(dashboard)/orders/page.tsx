"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getSalesOrders, getCustomers, getItems, createSalesOrder,
  exportToCSV, printDocument
} from "@/lib/services/erpnext";
import { OrderForm } from "@/components/forms";
import {
  ShoppingCart, Plus, TrendingUp, Search,
  Download, Printer, FileSpreadsheet, ChevronLeft, ChevronRight, Calendar
} from "lucide-react";

interface SalesOrder {
  name: string;
  customer_name: string;
  transaction_date: string;
  delivery_date: string;
  grand_total: number;
  status: string;
}

interface Customer {
  name: string;
  customer_name: string;
}

interface Item {
  item_code: string;
  item_name: string;
  standard_rate: number;
}

const columns = [
  { key: "name", label: "Reference" },
  { key: "customer_name", label: "Client" },
  { key: "transaction_date", label: "Date" },
  { key: "delivery_date", label: "Livraison" },
  { key: "grand_total", label: "Montant (MAD)" },
  { key: "status", label: "Statut" },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const pageSize = 10;

  const fetchOrders = async () => {
    setLoading(true);
    const [ordersData, customersData, itemsData] = await Promise.all([
      getSalesOrders(),
      getCustomers(),
      getItems(),
    ]);
    setOrders(ordersData);
    setFilteredOrders(ordersData);
    setCustomers(customersData);
    setItems(itemsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let filtered = orders.filter(
      (order) =>
        order.name?.toLowerCase().includes(search.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(search.toLowerCase())
    );

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [search, statusFilter, orders]);

  const totalAmount = orders.reduce((sum, order) => sum + (order.grand_total || 0), 0);
  const statuses = Array.from(new Set(orders.map((o) => o.status).filter(Boolean)));
  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + pageSize);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreateOrder = async (data: {
    customer: string;
    delivery_date: string;
    items: Array<{ item_code: string; qty: number; rate?: number }>;
  }) => {
    try {
      await createSalesOrder(data);
      showToast("Commande creee avec succes", "success");
      fetchOrders();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erreur lors de la creation", "error");
      throw error;
    }
  };

  const handleExportCSV = () => {
    exportToCSV(filteredOrders, columns, "commandes-maos");
    showToast("Export CSV telecharge", "success");
  };

  const handlePrint = () => {
    printDocument(filteredOrders, columns, "Liste des Commandes");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      Draft: "secondary",
      "To Deliver and Bill": "default",
      "To Bill": "default",
      "To Deliver": "default",
      Completed: "default",
      Cancelled: "outline",
    };
    const colors: Record<string, string> = {
      Draft: "",
      "To Deliver and Bill": "bg-blue-500",
      "To Bill": "bg-yellow-500",
      "To Deliver": "bg-purple-500",
      Completed: "bg-success-400",
      Cancelled: "",
    };
    return (
      <Badge variant={variants[status] || "secondary"} className={`rounded-lg ${colors[status] || ""}`}>
        {status === "To Deliver and Bill" ? "A livrer/facturer" :
         status === "To Bill" ? "A facturer" :
         status === "To Deliver" ? "A livrer" :
         status === "Completed" ? "Termine" :
         status === "Draft" ? "Brouillon" :
         status === "Cancelled" ? "Annule" : status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Chargement des commandes...
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
          <h2 className="text-3xl font-bold tracking-tight">Commandes</h2>
          <p className="text-muted-foreground">
            Gestion des commandes clients ({orders.length} commandes)
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle Commande
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-success-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success-400">
              {totalAmount.toLocaleString()} MAD
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En Cours</CardTitle>
            <ShoppingCart className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter((o) => o.status !== "Completed" && o.status !== "Cancelled").length}
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
              placeholder="Rechercher une commande..."
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
                {status === "To Deliver and Bill" ? "A livrer" :
                 status === "Completed" ? "Termine" :
                 status === "Draft" ? "Brouillon" : status}
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
          <CardTitle>Liste des commandes</CardTitle>
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
                  <div className="text-sm text-muted-foreground">{order.customer_name}</div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(order.transaction_date).toLocaleDateString("fr-FR")}
                    </span>
                    <span>
                      Livraison: {new Date(order.delivery_date).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {(order.grand_total || 0).toLocaleString()} MAD
                  </div>
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
          <h3 className="mt-4 text-lg font-semibold">Aucune commande</h3>
          <p className="text-muted-foreground">Creez votre premiere commande</p>
          <Button onClick={() => setFormOpen(true)} className="mt-4 rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Commande
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
      <OrderForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateOrder}
        customers={customers}
        items={items}
        type="order"
      />
    </div>
  );
}
