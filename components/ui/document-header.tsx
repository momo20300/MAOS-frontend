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
  // French status names
  "Brouillon": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Draft": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Valide": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "Validated": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "Submitted": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "Active": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "Actif": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "Annule": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  "Cancelled": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  "En cours": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "In Progress": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "Not Started": "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  "Completed": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "Termine": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "Pending": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  "En attente": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  "Paid": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "Paye": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "Unpaid": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  "Impaye": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  "Overdue": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  "En retard": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
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
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4 text-muted-foreground" />
          {isNew ? (
            <span className="font-mono text-muted-foreground">
              Nouveau — N° attribue a la validation
            </span>
          ) : (
            <span className="font-mono font-semibold text-foreground">
              {docname}
            </span>
          )}
        </div>
        {status && !isNew && (
          <Badge variant="secondary" className={getStatusStyle(status)}>
            {status}
          </Badge>
        )}
      </div>
      {createdAt && !isNew && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatDate(createdAt)}
        </div>
      )}
    </div>
  );
}
