"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getBillingDashboard, BillingDashboardData } from "@/lib/services/erpnext";
import {
  CreditCard, Receipt, CheckCircle, Clock,
  AlertTriangle, RefreshCw, ArrowRight, DollarSign,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-success-400",
  PENDING: "bg-yellow-500 text-white",
  OVERDUE: "bg-danger-400 text-white",
  CANCELLED: "bg-gray-400",
};

const STATUS_LABELS: Record<string, string> = {
  PAID: "Payee",
  PENDING: "En attente",
  OVERDUE: "En retard",
  CANCELLED: "Annulee",
};

export default function BillingDashboardPage() {
  const [data, setData] = useState<BillingDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    setError(null);
    try {
      const result = await getBillingDashboard();
      if (result) {
        setData(result);
      } else {
        setError("Impossible de charger les donnees de facturation");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Chargement de la facturation...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
          <p className="text-lg">{error || "Donnees indisponibles"}</p>
          <Button onClick={() => fetchData(true)}>Reessayer</Button>
        </div>
      </div>
    );
  }

  const { subscription, invoices } = data;
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(i => i.status === "PAID").length;
  const pendingInvoices = invoices.filter(i => i.status === "PENDING").length;
  const totalAmount = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);
  const paidAmount = invoices.filter(i => i.status === "PAID").reduce((sum, i) => sum + (i.amount || 0), 0);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Abonnement</h2>
          <p className="text-muted-foreground">
            Tableau de bord facturation et abonnement
          </p>
        </div>
        <Link href="/billing">
          <Button variant="outline" className="rounded-xl">
            <CreditCard className="mr-2 h-4 w-4" />
            Gerer l&apos;abonnement
          </Button>
        </Link>
      </div>

      {/* Subscription Card */}
      {subscription && (
        <Card className="rounded-2xl border-l-4 border-l-blue-500">
          <CardContent className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-950">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pack Actuel</p>
                <p className="text-2xl font-bold">{subscription.pack}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`rounded-lg text-xs ${subscription.status === "ACTIVE" ? "bg-success-400" : "bg-yellow-500 text-white"}`}>
                    {subscription.status === "ACTIVE" ? "Actif" : subscription.status}
                  </Badge>
                  {subscription.endDate && (
                    <span className="text-xs text-muted-foreground">
                      Expire le {new Date(subscription.endDate).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {subscription.amount > 0 && (
              <div className="text-right">
                <p className="text-2xl font-bold">{subscription.amount.toLocaleString("fr-FR")} MAD</p>
                <p className="text-xs text-muted-foreground">/mois</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/billing">
          <Card className="rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Factures</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInvoices}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {paidInvoices} payees, {pendingInvoices} en attente
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/billing">
          <Card className="rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalAmount.toLocaleString("fr-FR")} MAD
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Toutes factures confondues
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/billing">
          <Card className="rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Montant Paye</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success-400">
                {paidAmount.toLocaleString("fr-FR")} MAD
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0}% du total
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/billing">
          <Card className="rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">En Attente</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${pendingInvoices > 0 ? "text-yellow-500" : "text-success-400"}`}>
                {(totalAmount - paidAmount).toLocaleString("fr-FR")} MAD
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {pendingInvoices} facture(s) en attente
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Invoice List */}
      {invoices.length > 0 ? (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Historique des Factures
              </CardTitle>
              <Link href="/billing">
                <Button variant="ghost" size="sm" className="text-xs">
                  Voir tout <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invoices.slice(0, 10).map((invoice) => (
                <Link key={invoice.id || invoice.invoiceNumber} href="/billing" className="block">
                <div
                  className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{invoice.invoiceNumber}</span>
                      <Badge className={`rounded-lg text-xs ${STATUS_COLORS[invoice.status] || "bg-gray-400"}`}>
                        {STATUS_LABELS[invoice.status] || invoice.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Periode: {invoice.period}
                      {invoice.dueDate ? ` — Echeance: ${new Date(invoice.dueDate).toLocaleDateString("fr-FR")}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      {(invoice.amount || 0).toLocaleString("fr-FR")} {invoice.currency || "MAD"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString("fr-FR") : "—"}
                    </p>
                  </div>
                </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold">Aucune facture</p>
            <p className="text-muted-foreground text-sm">Votre historique de facturation apparaitra ici</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
