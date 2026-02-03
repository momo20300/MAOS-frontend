"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Landmark, Plus, DollarSign } from "lucide-react";

interface Asset {
  name: string;
  asset_name: string;
  asset_category: string;
  status: string;
  gross_purchase_amount: number;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await fetch('/api/finance/assets');
        if (response.ok) {
          const data = await response.json();
          setAssets(data.data || []);
        }
      } catch (error) {
        console.error('Erreur chargement actifs:', error);
      }
      setLoading(false);
    };
    fetchAssets();
  }, []);

  const totalValue = assets.reduce((sum, a) => sum + (a.gross_purchase_amount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-lg">Chargement des actifs...</div>
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
          <h2 className="text-3xl font-bold tracking-tight">Actifs / Immobilisations</h2>
          <p className="text-muted-foreground">Gérez vos immobilisations ({assets.length} actifs)</p>
        </div>
        <Button onClick={() => showToast("Fonctionnalite disponible prochainement", "success")}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel Actif
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Actifs</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valeur Totale</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalValue.toLocaleString()} MAD</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des actifs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {assets.map((asset) => (
              <div
                key={asset.name}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium">{asset.asset_name}</div>
                  <div className="text-xs text-muted-foreground">{asset.name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{asset.asset_category}</Badge>
                  <Badge variant={asset.status === 'Submitted' ? 'default' : 'secondary'}>{asset.status}</Badge>
                  <span className="font-semibold">{asset.gross_purchase_amount?.toLocaleString()} MAD</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {assets.length === 0 && (
        <div className="text-center py-12">
          <Landmark className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Aucun actif</h3>
          <p className="text-muted-foreground">Créez votre premier actif</p>
        </div>
      )}
    </div>
  );
}
