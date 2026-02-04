"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, BarChart3, Package, Plus, Trash2, Calendar, Warehouse } from "lucide-react";
import { DocumentHeader } from "@/components/ui/document-header";

interface StockEntryItem {
  item_code: string;
  qty: number;
  s_warehouse?: string;
  t_warehouse?: string;
}

interface StockEntryFormData {
  stock_entry_type: 'Material Receipt' | 'Material Issue' | 'Material Transfer';
  items: StockEntryItem[];
  posting_date: string;
}

interface StockEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: StockEntryFormData) => Promise<void>;
  items: Array<{ item_code: string; item_name: string }>;
  warehouses?: Array<{ name: string }>;
}

const ENTRY_TYPES = [
  { value: 'Material Receipt', label: 'Entree de stock', description: 'Reception de marchandises' },
  { value: 'Material Issue', label: 'Sortie de stock', description: 'Sortie de marchandises' },
  { value: 'Material Transfer', label: 'Transfert', description: 'Transfert entre entrepots' },
];

export function StockEntryForm({
  open,
  onOpenChange,
  onSubmit,
  items: availableItems,
  warehouses = [{ name: 'Stores - MAOS' }, { name: 'Work In Progress - MAOS' }, { name: 'Finished Goods - MAOS' }],
}: StockEntryFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [entryType, setEntryType] = React.useState<'Material Receipt' | 'Material Issue' | 'Material Transfer'>('Material Receipt');
  const [postingDate, setPostingDate] = React.useState<string>(
    new Date().toISOString().split("T")[0] as string
  );
  const [entryItems, setEntryItems] = React.useState<StockEntryItem[]>([
    { item_code: "", qty: 1, s_warehouse: "", t_warehouse: "Stores - MAOS" },
  ]);

  const addItem = () => {
    setEntryItems([...entryItems, { item_code: "", qty: 1, s_warehouse: "", t_warehouse: "Stores - MAOS" }]);
  };

  const removeItem = (index: number) => {
    if (entryItems.length > 1) {
      setEntryItems(entryItems.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof StockEntryItem, value: string | number) => {
    setEntryItems(prev => {
      const updated = [...prev];
      const currentItem = updated[index];
      if (!currentItem) return prev;

      updated[index] = {
        item_code: field === "item_code" ? (value as string) : currentItem.item_code,
        qty: field === "qty" ? (value as number) : currentItem.qty,
        s_warehouse: field === "s_warehouse" ? (value as string) : currentItem.s_warehouse,
        t_warehouse: field === "t_warehouse" ? (value as string) : currentItem.t_warehouse,
      };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (entryItems.some((item) => !item.item_code || item.qty <= 0)) return;

    setLoading(true);
    try {
      await onSubmit({
        stock_entry_type: entryType,
        items: entryItems.filter((item) => item.item_code),
        posting_date: postingDate,
      });
      onOpenChange(false);
      setEntryType('Material Receipt');
      setEntryItems([{ item_code: "", qty: 1, s_warehouse: "", t_warehouse: "Stores - MAOS" }]);
    } finally {
      setLoading(false);
    }
  };

  const showSourceWarehouse = entryType === 'Material Issue' || entryType === 'Material Transfer';
  const showTargetWarehouse = entryType === 'Material Receipt' || entryType === 'Material Transfer';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Document Header - OBLIGATOIRE selon CLAUDE.md */}
          <DocumentHeader title="Mouvement de Stock (STE)" />

          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Nouveau Mouvement de Stock
            </DialogTitle>
            <DialogDescription>
              Enregistrez une entree, sortie ou transfert de stock.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="entry_type">Type de mouvement *</Label>
                <Select value={entryType} onValueChange={(v) => setEntryType(v as any)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Type de mouvement" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTRY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="posting_date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Date
                </Label>
                <Input
                  id="posting_date"
                  type="date"
                  value={postingDate}
                  onChange={(e) => setPostingDate(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Articles</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="rounded-xl"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>

              <div className="space-y-2">
                {entryItems.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-xl bg-muted/50 space-y-2"
                  >
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-6">
                        <Label className="text-xs text-muted-foreground">
                          <Package className="h-3 w-3 inline mr-1" />
                          Article
                        </Label>
                        <Select
                          value={item.item_code}
                          onValueChange={(value) => updateItem(index, "item_code", value)}
                        >
                          <SelectTrigger className="rounded-lg h-9">
                            <SelectValue placeholder="Selectionnez un article" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableItems.map((i) => (
                              <SelectItem key={i.item_code} value={i.item_code}>
                                {i.item_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-3">
                        <Label className="text-xs text-muted-foreground">Quantite</Label>
                        <Input
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={item.qty}
                          onChange={(e) =>
                            updateItem(index, "qty", parseFloat(e.target.value) || 1)
                          }
                          className="rounded-lg h-9"
                        />
                      </div>

                      <div className="col-span-3 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          disabled={entryItems.length === 1}
                          className="h-9 w-9 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {(showSourceWarehouse || showTargetWarehouse) && (
                      <div className="grid grid-cols-2 gap-2">
                        {showSourceWarehouse && (
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              <Warehouse className="h-3 w-3 inline mr-1" />
                              Entrepot source
                            </Label>
                            <Select
                              value={item.s_warehouse || ""}
                              onValueChange={(value) => updateItem(index, "s_warehouse", value)}
                            >
                              <SelectTrigger className="rounded-lg h-9">
                                <SelectValue placeholder="Source" />
                              </SelectTrigger>
                              <SelectContent>
                                {warehouses.map((w) => (
                                  <SelectItem key={w.name} value={w.name}>
                                    {w.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {showTargetWarehouse && (
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              <Warehouse className="h-3 w-3 inline mr-1" />
                              Entrepot destination
                            </Label>
                            <Select
                              value={item.t_warehouse || ""}
                              onValueChange={(value) => updateItem(index, "t_warehouse", value)}
                            >
                              <SelectTrigger className="rounded-lg h-9">
                                <SelectValue placeholder="Destination" />
                              </SelectTrigger>
                              <SelectContent>
                                {warehouses.map((w) => (
                                  <SelectItem key={w.name} value={w.name}>
                                    {w.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || entryItems.some((item) => !item.item_code || item.qty <= 0)}
              className="rounded-xl"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
