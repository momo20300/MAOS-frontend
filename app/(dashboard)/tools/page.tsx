"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Database, Upload, Download, RefreshCw, FileText, Calculator } from "lucide-react";

export default function ToolsPage() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const tools = [
    {
      name: "Import de Données",
      description: "Importez vos données depuis Excel/CSV",
      icon: Upload,
      action: () => showToast("Fonctionnalite disponible prochainement", "success"),
    },
    {
      name: "Export de Données",
      description: "Exportez vos données vers Excel/CSV",
      icon: Download,
      action: () => showToast("Fonctionnalite disponible prochainement", "success"),
    },
    {
      name: "Renommer Documents",
      description: "Renommez en masse vos documents",
      icon: RefreshCw,
      action: () => showToast("Fonctionnalite disponible prochainement", "success"),
    },
    {
      name: "Rapport Personnalisé",
      description: "Créez des rapports personnalisés",
      icon: FileText,
      action: () => showToast("Fonctionnalite disponible prochainement", "success"),
    },
    {
      name: "Calculatrice",
      description: "Outils de calcul",
      icon: Calculator,
      action: () => showToast("Fonctionnalite disponible prochainement", "success"),
    },
    {
      name: "Console Base de Données",
      description: "Requêtes SQL directes",
      icon: Database,
      action: () => showToast("Fonctionnalite disponible prochainement", "success"),
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          toast.type === "success" ? "bg-success-400" : "bg-danger-400"
        } text-white`}>
          {toast.message}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Outils</h2>
          <p className="text-muted-foreground">Outils utilitaires du système</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Card key={tool.name} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <tool.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{tool.name}</CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={tool.action}>
                <Wrench className="mr-2 h-4 w-4" />
                Ouvrir
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
