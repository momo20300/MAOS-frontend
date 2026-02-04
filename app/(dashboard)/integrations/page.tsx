"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plug, Settings, Mail, CreditCard, Truck, Globe, MessageSquare, Smartphone } from "lucide-react";

export default function IntegrationsPage() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const integrations = [
    {
      name: "Email",
      description: "Configuration des comptes email",
      icon: Mail,
      status: "configured",
      action: () => showToast("Fonctionnalite disponible prochainement", "success"),
    },
    {
      name: "Paiement en Ligne",
      description: "Passerelles de paiement",
      icon: CreditCard,
      status: "pending",
      action: () => showToast("Fonctionnalite disponible prochainement", "success"),
    },
    {
      name: "Transporteurs",
      description: "Intégration transporteurs",
      icon: Truck,
      status: "pending",
      action: () => showToast("Fonctionnalite disponible prochainement", "success"),
    },
    {
      name: "Site Web",
      description: "Configuration e-commerce",
      icon: Globe,
      status: "pending",
      action: () => showToast("Fonctionnalite disponible prochainement", "success"),
    },
    {
      name: "SMS",
      description: "Envoi de SMS",
      icon: Smartphone,
      status: "pending",
      action: () => showToast("Fonctionnalite disponible prochainement", "success"),
    },
    {
      name: "Webhooks",
      description: "Intégrations API externes",
      icon: MessageSquare,
      status: "pending",
      action: () => showToast("Fonctionnalite disponible prochainement", "success"),
    },
  ];

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
          <h2 className="text-3xl font-bold tracking-tight">Intégrations</h2>
          <p className="text-muted-foreground">Connectez MAOS à vos outils externes</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <Card key={integration.name} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <integration.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                    <CardDescription>{integration.description}</CardDescription>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  integration.status === 'configured'
                    ? 'bg-green-100 text-success-500'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {integration.status === 'configured' ? 'Configuré' : 'À configurer'}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={integration.action}>
                <Settings className="mr-2 h-4 w-4" />
                Configurer
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
