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
        <div
          className="flex h-screen overflow-hidden"
          style={{
            background: "linear-gradient(-45deg, #0a0f1e, #0d1b3e, #0a1628, #101d3a)",
            backgroundSize: "400% 400%",
            animation: "gradientShift 15s ease infinite",
          }}
        >
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto relative">
              {children}
            </main>
          </div>
          <MaosTalk />
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
