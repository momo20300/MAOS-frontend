"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getHrDashboard, HrDashboardData } from "@/lib/services/erpnext";
import {
  Users, UserCheck, UserX, UserPlus,
  AlertTriangle, RefreshCw, BarChart3, Building2,
  ArrowRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#6bbc8e", "#4f9cf7", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export default function HrDashboardPage() {
  const [data, setData] = useState<HrDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    setError(null);
    try {
      const result = await getHrDashboard();
      if (result) {
        setData(result);
      } else {
        setError("Impossible de charger les donnees RH");
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
          <p className="text-lg text-muted-foreground">Chargement des donnees RH...</p>
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

  const { kpis, departments, genderDistribution, designations, statusDistribution, monthlyJoining, employeeList } = data;
  const retentionRate = kpis.totalEmployees > 0
    ? Math.round((kpis.activeEmployees / kpis.totalEmployees) * 100)
    : 0;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ressources Humaines</h2>
          <p className="text-muted-foreground">
            Tableau de bord RH
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/employees">
            <Button variant="outline" className="rounded-xl">
              <Users className="mr-2 h-4 w-4" />
              Employes
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/employees">
          <Card className="rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Employes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.totalEmployees}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.departmentCount} departement(s)
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/employees">
          <Card className="rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Actifs</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success-400">{kpis.activeEmployees}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Retention: {retentionRate}%
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/employees">
          <Card className="rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Departs</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpis.leftEmployees > 0 ? "text-danger-400" : ""}`}>
                {kpis.leftEmployees}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Employe(s) ayant quitte
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/employees">
          <Card className="rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Recrutements</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{kpis.newHires}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Nouveaux cette annee
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts Row 1: Departments + Gender */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Repartition par Departement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full" style={{ minWidth: 0 }}>
              {departments.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={departments} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" width={80} />
                    <Tooltip />
                    <Bar dataKey="count" name="Employes" fill="#4f9cf7" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucun departement
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Repartition par Genre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full" style={{ minWidth: 0 }}>
              {genderDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={genderDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="count"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {genderDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucune donnee
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Designations + Monthly Joining */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Top Postes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full" style={{ minWidth: 0 }}>
              {designations.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={designations} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" width={100} />
                    <Tooltip />
                    <Bar dataKey="count" name="Employes" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucune designation
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="h-4 w-4" />
              Recrutements Mensuels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full" style={{ minWidth: 0 }}>
              {monthlyJoining.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={monthlyJoining} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <Tooltip />
                    <Bar dataKey="count" name="Recrutements" fill="#6bbc8e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Aucun recrutement cette annee
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      {statusDistribution.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          {statusDistribution.map((s) => (
            <Card key={s.status} className="rounded-2xl">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{s.status}</p>
                  <p className="text-xl font-bold">{s.count}</p>
                </div>
                <Badge
                  variant={s.status === "Active" ? "default" : "secondary"}
                  className={`rounded-lg ${s.status === "Active" ? "bg-success-400" : s.status === "Left" ? "bg-danger-400 text-white" : ""}`}
                >
                  {s.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Employee List */}
      {employeeList.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employes Actifs
              </CardTitle>
              <Link href="/employees">
                <Button variant="ghost" size="sm" className="text-xs">
                  Voir tout <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 px-3 font-medium">ID</th>
                    <th className="text-left py-2 px-3 font-medium">Nom</th>
                    <th className="text-left py-2 px-3 font-medium">Poste</th>
                    <th className="text-left py-2 px-3 font-medium">Departement</th>
                    <th className="text-left py-2 px-3 font-medium">Genre</th>
                    <th className="text-left py-2 px-3 font-medium">Date Embauche</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeList.map((emp) => (
                    <Link href="/employees" key={emp.name} className="contents">
                      <tr className="border-b hover:bg-muted/50 transition-colors cursor-pointer">
                        <td className="py-2 px-3 font-mono text-xs">{emp.name}</td>
                        <td className="py-2 px-3 font-semibold">{emp.employee_name}</td>
                        <td className="py-2 px-3">{emp.designation || "—"}</td>
                        <td className="py-2 px-3">{emp.department || "—"}</td>
                        <td className="py-2 px-3">{emp.gender || "—"}</td>
                        <td className="py-2 px-3">
                          {emp.date_of_joining
                            ? new Date(emp.date_of_joining).toLocaleDateString("fr-FR")
                            : "—"}
                        </td>
                      </tr>
                    </Link>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
