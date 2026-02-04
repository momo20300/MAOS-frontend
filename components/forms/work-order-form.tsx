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
import { Loader2, Factory, Package, Calendar, ClipboardList } from "lucide-react";
import { DocumentHeader } from "@/components/ui/document-header";

const getDefaultDate = (): string => new Date().toISOString().split("T")[0] as string;

interface WorkOrderFormData {
  production_item: string;
  qty: number;
  bom_no?: string;
  planned_start_date: string;
}

interface WorkOrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: WorkOrderFormData) => Promise<void>;
  items: Array<{ item_code: string; item_name: string }>;
  boms: Array<{ name: string; item: string; item_name: string }>;
}

export function WorkOrderForm({
  open,
  onOpenChange,
  onSubmit,
  items,
  boms,
}: WorkOrderFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [productionItem, setProductionItem] = React.useState("");
  const [qty, setQty] = React.useState(1);
  const [bomNo, setBomNo] = React.useState("");
  const [plannedStartDate, setPlannedStartDate] = React.useState<string>(getDefaultDate());

  // Filter BOMs for selected item
  const filteredBoms = boms.filter((bom) => bom.item === productionItem);

  React.useEffect(() => {
    if (productionItem && filteredBoms.length > 0 && filteredBoms[0]) {
      setBomNo(filteredBoms[0].name);
    } else {
      setBomNo("");
    }
  }, [productionItem, filteredBoms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productionItem || qty <= 0) return;

    setLoading(true);
    try {
      await onSubmit({
        production_item: productionItem,
        qty,
        bom_no: bomNo || undefined,
        planned_start_date: plannedStartDate,
      });
      onOpenChange(false);
      setProductionItem("");
      setQty(1);
      setBomNo("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          {/* Document Header - OBLIGATOIRE selon CLAUDE.md */}
          <DocumentHeader title="Ordre de Fabrication (WO)" />

          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" />
              Nouvel Ordre de Fabrication
            </DialogTitle>
            <DialogDescription>
              Creez un ordre de fabrication pour lancer la production.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="production_item" className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                Article a fabriquer *
              </Label>
              <Select value={productionItem} onValueChange={setProductionItem}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selectionnez un article" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.item_code} value={item.item_code}>
                      {item.item_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="qty">Quantite a produire *</Label>
                <Input
                  id="qty"
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(parseInt(e.target.value) || 1)}
                  className="rounded-xl"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="planned_start_date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Date de debut
                </Label>
                <Input
                  id="planned_start_date"
                  type="date"
                  value={plannedStartDate}
                  onChange={(e) => setPlannedStartDate(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            {filteredBoms.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="bom_no" className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  Nomenclature (BOM)
                </Label>
                <Select value={bomNo} onValueChange={setBomNo}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selectionnez une nomenclature" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBoms.map((bom) => (
                      <SelectItem key={bom.name} value={bom.name}>
                        {bom.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {productionItem && filteredBoms.length === 0 && (
              <p className="text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-xl">
                Aucune nomenclature trouvee pour cet article. Creez d&apos;abord une nomenclature (BOM).
              </p>
            )}
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
              disabled={loading || !productionItem || qty <= 0}
              className="rounded-xl"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Creer l&apos;ordre
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
