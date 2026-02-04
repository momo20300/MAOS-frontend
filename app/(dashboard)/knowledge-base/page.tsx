"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, FileText } from "lucide-react";

export default function KnowledgeBasePage() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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
          <h2 className="text-3xl font-bold tracking-tight">Base de Connaissances</h2>
          <p className="text-muted-foreground">Documentez vos processus</p>
        </div>
        <Button onClick={() => showToast("Fonctionnalite disponible prochainement", "success")}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel Article
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Articles</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Articles de documentation</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Aucun article</h3>
          <p className="text-muted-foreground">Créez votre premier article de documentation</p>
        </CardContent>
      </Card>
    </div>
  );
}
