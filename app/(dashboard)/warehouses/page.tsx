"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Warehouse, Plus, MapPin } from "lucide-react";

interface WarehouseItem {
  name: string;
  warehouse_name: string;
  is_group: number;
  parent_warehouse: string;
  company: string;
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await fetch('/api/stock/warehouses');
        if (response.ok) {
          const data = await response.json();
          setWarehouses(data.data || []);
        }
      } catch (error) {
        console.error('Erreur chargement entrepôts:', error);
      }
      setLoading(false);
    };
    fetchWarehouses();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-lg">Chargement des entrepôts...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Entrepôts</h2>
          <p className="text-muted-foreground">Gérez vos entrepôts et emplacements ({warehouses.length} entrepôts)</p>
        </div>
        <Button onClick={() => alert('Formulaire de création entrepôt - À implémenter')}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel Entrepôt
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Entrepôts</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warehouses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Emplacements</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warehouses.filter(w => w.is_group === 0).length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des entrepôts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {warehouses.map((warehouse) => (
              <div
                key={warehouse.name}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium">{warehouse.warehouse_name}</div>
                  <div className="text-xs text-muted-foreground">{warehouse.name}</div>
                </div>
                <Badge variant={warehouse.is_group === 1 ? 'default' : 'secondary'}>
                  {warehouse.is_group === 1 ? 'Groupe' : 'Emplacement'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {warehouses.length === 0 && (
        <div className="text-center py-12">
          <Warehouse className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Aucun entrepôt</h3>
          <p className="text-muted-foreground">Créez votre premier entrepôt</p>
        </div>
      )}
    </div>
  );
}
