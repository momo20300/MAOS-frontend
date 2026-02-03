"use client";

import * as React from "react";
import { Button } from "./button";
import { Input } from "./input";
import {
  Download,
  Upload,
  Printer,
  Search,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  onExportCSV?: () => void;
  onImportCSV?: (file: File) => void;
  onPrint?: () => void;
  pageSize?: number;
  emptyMessage?: string;
  loading?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = "Rechercher...",
  searchKeys = [],
  onExportCSV,
  onImportCSV,
  onPrint,
  pageSize = 10,
  emptyMessage = "Aucune donnee",
  loading = false,
}: DataTableProps<T>) {
  const [search, setSearch] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Filter data based on search
  const filteredData = React.useMemo(() => {
    if (!search || searchKeys.length === 0) return data;
    const lowerSearch = search.toLowerCase();
    return data.filter((item) =>
      searchKeys.some((key) => {
        const value = item[key];
        return value && String(value).toLowerCase().includes(lowerSearch);
      })
    );
  }, [data, search, searchKeys]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Export to CSV
  const handleExportCSV = () => {
    if (onExportCSV) {
      onExportCSV();
      return;
    }

    const headers = columns.map((col) => col.label).join(",");
    const rows = filteredData.map((item) =>
      columns
        .map((col) => {
          const keyStr = String(col.key);
          const value = keyStr.includes(".")
            ? keyStr.split(".").reduce((obj: any, key: string) => obj?.[key], item)
            : item[col.key as keyof T];
          // Escape quotes and wrap in quotes if contains comma
          const strValue = String(value ?? "");
          if (strValue.includes(",") || strValue.includes('"')) {
            return `"${strValue.replace(/"/g, '""')}"`;
          }
          return strValue;
        })
        .join(",")
    );

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `export-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import CSV
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportCSV) {
      onImportCSV(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Print
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const tableHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Impression MAOS</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap');
            body {
              font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
              padding: 40px;
              color: #1a1a1a;
            }
            h1 {
              font-size: 24px;
              font-weight: 600;
              margin-bottom: 8px;
            }
            .date {
              color: #666;
              font-size: 14px;
              margin-bottom: 24px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 13px;
            }
            th {
              background: #f5f5f7;
              padding: 12px 16px;
              text-align: left;
              font-weight: 600;
              border-bottom: 2px solid #e5e5e5;
            }
            td {
              padding: 12px 16px;
              border-bottom: 1px solid #e5e5e5;
            }
            tr:hover {
              background: #fafafa;
            }
            .footer {
              margin-top: 32px;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <h1>MAOS - Export de donnees</h1>
          <div class="date">Genere le ${new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}</div>
          <table>
            <thead>
              <tr>
                ${columns.map((col) => `<th>${col.label}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${filteredData
                .map(
                  (item) =>
                    `<tr>${columns
                      .map((col) => {
                        const keyStr = String(col.key);
                        const value = keyStr.includes(".")
                          ? keyStr.split(".").reduce((obj: any, key: string) => obj?.[key], item)
                          : item[col.key as keyof T];
                        return `<td>${value ?? "-"}</td>`;
                      })
                      .join("")}</tr>`
                )
                .join("")}
            </tbody>
          </table>
          <div class="footer">
            Total: ${filteredData.length} enregistrement(s) | MAOS - Multi-Agent Operating System
          </div>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.write(tableHtml);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onImportCSV && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importer
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="rounded-xl">
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-xl">
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className={`px-4 py-3 text-left text-sm font-semibold text-muted-foreground ${col.className || ""}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Chargement...
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                    <FileSpreadsheet className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className={`px-4 py-3 text-sm ${col.className || ""}`}>
                        {col.render
                          ? col.render(item)
                          : String(col.key).includes(".")
                          ? String(col.key).split(".").reduce((obj: any, key: string) => obj?.[key], item)
                          : item[col.key as keyof T] ?? "-"}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            {startIndex + 1}-{Math.min(startIndex + pageSize, filteredData.length)} sur{" "}
            {filteredData.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0 rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm font-medium">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0 rounded-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
