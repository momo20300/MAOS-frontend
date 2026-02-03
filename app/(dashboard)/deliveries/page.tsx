"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, Plus, CheckCircle } from "lucide-react";

interface Delivery {
  name: string;
  customer_name: string;
  posting_date: string;
  status: string;
  grand_total: number;
}

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const response = await fetch('/api/sales/deliveries');
        if (response.ok) {
          const data = await response.json();
          setDeliveries(data.data || []);
        }
      } catch (error) {
        console.error('Erreur chargement livraisons:', error);
      }
      setLoading(false);
    };
    fetchDeliveries();
  }, []);

  const pendingCount = deliveries.filter(d => d.status !== 'Completed').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-lg">Chargement des livraisons...</div>
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
          <h2 className="text-3xl font-bold tracking-tight">Livraisons</h2>
          <p className="text-muted-foreground">Gérez vos bons de livraison ({deliveries.length} livraisons)</p>
        </div>
        <Button onClick={() => showToast("Fonctionnalite disponible prochainement", "success")}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Bon de Livraison
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Livraisons</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveries.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En Cours</CardTitle>
            <Truck className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Complétées</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{deliveries.length - pendingCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des livraisons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deliveries.map((delivery) => (
              <div
                key={delivery.name}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{delivery.name}</span>
                    <Badge variant={delivery.status === 'Completed' ? 'default' : 'secondary'}>{delivery.status}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{delivery.customer_name}</div>
                  <div className="text-xs text-muted-foreground">
                    Date: {new Date(delivery.posting_date).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div className="text-lg font-bold">{delivery.grand_total?.toLocaleString()} MAD</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {deliveries.length === 0 && (
        <div className="text-center py-12">
          <Truck className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Aucune livraison</h3>
          <p className="text-muted-foreground">Créez votre premier bon de livraison</p>
        </div>
      )}
    </div>
  );
}
