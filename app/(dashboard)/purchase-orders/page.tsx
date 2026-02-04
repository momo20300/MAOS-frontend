"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, TrendingUp, Download, Printer, FileSpreadsheet } from "lucide-react";

interface PurchaseOrder {
  name: string;
  supplier_name: string;
  transaction_date: string;
  grand_total: number;
  status: string;
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/purchase/orders');
        if (response.ok) {
          const data = await response.json();
          setOrders(data.data || []);
        }
      } catch (error) {
        console.error('Erreur chargement commandes:', error);
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const totalAmount = orders.reduce((sum, o) => sum + (o.grand_total || 0), 0);

  const handleExportCSV = () => {
    if (orders.length === 0) {
      showToast("Aucune donnee a exporter", "error");
      return;
    }
    const headers = ["Reference", "Fournisseur", "Date", "Montant", "Statut"];
    const csvContent = [
      headers.join(","),
      ...orders.map(o => [
        o.name,
        `"${o.supplier_name}"`,
        o.transaction_date,
        o.grand_total,
        o.status
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `commandes_achats_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast("Export CSV telecharge avec succes", "success");
  };

  const handlePrint = () => {
    window.print();
    showToast("Impression lancee", "success");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-lg">Chargement des commandes...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg transition-all duration-300 ${
          toast.type === "success"
            ? "bg-success-400 text-white"
            : "bg-danger-400 text-white"
        }`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Commandes Achats</h2>
          <p className="text-muted-foreground">Gerez vos commandes fournisseurs ({orders.length} commandes)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} className="rounded-xl">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handlePrint} className="rounded-xl">
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>
          <Button onClick={() => showToast("Fonctionnalite disponible prochainement", "success")} className="rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Commande
          </Button>
        </div>
      </div>

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
            <div className="text-2xl font-bold">{totalAmount.toLocaleString()} MAD</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En Cours</CardTitle>
            <ShoppingCart className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Liste des commandes</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => showToast("Fonctionnalite disponible prochainement", "success")} className="rounded-xl">
            <Download className="h-4 w-4 mr-2" />
            Exporter tout
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.name}
                className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => showToast("Fonctionnalite disponible prochainement", "success")}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{order.name}</span>
                    <Badge variant="secondary" className="rounded-xl">{order.status}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{order.supplier_name}</div>
                  <div className="text-xs text-muted-foreground">
                    Date: {new Date(order.transaction_date).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div className="text-lg font-bold">{order.grand_total?.toLocaleString()} MAD</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Aucune commande</h3>
          <p className="text-muted-foreground">Creez votre premiere commande fournisseur</p>
        </div>
      )}
    </div>
  );
}
