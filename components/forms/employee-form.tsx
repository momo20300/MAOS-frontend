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
import { Loader2, User, Briefcase, Building2, Mail, Phone, Calendar } from "lucide-react";
import { DocumentHeader } from "@/components/ui/document-header";

interface EmployeeFormData {
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  date_of_joining: string;
  designation: string;
  department: string;
  cell_number: string;
  personal_email: string;
}

interface EmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  initialData?: Partial<EmployeeFormData>;
  mode?: "create" | "edit";
}

const genders = ["Male", "Female", "Other"];
const designations = [
  "Manager",
  "Assistant Manager",
  "Sales Executive",
  "Accountant",
  "Developer",
  "Designer",
  "HR Manager",
  "Operations Manager",
  "Intern",
];
const departments = [
  "Sales",
  "Marketing",
  "Finance",
  "Human Resources",
  "IT",
  "Operations",
  "Customer Service",
  "Administration",
];

export function EmployeeForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = "create",
}: EmployeeFormProps) {
  const [loading, setLoading] = React.useState(false);
  const getDefaultDate = () => new Date().toISOString().split("T")[0] as string;

  const [formData, setFormData] = React.useState<EmployeeFormData>({
    first_name: initialData?.first_name ?? "",
    last_name: initialData?.last_name ?? "",
    gender: initialData?.gender ?? "Male",
    date_of_birth: initialData?.date_of_birth ?? "",
    date_of_joining: initialData?.date_of_joining ?? getDefaultDate(),
    designation: initialData?.designation ?? "Sales Executive",
    department: initialData?.department ?? "Sales",
    cell_number: initialData?.cell_number ?? "",
    personal_email: initialData?.personal_email ?? "",
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        first_name: initialData.first_name ?? "",
        last_name: initialData.last_name ?? "",
        gender: initialData.gender ?? "Male",
        date_of_birth: initialData.date_of_birth ?? "",
        date_of_joining: initialData.date_of_joining ?? getDefaultDate(),
        designation: initialData.designation ?? "Sales Executive",
        department: initialData.department ?? "Sales",
        cell_number: initialData.cell_number ?? "",
        personal_email: initialData.personal_email ?? "",
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name.trim()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
      setFormData({
        first_name: "",
        last_name: "",
        gender: "Male",
        date_of_birth: "",
        date_of_joining: getDefaultDate(),
        designation: "Sales Executive",
        department: "Sales",
        cell_number: "",
        personal_email: "",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          {/* Document Header - OBLIGATOIRE selon CLAUDE.md */}
          <DocumentHeader title="Employe (HR-EMP)" />

          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {mode === "create" ? "Nouvel Employe" : "Modifier l'Employe"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Remplissez les informations pour creer un nouvel employe."
                : "Modifiez les informations de l'employe."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first_name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Prenom *
                </Label>
                <Input
                  id="first_name"
                  placeholder="Ex: Ahmed"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, first_name: e.target.value }))
                  }
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="last_name">Nom</Label>
                <Input
                  id="last_name"
                  placeholder="Ex: Benali"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, last_name: e.target.value }))
                  }
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="gender">Genre</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, gender: value }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {genders.map((gender) => (
                      <SelectItem key={gender} value={gender}>
                        {gender === "Male" ? "Homme" : gender === "Female" ? "Femme" : "Autre"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="date_of_birth" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Naissance
                </Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date_of_birth: e.target.value }))
                  }
                  className="rounded-xl"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="date_of_joining">Date embauche</Label>
                <Input
                  id="date_of_joining"
                  type="date"
                  value={formData.date_of_joining}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date_of_joining: e.target.value }))
                  }
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="department" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Departement
                </Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, department: value }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="designation" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  Poste
                </Label>
                <Select
                  value={formData.designation}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, designation: value }))
                  }
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {designations.map((designation) => (
                      <SelectItem key={designation} value={designation}>
                        {designation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="personal_email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email personnel
                </Label>
                <Input
                  id="personal_email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.personal_email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, personal_email: e.target.value }))
                  }
                  className="rounded-xl"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cell_number" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Telephone
                </Label>
                <Input
                  id="cell_number"
                  type="tel"
                  placeholder="+212 6XX XXX XXX"
                  value={formData.cell_number}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, cell_number: e.target.value }))
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
            <Button type="submit" disabled={loading || !formData.first_name.trim()} className="rounded-xl">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Creer l'employe" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
