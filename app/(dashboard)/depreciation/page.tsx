"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingDown, Plus, Calendar, DollarSign } from "lucide-react";

interface DepreciationSchedule {
  name: string;
  asset_name: string;
  depreciation_amount: number;
  schedule_date: string;
  status: string;
}

export default function DepreciationPage() {
  const [schedules, setSchedules] = useState<DepreciationSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await fetch('/api/finance/depreciation-schedules');
        if (response.ok) {
          const data = await response.json();
          setSchedules(data.data || []);
        }
      } catch (error) {
        console.error('Erreur chargement amortissements:', error);
      }
      setLoading(false);
    };
    fetchSchedules();
  }, []);

  const totalDepreciation = schedules.reduce((sum, s) => sum + (s.depreciation_amount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-lg">Chargement des amortissements...</div>
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
          <h2 className="text-3xl font-bold tracking-tight">Amortissements</h2>
          <p className="text-muted-foreground">Gérez les amortissements de vos actifs ({schedules.length} écritures)</p>
        </div>
        <Button onClick={() => showToast("Fonctionnalite disponible prochainement", "success")}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel Amortissement
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Écritures</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedules.length}</div>
            <p className="text-xs text-muted-foreground">Écritures d&apos;amortissement</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDepreciation.toLocaleString()} MAD</div>
            <p className="text-xs text-muted-foreground">Amortissements cumulés</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Écritures d&apos;amortissement</CardTitle>
        </CardHeader>
        <CardContent>
          {schedules.length > 0 ? (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div
                  key={schedule.name}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1 flex-1">
                    <span className="font-semibold">{schedule.asset_name}</span>
                    <div className="text-xs text-muted-foreground">
                      Date: {new Date(schedule.schedule_date).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <div className="text-lg font-bold">{schedule.depreciation_amount?.toLocaleString()} MAD</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <TrendingDown className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Aucun amortissement</h3>
              <p className="text-muted-foreground">Créez votre première écriture d&apos;amortissement</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
