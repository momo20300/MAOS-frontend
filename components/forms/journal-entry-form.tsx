"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, BookOpen, Calendar, Trash2, Plus, AlertCircle } from "lucide-react";
import { DocumentHeader } from "@/components/ui/document-header";

interface JEAccount {
  account: string;
  debit_in_account_currency: number;
  credit_in_account_currency: number;
}

interface JournalEntryFormData {
  posting_date: string;
  voucher_type: string;
  accounts: JEAccount[];
  user_remark: string;
}

interface JournalEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: JournalEntryFormData) => Promise<void>;
  accounts: Array<{ name: string; account_name?: string }>;
}

export function JournalEntryForm({
  open, onOpenChange, onSubmit, accounts: availableAccounts,
}: JournalEntryFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [postingDate, setPostingDate] = React.useState(
    new Date().toISOString().split("T")[0] as string
  );
  const [voucherType, setVoucherType] = React.useState("Journal Entry");
  const [userRemark, setUserRemark] = React.useState("");
  const [jeAccounts, setJeAccounts] = React.useState<JEAccount[]>([
    { account: "", debit_in_account_currency: 0, credit_in_account_currency: 0 },
    { account: "", debit_in_account_currency: 0, credit_in_account_currency: 0 },
  ]);

  const addAccount = () =>
    setJeAccounts([...jeAccounts, { account: "", debit_in_account_currency: 0, credit_in_account_currency: 0 }]);

  const removeAccount = (index: number) => {
    if (jeAccounts.length > 2) setJeAccounts(jeAccounts.filter((_, i) => i !== index));
  };

  const updateAccount = (index: number, field: keyof JEAccount, value: string | number) => {
    setJeAccounts(prev => {
      const updated = [...prev];
      const cur = updated[index];
      if (!cur) return prev;
      updated[index] = { ...cur, [field]: value };
      return updated;
    });
  };

  const totalDebit = jeAccounts.reduce((sum, a) => sum + (a.debit_in_account_currency || 0), 0);
  const totalCredit = jeAccounts.reduce((sum, a) => sum + (a.credit_in_account_currency || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced || jeAccounts.some(a => !a.account)) return;
    setLoading(true);
    try {
      await onSubmit({
        posting_date: postingDate,
        voucher_type: voucherType,
        accounts: jeAccounts.filter(a => a.account),
        user_remark: userRemark,
      });
      onOpenChange(false);
      setJeAccounts([
        { account: "", debit_in_account_currency: 0, credit_in_account_currency: 0 },
        { account: "", debit_in_account_currency: 0, credit_in_account_currency: 0 },
      ]);
      setUserRemark("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DocumentHeader title="Ecriture Comptable (JV)" />
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Nouvelle Ecriture Comptable
            </DialogTitle>
            <DialogDescription>Saisissez les lignes comptables (debit = credit).</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> Date</Label>
                <Input type="date" value={postingDate} onChange={e => setPostingDate(e.target.value)} className="rounded-xl" />
              </div>
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={voucherType} onValueChange={setVoucherType}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Journal Entry">Journal Entry</SelectItem>
                    <SelectItem value="Bank Entry">Bank Entry</SelectItem>
                    <SelectItem value="Cash Entry">Cash Entry</SelectItem>
                    <SelectItem value="Depreciation Entry">Depreciation Entry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Libelle / Remarque</Label>
              <Input value={userRemark} onChange={e => setUserRemark(e.target.value)} className="rounded-xl" placeholder="Description de l'ecriture..." />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Lignes comptables</Label>
                <Button type="button" variant="outline" size="sm" onClick={addAccount} className="rounded-xl">
                  <Plus className="h-4 w-4 mr-1" /> Ajouter
                </Button>
              </div>
              <div className="space-y-2">
                {jeAccounts.map((acc, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 rounded-xl bg-muted/50">
                    <div className="col-span-5">
                      <Label className="text-xs text-muted-foreground">Compte</Label>
                      <Select value={acc.account} onValueChange={v => updateAccount(index, "account", v)}>
                        <SelectTrigger className="rounded-lg h-9"><SelectValue placeholder="Selectionnez" /></SelectTrigger>
                        <SelectContent>
                          {availableAccounts.map(a => (
                            <SelectItem key={a.name} value={a.name}>
                              {a.account_name || a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs text-muted-foreground">Debit</Label>
                      <Input
                        type="number" min="0" step="0.01"
                        value={acc.debit_in_account_currency || ""}
                        onChange={e => updateAccount(index, "debit_in_account_currency", parseFloat(e.target.value) || 0)}
                        className="rounded-lg h-9"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs text-muted-foreground">Credit</Label>
                      <Input
                        type="number" min="0" step="0.01"
                        value={acc.credit_in_account_currency || ""}
                        onChange={e => updateAccount(index, "credit_in_account_currency", parseFloat(e.target.value) || 0)}
                        className="rounded-lg h-9"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeAccount(index)} disabled={jeAccounts.length <= 2} className="h-9 w-9 p-0">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                {!isBalanced && totalDebit + totalCredit > 0 && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" /> Debit et Credit doivent etre egaux
                  </div>
                )}
                {isBalanced && <div />}
                <div className="text-right space-y-1">
                  <p className="text-sm">Debit: <span className="font-bold">{totalDebit.toLocaleString()} MAD</span></p>
                  <p className="text-sm">Credit: <span className="font-bold">{totalCredit.toLocaleString()} MAD</span></p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Annuler</Button>
            <Button type="submit" disabled={loading || !isBalanced || jeAccounts.some(a => !a.account) || totalDebit === 0} className="rounded-xl">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Creer l'ecriture
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
