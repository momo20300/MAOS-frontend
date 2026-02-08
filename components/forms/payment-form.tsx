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
import { Loader2, CreditCard, Calendar } from "lucide-react";
import { DocumentHeader } from "@/components/ui/document-header";

interface PaymentFormData {
  payment_type: "Receive" | "Pay";
  party_type: "Customer" | "Supplier";
  party: string;
  paid_amount: number;
  posting_date: string;
  reference_no: string;
}

interface PaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PaymentFormData) => Promise<void>;
  customers: Array<{ name: string; customer_name: string }>;
  suppliers: Array<{ name: string; supplier_name: string }>;
}

export function PaymentForm({
  open, onOpenChange, onSubmit, customers, suppliers,
}: PaymentFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [paymentType, setPaymentType] = React.useState<"Receive" | "Pay">("Receive");
  const [party, setParty] = React.useState("");
  const [paidAmount, setPaidAmount] = React.useState(0);
  const [postingDate, setPostingDate] = React.useState(
    new Date().toISOString().split("T")[0] as string
  );
  const [referenceNo, setReferenceNo] = React.useState("");

  const partyType = paymentType === "Receive" ? "Customer" : "Supplier";
  const partyList = paymentType === "Receive"
    ? customers.map(c => ({ name: c.name, display: c.customer_name }))
    : suppliers.map(s => ({ name: s.name, display: s.supplier_name }));

  // Reset party when payment type changes
  React.useEffect(() => {
    setParty("");
  }, [paymentType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!party || paidAmount <= 0) return;
    setLoading(true);
    try {
      await onSubmit({
        payment_type: paymentType,
        party_type: partyType,
        party,
        paid_amount: paidAmount,
        posting_date: postingDate,
        reference_no: referenceNo,
      });
      onOpenChange(false);
      setParty("");
      setPaidAmount(0);
      setReferenceNo("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DocumentHeader title="Paiement (PE)" />
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" /> Nouveau Paiement
            </DialogTitle>
            <DialogDescription>Enregistrez un encaissement ou un decaissement.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Type de paiement *</Label>
              <Select value={paymentType} onValueChange={v => setPaymentType(v as "Receive" | "Pay")}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Receive">Encaissement (Client)</SelectItem>
                  <SelectItem value="Pay">Decaissement (Fournisseur)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{paymentType === "Receive" ? "Client" : "Fournisseur"} *</Label>
              <Select value={party} onValueChange={setParty}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selectionnez" /></SelectTrigger>
                <SelectContent>
                  {partyList.map(p => <SelectItem key={p.name} value={p.name}>{p.display}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Montant (MAD) *</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={paidAmount || ""}
                  onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="rounded-xl"
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> Date</Label>
                <Input type="date" value={postingDate} onChange={e => setPostingDate(e.target.value)} className="rounded-xl" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Reference / N° cheque</Label>
              <Input
                value={referenceNo}
                onChange={e => setReferenceNo(e.target.value)}
                className="rounded-xl"
                placeholder="Ex: CHQ-001, VIR-2026-001..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Annuler</Button>
            <Button type="submit" disabled={loading || !party || paidAmount <= 0} className="rounded-xl">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Creer le paiement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
