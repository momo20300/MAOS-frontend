"use client";

import { Badge } from "@/components/ui/badge";
import { FileText, Clock } from "lucide-react";

interface DocumentHeaderProps {
  title: string;
  docname?: string | null;
  status?: string;
  createdAt?: string;
}

const statusStyles: Record<string, string> = {
  "Brouillon": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Draft": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Valide": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-success-300",
  "Validated": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-success-300",
  "Submitted": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-success-300",
  "Open": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "Active": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-success-300",
  "Actif": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-success-300",
  "Annule": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-danger-300",
  "Cancelled": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-danger-300",
  "En cours": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "In Progress": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "Not Started": "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  "Completed": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-success-300",
  "Termine": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-success-300",
  "Pending": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  "En attente": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  "Paid": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-success-300",
  "Paye": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-success-300",
  "Unpaid": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-danger-300",
  "Impaye": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-danger-300",
  "Overdue": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-danger-300",
  "En retard": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-danger-300",
};

function getStatusStyle(status: string): string {
  return statusStyles[status] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function DocumentHeader({
  title,
  docname,
  status,
  createdAt,
}: DocumentHeaderProps) {
  const isNew = !docname;

  return (
    <div className="w-full rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
            {isNew ? (
              <p className="font-mono text-sm font-medium text-primary">
                Nouveau — N° attribue a la validation
              </p>
            ) : (
              <p className="font-mono text-base font-bold text-foreground">
                {docname}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isNew ? (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
              Nouveau
            </Badge>
          ) : status && (
            <Badge variant="secondary" className={getStatusStyle(status)}>
              {status}
            </Badge>
          )}
          {createdAt && !isNew && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
              <Clock className="h-3 w-3" />
              {formatDate(createdAt)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
