"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Plus, TrendingUp, TrendingDown, Download, Printer, FileSpreadsheet, Filter } from "lucide-react";
import { authFetch } from "@/lib/services/auth";

interface Payment {
  name: string;
  party_name: string;
  payment_type: string;
  posting_date: string;
  paid_amount: number;
  status: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [filter, setFilter] = useState<"all" | "receive" | "pay">("all");

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await authFetch('/api/erp/accounting/payments');
        if (response.ok) {
          const data = await response.json();
          setPayments(data.data || []);
        }
      } catch (error) {
        // silently handle error
      }
      setLoading(false);
    };
    fetchPayments();
  }, []);

  const received = payments.filter(p => p.payment_type === 'Receive').reduce((sum, p) => sum + (p.paid_amount || 0), 0);
  const paid = payments.filter(p => p.payment_type === 'Pay').reduce((sum, p) => sum + (p.paid_amount || 0), 0);

  const filteredPayments = payments.filter(p => {
    if (filter === "all") return true;
    if (filter === "receive") return p.payment_type === "Receive";
    if (filter === "pay") return p.payment_type === "Pay";
    return true;
  });

  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      showToast("Aucune donnee a exporter", "error");
      return;
    }
    const headers = ["Reference", "Tiers", "Type", "Date", "Montant", "Statut"];
    const csvContent = [
      headers.join(","),
      ...filteredPayments.map(p => [
        p.name,
        `"${p.party_name}"`,
        p.payment_type === 'Receive' ? 'Encaissement' : 'Decaissement',
        p.posting_date,
        p.paid_amount,
        p.status
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `paiements_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast("Export CSV telecharge avec succes", "success");
  };

  const handlePrint = () => {
    window.print();
    showToast("Impression lancee", "success");
  };

  const handleViewDetails = (paymentName: string) => {
    showToast(`Details de ${paymentName} - Fonctionnalite disponible prochainement`, "success");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-lg">Chargement des paiements...</div>
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
          <h2 className="text-3xl font-bold tracking-tight">Paiements</h2>
          <p className="text-muted-foreground">Gerez vos encaissements et decaissements ({payments.length} paiements)</p>
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
            Nouveau Paiement
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Paiements</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Encaissements</CardTitle>
            <TrendingUp className="h-4 w-4 text-success-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success-400">{received.toLocaleString()} MAD</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Decaissements</CardTitle>
            <TrendingDown className="h-4 w-4 text-danger-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger-400">{paid.toLocaleString()} MAD</div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Historique des paiements</CardTitle>
          <div className="flex gap-2">
            <div className="flex gap-1 bg-muted p-1 rounded-xl">
              <Button
                variant={filter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("all")}
                className="rounded-xl"
              >
                Tous
              </Button>
              <Button
                variant={filter === "receive" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("receive")}
                className="rounded-xl"
              >
                Encaissements
              </Button>
              <Button
                variant={filter === "pay" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("pay")}
                className="rounded-xl"
              >
                Decaissements
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => showToast("Fonctionnalite disponible prochainement", "success")} className="rounded-xl">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredPayments.map((payment) => (
              <div
                key={payment.name}
                className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleViewDetails(payment.name)}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{payment.name}</span>
                    <Badge
                      variant={payment.payment_type === 'Receive' ? 'default' : 'secondary'}
                      className="rounded-xl"
                    >
                      {payment.payment_type === 'Receive' ? 'Encaissement' : 'Decaissement'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{payment.party_name}</div>
                  <div className="text-xs text-muted-foreground">
                    Date: {new Date(payment.posting_date).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div className={`text-lg font-bold ${payment.payment_type === 'Receive' ? 'text-success-400' : 'text-danger-400'}`}>
                  {payment.payment_type === 'Receive' ? '+' : '-'}{payment.paid_amount?.toLocaleString()} MAD
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {filteredPayments.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Aucun paiement</h3>
          <p className="text-muted-foreground">
            {filter === "all"
              ? "Creez votre premier paiement"
              : filter === "receive"
                ? "Aucun encaissement trouve"
                : "Aucun decaissement trouve"
            }
          </p>
        </div>
      )}
    </div>
  );
}
