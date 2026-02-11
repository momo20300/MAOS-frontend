"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/context/auth-context";
import { Settings, User, Bell, Shield, Database, LogOut, Building, Loader2, Bot, Users, Briefcase, Package, UserCog, FileText, Target, ImageIcon, Upload, CheckCircle } from "lucide-react";
import { authFetch } from "@/lib/services/auth";

interface AgentStats {
  totalAgents: number;
  byDepartment: Record<string, number>;
  byRole: Record<string, number>;
  uniqueKeywords: number;
  uniqueDoctypes: number;
}

export default function SettingsPage() {
  const { user, logout, isLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [agentStats, setAgentStats] = useState<AgentStats | null>(null);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [logoExists, setLogoExists] = useState(false);
  const [logoSize, setLogoSize] = useState(0);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoMessage, setLogoMessage] = useState("");

  useEffect(() => {
    const fetchLogoInfo = async () => {
      try {
        const res = await authFetch("/api/reports/company-logo");
        if (res.ok) {
          const data = await res.json();
          setLogoExists(data.exists);
          setLogoSize(data.size || 0);
        }
      } catch { /* ignore */ }
    };
    fetchLogoInfo();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setLogoMessage("Fichier trop volumineux (max 2 MB)");
      return;
    }
    setLogoUploading(true);
    setLogoMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await authFetch("/api/reports/company-logo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setLogoExists(true);
        setLogoSize(data.size || file.size);
        setLogoMessage("Logo enregistre avec succes");
      } else {
        setLogoMessage(data.error || "Erreur lors de l'upload");
      }
    } catch {
      setLogoMessage("Erreur reseau");
    } finally {
      setLogoUploading(false);
    }
  };

  useEffect(() => {
    const fetchAgentStats = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/agents/stats`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setAgentStats(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch agent stats:', error);
      } finally {
        setLoadingAgents(false);
      }
    };
    fetchAgentStats();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const departmentIcons: Record<string, React.ReactNode> = {
    FINANCE: <Briefcase className="h-4 w-4" />,
    CRM: <Users className="h-4 w-4" />,
    PROCUREMENT: <Package className="h-4 w-4" />,
    INVENTORY: <Package className="h-4 w-4" />,
    HR: <UserCog className="h-4 w-4" />,
    DOCUMENTS: <FileText className="h-4 w-4" />,
    EXECUTIVE: <Target className="h-4 w-4" />,
  };

  const departmentNames: Record<string, string> = {
    FINANCE: 'Finance & Comptabilite',
    CRM: 'Commercial & CRM',
    PROCUREMENT: 'Achats & Fournisseurs',
    INVENTORY: 'Stock & Logistique',
    HR: 'RH & Organisation',
    DOCUMENTS: 'Documents & Audit',
    EXECUTIVE: 'Strategie & Decision',
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Parametres</h2>
        <p className="text-muted-foreground">
          Gerez vos preferences et configurations
        </p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Profil Utilisateur</CardTitle>
            </div>
            <CardDescription>
              Informations personnelles et preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">Prenom</Label>
                <Input
                  id="firstName"
                  defaultValue={user?.firstName || ''}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  defaultValue={user?.lastName || ''}
                />
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Enregistrer les modifications"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Tenant Info */}
        {user?.currentTenant && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                <CardTitle>Entreprise</CardTitle>
              </div>
              <CardDescription>
                Informations sur votre tenant actuel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{user.currentTenant.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {user.currentTenant.slug}
                  </div>
                </div>
                <Badge variant="default">{user.currentTenant.role}</Badge>
              </div>
              {user.tenants && user.tenants.length > 1 && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-2">
                    Vous avez acces a {user.tenants.length} entreprises
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {user.tenants.map((tenant) => (
                      <Badge
                        key={tenant.id}
                        variant={tenant.id === user.currentTenant?.id ? "default" : "outline"}
                      >
                        {tenant.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Logo Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              <CardTitle>Logo Societe</CardTitle>
            </div>
            <CardDescription>
              Logo affiche dans les en-tetes des rapports PDF
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">
                  {logoExists ? "Logo configure" : "Aucun logo"}
                </div>
                {logoExists && (
                  <div className="text-sm text-muted-foreground">
                    {Math.round(logoSize / 1024)} KB
                  </div>
                )}
              </div>
              {logoExists ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Actif
                </Badge>
              ) : (
                <Badge variant="outline">Non configure</Badge>
              )}
            </div>
            <div>
              <Label htmlFor="logo-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted/50 transition-colors w-fit">
                  {logoUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span className="text-sm">
                    {logoExists ? "Remplacer le logo" : "Telecharger un logo"}
                  </span>
                </div>
              </Label>
              <input
                id="logo-upload"
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleLogoUpload}
                disabled={logoUploading}
              />
              <p className="text-xs text-muted-foreground mt-2">
                PNG ou JPG, max 2 MB
              </p>
              {logoMessage && (
                <p className={`text-sm mt-2 ${logoMessage.includes("succes") ? "text-green-600" : "text-red-500"}`}>
                  {logoMessage}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Connexion MAOS ERP</CardTitle>
            </div>
            <CardDescription>
              Configuration de la connexion a MAOS ERP
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Statut de connexion</div>
                <div className="text-sm text-muted-foreground">
                  Backend API: localhost:4000
                </div>
              </div>
              <Badge variant="default" className="bg-success-400">Connecte</Badge>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="api-url">URL Backend MAOS</Label>
              <Input id="api-url" value="http://localhost:4000" disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Gerez vos preferences de notification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Notifications par email</div>
                <div className="text-sm text-muted-foreground">
                  Recevoir les notifications par email
                </div>
              </div>
              <Button variant="outline" size="sm">Active</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Alertes en temps reel</div>
                <div className="text-sm text-muted-foreground">
                  Notifications push dans l&apos;application
                </div>
              </div>
              <Button variant="outline" size="sm">Active</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Securite</CardTitle>
            </div>
            <CardDescription>
              Parametres de securite et authentification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              Changer le mot de passe
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Sessions actives
            </Button>
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={handleLogout}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Deconnexion
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <CardTitle>Systeme Multi-Agents MAOS</CardTitle>
            </div>
            <CardDescription>
              {agentStats?.totalAgents || 50} agents IA hierarchiques repartis en 7 departements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingAgents ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : agentStats ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(agentStats.byDepartment || {}).map(([dept, count]) => (
                    <div
                      key={dept}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                    >
                      {departmentIcons[dept] || <Bot className="h-4 w-4" />}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground truncate">
                          {departmentNames[dept] || dept}
                        </div>
                        <div className="font-semibold">{count} agents</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 mt-4">
                  <div className="text-sm font-medium mb-2">Hierarchie</div>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Employes</Badge>
                      <span>{agentStats.byRole?.EMPLOYEE || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Chefs</Badge>
                      <span>{agentStats.byRole?.CHIEF || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>Directeurs</Badge>
                      <span>{agentStats.byRole?.DIRECTOR || 0}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold">50</div>
                  <div className="text-xs text-muted-foreground">Agents Total</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold">7</div>
                  <div className="text-xs text-muted-foreground">Departements</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold">3</div>
                  <div className="text-xs text-muted-foreground">Niveaux</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold">100%</div>
                  <div className="text-xs text-muted-foreground">Donnees</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>A propos de MAOS</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Agents IA</span>
              <span className="font-medium">{agentStats?.totalAgents || 50} agents</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Utilisateur</span>
              <span className="font-medium">{user?.email || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium">
                {user?.isSuperAdmin
                  ? 'SUPERADMIN'
                  : user?.currentTenant?.role || 'Utilisateur'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
