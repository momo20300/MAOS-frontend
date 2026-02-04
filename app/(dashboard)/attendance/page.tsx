"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Plus, CheckCircle, XCircle } from "lucide-react";

interface Attendance {
  name: string;
  employee_name: string;
  attendance_date: string;
  status: string;
}

export default function AttendancePage() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchAttendances = async () => {
      try {
        const response = await fetch('/api/hr/attendances');
        if (response.ok) {
          const data = await response.json();
          setAttendances(data.data || []);
        }
      } catch (error) {
        console.error('Erreur chargement présences:', error);
      }
      setLoading(false);
    };
    fetchAttendances();
  }, []);

  const presentCount = attendances.filter(a => a.status === 'Present').length;
  const absentCount = attendances.filter(a => a.status === 'Absent').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-lg">Chargement des présences...</div>
      </div>
    );
  }

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
          <h2 className="text-3xl font-bold tracking-tight">Présences</h2>
          <p className="text-muted-foreground">Suivez les présences des employés ({attendances.length} entrées)</p>
        </div>
        <Button onClick={() => showToast("Fonctionnalite disponible prochainement", "success")}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle Présence
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Pointages</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendances.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Présents</CardTitle>
            <CheckCircle className="h-4 w-4 text-success-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success-400">{presentCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Absents</CardTitle>
            <XCircle className="h-4 w-4 text-danger-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger-400">{absentCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des présences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {attendances.slice(0, 20).map((attendance) => (
              <div
                key={attendance.name}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium">{attendance.employee_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(attendance.attendance_date).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <Badge variant={attendance.status === 'Present' ? 'default' : 'destructive'}>{attendance.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {attendances.length === 0 && (
        <div className="text-center py-12">
          <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Aucun pointage</h3>
          <p className="text-muted-foreground">Commencez à enregistrer les présences</p>
        </div>
      )}
    </div>
  );
}
