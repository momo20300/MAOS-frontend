"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, Lightbulb, RefreshCw, ChevronRight } from "lucide-react";
import { getDashboardInsights } from "@/lib/services/erpnext";

interface Alert {
  type: 'STOCK_CRITIQUE' | 'IMPAYE_30J' | 'CLIENT_INACTIF' | 'MARGE_FAIBLE';
  priority: 'HIGH' | 'MEDIUM';
  title: string;
  detail: string;
  suggestedAction: string;
}

interface Opportunity {
  title: string;
  impact: string;
  effort: 'FACILE' | 'MOYEN' | 'COMPLEXE';
  detail: string;
}

interface InsightsData {
  snapshot: {
    todayRevenue: number;
    totalCustomers: number;
    totalProducts: number;
    criticalStockCount: number;
    overdueInvoicesCount: number;
  };
  alerts: Alert[];
  opportunities: Opportunity[];
  generatedAt: string;
}

export function MaosInsights() {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardInsights();
      setInsights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
    // Refresh every 5 minutes
    const interval = setInterval(fetchInsights, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchInsights]);

  if (loading && !insights) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error && !insights) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchInsights} className="mt-2">
            Reessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  const highPriorityAlerts = insights?.alerts.filter(a => a.priority === 'HIGH') || [];
  const mediumPriorityAlerts = insights?.alerts.filter(a => a.priority === 'MEDIUM') || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              MAOS Insights
            </CardTitle>
            <CardDescription>Briefing quotidien et alertes</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchInsights} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* High Priority Alerts */}
        {highPriorityAlerts.length > 0 && (
          <div className="space-y-2">
            {highPriorityAlerts.map((alert, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900"
              >
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-red-900 dark:text-red-100">{alert.title}</span>
                    <Badge variant="destructive" className="text-xs">Urgent</Badge>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-200 mt-1">{alert.detail}</p>
                  <p className="text-xs text-red-600 dark:text-red-300 mt-2 flex items-center gap-1">
                    <ChevronRight className="h-3 w-3" />
                    {alert.suggestedAction}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Medium Priority Alerts */}
        {mediumPriorityAlerts.length > 0 && (
          <div className="space-y-2">
            {mediumPriorityAlerts.map((alert, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900"
              >
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-yellow-900 dark:text-yellow-100">{alert.title}</span>
                  <p className="text-sm text-yellow-700 dark:text-yellow-200 mt-1">{alert.detail}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Opportunities */}
        {insights?.opportunities && insights.opportunities.length > 0 && (
          <div className="space-y-2">
            {insights.opportunities.slice(0, 2).map((opp, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900"
              >
                <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-green-900 dark:text-green-100">{opp.title}</span>
                    <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                      {opp.effort}
                    </Badge>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-200 mt-1">{opp.impact}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {(!insights?.alerts || insights.alerts.length === 0) &&
         (!insights?.opportunities || insights.opportunities.length === 0) && (
          <div className="text-center py-4 text-muted-foreground">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune alerte ou opportunite detectee</p>
          </div>
        )}

        {/* Last Update */}
        {insights?.generatedAt && (
          <p className="text-xs text-muted-foreground text-right">
            Mis a jour: {new Date(insights.generatedAt).toLocaleTimeString('fr-FR')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
