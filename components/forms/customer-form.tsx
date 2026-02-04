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
import { Loader2, User, Building2, Mail, Phone, MapPin } from "lucide-react";
import { DocumentHeader } from "@/components/ui/document-header";

interface CustomerFormData {
  customer_name: string;
  customer_type: "Company" | "Individual";
  customer_group: string;
  territory: string;
  mobile_no: string;
  email_id: string;
}

interface CustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  initialData?: Partial<CustomerFormData>;
  mode?: "create" | "edit";
}

const customerGroups = [
  "Commercial",
  "Individual",
  "Non Profit",
  "Government",
];

const territories = [
  "Morocco",
  "Casablanca",
  "Rabat",
  "Marrakech",
  "Fes",
  "Tangier",
  "Agadir",
  "All Territories",
];

export function CustomerForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = "create",
}: CustomerFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<CustomerFormData>({
    customer_name: initialData?.customer_name || "",
    customer_type: initialData?.customer_type || "Company",
    customer_group: initialData?.customer_group || "Commercial",
    territory: initialData?.territory || "Morocco",
    mobile_no: initialData?.mobile_no || "",
    email_id: initialData?.email_id || "",
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        customer_name: initialData.customer_name || "",
        customer_type: initialData.customer_type || "Company",
        customer_group: initialData.customer_group || "Commercial",
        territory: initialData.territory || "Morocco",
        mobile_no: initialData.mobile_no || "",
        email_id: initialData.email_id || "",
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name.trim()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
      setFormData({
        customer_name: "",
        customer_type: "Company",
        customer_group: "Commercial",
        territory: "Morocco",
        mobile_no: "",
        email_id: "",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          {/* Document Header - OBLIGATOIRE selon CLAUDE.md */}
          <DocumentHeader title="Client (CUST)" />

          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {mode === "create" ? "Nouveau Client" : "Modifier le Client"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Remplissez les informations pour creer un nouveau client."
                : "Modifiez les informations du client."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customer_name" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Nom du client *
              </Label>
              <Input
                id="customer_name"
                placeholder="Ex: Societe Atlas SARL"
                value={formData.customer_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, customer_name: e.target.value }))
                }
                required
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="customer_type" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Type
                </Label>
                <Select
                  value={formData.customer_type}
                  onValueChange={(value: "Company" | "Individual") =>
                    setFormData((prev) => ({ ...prev, customer_type: value }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Company">Entreprise</SelectItem>
                    <SelectItem value="Individual">Particulier</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="customer_group" className="flex items-center gap-2">
                  Groupe
                </Label>
                <Select
                  value={formData.customer_group}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, customer_group: value }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {customerGroups.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="territory" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Territoire
              </Label>
              <Select
                value={formData.territory}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, territory: value }))
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {territories.map((territory) => (
                    <SelectItem key={territory} value={territory}>
                      {territory}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email_id" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="email_id"
                  type="email"
                  placeholder="contact@example.com"
                  value={formData.email_id}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email_id: e.target.value }))
                  }
                  className="rounded-xl"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="mobile_no" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Telephone
                </Label>
                <Input
                  id="mobile_no"
                  type="tel"
                  placeholder="+212 6XX XXX XXX"
                  value={formData.mobile_no}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, mobile_no: e.target.value }))
                  }
                  className="rounded-xl"
                />
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
            <Button type="submit" disabled={loading || !formData.customer_name.trim()} className="rounded-xl">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Creer le client" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
