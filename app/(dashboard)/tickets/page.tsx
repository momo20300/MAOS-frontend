"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Headphones, Plus, AlertCircle, CheckCircle } from "lucide-react";

interface Ticket {
  name: string;
  subject: string;
  status: string;
  priority: string;
  raised_by: string;
  creation: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch('/api/support/tickets');
        if (response.ok) {
          const data = await response.json();
          setTickets(data.data || []);
        }
      } catch (error) {
        console.error('Erreur chargement tickets:', error);
      }
      setLoading(false);
    };
    fetchTickets();
  }, []);

  const openCount = tickets.filter(t => t.status === 'Open').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-lg">Chargement des tickets...</div>
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
          <h2 className="text-3xl font-bold tracking-tight">Tickets Support</h2>
          <p className="text-muted-foreground">Gérez les demandes de support ({tickets.length} tickets)</p>
        </div>
        <Button onClick={() => showToast("Fonctionnalite disponible prochainement", "success")}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Ticket
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Headphones className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ouverts</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Résolus</CardTitle>
            <CheckCircle className="h-4 w-4 text-success-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success-400">{tickets.length - openCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.name}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{ticket.subject}</span>
                    <Badge variant={ticket.status === 'Open' ? 'destructive' : 'default'}>{ticket.status}</Badge>
                    <Badge variant={ticket.priority === 'High' ? 'destructive' : 'outline'}>{ticket.priority}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">Par: {ticket.raised_by}</div>
                  <div className="text-xs text-muted-foreground">
                    Créé le: {new Date(ticket.creation).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {tickets.length === 0 && (
        <div className="text-center py-12">
          <Headphones className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Aucun ticket</h3>
          <p className="text-muted-foreground">Aucune demande de support</p>
        </div>
      )}
    </div>
  );
}
