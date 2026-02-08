"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Database, Loader2, RefreshCw } from "lucide-react";
import {
  getCustomers, getSuppliers, getItems, getInvoices, getPurchaseInvoices,
  getSalesOrders, getPurchaseOrders, getQuotations, getDeliveryNotes,
  getPurchaseReceipts, getPaymentEntries, getJournalEntries, getEmployees,
} from "@/lib/services/erpnext";

interface DocCount {
  label: string;
  icon: string;
  count: number | null;
  module: string;
}

const doctypeFetchers = [
  { label: "Clients", icon: "CRM", module: "CRM", fetch: getCustomers },
  { label: "Fournisseurs", icon: "CRM", module: "Achats", fetch: getSuppliers },
  { label: "Articles", icon: "Stock", module: "Stock", fetch: getItems },
  { label: "Factures de vente", icon: "Ventes", module: "Ventes", fetch: getInvoices },
  { label: "Commandes de vente", icon: "Ventes", module: "Ventes", fetch: getSalesOrders },
  { label: "Devis", icon: "Ventes", module: "Ventes", fetch: getQuotations },
  { label: "Bons de livraison", icon: "Ventes", module: "Ventes", fetch: getDeliveryNotes },
  { label: "Factures d'achat", icon: "Achats", module: "Achats", fetch: getPurchaseInvoices },
  { label: "Commandes d'achat", icon: "Achats", module: "Achats", fetch: getPurchaseOrders },
  { label: "Receptions", icon: "Achats", module: "Achats", fetch: getPurchaseReceipts },
  { label: "Paiements", icon: "Compta", module: "Comptabilite", fetch: getPaymentEntries },
  { label: "Ecritures comptables", icon: "Compta", module: "Comptabilite", fetch: getJournalEntries },
  { label: "Employes", icon: "RH", module: "RH", fetch: getEmployees },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StatsDialog({ open, onOpenChange }: Props) {
  const [stats, setStats] = useState<DocCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    const results: DocCount[] = [];
    const promises = doctypeFetchers.map(async (dt) => {
      try {
        const data = await dt.fetch();
        return { label: dt.label, icon: dt.icon, module: dt.module, count: data.length };
      } catch {
        return { label: dt.label, icon: dt.icon, module: dt.module, count: null };
      }
    });
    const settled = await Promise.all(promises);
    results.push(...settled);
    setStats(results);
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => {
    if (open && stats.length === 0) {
      fetchStats();
    }
  }, [open]);

  const totalDocs = stats.reduce((sum, s) => sum + (s.count || 0), 0);
  const modules = [...new Set(stats.map(s => s.module))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" /> Console Base de Donnees
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{totalDocs.toLocaleString("fr-FR")}</div>
              <div className="text-sm text-muted-foreground">Documents total dans ERPNext</div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading} className="rounded-xl">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>

          {loading && stats.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Chargement des statistiques...
            </div>
          ) : (
            <>
              {modules.map(mod => (
                <div key={mod}>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{mod}</div>
                  <div className="space-y-1">
                    {stats.filter(s => s.module === mod).map(s => (
                      <div key={s.label} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                        <span className="text-sm">{s.label}</span>
                        <span className={`font-bold text-sm ${s.count === null ? "text-red-500" : ""}`}>
                          {s.count !== null ? s.count.toLocaleString("fr-FR") : "Erreur"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {lastRefresh && (
            <p className="text-xs text-muted-foreground text-center">
              Derniere mise a jour : {lastRefresh.toLocaleTimeString("fr-FR")}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
