"use client";

import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import MaosTalk from "@/components/MaosTalk";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { SidebarProvider } from "@/src/context/SidebarContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto pb-32 bg-muted/25">
              {children}
            </main>
          </div>
          <MaosTalk />
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
