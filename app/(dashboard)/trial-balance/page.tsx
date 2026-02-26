"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getTrialBalance, TrialBalanceData } from "@/lib/services/erpnext";
import {
  Calculator, RefreshCw, AlertTriangle, Download, ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function TrialBalancePage() {
  const [data, setData] = useState<TrialBalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-01-01`;
  });
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTrialBalance(fromDate, toDate);
      if (result) {
        setData(result);
      } else {
        setError("Impossible de charger la balance des comptes");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatAmount = (amount: number) => {
    if (amount === 0) return "-";
    return amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Chargement de la balance...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
          <p className="text-lg">{error}</p>
          <Button onClick={fetchData}>Reessayer</Button>
        </div>
      </div>
    );
  }

  const rows = data?.rows || [];
  const totals = data?.totals || { debit: 0, credit: 0 };
  const isBalanced = Math.abs(totals.debit - totals.credit) < 0.01;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/accounting">
              <Button variant="ghost" size="sm" className="rounded-lg h-8 px-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h2 className="text-3xl font-bold tracking-tight">Balance Generale</h2>
          </div>
          <p className="text-muted-foreground ml-11">
            {rows.length} compte(s) avec mouvements
          </p>
        </div>
      </div>

      {/* Date Filter */}
      <Card className="rounded-2xl">
        <CardContent className="flex flex-wrap items-center gap-4 py-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium whitespace-nowrap">Du:</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-40 rounded-xl"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium whitespace-nowrap">Au:</label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-40 rounded-xl"
            />
          </div>
          <Button onClick={fetchData} className="rounded-xl">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <div className="ml-auto flex items-center gap-2">
            {isBalanced ? (
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                <Calculator className="h-4 w-4" />
                Balance equilibree
              </span>
            ) : (
              <span className="text-sm text-red-600 font-medium flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Desequilibre: {formatAmount(Math.abs(totals.debit - totals.credit))} MAD
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trial Balance Table */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Balance des Comptes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-semibold">Compte</th>
                  <th className="text-right py-3 px-4 font-semibold">Debit (MAD)</th>
                  <th className="text-right py-3 px-4 font-semibold">Credit (MAD)</th>
                  <th className="text-right py-3 px-4 font-semibold">Solde (MAD)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.account}
                    className={`border-b hover:bg-muted/30 transition-colors ${row.isGroup ? "font-semibold bg-muted/20" : ""}`}
                  >
                    <td className="py-2.5 px-4">
                      <span className={row.isGroup ? "" : "text-muted-foreground"}>
                        {row.account}
                      </span>
                    </td>
                    <td className="text-right py-2.5 px-4 tabular-nums">
                      {row.debit > 0 ? formatAmount(row.debit) : "-"}
                    </td>
                    <td className="text-right py-2.5 px-4 tabular-nums">
                      {row.credit > 0 ? formatAmount(row.credit) : "-"}
                    </td>
                    <td className={`text-right py-2.5 px-4 tabular-nums font-medium ${row.balance > 0 ? "text-blue-600" : row.balance < 0 ? "text-red-600" : ""}`}>
                      {row.balance !== 0 ? formatAmount(row.balance) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-muted/50 font-bold">
                  <td className="py-3 px-4">TOTAUX</td>
                  <td className="text-right py-3 px-4 tabular-nums">
                    {formatAmount(totals.debit)}
                  </td>
                  <td className="text-right py-3 px-4 tabular-nums">
                    {formatAmount(totals.credit)}
                  </td>
                  <td className={`text-right py-3 px-4 tabular-nums ${isBalanced ? "text-green-600" : "text-red-600"}`}>
                    {formatAmount(totals.debit - totals.credit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {rows.length === 0 && (
        <div className="text-center py-12">
          <Calculator className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="mt-4 text-lg font-semibold">Aucune donnee</h3>
          <p className="text-muted-foreground">
            Aucun mouvement comptable pour la periode selectionnee
          </p>
        </div>
      )}
    </div>
  );
}
