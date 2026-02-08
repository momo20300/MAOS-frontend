"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, CheckCircle, AlertCircle, FileUp } from "lucide-react";
import {
  createCustomer, createSupplier, createItem, createLead,
  importFromCSV,
} from "@/lib/services/erpnext";

const importOptions = [
  { value: "Customer", label: "Clients", create: createCustomer as (data: Record<string, unknown>) => Promise<unknown>,
    hint: "Colonnes: customer_name, customer_group, territory" },
  { value: "Supplier", label: "Fournisseurs", create: createSupplier as (data: Record<string, unknown>) => Promise<unknown>,
    hint: "Colonnes: supplier_name, supplier_group, supplier_type" },
  { value: "Item", label: "Articles", create: createItem as (data: Record<string, unknown>) => Promise<unknown>,
    hint: "Colonnes: item_code, item_name, item_group, standard_rate" },
  { value: "Lead", label: "Prospects", create: createLead as (data: Record<string, unknown>) => Promise<unknown>,
    hint: "Colonnes: lead_name, company_name, email_id, phone" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportDialog({ open, onOpenChange }: Props) {
  const [selected, setSelected] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = async () => {
    if (!file || !selected) return;
    const opt = importOptions.find(d => d.value === selected);
    if (!opt) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await importFromCSV(file, opt.create);
      setResult(res);
    } catch (error) {
      setResult({ success: 0, errors: [error instanceof Error ? error.message : "Erreur inconnue"] });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setFile(null);
    setSelected("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const hint = importOptions.find(d => d.value === selected)?.hint;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> Import de Donnees
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Type de document</Label>
            <select value={selected} onChange={e => { setSelected(e.target.value); setResult(null); }}
              className="w-full h-10 mt-1 rounded-xl border border-input bg-background px-3 text-sm">
              <option value="">-- Selectionnez --</option>
              {importOptions.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
          </div>

          <div>
            <Label>Fichier CSV</Label>
            <div className="mt-1 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileRef.current?.click()}>
              <FileUp className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              {file ? (
                <p className="text-sm font-medium">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
              ) : (
                <p className="text-sm text-muted-foreground">Cliquez pour selectionner un fichier CSV</p>
              )}
              <input ref={fileRef} type="file" accept=".csv" className="hidden"
                onChange={e => { setFile(e.target.files?.[0] || null); setResult(null); }} />
            </div>
          </div>

          {result && (
            <div className="space-y-2">
              {result.success > 0 && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-xl text-green-800 dark:text-green-200 text-sm">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  {result.success} enregistrement(s) importe(s) avec succes
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-red-800 dark:text-red-200 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {result.errors.length} erreur(s)
                  </div>
                  <ul className="list-disc pl-5 space-y-1 max-h-32 overflow-y-auto">
                    {result.errors.map((err, i) => <li key={i} className="text-xs">{err}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          <Button onClick={handleImport} disabled={!selected || !file || loading} className="w-full rounded-xl">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            {loading ? "Import en cours..." : "Importer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
