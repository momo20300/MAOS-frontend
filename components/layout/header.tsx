"use client";

import { Bell, Settings, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/src/context/SidebarContext";

export default function Header() {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

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
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
