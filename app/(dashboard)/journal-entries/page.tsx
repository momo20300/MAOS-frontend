"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileBarChart, Plus, DollarSign } from "lucide-react";
import { authFetch } from "@/lib/services/auth";

interface JournalEntry {
  name: string;
  voucher_type: string;
  posting_date: string;
  total_debit: number;
  docstatus: number;
}

export default function JournalEntriesPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const response = await authFetch('/api/erp/accounting/journal-entries');
        if (response.ok) {
          const data = await response.json();
          setEntries(data.data || []);
        }
      } catch (error) {
        // silently handle error
      }
      setLoading(false);
    };
    fetchEntries();
  }, []);

  const totalAmount = entries.reduce((sum, e) => sum + (e.total_debit || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-lg">Chargement des écritures...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          toast.type === "success" ? "bg-success-400" : "bg-danger-400"
        } text-white`}>
          {toast.message}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Écritures Comptables</h2>
          <p className="text-muted-foreground">Gérez vos écritures de journal ({entries.length} écritures)</p>
        </div>
        <Button onClick={() => showToast("Fonctionnalite disponible prochainement", "success")}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle Écriture
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Écritures</CardTitle>
            <FileBarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entries.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
            <DollarSign className="h-4 w-4 text-success-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAmount.toLocaleString()} MAD</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des écritures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.name}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{entry.name}</span>
                    <Badge variant="secondary">{entry.voucher_type}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Date: {new Date(entry.posting_date).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div className="text-lg font-bold">{entry.total_debit?.toLocaleString()} MAD</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {entries.length === 0 && (
        <div className="text-center py-12">
          <FileBarChart className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Aucune écriture</h3>
          <p className="text-muted-foreground">Créez votre première écriture comptable</p>
        </div>
      )}
    </div>
  );
}
