"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calculator, Plus, FileText } from "lucide-react";

interface Account {
  name: string;
  account_name: string;
  account_type: string;
  root_type: string;
  is_group: number;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch('/api/finance/accounts');
        if (response.ok) {
          const data = await response.json();
          setAccounts(data.data || []);
        }
      } catch (error) {
        console.error('Erreur chargement comptes:', error);
      }
      setLoading(false);
    };
    fetchAccounts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-lg">Chargement du plan comptable...</div>
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
          <h2 className="text-3xl font-bold tracking-tight">Plan Comptable</h2>
          <p className="text-muted-foreground">Gérez votre plan comptable ({accounts.length} comptes)</p>
        </div>
        <Button onClick={() => showToast("Fonctionnalite disponible prochainement", "success")}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Compte
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Comptes</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Groupes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.filter(a => a.is_group === 1).length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan comptable</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {accounts.slice(0, 20).map((account) => (
              <div
                key={account.name}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium">{account.account_name}</div>
                  <div className="text-xs text-muted-foreground">{account.name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{account.root_type}</Badge>
                  {account.account_type && <Badge variant="secondary">{account.account_type}</Badge>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {accounts.length === 0 && (
        <div className="text-center py-12">
          <Calculator className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Aucun compte</h3>
          <p className="text-muted-foreground">Le plan comptable est vide</p>
        </div>
      )}
    </div>
  );
}
