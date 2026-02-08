"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download, Loader2, CheckCircle } from "lucide-react";
import {
  getCustomers, getSuppliers, getItems, getInvoices, getPurchaseInvoices,
  getSalesOrders, getPurchaseOrders, getQuotations, getDeliveryNotes,
  getPurchaseReceipts, getPaymentEntries, getJournalEntries, getEmployees,
  exportToCSV,
} from "@/lib/services/erpnext";

const doctypeOptions = [
  { value: "customers", label: "Clients", fetch: getCustomers, columns: [
    { key: "name", label: "ID" }, { key: "customer_name", label: "Nom" }, { key: "customer_group", label: "Groupe" }, { key: "territory", label: "Territoire" },
  ]},
  { value: "suppliers", label: "Fournisseurs", fetch: getSuppliers, columns: [
    { key: "name", label: "ID" }, { key: "supplier_name", label: "Nom" }, { key: "supplier_group", label: "Groupe" },
  ]},
  { value: "items", label: "Articles", fetch: getItems, columns: [
    { key: "item_code", label: "Code" }, { key: "item_name", label: "Nom" }, { key: "item_group", label: "Groupe" }, { key: "standard_rate", label: "Prix" },
  ]},
  { value: "sales-invoices", label: "Factures de vente", fetch: getInvoices, columns: [
    { key: "name", label: "Reference" }, { key: "customer_name", label: "Client" }, { key: "posting_date", label: "Date" }, { key: "grand_total", label: "Montant" }, { key: "status", label: "Statut" },
  ]},
  { value: "purchase-invoices", label: "Factures d'achat", fetch: getPurchaseInvoices, columns: [
    { key: "name", label: "Reference" }, { key: "supplier_name", label: "Fournisseur" }, { key: "posting_date", label: "Date" }, { key: "grand_total", label: "Montant" }, { key: "status", label: "Statut" },
  ]},
  { value: "sales-orders", label: "Commandes de vente", fetch: getSalesOrders, columns: [
    { key: "name", label: "Reference" }, { key: "customer_name", label: "Client" }, { key: "transaction_date", label: "Date" }, { key: "grand_total", label: "Montant" }, { key: "status", label: "Statut" },
  ]},
  { value: "purchase-orders", label: "Commandes d'achat", fetch: getPurchaseOrders, columns: [
    { key: "name", label: "Reference" }, { key: "supplier_name", label: "Fournisseur" }, { key: "transaction_date", label: "Date" }, { key: "grand_total", label: "Montant" }, { key: "status", label: "Statut" },
  ]},
  { value: "quotations", label: "Devis", fetch: getQuotations, columns: [
    { key: "name", label: "Reference" }, { key: "party_name", label: "Client" }, { key: "transaction_date", label: "Date" }, { key: "grand_total", label: "Montant" }, { key: "status", label: "Statut" },
  ]},
  { value: "delivery-notes", label: "Bons de livraison", fetch: getDeliveryNotes, columns: [
    { key: "name", label: "Reference" }, { key: "customer_name", label: "Client" }, { key: "posting_date", label: "Date" }, { key: "grand_total", label: "Montant" }, { key: "status", label: "Statut" },
  ]},
  { value: "purchase-receipts", label: "Receptions", fetch: getPurchaseReceipts, columns: [
    { key: "name", label: "Reference" }, { key: "supplier_name", label: "Fournisseur" }, { key: "posting_date", label: "Date" }, { key: "grand_total", label: "Montant" }, { key: "status", label: "Statut" },
  ]},
  { value: "payments", label: "Paiements", fetch: getPaymentEntries, columns: [
    { key: "name", label: "Reference" }, { key: "party_name", label: "Tiers" }, { key: "posting_date", label: "Date" }, { key: "paid_amount", label: "Montant" }, { key: "payment_type", label: "Type" },
  ]},
  { value: "journal-entries", label: "Ecritures comptables", fetch: getJournalEntries, columns: [
    { key: "name", label: "Reference" }, { key: "posting_date", label: "Date" }, { key: "total_debit", label: "Debit" }, { key: "total_credit", label: "Credit" }, { key: "voucher_type", label: "Type" },
  ]},
  { value: "employees", label: "Employes", fetch: getEmployees, columns: [
    { key: "name", label: "ID" }, { key: "employee_name", label: "Nom" }, { key: "department", label: "Departement" }, { key: "designation", label: "Poste" },
  ]},
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ open, onOpenChange }: Props) {
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ count: number } | null>(null);

  const handleExport = async () => {
    const opt = doctypeOptions.find(d => d.value === selected);
    if (!opt) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await opt.fetch();
      exportToCSV(data, opt.columns, `${opt.value}-maos`);
      setResult({ count: data.length });
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setResult(null); setSelected(""); } }}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" /> Export de Donnees
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Type de document</Label>
            <select value={selected} onChange={e => setSelected(e.target.value)}
              className="w-full h-10 mt-1 rounded-xl border border-input bg-background px-3 text-sm">
              <option value="">-- Selectionnez --</option>
              {doctypeOptions.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          {result && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-xl text-green-800 dark:text-green-200 text-sm">
              <CheckCircle className="h-4 w-4" />
              {result.count} enregistrement(s) exporte(s) avec succes
            </div>
          )}
          <Button onClick={handleExport} disabled={!selected || loading} className="w-full rounded-xl">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            {loading ? "Export en cours..." : "Exporter en CSV"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
