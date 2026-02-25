"use client";

import Link from "next/link";
import Image from "next/image";
import { Check, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "STANDARD",
    price: "499",
    description: "L'essentiel pour démarrer",
    popular: false,
    features: [
      "Gestion commerciale de base",
      "2 utilisateurs inclus",
      "Chat IA conversationnel",
      "Rapports PDF",
      "Support email",
    ],
  },
  {
    name: "PRO",
    price: "999",
    description: "Pour les entreprises en croissance",
    popular: true,
    features: [
      "Tout STANDARD +",
      "Recommandations IA",
      "10 utilisateurs inclus",
      "Tableaux de bord avancés",
      "Support prioritaire",
      "Analyses sectorielles",
    ],
  },
  {
    name: "PRO+",
    price: "1 999",
    description: "La puissance maximale",
    popular: false,
    features: [
      "Tout PRO +",
      "Prédictions IA avancées",
      "Utilisateurs illimités",
      "Agent vocal temps réel",
      "Accès API",
      "Support dédié",
      "Onboarding personnalisé",
    ],
  },
];

export default function PricingPage() {
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

      {/* Navigation */}
      <nav className="relative z-20 px-6 md:px-12 py-5">
        <div className="flex items-center justify-between">
          <div className="w-[80px] hidden sm:block" />
          <Link href="/">
            <Image
              src="/logo_darkmode.png"
              alt="MAOS"
              width={170}
              height={32}
              priority
              unoptimized
            />
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm px-5 py-2 rounded-lg border border-white/[0.08] text-white/70 hover:text-white hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300"
            >
              Log in
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="relative z-10 text-center px-6 pt-12 md:pt-20 pb-16">
        <div className="mb-6 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs text-white/50 tracking-wider uppercase inline-block">
          Plans & Tarifs
        </div>
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight max-w-3xl mx-auto">
          <span className="text-white">Choisissez votre </span>
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, #60a5fa 0%, #34d399 100%)",
            }}
          >
            plan
          </span>
        </h1>
        <p className="mt-5 text-lg text-white/40 max-w-xl mx-auto leading-relaxed">
          Des solutions adaptées à chaque entreprise. Commencez gratuitement, évoluez sans limites.
        </p>
      </section>

      {/* Plans Grid */}
      <section className="relative z-10 px-6 md:px-12 pb-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 transition-all duration-300 hover:border-white/[0.15] ${
                plan.popular
                  ? "border-blue-500/30 md:scale-105 md:-my-2"
                  : "border-white/[0.08]"
              }`}
              style={{
                background: plan.popular
                  ? "rgba(59, 130, 246, 0.04)"
                  : "rgba(255, 255, 255, 0.02)",
                backdropFilter: "blur(40px)",
                boxShadow: plan.popular
                  ? "0 0 0 1px rgba(59,130,246,0.1), 0 20px 50px -12px rgba(0,0,0,0.4), 0 0 80px -20px rgba(59,130,246,0.1)"
                  : "0 0 0 1px rgba(255,255,255,0.05), 0 20px 50px -12px rgba(0,0,0,0.3)",
              }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold tracking-wider uppercase"
                  style={{
                    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  }}
                >
                  Populaire
                </div>
              )}

              {/* Plan name */}
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
                {plan.name}
              </h3>

              {/* Price */}
              <div className="mb-2">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-sm text-white/40 ml-2">MAD/mois</span>
              </div>

              {/* Description */}
              <p className="text-sm text-white/35 mb-8">{plan.description}</p>

              {/* CTA */}
              <Link
                href="/register"
                className={`group relative flex items-center justify-center w-full h-12 rounded-xl text-sm font-semibold overflow-hidden transition-all duration-300 mb-8 ${
                  plan.popular ? "text-white" : "text-white/80 border border-white/[0.1] hover:border-white/20 hover:bg-white/[0.04]"
                }`}
                style={
                  plan.popular
                    ? {
                        background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)",
                      }
                    : undefined
                }
              >
                {plan.popular && (
                  <>
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background:
                          "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 55%, transparent 60%)",
                      }}
                    />
                  </>
                )}
                <span className="relative z-10 flex items-center gap-2">
                  Commencer
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-300" />
                </span>
              </Link>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${plan.popular ? "text-blue-400" : "text-white/30"}`} />
                    <span className="text-sm text-white/50">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto text-center px-6 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-white/90">
            Prêt à transformer votre entreprise ?
          </h2>
          <p className="mt-3 text-lg text-white/35">
            Commencez dès aujourd&apos;hui avec MAOS.
          </p>
          <div className="mt-8 flex items-center justify-center gap-6">
            <Link
              href="/register"
              className="group relative px-8 py-3.5 rounded-xl text-sm font-semibold text-white overflow-hidden transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)",
              }}
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
              <span className="relative z-10 flex items-center gap-2">
                Créer un compte
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-300" />
              </span>
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-white/50 hover:text-white/80 transition-colors duration-200"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
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
