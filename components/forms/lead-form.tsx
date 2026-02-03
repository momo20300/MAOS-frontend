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
import { Loader2, UserPlus, Building2, Mail, Phone, Target } from "lucide-react";
import { DocumentHeader } from "@/components/ui/document-header";

interface LeadFormData {
  lead_name: string;
  company_name: string;
  email_id: string;
  mobile_no: string;
  source: string;
  status: string;
}

interface LeadFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: LeadFormData) => Promise<void>;
  initialData?: Partial<LeadFormData>;
  mode?: "create" | "edit";
}

const leadSources = [
  "Website",
  "Reference",
  "Cold Calling",
  "Exhibition",
  "Social Media",
  "Campaign",
  "Walk In",
];

const leadStatuses = [
  "Lead",
  "Open",
  "Replied",
  "Opportunity",
  "Quotation",
  "Lost Quotation",
  "Interested",
  "Converted",
  "Do Not Contact",
];

export function LeadForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = "create",
}: LeadFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<LeadFormData>({
    lead_name: initialData?.lead_name || "",
    company_name: initialData?.company_name || "",
    email_id: initialData?.email_id || "",
    mobile_no: initialData?.mobile_no || "",
    source: initialData?.source || "Website",
    status: initialData?.status || "Lead",
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        lead_name: initialData.lead_name || "",
        company_name: initialData.company_name || "",
        email_id: initialData.email_id || "",
        mobile_no: initialData.mobile_no || "",
        source: initialData.source || "Website",
        status: initialData.status || "Lead",
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lead_name.trim()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
      setFormData({
        lead_name: "",
        company_name: "",
        email_id: "",
        mobile_no: "",
        source: "Website",
        status: "Lead",
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
            <DocumentHeader title="Lead (CRM)" />
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {mode === "create" ? "Nouveau Lead" : "Modifier le Lead"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Remplissez les informations pour creer un nouveau lead."
                : "Modifiez les informations du lead."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="lead_name" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                Nom du contact *
              </Label>
              <Input
                id="lead_name"
                placeholder="Ex: Ahmed Benali"
                value={formData.lead_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, lead_name: e.target.value }))
                }
                required
                className="rounded-xl"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="company_name" className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Entreprise
              </Label>
              <Input
                id="company_name"
                placeholder="Ex: Tech Solutions SARL"
                value={formData.company_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, company_name: e.target.value }))
                }
                className="rounded-xl"
              />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="source" className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  Source
                </Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, source: value }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {leadSources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {leadStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <Button type="submit" disabled={loading || !formData.lead_name.trim()} className="rounded-xl">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Creer le lead" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
