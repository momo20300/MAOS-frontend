"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, Plus, Package } from "lucide-react";

interface Receipt {
  name: string;
  supplier_name: string;
  posting_date: string;
  status: string;
  grand_total: number;
}

export default function PurchaseReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const response = await fetch('/api/purchase/receipts');
        if (response.ok) {
          const data = await response.json();
          setReceipts(data.data || []);
        }
      } catch (error) {
        console.error('Erreur chargement réceptions:', error);
      }
      setLoading(false);
    };
    fetchReceipts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-lg">Chargement des réceptions...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          toast.type === "success" ? "bg-green-500" : "bg-red-500"
        } text-white`}>
          {toast.message}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Réceptions</h2>
          <p className="text-muted-foreground">Gérez vos réceptions fournisseurs ({receipts.length} réceptions)</p>
        </div>
        <Button onClick={() => showToast("Fonctionnalite disponible prochainement", "success")}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle Réception
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Réceptions</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{receipts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ce Mois</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {receipts.filter(r => new Date(r.posting_date).getMonth() === new Date().getMonth()).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des réceptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {receipts.map((receipt) => (
              <div
                key={receipt.name}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{receipt.name}</span>
                    <Badge variant="secondary">{receipt.status}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{receipt.supplier_name}</div>
                  <div className="text-xs text-muted-foreground">
                    Date: {new Date(receipt.posting_date).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div className="text-lg font-bold">{receipt.grand_total?.toLocaleString()} MAD</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {receipts.length === 0 && (
        <div className="text-center py-12">
          <Truck className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Aucune réception</h3>
          <p className="text-muted-foreground">Créez votre première réception</p>
        </div>
      )}
    </div>
  );
}
