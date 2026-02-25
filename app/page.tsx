"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MessageSquare, BarChart3, FileText, Shield, Zap, Brain } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "IA Conversationnelle",
    desc: "Parlez à votre entreprise en langage naturel. MAOS comprend, analyse et recommande.",
  },
  {
    icon: BarChart3,
    title: "Tableaux de bord",
    desc: "KPIs financiers, ventes, stock et RH en temps réel. Tout dans une seule vue.",
  },
  {
    icon: FileText,
    title: "Rapports PDF",
    desc: "Générez des rapports professionnels en un clic. Finance, stock, ventes, achats.",
  },
  {
    icon: MessageSquare,
    title: "Chat Multilingue",
    desc: "16 langues supportées : FR, AR, Darija, EN, ES et plus. MAOS parle votre langue.",
  },
  {
    icon: Shield,
    title: "Multi-tenant",
    desc: "Chaque entreprise isolée. Données sécurisées, accès par rôle, zéro fuite.",
  },
  {
    icon: Zap,
    title: "Agent Vocal",
    desc: "Parlez à MAOS en temps réel. Analyse vocale instantanée de vos données.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden text-white">
      {/* Animated gradient background */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: "linear-gradient(-45deg, #0a0f1e, #0d1b3e, #0a1628, #101d3a)",
          backgroundSize: "400% 400%",
          animation: "gradientShift 15s ease infinite",
        }}
      />

      {/* Grid pattern */}
      <div
        className="fixed inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow orbs */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-600/8 rounded-full blur-[150px] -z-10" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[120px] -z-10" />

      {/* ── Navigation ── */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-5">
        <Image
          src="/logo_darkmode.png"
          alt="MAOS"
          width={120}
          height={23}
          priority
          unoptimized
        />
        <div className="flex items-center gap-6">
          <Link
            href="/pricing"
            className="text-sm text-white/50 hover:text-white/90 transition-colors duration-300 hidden sm:block"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-sm px-5 py-2 rounded-lg border border-white/[0.08] text-white/70 hover:text-white hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
          >
            Log in
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-16 md:pt-24 pb-20">
        {/* Badge */}
        <div className="mb-8 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs text-white/50 tracking-wider uppercase">
          Multi-Agent Operating System
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight max-w-4xl">
          <span className="text-white">Talk to your </span>
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, #60a5fa 0%, #34d399 100%)",
            }}
          >
            company
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mt-6 text-lg md:text-xl text-white/40 max-w-2xl leading-relaxed">
          MAOS analyse vos données en temps réel, vous explique ce qui se passe,
          et recommande des actions concrètes. Votre expert IA disponible 24/7.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/login"
            className="group relative px-8 py-3.5 rounded-xl text-sm font-semibold text-white overflow-hidden transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)",
            }}
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
            <span className="relative z-10 flex items-center gap-2">
              Commencer maintenant
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-300" />
            </span>
          </Link>
          <Link
            href="/pricing"
            className="px-8 py-3.5 rounded-xl text-sm font-medium text-white/60 border border-white/[0.08] hover:text-white/90 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
          >
            Voir les plans
          </Link>
        </div>

        {/* Social proof */}
        <p className="mt-12 text-xs text-white/20 tracking-wide">
          Utilisé par des PME au Maroc et en Afrique
        </p>
      </section>

      {/* ── Features Grid ── */}
      <section className="relative z-10 px-6 md:px-12 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-white/[0.06] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.02]"
                style={{
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center mb-4 group-hover:bg-white/[0.08] transition-colors duration-300">
                  <f.icon className="h-5 w-5 text-blue-400/70 group-hover:text-blue-400 transition-colors duration-300" />
                </div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">{f.title}</h3>
                <p className="text-sm text-white/35 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="relative z-10 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto text-center px-6 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-white/90">
            Stop managing software.
          </h2>
          <p className="mt-3 text-lg text-white/35">
            Start running your company.
          </p>
          <div className="mt-8 flex items-center justify-center gap-6">
            <Link
              href="/login"
              className="text-sm font-medium text-blue-400/80 hover:text-blue-300 transition-colors duration-200"
            >
              Log in
            </Link>
            <span className="text-white/10">|</span>
            <Link
              href="/login"
              className="text-sm font-medium text-emerald-400/70 hover:text-emerald-300 transition-colors duration-200"
            >
              Talk to MAOS
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.04] py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/15">
            MAOS v1.0 — Multi-Agent Operating System
          </p>
          <p className="text-xs text-white/15">
            Powered by AI
          </p>
        </div>
      </footer>

      {/* CSS animation */}
      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </main>
  );
}
