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
import { Loader2, Building2, Globe, Tag } from "lucide-react";
import { DocumentHeader } from "@/components/ui/document-header";

interface SupplierFormData {
  supplier_name: string;
  supplier_type: string;
  supplier_group: string;
  country: string;
}

interface SupplierFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SupplierFormData) => Promise<void>;
  initialData?: Partial<SupplierFormData>;
  mode?: "create" | "edit";
}

const supplierTypes = ["Company", "Individual"];
const supplierGroups = ["Raw Material", "Services", "Hardware", "Distributor", "Local"];
const countries = [
  "Morocco",
  "France",
  "Spain",
  "Germany",
  "United States",
  "China",
  "Turkey",
  "United Arab Emirates",
];

export function SupplierForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = "create",
}: SupplierFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<SupplierFormData>({
    supplier_name: initialData?.supplier_name || "",
    supplier_type: initialData?.supplier_type || "Company",
    supplier_group: initialData?.supplier_group || "Raw Material",
    country: initialData?.country || "Morocco",
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        supplier_name: initialData.supplier_name || "",
        supplier_type: initialData.supplier_type || "Company",
        supplier_group: initialData.supplier_group || "Raw Material",
        country: initialData.country || "Morocco",
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplier_name.trim()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
      setFormData({
        supplier_name: "",
        supplier_type: "Company",
        supplier_group: "Raw Material",
        country: "Morocco",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DocumentHeader title="Fournisseur (SUP)" />
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {mode === "create" ? "Nouveau Fournisseur" : "Modifier le Fournisseur"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Remplissez les informations pour creer un nouveau fournisseur."
                : "Modifiez les informations du fournisseur."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="supplier_name" className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Nom du fournisseur *
              </Label>
              <Input
                id="supplier_name"
                placeholder="Ex: Fournisseur Import SARL"
                value={formData.supplier_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, supplier_name: e.target.value }))
                }
                required
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="supplier_type" className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  Type
                </Label>
                <Select
                  value={formData.supplier_type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, supplier_type: value }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {supplierTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type === "Company" ? "Entreprise" : "Individuel"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="supplier_group">Groupe</Label>
                <Select
                  value={formData.supplier_group}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, supplier_group: value }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {supplierGroups.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="country" className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Pays
              </Label>
              <Select
                value={formData.country}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, country: value }))
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Button type="submit" disabled={loading || !formData.supplier_name.trim()} className="rounded-xl">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Creer le fournisseur" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
