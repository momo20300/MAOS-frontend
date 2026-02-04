"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Plus, TrendingUp, DollarSign, Download, Printer, FileSpreadsheet } from "lucide-react";

interface Opportunity {
  name: string;
  party_name: string;
  opportunity_from: string;
  status: string;
  opportunity_amount: number;
  expected_closing: string;
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const response = await fetch('/api/crm/opportunities');
        if (response.ok) {
          const data = await response.json();
          setOpportunities(data.data || []);
        }
      } catch (error) {
        console.error('Erreur chargement opportunites:', error);
      }
      setLoading(false);
    };
    fetchOpportunities();
  }, []);

  const openCount = opportunities.filter(o => o.status === 'Open').length;
  const totalAmount = opportunities.reduce((sum, o) => sum + (o.opportunity_amount || 0), 0);

  const handleExportCSV = () => {
    if (opportunities.length === 0) {
      showToast("Aucune donnee a exporter", "error");
      return;
    }
    const headers = ["Reference", "Client", "Source", "Statut", "Montant", "Date Cloture"];
    const csvContent = [
      headers.join(","),
      ...opportunities.map(o => [
        o.name,
        `"${o.party_name}"`,
        o.opportunity_from,
        o.status,
        o.opportunity_amount,
        o.expected_closing
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `opportunites_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast("Export CSV telecharge avec succes", "success");
  };

  const handlePrint = () => {
    window.print();
    showToast("Impression lancee", "success");
  };

  const handleConvertOpportunity = (oppName: string) => {
    showToast(`Conversion de ${oppName} - Fonctionnalite disponible prochainement`, "success");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-lg">Chargement des opportunites...</div>
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
          <h2 className="text-3xl font-bold tracking-tight">Opportunites</h2>
          <p className="text-muted-foreground">Gerez vos opportunites commerciales ({opportunities.length} opportunites)</p>
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
            Nouvelle Opportunite
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Opportunites Ouvertes</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openCount}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Potentiel Total</CardTitle>
            <DollarSign className="h-4 w-4 text-success-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success-400">{totalAmount.toLocaleString()} MAD</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taux Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {opportunities.length > 0
                ? Math.round((opportunities.filter(o => o.status === 'Converted').length / opportunities.length) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pipeline des opportunites</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => showToast("Fonctionnalite disponible prochainement", "success")} className="rounded-xl">
            <Download className="h-4 w-4 mr-2" />
            Exporter tout
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {opportunities.map((opp) => (
              <div
                key={opp.name}
                className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{opp.party_name}</span>
                    <Badge
                      variant={opp.status === 'Open' ? 'default' : opp.status === 'Converted' ? 'secondary' : 'outline'}
                      className="rounded-xl"
                    >
                      {opp.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{opp.name}</div>
                  {opp.expected_closing && (
                    <div className="text-xs text-muted-foreground">
                      Cloture prevue: {new Date(opp.expected_closing).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-lg font-bold text-success-400">{opp.opportunity_amount?.toLocaleString()} MAD</div>
                  {opp.status === 'Open' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConvertOpportunity(opp.name)}
                      className="rounded-xl"
                    >
                      Convertir
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {opportunities.length === 0 && (
        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Aucune opportunite</h3>
          <p className="text-muted-foreground">Creez votre premiere opportunite commerciale</p>
        </div>
      )}
    </div>
  );
}
