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
import { Loader2, ClipboardList, Package, Plus, Trash2 } from "lucide-react";
import { DocumentHeader } from "@/components/ui/document-header";

interface BOMItem {
  item_code: string;
  qty: number;
  rate: number;
}

interface BOMFormData {
  item: string;
  quantity: number;
  items: BOMItem[];
  is_active?: boolean;
  is_default?: boolean;
}

interface BOMFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BOMFormData) => Promise<void>;
  items: Array<{ item_code: string; item_name: string; standard_rate: number }>;
}

export function BOMForm({
  open,
  onOpenChange,
  onSubmit,
  items: availableItems,
}: BOMFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [mainItem, setMainItem] = React.useState("");
  const [quantity, setQuantity] = React.useState(1);
  const [bomItems, setBomItems] = React.useState<BOMItem[]>([
    { item_code: "", qty: 1, rate: 0 },
  ]);

  const addItem = () => {
    setBomItems([...bomItems, { item_code: "", qty: 1, rate: 0 }]);
  };

  const removeItem = (index: number) => {
    if (bomItems.length > 1) {
      setBomItems(bomItems.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof BOMItem, value: string | number) => {
    setBomItems(prev => {
      const updated = [...prev];
      const currentItem = updated[index];
      if (!currentItem) return prev;

      if (field === "item_code") {
        const selectedItem = availableItems.find((i) => i.item_code === value);
        updated[index] = {
          item_code: value as string,
          qty: currentItem.qty,
          rate: selectedItem?.standard_rate || 0,
        };
      } else if (field === "qty") {
        updated[index] = { item_code: currentItem.item_code, qty: value as number, rate: currentItem.rate };
      } else if (field === "rate") {
        updated[index] = { item_code: currentItem.item_code, qty: currentItem.qty, rate: value as number };
      }
      return updated;
    });
  };

  const totalCost = bomItems.reduce((sum, item) => sum + item.qty * item.rate, 0);

  // Check if at least one component is complete (has item_code)
  const hasAtLeastOneComponent = bomItems.some((item) => item.item_code);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Only require mainItem + quantity > 0 + at least one complete component
    if (!mainItem || quantity <= 0 || !hasAtLeastOneComponent) return;

    setLoading(true);
    try {
      await onSubmit({
        item: mainItem,
        quantity,
        items: bomItems.filter((item) => item.item_code),
        is_active: true,
        is_default: true,
      });
      onOpenChange(false);
      setMainItem("");
      setQuantity(1);
      setBomItems([{ item_code: "", qty: 1, rate: 0 }]);
    } finally {
      setLoading(false);
    }
  };

  // Filter out the main item from available components
  const componentItems = availableItems.filter((i) => i.item_code !== mainItem);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Document Header - OBLIGATOIRE selon CLAUDE.md */}
          <DocumentHeader title="Nomenclature (BOM)" />

          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Nouvelle Nomenclature (BOM)
            </DialogTitle>
            <DialogDescription>
              Definissez les composants necessaires pour fabriquer un produit.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="item" className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  Article fabrique *
                </Label>
                <Select value={mainItem} onValueChange={setMainItem}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Article a fabriquer" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableItems.map((item) => (
                      <SelectItem key={item.item_code} value={item.item_code}>
                        {item.item_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantite produite</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Composants</Label>
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
                {bomItems.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-end p-3 rounded-xl bg-muted/50"
                  >
                    <div className="col-span-5">
                      <Label className="text-xs text-muted-foreground">Composant</Label>
                      <Select
                        value={item.item_code}
                        onValueChange={(value) => updateItem(index, "item_code", value)}
                      >
                        <SelectTrigger className="rounded-lg h-9">
                          <SelectValue placeholder="Selectionnez" />
                        </SelectTrigger>
                        <SelectContent>
                          {componentItems.map((i) => (
                            <SelectItem key={i.item_code} value={i.item_code}>
                              {i.item_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
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

                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">Cout unit.</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) =>
                          updateItem(index, "rate", parseFloat(e.target.value) || 0)
                        }
                        className="rounded-lg h-9"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">Total</Label>
                      <div className="h-9 flex items-center font-medium text-sm">
                        {(item.qty * item.rate).toLocaleString()} MAD
                      </div>
                    </div>

                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={bomItems.length === 1}
                        className="h-9 w-9 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2 border-t">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Cout total de fabrication</p>
                  <p className="text-2xl font-bold">{totalCost.toLocaleString()} MAD</p>
                </div>
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
              disabled={loading || !mainItem || quantity <= 0 || !hasAtLeastOneComponent}
              className="rounded-xl"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Creer la nomenclature
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
