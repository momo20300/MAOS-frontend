"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { renameDocument } from "@/lib/services/erpnext";

const renamableDoctypes = [
  { value: "Customer", label: "Client" },
  { value: "Supplier", label: "Fournisseur" },
  { value: "Item", label: "Article" },
  { value: "Employee", label: "Employe" },
  { value: "Warehouse", label: "Entrepot" },
  { value: "Item Group", label: "Groupe d'articles" },
  { value: "Customer Group", label: "Groupe de clients" },
  { value: "Supplier Group", label: "Groupe de fournisseurs" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenameDialog({ open, onOpenChange }: Props) {
  const [doctype, setDoctype] = useState("");
  const [oldName, setOldName] = useState("");
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleRename = async () => {
    if (!doctype || !oldName || !newName) return;
    setLoading(true);
    setResult(null);
    try {
      await renameDocument(doctype, oldName, newName);
      setResult({ success: true, message: `"${oldName}" renomme en "${newName}" avec succes` });
      setOldName("");
      setNewName("");
    } catch (error) {
      setResult({ success: false, message: error instanceof Error ? error.message : "Erreur lors du renommage" });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setDoctype("");
    setOldName("");
    setNewName("");
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" /> Renommer Documents
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Type de document</Label>
            <select value={doctype} onChange={e => { setDoctype(e.target.value); setResult(null); }}
              className="w-full h-10 mt-1 rounded-xl border border-input bg-background px-3 text-sm">
              <option value="">-- Selectionnez --</option>
              {renamableDoctypes.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Nom actuel du document</Label>
            <Input value={oldName} onChange={e => setOldName(e.target.value)}
              placeholder="Ex: CUST-00042" className="mt-1 rounded-xl" />
          </div>
          <div>
            <Label>Nouveau nom</Label>
            <Input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Ex: Atlas Distribution SARL" className="mt-1 rounded-xl" />
          </div>

          {result && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
              result.success
                ? "bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
                : "bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
            }`}>
              {result.success ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              {result.message}
            </div>
          )}

          <Button onClick={handleRename} disabled={!doctype || !oldName || !newName || loading} className="w-full rounded-xl">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {loading ? "Renommage en cours..." : "Renommer"}
          </Button>

          <p className="text-xs text-muted-foreground">
            Seuls les documents de type Client, Fournisseur, Article, Employe, Entrepot et Groupes peuvent etre renommes.
            Les documents transactionnels (factures, commandes) ont des noms auto-generes.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
