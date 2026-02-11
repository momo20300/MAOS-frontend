"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProjectsDashboard, ProjectsDashboardData } from "@/lib/services/erpnext";
import {
  FolderKanban, CheckCircle, Clock, AlertTriangle,
  RefreshCw, BarChart3, ClipboardList, ArrowRight,
  ListTodo,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#6bbc8e", "#4f9cf7", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

const STATUS_COLORS: Record<string, string> = {
  "Open": "bg-blue-500 text-white",
  "Completed": "bg-success-400",
  "Cancelled": "bg-red-300",
  "Overdue": "bg-danger-400 text-white",
};

const PRIORITY_COLORS: Record<string, string> = {
  "High": "text-danger-400",
  "Medium": "text-yellow-500",
  "Low": "text-blue-500",
};

export default function ProjectsDashboardPage() {
  const [data, setData] = useState<ProjectsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    setError(null);
    try {
      const result = await getProjectsDashboard();
      if (result) {
        setData(result);
      } else {
        setError("Impossible de charger les donnees des projets");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Chargement des projets...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
          <p className="text-lg">{error || "Donnees indisponibles"}</p>
          <Button onClick={() => fetchData(true)}>Reessayer</Button>
        </div>
      </div>
    );
  }

  const { kpis, projectStatusDistribution, taskStatusDistribution, priorityDistribution, projectTypes, topProjectsByTasks, projectList } = data;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projets</h2>
          <p className="text-muted-foreground">
            Tableau de bord projets
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/projects">
            <Button variant="outline" className="rounded-xl">
              <FolderKanban className="mr-2 h-4 w-4" />
              Projets
            </Button>
          </Link>
          <Link href="/tasks">
            <Button variant="outline" className="rounded-xl">
              <ClipboardList className="mr-2 h-4 w-4" />
              Taches
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Projets</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.openProjects} en cours, {kpis.completedProjects} termines
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completion Moyenne</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${kpis.avgCompletion >= 70 ? "text-success-400" : kpis.avgCompletion >= 40 ? "text-yellow-500" : "text-blue-500"}`}>
              {kpis.avgCompletion}%
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full ${kpis.avgCompletion >= 70 ? "bg-success-400" : kpis.avgCompletion >= 40 ? "bg-yellow-500" : "bg-blue-500"}`}
                style={{ width: `${kpis.avgCompletion}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taches</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.openTasks} ouvertes, {kpis.workingTasks} en cours
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En Retard</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${kpis.overdueProjects > 0 ? "text-danger-400" : "text-success-400"}`}>
              {kpis.overdueProjects}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Projet(s) en retard
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Row */}
      {(kpis.totalEstimated > 0 || kpis.totalActual > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-2xl border-l-4 border-l-blue-500">
            <CardContent className="flex items-center gap-4 py-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Budget Estime</p>
                <p className="text-xl font-bold">{kpis.totalEstimated.toLocaleString("fr-FR")} MAD</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-l-4 border-l-orange-500">
            <CardContent className="flex items-center gap-4 py-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cout Reel</p>
                <p className="text-xl font-bold">{kpis.totalActual.toLocaleString("fr-FR")} MAD</p>
                {kpis.totalEstimated > 0 && (
                  <p className={`text-xs ${kpis.totalActual > kpis.totalEstimated ? "text-danger-400" : "text-success-400"}`}>
                    {kpis.totalActual > kpis.totalEstimated ? "Depassement" : "Sous budget"}: {Math.abs(Math.round(((kpis.totalActual - kpis.totalEstimated) / kpis.totalEstimated) * 100))}%
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row 1: Project Status + Task Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderKanban className="h-4 w-4" />
              Statuts des Projets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full" style={{ minWidth: 0 }}>
              {projectStatusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={projectStatusDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="count"
                      nameKey="status"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {projectStatusDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucun projet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ListTodo className="h-4 w-4" />
              Statuts des Taches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full" style={{ minWidth: 0 }}>
              {taskStatusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={taskStatusDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="count"
                      nameKey="status"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {taskStatusDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucune tache
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Priority + Project Types */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Priorites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full" style={{ minWidth: 0 }}>
              {priorityDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={priorityDistribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <Tooltip />
                    <Bar dataKey="count" name="Projets" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucune donnee
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {projectTypes.length > 0 && (
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <FolderKanban className="h-4 w-4" />
                Types de Projets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full" style={{ minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={projectTypes} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" width={80} />
                    <Tooltip />
                    <Bar dataKey="count" name="Projets" fill="#4f9cf7" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Projects by Tasks */}
      {topProjectsByTasks.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Projets par Volume de Taches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full" style={{ minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={topProjectsByTasks} layout="vertical" margin={{ top: 5, right: 20, left: 120, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} className="text-muted-foreground" width={120} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" name="Total" fill="#4f9cf7" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="completed" name="Terminees" fill="#6bbc8e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project List */}
      {projectList.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                Projets Actifs
              </CardTitle>
              <Link href="/projects">
                <Button variant="ghost" size="sm" className="text-xs">
                  Voir tout <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {projectList.map((project) => (
                <div
                  key={project.name}
                  className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{project.project_name || project.name}</span>
                      <Badge
                        className={`rounded-lg text-xs ${STATUS_COLORS[project.status] || "bg-gray-400"}`}
                      >
                        {project.status}
                      </Badge>
                      {project.priority && (
                        <span className={`text-xs font-medium ${PRIORITY_COLORS[project.priority] || ""}`}>
                          {project.priority}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{project.name}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <div className="text-sm font-bold">{project.percent_complete}%</div>
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            project.percent_complete >= 80
                              ? "bg-success-400"
                              : project.percent_complete >= 40
                                ? "bg-yellow-500"
                                : "bg-blue-500"
                          }`}
                          style={{ width: `${project.percent_complete}%` }}
                        />
                      </div>
                    </div>
                    {project.expected_end_date && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(project.expected_end_date).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
