"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Settings, User, Menu, X, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/src/context/SidebarContext";
import { useAuth } from "@/lib/context/auth-context";
import { useRouter } from "next/navigation";

export default function Header() {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
  };

  const roleBadge = user?.currentTenant?.role || "USER";

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      {/* Hamburger menu button - visible only on mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggleMobileSidebar}
        aria-label={isMobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <div className="flex-1">
        <h1 className="text-lg font-semibold">Tableau de bord</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" title="Notifications">
          <Bell className="h-5 w-5" />
        </Button>

        {/* Settings */}
        <Button
          variant="ghost"
          size="icon"
          title="Paramètres"
          onClick={() => router.push("/integrations")}
        >
          <Settings className="h-5 w-5" />
        </Button>

        {/* User menu dropdown */}
        <div className="relative" ref={menuRef}>
          <Button
            variant="ghost"
            className="flex items-center gap-2 px-2"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
              {user?.firstName?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <span className="hidden md:inline text-sm font-medium">
              {user?.firstName || "Utilisateur"}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-64 rounded-md border bg-popover shadow-lg z-50">
              {/* User info */}
              <div className="border-b px-4 py-3">
                <p className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                {user?.currentTenant && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {user.currentTenant.name}
                    <span className="ml-2 inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      {roleBadge}
                    </span>
                  </p>
                )}
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                  onClick={() => {
                    setUserMenuOpen(false);
                    router.push("/integrations");
                  }}
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Paramètres
                </button>

                <button
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Se déconnecter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
