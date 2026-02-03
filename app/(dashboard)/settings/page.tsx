"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/context/auth-context";
import { Settings, User, Bell, Shield, Database, LogOut, Building, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { user, logout, isLoading } = useAuth();
  const [saving, setSaving] = useState(false);

  const handleLogout = async () => {
    await logout();
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
              <Badge variant="default" className="bg-green-600">Connecte</Badge>
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
              <span className="font-medium">6 agents</span>
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
