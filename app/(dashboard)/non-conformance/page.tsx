"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Plus, CheckCircle, XCircle } from "lucide-react";

interface NonConformance {
  name: string;
  item_name: string;
  description: string;
  status: string;
  creation: string;
}

export default function NonConformancePage() {
  const [nonConformances, setNonConformances] = useState<NonConformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchNonConformances = async () => {
      try {
        const response = await fetch('/api/quality/non-conformances');
        if (response.ok) {
          const data = await response.json();
          setNonConformances(data.data || []);
        }
      } catch (error) {
        console.error('Erreur chargement non-conformités:', error);
      }
      setLoading(false);
    };
    fetchNonConformances();
  }, []);

  const openCount = nonConformances.filter(nc => nc.status === 'Open').length;
  const resolvedCount = nonConformances.filter(nc => nc.status === 'Resolved').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-lg">Chargement des non-conformités...</div>
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
          <h2 className="text-3xl font-bold tracking-tight">Non-Conformités</h2>
          <p className="text-muted-foreground">Gérez les non-conformités qualité ({nonConformances.length} NC)</p>
        </div>
        <Button onClick={() => showToast("Fonctionnalite disponible prochainement", "success")}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle NC
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total NC</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nonConformances.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ouvertes</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{openCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Résolues</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resolvedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des non-conformités</CardTitle>
        </CardHeader>
        <CardContent>
          {nonConformances.length > 0 ? (
            <div className="space-y-3">
              {nonConformances.map((nc) => (
                <div
                  key={nc.name}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{nc.name}</span>
                      <Badge variant={nc.status === 'Open' ? 'destructive' : 'default'}>
                        {nc.status === 'Open' ? 'Ouverte' : 'Résolue'}
                      </Badge>
                    </div>
                    <div className="text-sm">{nc.item_name}</div>
                    <div className="text-xs text-muted-foreground">
                      Créée le: {new Date(nc.creation).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Aucune non-conformité</h3>
              <p className="text-muted-foreground">Aucune non-conformité enregistrée</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
