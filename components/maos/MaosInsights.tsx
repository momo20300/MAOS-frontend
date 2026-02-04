"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDashboardInsights, DashboardInsights, InsightAlert, InsightOpportunity } from "@/lib/services/api";
import {
  AlertCircle,
  TrendingUp,
  Package,
  Users,
  FileText,
  RefreshCw,
  Lightbulb,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MaosInsightsProps {
  className?: string;
  showRefresh?: boolean;
}

export default function MaosInsights({ className, showRefresh = true }: MaosInsightsProps) {
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchInsights = useCallback(async (silent = false) => {
    if (!silent) {
      setIsRefreshing(true);
    }
    try {
      const data = await getDashboardInsights();
      setInsights(data);
    } catch (error) {
      console.error("Insights fetch error:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
    // Refresh every 5 minutes
    const interval = setInterval(() => fetchInsights(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchInsights]);

  const getAlertIcon = (type: InsightAlert["type"]) => {
    switch (type) {
      case "STOCK_CRITIQUE":
        return <Package className="h-4 w-4" />;
      case "IMPAYE_30J":
        return <FileText className="h-4 w-4" />;
      case "CLIENT_INACTIF":
        return <Users className="h-4 w-4" />;
      case "MARGE_FAIBLE":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getAlertStyle = (priority: InsightAlert["priority"]) => {
    if (priority === "HIGH") {
      return "bg-danger-50 dark:bg-red-950/20 border-danger-100 dark:border-danger-900";
    }
    return "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900";
  };

  const getEffortBadge = (effort: InsightOpportunity["effort"]) => {
    switch (effort) {
      case "FACILE":
        return <Badge variant="outline" className="text-xs text-success-400 border-success-200">FACILE</Badge>;
      case "MOYEN":
        return <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">MOYEN</Badge>;
      case "COMPLEXE":
        return <Badge variant="outline" className="text-xs text-purple-600 border-purple-300">COMPLEXE</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            MAOS Insights
          </CardTitle>
          <CardDescription>Chargement du briefing...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              MAOS Insights
            </CardTitle>
            <CardDescription>Briefing quotidien et alertes</CardDescription>
          </div>
          {showRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchInsights()}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Snapshot rapide */}
        {insights?.snapshot && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <DollarSign className="h-4 w-4 mx-auto text-success-400 mb-1" />
              <p className="text-lg font-bold text-success-400">
                {(insights.snapshot.todayRevenue || 0).toLocaleString()} MAD
              </p>
              <p className="text-xs text-muted-foreground">CA du jour</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <Users className="h-4 w-4 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold text-primary">
                {insights.snapshot.totalCustomers || 0}
              </p>
              <p className="text-xs text-muted-foreground">Clients</p>
            </div>
          </div>
        )}

        {/* Alertes */}
        {insights?.alerts && insights.alerts.length > 0 && (
          <>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              Alertes ({insights.alerts.length})
            </div>
            {insights.alerts.map((alert, index) => (
              <div
                key={index}
                className={cn(
                  "p-3 rounded-lg border",
                  getAlertStyle(alert.priority)
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm flex items-center gap-2">
                    {getAlertIcon(alert.type)}
                    {alert.title}
                  </span>
                  <Badge variant={alert.priority === "HIGH" ? "destructive" : "secondary"} className="text-xs">
                    {alert.priority === "HIGH" ? "Urgent" : "Attention"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{alert.detail}</p>
                <p className="text-xs font-medium text-primary">{alert.suggestedAction}</p>
              </div>
            ))}
          </>
        )}

        {/* Opportunites */}
        {insights?.opportunities && insights.opportunities.length > 0 && (
          <>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mt-4">
              <TrendingUp className="h-4 w-4" />
              Opportunites ({insights.opportunities.length})
            </div>
            {insights.opportunities.map((opp, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-success-50 dark:bg-green-950/20 border border-success-100 dark:border-success-900"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-green-900 dark:text-green-100">
                    {opp.title}
                  </span>
                  {getEffortBadge(opp.effort)}
                </div>
                <p className="text-sm text-success-500 dark:text-success-100">{opp.impact}</p>
                <p className="text-xs text-muted-foreground mt-1">{opp.detail}</p>
              </div>
            ))}
          </>
        )}

        {/* Etat vide */}
        {(!insights?.alerts || insights.alerts.length === 0) &&
          (!insights?.opportunities || insights.opportunities.length === 0) && (
            <div className="text-center py-4 text-muted-foreground">
              <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune alerte ou opportunite</p>
              <p className="text-xs mt-1">MAOS analyse vos donnees en continu</p>
            </div>
          )}

        {/* Timestamp */}
        {insights?.generatedAt && (
          <p className="text-xs text-muted-foreground text-right pt-2 border-t">
            Actualise {new Date(insights.generatedAt).toLocaleTimeString("fr-FR")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
