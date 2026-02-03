"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2, Package, Tag, DollarSign } from "lucide-react";
import { DocumentHeader } from "@/components/ui/document-header";

interface ProductFormData {
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  standard_rate: number;
  is_stock_item: boolean;
  description: string;
}

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
  initialData?: Partial<ProductFormData>;
  mode?: "create" | "edit";
}

const itemGroups = [
  "Products",
  "Raw Materials",
  "Services",
  "Consumable",
  "Sub Assemblies",
  "All Item Groups",
];

const stockUnits = ["Unit", "Kg", "Litre", "Metre", "Box", "Piece", "Nos"];

export function ProductForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = "create",
}: ProductFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<ProductFormData>({
    item_code: initialData?.item_code || "",
    item_name: initialData?.item_name || "",
    item_group: initialData?.item_group || "Products",
    stock_uom: initialData?.stock_uom || "Unit",
    standard_rate: initialData?.standard_rate || 0,
    is_stock_item: initialData?.is_stock_item ?? true,
    description: initialData?.description || "",
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        item_code: initialData.item_code || "",
        item_name: initialData.item_name || "",
        item_group: initialData.item_group || "Products",
        stock_uom: initialData.stock_uom || "Unit",
        standard_rate: initialData.standard_rate || 0,
        is_stock_item: initialData.is_stock_item ?? true,
        description: initialData.description || "",
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item_code.trim() || !formData.item_name.trim()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
      setFormData({
        item_code: "",
        item_name: "",
        item_group: "Products",
        stock_uom: "Unit",
        standard_rate: 0,
        is_stock_item: true,
        description: "",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DocumentHeader title="Produit (ITEM)" />
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {mode === "create" ? "Nouveau Produit" : "Modifier le Produit"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Remplissez les informations pour creer un nouveau produit."
                : "Modifiez les informations du produit."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="item_code" className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  Code article *
                </Label>
                <Input
                  id="item_code"
                  placeholder="Ex: PROD-001"
                  value={formData.item_code}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, item_code: e.target.value }))
                  }
                  required
                  disabled={mode === "edit"}
                  className="rounded-xl"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="item_name" className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  Nom du produit *
                </Label>
                <Input
                  id="item_name"
                  placeholder="Ex: Huile d'olive Bio"
                  value={formData.item_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, item_name: e.target.value }))
                  }
                  required
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="item_group">Categorie</Label>
                <Select
                  value={formData.item_group}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, item_group: value }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {itemGroups.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="stock_uom">Unite de mesure</Label>
                <Select
                  value={formData.stock_uom}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, stock_uom: value }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stockUnits.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="standard_rate" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Prix de vente (MAD)
                </Label>
                <Input
                  id="standard_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.standard_rate || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      standard_rate: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="rounded-xl"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="is_stock_item">Article de stock</Label>
                <Select
                  value={formData.is_stock_item ? "yes" : "no"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, is_stock_item: value === "yes" }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Oui - Maintenir le stock</SelectItem>
                    <SelectItem value="no">Non - Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description du produit..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                className="rounded-xl min-h-[80px]"
              />
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
              disabled={loading || !formData.item_code.trim() || !formData.item_name.trim()}
              className="rounded-xl"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Creer le produit" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
