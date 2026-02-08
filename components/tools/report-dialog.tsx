"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText, Loader2, Download, Printer } from "lucide-react";
import {
  getCustomers, getSuppliers, getItems, getInvoices, getPurchaseInvoices,
  getSalesOrders, getPurchaseOrders, getQuotations, getDeliveryNotes,
  getPurchaseReceipts, getPaymentEntries, getJournalEntries, getEmployees,
  exportToCSV, printDocument,
} from "@/lib/services/erpnext";

interface DoctypeOption {
  value: string;
  label: string;
  fetch: () => Promise<Record<string, unknown>[]>;
  amountField?: string;
  columns: { key: string; label: string }[];
}

const doctypeOptions: DoctypeOption[] = [
  { value: "customers", label: "Clients", fetch: getCustomers, columns: [
    { key: "name", label: "ID" }, { key: "customer_name", label: "Nom" }, { key: "customer_group", label: "Groupe" },
  ]},
  { value: "suppliers", label: "Fournisseurs", fetch: getSuppliers, columns: [
    { key: "name", label: "ID" }, { key: "supplier_name", label: "Nom" }, { key: "supplier_group", label: "Groupe" },
  ]},
  { value: "items", label: "Articles", fetch: getItems, columns: [
    { key: "item_code", label: "Code" }, { key: "item_name", label: "Nom" }, { key: "item_group", label: "Groupe" }, { key: "standard_rate", label: "Prix" },
  ]},
  { value: "sales-invoices", label: "Factures de vente", fetch: getInvoices, amountField: "grand_total", columns: [
    { key: "name", label: "Ref" }, { key: "customer_name", label: "Client" }, { key: "posting_date", label: "Date" }, { key: "grand_total", label: "Montant" }, { key: "status", label: "Statut" },
  ]},
  { value: "purchase-invoices", label: "Factures d'achat", fetch: getPurchaseInvoices, amountField: "grand_total", columns: [
    { key: "name", label: "Ref" }, { key: "supplier_name", label: "Fournisseur" }, { key: "posting_date", label: "Date" }, { key: "grand_total", label: "Montant" }, { key: "status", label: "Statut" },
  ]},
  { value: "sales-orders", label: "Commandes de vente", fetch: getSalesOrders, amountField: "grand_total", columns: [
    { key: "name", label: "Ref" }, { key: "customer_name", label: "Client" }, { key: "transaction_date", label: "Date" }, { key: "grand_total", label: "Montant" }, { key: "status", label: "Statut" },
  ]},
  { value: "purchase-orders", label: "Commandes d'achat", fetch: getPurchaseOrders, amountField: "grand_total", columns: [
    { key: "name", label: "Ref" }, { key: "supplier_name", label: "Fournisseur" }, { key: "transaction_date", label: "Date" }, { key: "grand_total", label: "Montant" }, { key: "status", label: "Statut" },
  ]},
  { value: "quotations", label: "Devis", fetch: getQuotations, amountField: "grand_total", columns: [
    { key: "name", label: "Ref" }, { key: "party_name", label: "Client" }, { key: "transaction_date", label: "Date" }, { key: "grand_total", label: "Montant" }, { key: "status", label: "Statut" },
  ]},
  { value: "delivery-notes", label: "Bons de livraison", fetch: getDeliveryNotes, amountField: "grand_total", columns: [
    { key: "name", label: "Ref" }, { key: "customer_name", label: "Client" }, { key: "posting_date", label: "Date" }, { key: "grand_total", label: "Montant" }, { key: "status", label: "Statut" },
  ]},
  { value: "purchase-receipts", label: "Receptions", fetch: getPurchaseReceipts, amountField: "grand_total", columns: [
    { key: "name", label: "Ref" }, { key: "supplier_name", label: "Fournisseur" }, { key: "posting_date", label: "Date" }, { key: "grand_total", label: "Montant" }, { key: "status", label: "Statut" },
  ]},
  { value: "payments", label: "Paiements", fetch: getPaymentEntries, amountField: "paid_amount", columns: [
    { key: "name", label: "Ref" }, { key: "party_name", label: "Tiers" }, { key: "posting_date", label: "Date" }, { key: "paid_amount", label: "Montant" }, { key: "payment_type", label: "Type" },
  ]},
  { value: "journal-entries", label: "Ecritures comptables", fetch: getJournalEntries, amountField: "total_debit", columns: [
    { key: "name", label: "Ref" }, { key: "posting_date", label: "Date" }, { key: "total_debit", label: "Debit" }, { key: "total_credit", label: "Credit" }, { key: "voucher_type", label: "Type" },
  ]},
  { value: "employees", label: "Employes", fetch: getEmployees, columns: [
    { key: "name", label: "ID" }, { key: "employee_name", label: "Nom" }, { key: "department", label: "Dept" }, { key: "designation", label: "Poste" },
  ]},
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportDialog({ open, onOpenChange }: Props) {
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [generated, setGenerated] = useState(false);

  const opt = doctypeOptions.find(d => d.value === selected);

  const handleGenerate = async () => {
    if (!opt) return;
    setLoading(true);
    try {
      const result = await opt.fetch();
      setData(result);
      setGenerated(true);
    } catch (error) {
      console.error("Report error:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = opt?.amountField
    ? data.reduce((sum, item) => sum + (Number(item[opt.amountField!]) || 0), 0)
    : null;

  const statusCounts: Record<string, number> = {};
  data.forEach(item => {
    const status = String(item.status || "N/A");
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setData([]); setGenerated(false); setSelected(""); } }}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Rapport Personnalise
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Type de document</Label>
              <select value={selected} onChange={e => { setSelected(e.target.value); setGenerated(false); setData([]); }}
                className="w-full h-10 mt-1 rounded-xl border border-input bg-background px-3 text-sm">
                <option value="">-- Selectionnez --</option>
                {doctypeOptions.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleGenerate} disabled={!selected || loading} className="rounded-xl">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generer"}
              </Button>
            </div>
          </div>

          {generated && opt && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-muted rounded-xl text-center">
                  <div className="text-2xl font-bold">{data.length}</div>
                  <div className="text-xs text-muted-foreground">Total documents</div>
                </div>
                {totalAmount !== null && (
                  <div className="p-3 bg-muted rounded-xl text-center">
                    <div className="text-2xl font-bold">{totalAmount.toLocaleString("fr-FR")}</div>
                    <div className="text-xs text-muted-foreground">Montant total (MAD)</div>
                  </div>
                )}
                {Object.keys(statusCounts).length > 1 && (
                  <div className="p-3 bg-muted rounded-xl">
                    <div className="text-xs text-muted-foreground mb-1">Par statut</div>
                    {Object.entries(statusCounts).slice(0, 4).map(([status, count]) => (
                      <div key={status} className="flex justify-between text-xs">
                        <span>{status}</span>
                        <span className="font-bold">{String(count)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted">
                      {opt.columns.map(col => (
                        <th key={col.key} className="px-3 py-2 text-left font-medium">{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 20).map((item, i) => (
                      <tr key={i} className="border-t hover:bg-muted/50">
                        {opt.columns.map(col => (
                          <td key={col.key} className="px-3 py-2 truncate max-w-[150px]">
                            {typeof item[col.key] === "number"
                              ? Number(item[col.key]).toLocaleString("fr-FR")
                              : String(item[col.key] ?? "-")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.length > 20 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground border-t bg-muted/50">
                    Affichage 20 / {data.length} documents. Exportez pour voir tout.
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-xl"
                  onClick={() => exportToCSV(data, opt.columns, `rapport-${opt.value}`)}>
                  <Download className="h-4 w-4 mr-2" /> Exporter CSV
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl"
                  onClick={() => printDocument(data, opt.columns, `Rapport ${opt.label}`)}>
                  <Printer className="h-4 w-4 mr-2" /> Imprimer
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
