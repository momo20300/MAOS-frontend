"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Database, Upload, Download, RefreshCw, FileText, Calculator } from "lucide-react";
import { ExportDialog } from "@/components/tools/export-dialog";
import { ImportDialog } from "@/components/tools/import-dialog";
import { CalculatorDialog } from "@/components/tools/calculator-dialog";
import { ReportDialog } from "@/components/tools/report-dialog";
import { RenameDialog } from "@/components/tools/rename-dialog";
import { StatsDialog } from "@/components/tools/stats-dialog";

export default function ToolsPage() {
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  const tools = [
    {
      name: "Import de Donnees",
      description: "Importez vos donnees depuis Excel/CSV",
      icon: Upload,
      action: () => setImportOpen(true),
    },
    {
      name: "Export de Donnees",
      description: "Exportez vos donnees vers Excel/CSV",
      icon: Download,
      action: () => setExportOpen(true),
    },
    {
      name: "Renommer Documents",
      description: "Renommez vos documents ERPNext",
      icon: RefreshCw,
      action: () => setRenameOpen(true),
    },
    {
      name: "Rapport Personnalise",
      description: "Generez des rapports personnalises",
      icon: FileText,
      action: () => setReportOpen(true),
    },
    {
      name: "Calculatrice",
      description: "Calcul de marge, TVA et devises",
      icon: Calculator,
      action: () => setCalcOpen(true),
    },
    {
      name: "Console Base de Donnees",
      description: "Statistiques et compteurs ERPNext",
      icon: Database,
      action: () => setStatsOpen(true),
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Outils</h2>
          <p className="text-muted-foreground">Outils utilitaires du systeme connectes a ERPNext</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Card key={tool.name} className="hover:shadow-lg transition-shadow rounded-2xl">
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
              <Button variant="outline" className="w-full rounded-xl" onClick={tool.action}>
                <Wrench className="mr-2 h-4 w-4" />
                Ouvrir
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <CalculatorDialog open={calcOpen} onOpenChange={setCalcOpen} />
      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} />
      <RenameDialog open={renameOpen} onOpenChange={setRenameOpen} />
      <StatsDialog open={statsOpen} onOpenChange={setStatsOpen} />
    </div>
  );
}
