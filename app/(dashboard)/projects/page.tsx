"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderKanban, Plus, Clock, CheckCircle, Download, Printer, FileSpreadsheet, Eye } from "lucide-react";

interface Project {
  name: string;
  project_name: string;
  status: string;
  percent_complete: number;
  expected_end_date: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "completed">("all");

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(data.data || []);
        }
      } catch (error) {
        console.error('Erreur chargement projets:', error);
      }
      setLoading(false);
    };
    fetchProjects();
  }, []);

  const activeCount = projects.filter(p => p.status === 'Open').length;
  const completedCount = projects.filter(p => p.status === 'Completed').length;

  const filteredProjects = projects.filter(p => {
    if (statusFilter === "all") return true;
    if (statusFilter === "open") return p.status === "Open";
    if (statusFilter === "completed") return p.status === "Completed";
    return true;
  });

  const handleExportCSV = () => {
    if (filteredProjects.length === 0) {
      showToast("Aucune donnee a exporter", "error");
      return;
    }
    const headers = ["Reference", "Nom Projet", "Statut", "Progression", "Date Fin Prevue"];
    const csvContent = [
      headers.join(","),
      ...filteredProjects.map(p => [
        p.name,
        `"${p.project_name}"`,
        p.status,
        `${p.percent_complete || 0}%`,
        p.expected_end_date
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `projets_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast("Export CSV telecharge avec succes", "success");
  };

  const handlePrint = () => {
    window.print();
    showToast("Impression lancee", "success");
  };

  const handleViewProject = (projectName: string) => {
    showToast(`Details de ${projectName} - Fonctionnalite disponible prochainement`, "success");
  };

  const handleUpdateProgress = (projectName: string) => {
    showToast(`Mise a jour progression de ${projectName} - Fonctionnalite disponible prochainement`, "success");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-lg">Chargement des projets...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg transition-all duration-300 ${
          toast.type === "success"
            ? "bg-green-500 text-white"
            : "bg-red-500 text-white"
        }`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projets</h2>
          <p className="text-muted-foreground">Gerez vos projets ({projects.length} projets)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} className="rounded-xl">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handlePrint} className="rounded-xl">
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>
          <Button onClick={() => showToast("Fonctionnalite disponible prochainement", "success")} className="rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau Projet
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Projets</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En Cours</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Termines</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Liste des projets</CardTitle>
          <div className="flex gap-2">
            <div className="flex gap-1 bg-muted p-1 rounded-xl">
              <Button
                variant={statusFilter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="rounded-xl"
              >
                Tous
              </Button>
              <Button
                variant={statusFilter === "open" ? "default" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("open")}
                className="rounded-xl"
              >
                En Cours
              </Button>
              <Button
                variant={statusFilter === "completed" ? "default" : "ghost"}
                size="sm"
                onClick={() => setStatusFilter("completed")}
                className="rounded-xl"
              >
                Termines
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => showToast("Fonctionnalite disponible prochainement", "success")} className="rounded-xl">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredProjects.map((project) => (
              <div
                key={project.name}
                className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{project.project_name}</span>
                    <Badge
                      variant={project.status === 'Completed' ? 'default' : 'secondary'}
                      className="rounded-xl"
                    >
                      {project.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{project.name}</div>
                  {project.expected_end_date && (
                    <div className="text-xs text-muted-foreground">
                      Echeance: {new Date(project.expected_end_date).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <div className="text-lg font-bold">{project.percent_complete || 0}%</div>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          project.percent_complete === 100
                            ? 'bg-green-500'
                            : project.percent_complete >= 50
                              ? 'bg-yellow-500'
                              : 'bg-blue-500'
                        }`}
                        style={{ width: `${project.percent_complete || 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewProject(project.name)}
                      className="rounded-xl"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {project.status !== 'Completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateProgress(project.name)}
                        className="rounded-xl"
                      >
                        Mettre a jour
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Aucun projet</h3>
          <p className="text-muted-foreground">
            {statusFilter === "all"
              ? "Creez votre premier projet"
              : statusFilter === "open"
                ? "Aucun projet en cours"
                : "Aucun projet termine"
            }
          </p>
        </div>
      )}
    </div>
  );
}
