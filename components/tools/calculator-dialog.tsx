"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CalculatorDialog({ open, onOpenChange }: Props) {
  const [tab, setTab] = useState<"margin" | "tva" | "conversion">("margin");

  // Margin
  const [prixAchat, setPrixAchat] = useState("");
  const [prixVente, setPrixVente] = useState("");

  // TVA
  const [montantHT, setMontantHT] = useState("");
  const [tauxTVA, setTauxTVA] = useState("20");

  // Conversion
  const [montantMAD, setMontantMAD] = useState("");
  const [devise, setDevise] = useState("EUR");

  const pa = parseFloat(prixAchat) || 0;
  const pv = parseFloat(prixVente) || 0;
  const marge = pv - pa;
  const tauxMarge = pa > 0 ? (marge / pa) * 100 : 0;
  const coeff = pa > 0 ? pv / pa : 0;

  const ht = parseFloat(montantHT) || 0;
  const tva = parseFloat(tauxTVA) || 0;
  const montantTVA = ht * (tva / 100);
  const ttc = ht + montantTVA;

  const mad = parseFloat(montantMAD) || 0;
  const rates: Record<string, number> = { EUR: 0.091, USD: 0.098, GBP: 0.078 };
  const converted = mad * (rates[devise] || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" /> Calculatrice Business
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          {([
            { key: "margin" as const, label: "Marge" },
            { key: "tva" as const, label: "TVA" },
            { key: "conversion" as const, label: "Devises" },
          ]).map(t => (
            <Button key={t.key} variant={tab === t.key ? "default" : "outline"} size="sm"
              onClick={() => setTab(t.key)} className="rounded-xl flex-1">
              {t.label}
            </Button>
          ))}
        </div>

        {tab === "margin" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prix d&apos;achat (MAD)</Label>
                <Input type="number" value={prixAchat} onChange={e => setPrixAchat(e.target.value)}
                  placeholder="0.00" className="mt-1 rounded-xl" />
              </div>
              <div>
                <Label>Prix de vente (MAD)</Label>
                <Input type="number" value={prixVente} onChange={e => setPrixVente(e.target.value)}
                  placeholder="0.00" className="mt-1 rounded-xl" />
              </div>
            </div>
            <div className="p-4 bg-muted rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Marge brute</span>
                <span className={`font-bold ${marge >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {marge.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} MAD
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taux de marge</span>
                <span className="font-bold">{tauxMarge.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coefficient</span>
                <span className="font-bold">{coeff.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {tab === "tva" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Montant HT (MAD)</Label>
                <Input type="number" value={montantHT} onChange={e => setMontantHT(e.target.value)}
                  placeholder="0.00" className="mt-1 rounded-xl" />
              </div>
              <div>
                <Label>Taux TVA</Label>
                <select value={tauxTVA} onChange={e => setTauxTVA(e.target.value)}
                  className="w-full h-10 mt-1 rounded-xl border border-input bg-background px-3 text-sm">
                  <option value="20">20% (Standard)</option>
                  <option value="14">14% (Intermediaire)</option>
                  <option value="10">10% (Reduit)</option>
                  <option value="7">7% (Reduit)</option>
                  <option value="0">0% (Exonere)</option>
                </select>
              </div>
            </div>
            <div className="p-4 bg-muted rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant HT</span>
                <span className="font-bold">{ht.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} MAD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TVA ({tva}%)</span>
                <span className="font-bold">{montantTVA.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} MAD</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Montant TTC</span>
                <span className="font-bold text-lg">{ttc.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} MAD</span>
              </div>
            </div>
          </div>
        )}

        {tab === "conversion" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Montant (MAD)</Label>
                <Input type="number" value={montantMAD} onChange={e => setMontantMAD(e.target.value)}
                  placeholder="0.00" className="mt-1 rounded-xl" />
              </div>
              <div>
                <Label>Devise cible</Label>
                <select value={devise} onChange={e => setDevise(e.target.value)}
                  className="w-full h-10 mt-1 rounded-xl border border-input bg-background px-3 text-sm">
                  <option value="EUR">EUR (Euro)</option>
                  <option value="USD">USD (Dollar US)</option>
                  <option value="GBP">GBP (Livre Sterling)</option>
                </select>
              </div>
            </div>
            <div className="p-4 bg-muted rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resultat</span>
                <span className="font-bold text-lg">{converted.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {devise}</span>
              </div>
              <p className="text-xs text-muted-foreground">Taux indicatif : 1 MAD = {rates[devise]} {devise}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
