"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { authFetch } from "@/lib/services/auth";
import { cn } from "@/lib/utils";
import {
  Package, DollarSign, ShoppingCart, Truck, Download, Search,
  Loader2, RefreshCw, AlertTriangle, CheckCircle, ExternalLink,
  ArrowUpRight, ArrowDownRight, TrendingUp, Users, Globe,
  BarChart3,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

// ── Types ──────────────────────────────────────────────────

interface ProductSummary {
  itemCode: string;
  itemName: string;
  itemGroup: string;
  supplier: string;
  revenue: number;
  cost: number;
  margin: number;
  marginPercent: number;
  qtySold: number;
  qtyPurchased: number;
  qtyDelivered: number;
  invoiceCount: number;
  deliveryCount: number;
}

interface ProductDelivery {
  date: string;
  client: string;
  qty: number;
  salesOrder: string;
}

interface ProductPurchaseOrder {
  ref: string;
  date: string;
  supplier: string;
  qty: number;
  unitPrice: number;
  currency: string;
  totalMAD: number;
}

interface WebPrice {
  supplier: string;
  productName: string;
  price: number;
  currency: string;
  priceMAD: number;
  packaging: string;
  url: string;
}

interface Alternative {
  productName: string;
  manufacturer: string;
  principle: string;
  certifications: string[];
  advantages: string;
  price?: number;
  priceCurrency?: string;
  url?: string;
}

interface Distributor {
  name: string;
  country: string;
  website: string;
  phone?: string;
  email?: string;
}

interface PriceComparison {
  internalPricePerUnit: number;
  cheapestWebPrice: number;
  averageWebPrice: number;
  potentialAnnualSavings: number;
  recommendation: string;
  alerts: Array<{ type: string; message: string }>;
}

interface ProductAnalysis {
  itemCode: string;
  itemName: string;
  itemGroup: string;
  supplier: string;
  totalRevenue: number;
  totalQtySold: number;
  invoiceCount: number;
  avgSellingPrice: number;
  totalPurchaseCost: number;
  totalQtyPurchased: number;
  purchaseOrderCount: number;
  avgPurchasePrice: number;
  deliveryCount: number;
  totalQtyDelivered: number;
  avgQtyPerDelivery: number;
  activeClients: string[];
  clientCount: number;
  grossMargin: number;
  grossMarginPercent: number;
  deliveries: ProductDelivery[];
  purchaseOrders: ProductPurchaseOrder[];
  webData?: {
    searchDate: string;
    webPrices: WebPrice[];
    alternatives: Alternative[];
    distributors: Distributor[];
    priceComparison: PriceComparison;
  };
}

// ── Helpers ────────────────────────────────────────────────

function fmtMAD(n: number): string {
  if (!n && n !== 0) return "0 DH";
  return Math.round(n).toLocaleString("fr-FR") + " DH";
}

function fmtPct(n: number): string {
  return n.toFixed(1) + "%";
}

const CHART_COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"];

// ── Page Component ────────────────────────────────────────

export default function ProductAnalysisPage() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"catalogue" | "detail">("catalogue");

  // ── Fetch all products ──
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/reports/product-analysis");
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Erreur inconnue");
      setProducts(json.data || []);
    } catch (e: any) {
      setError(e.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch single product detail ──
  const fetchProductDetail = useCallback(async (itemCode: string) => {
    setDetailLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/api/reports/product-analysis?itemCode=${encodeURIComponent(itemCode)}`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Erreur inconnue");
      setSelectedProduct(json.data);
      setView("detail");
    } catch (e: any) {
      setError(e.message || "Erreur de chargement");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ── PDF ──
  const downloadPDF = async (itemCode?: string) => {
    setPdfLoading(true);
    try {
      const res = await authFetch("/api/reports/product-analysis/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemCode }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (e) {
      console.error("PDF generation failed:", e);
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Filter ──
  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.itemCode.toLowerCase().includes(q) ||
      p.itemName.toLowerCase().includes(q) ||
      (p.supplier || "").toLowerCase().includes(q) ||
      (p.itemGroup || "").toLowerCase().includes(q)
    );
  });

  // ── Aggregates ──
  const totalCA = products.reduce((s, p) => s + p.revenue, 0);
  const totalCost = products.reduce((s, p) => s + p.cost, 0);
  const avgMargin = totalCA > 0 ? ((totalCA - totalCost) / totalCA) * 100 : 0;

  // ── Group chart data ──
  const groupData = products.reduce((acc: Record<string, number>, p) => {
    const g = p.itemGroup || "Autre";
    acc[g] = (acc[g] || 0) + p.revenue;
    return acc;
  }, {});
  const pieData = Object.entries(groupData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  // ═══════════════════════════════════════════════════════════
  // DETAIL VIEW
  // ═══════════════════════════════════════════════════════════

  if (view === "detail" && selectedProduct) {
    const p = selectedProduct;
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Button variant="ghost" size="sm" className="mb-2" onClick={() => setView("catalogue")}>
              &larr; Retour au catalogue
            </Button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-7 w-7 text-blue-500" />
              {p.itemCode} — {p.itemName}
            </h1>
            <p className="text-muted-foreground mt-1">
              Groupe: {p.itemGroup} | Fournisseur: {p.supplier || "-"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => downloadPDF(p.itemCode)}
              disabled={pdfLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
              PDF Analyse
            </Button>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="CA Cumule"
            value={fmtMAD(p.totalRevenue)}
            subtitle={`${p.invoiceCount} factures | PVM: ${fmtMAD(p.avgSellingPrice)}`}
            icon={<DollarSign className="h-5 w-5" />}
            color="emerald"
          />
          <KPICard
            title="Achats"
            value={fmtMAD(p.totalPurchaseCost)}
            subtitle={`${p.purchaseOrderCount} PO | PAM: ${fmtMAD(p.avgPurchasePrice)}`}
            icon={<ShoppingCart className="h-5 w-5" />}
            color="blue"
          />
          <KPICard
            title="Marge Brute"
            value={fmtMAD(p.grossMargin)}
            subtitle={`Taux: ${fmtPct(p.grossMarginPercent)}`}
            icon={p.grossMarginPercent > 15 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
            color={p.grossMarginPercent > 15 ? "emerald" : "amber"}
            trend={fmtPct(p.grossMarginPercent)}
            trendUp={p.grossMarginPercent > 15}
          />
          <KPICard
            title="Livraisons"
            value={`${p.totalQtyDelivered} unites`}
            subtitle={`${p.deliveryCount} BL | ${p.clientCount} clients`}
            icon={<Truck className="h-5 w-5" />}
            color="purple"
          />
        </div>

        {/* Clients */}
        {p.activeClients.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-500" />
                Clients actifs ({p.clientCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {p.activeClients.map((c, i) => (
                  <Badge key={i} variant="secondary">{c}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Deliveries Table */}
        {p.deliveries.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-4 w-4 text-purple-500" />
                Detail des livraisons ({p.deliveries.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left">
                      <th className="py-2 px-2 w-8">#</th>
                      <th className="py-2 px-2">Date</th>
                      <th className="py-2 px-2">Client</th>
                      <th className="py-2 px-2 text-right">Quantite</th>
                      <th className="py-2 px-2">Commande</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.deliveries.slice(0, 30).map((d, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2 px-2 text-muted-foreground">{i + 1}</td>
                        <td className="py-2 px-2">{d.date}</td>
                        <td className="py-2 px-2 font-medium truncate max-w-[200px]">{d.client}</td>
                        <td className="py-2 px-2 text-right font-semibold">{d.qty}</td>
                        <td className="py-2 px-2 text-muted-foreground">{d.salesOrder || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Purchase Orders Table */}
        {p.purchaseOrders.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-blue-500" />
                Historique commandes fournisseur ({p.purchaseOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left">
                      <th className="py-2 px-2">Ref</th>
                      <th className="py-2 px-2">Date</th>
                      <th className="py-2 px-2">Fournisseur</th>
                      <th className="py-2 px-2 text-right">Qty</th>
                      <th className="py-2 px-2 text-right">PU</th>
                      <th className="py-2 px-2 text-right">Total DH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.purchaseOrders.slice(0, 20).map((po, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-2 px-2 font-mono text-xs">{po.ref}</td>
                        <td className="py-2 px-2">{po.date}</td>
                        <td className="py-2 px-2 truncate max-w-[150px]">{po.supplier}</td>
                        <td className="py-2 px-2 text-right">{po.qty}</td>
                        <td className="py-2 px-2 text-right">{po.unitPrice} {po.currency}</td>
                        <td className="py-2 px-2 text-right font-semibold">{fmtMAD(po.totalMAD)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ═══ WEB DATA ═══ */}
        {p.webData && (
          <>
            {/* Price Alerts */}
            {p.webData.priceComparison.alerts.length > 0 && (
              <div className="space-y-2">
                {p.webData.priceComparison.alerts.map((alert, i) => (
                  <Card
                    key={i}
                    className={cn(
                      "border-l-4",
                      alert.type === "OVERPAYING"
                        ? "border-l-red-500 bg-red-50 dark:bg-red-900/10"
                        : alert.type === "GOOD_DEAL"
                        ? "border-l-green-500 bg-green-50 dark:bg-green-900/10"
                        : "border-l-amber-500 bg-amber-50 dark:bg-amber-900/10"
                    )}
                  >
                    <CardContent className="p-4 flex items-start gap-3">
                      {alert.type === "OVERPAYING" ? (
                        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-semibold text-sm">
                          {alert.type === "OVERPAYING" ? "Alerte prix" : alert.type === "GOOD_DEAL" ? "Bon prix" : "Verification"}
                        </p>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Web Prices Comparison */}
            {p.webData.webPrices.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-500" />
                    Veille Prix — Comparaison Marche
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground text-left">
                          <th className="py-2 px-2">Fournisseur</th>
                          <th className="py-2 px-2">Produit</th>
                          <th className="py-2 px-2">Conditionnement</th>
                          <th className="py-2 px-2 text-right">Prix</th>
                          <th className="py-2 px-2 text-right">DH</th>
                          <th className="py-2 px-2">Lien</th>
                        </tr>
                      </thead>
                      <tbody>
                        {p.webData.webPrices.map((wp, i) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="py-2 px-2 font-medium">{wp.supplier}</td>
                            <td className="py-2 px-2 truncate max-w-[150px]">{wp.productName}</td>
                            <td className="py-2 px-2 text-muted-foreground">{wp.packaging}</td>
                            <td className="py-2 px-2 text-right">{wp.price} {wp.currency}</td>
                            <td className="py-2 px-2 text-right font-semibold">{fmtMAD(wp.priceMAD)}</td>
                            <td className="py-2 px-2">
                              {wp.url && (
                                <a href={wp.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                                  <ExternalLink className="h-3 w-3" /> Voir
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                        {/* Internal price row */}
                        <tr className="border-t-2 bg-emerald-50 dark:bg-emerald-900/10 font-semibold">
                          <td className="py-2 px-2">VOTRE PRIX</td>
                          <td className="py-2 px-2">{p.itemName}</td>
                          <td className="py-2 px-2">-</td>
                          <td className="py-2 px-2 text-right">-</td>
                          <td className="py-2 px-2 text-right text-emerald-600 dark:text-emerald-400">
                            {fmtMAD(p.webData!.priceComparison.internalPricePerUnit)}
                          </td>
                          <td className="py-2 px-2 text-xs text-muted-foreground">(prix interne)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Recommendation */}
                  {p.webData.priceComparison.recommendation && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-sm">
                      <p className="font-semibold text-blue-700 dark:text-blue-300 mb-1">Recommandation</p>
                      <p className="text-muted-foreground">{p.webData.priceComparison.recommendation}</p>
                    </div>
                  )}

                  {p.webData.priceComparison.potentialAnnualSavings > 0 && (
                    <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg text-sm">
                      <p className="font-semibold text-amber-700 dark:text-amber-300">
                        Economie potentielle annuelle : {fmtMAD(p.webData.priceComparison.potentialAnnualSavings)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Distributors */}
            {p.webData.distributors.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-500" />
                    Distributeurs identifies ({p.webData.distributors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground text-left">
                          <th className="py-2 px-2">Distributeur</th>
                          <th className="py-2 px-2">Pays</th>
                          <th className="py-2 px-2">Site Web</th>
                          <th className="py-2 px-2">Contact</th>
                        </tr>
                      </thead>
                      <tbody>
                        {p.webData.distributors.map((d, i) => (
                          <tr
                            key={i}
                            className={cn(
                              "border-b last:border-0 hover:bg-muted/30",
                              /maroc|morocco/i.test(d.country) && "bg-emerald-50 dark:bg-emerald-900/10"
                            )}
                          >
                            <td className="py-2 px-2 font-medium">{d.name}</td>
                            <td className="py-2 px-2">
                              {d.country}
                              {/maroc|morocco/i.test(d.country) && (
                                <Badge className="ml-2 text-xs" variant="default">Local</Badge>
                              )}
                            </td>
                            <td className="py-2 px-2">
                              {d.website && (
                                <a href={d.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                                  <ExternalLink className="h-3 w-3" /> {d.website.replace(/https?:\/\/(www\.)?/, "").substring(0, 25)}
                                </a>
                              )}
                            </td>
                            <td className="py-2 px-2 text-muted-foreground text-xs">
                              {[d.phone, d.email].filter(Boolean).join(" / ")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Alternatives */}
            {p.webData.alternatives.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-amber-500" />
                    Alternatives de substitution certifiees ({p.webData.alternatives.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {p.webData.alternatives.map((alt, i) => (
                      <Card key={i} className={cn("border", i === 0 && "border-emerald-300 dark:border-emerald-700")}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold">{alt.productName}</p>
                              <p className="text-sm text-muted-foreground">{alt.manufacturer}</p>
                            </div>
                            {i === 0 && <Badge variant="default" className="bg-emerald-600 text-xs">Recommande</Badge>}
                          </div>
                          <p className="text-sm mb-2">{alt.principle}</p>
                          {alt.certifications.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {alt.certifications.map((c, j) => (
                                <Badge key={j} variant="outline" className="text-xs">{c}</Badge>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">{alt.advantages}</p>
                          {alt.price && (
                            <p className="text-sm font-semibold mt-2">{alt.price} {alt.priceCurrency || "EUR"}</p>
                          )}
                          {alt.url && (
                            <a href={alt.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs hover:underline mt-1 flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" /> Fiche produit
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Margin Summary */}
        <Card className="border-t-4 border-t-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Resume Marge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">CA cumule</p>
                <p className="text-xl font-bold text-emerald-600">{fmtMAD(p.totalRevenue)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cout achat total</p>
                <p className="text-xl font-bold text-blue-600">{fmtMAD(p.totalPurchaseCost)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Marge brute</p>
                <p className={cn("text-xl font-bold", p.grossMarginPercent > 15 ? "text-emerald-600" : "text-amber-600")}>
                  {fmtMAD(p.grossMargin)} ({fmtPct(p.grossMarginPercent)})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // CATALOGUE VIEW
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-7 w-7 text-blue-500" />
            Analyse Produit
          </h1>
          <p className="text-muted-foreground mt-1">
            Catalogue complet — Cliquez sur un produit pour une analyse detaillee avec veille prix
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProducts}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
            Actualiser
          </Button>
          <Button
            size="sm"
            onClick={() => downloadPDF()}
            disabled={pdfLoading || products.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
            PDF Catalogue
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par code, nom, fournisseur, groupe..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-3 text-muted-foreground">Chargement des produits...</span>
        </div>
      )}

      {error && !loading && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardContent className="p-4 text-red-600 dark:text-red-400">{error}</CardContent>
        </Card>
      )}

      {detailLoading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span>Analyse en cours (donnees internes + veille prix web)...</span>
            </div>
          </Card>
        </div>
      )}

      {!loading && products.length > 0 && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Produits actifs"
              value={String(products.length)}
              subtitle={`${filtered.length} affiches`}
              icon={<Package className="h-5 w-5" />}
              color="blue"
            />
            <KPICard
              title="CA Total"
              value={fmtMAD(totalCA)}
              icon={<DollarSign className="h-5 w-5" />}
              color="emerald"
            />
            <KPICard
              title="Marge Moyenne"
              value={fmtPct(avgMargin)}
              icon={avgMargin > 15 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
              color={avgMargin > 15 ? "emerald" : "amber"}
              trend={fmtPct(avgMargin)}
              trendUp={avgMargin > 15}
            />
            <KPICard
              title="Groupes"
              value={String(Object.keys(groupData).length)}
              icon={<BarChart3 className="h-5 w-5" />}
              color="purple"
            />
          </div>

          {/* Pie Chart */}
          {pieData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">CA par groupe de produits</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => fmtMAD(Number(value || 0))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Products Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Classement des produits par CA ({filtered.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-left">
                      <th className="py-2 px-2 w-8">#</th>
                      <th className="py-2 px-2">Code</th>
                      <th className="py-2 px-2">Nom</th>
                      <th className="py-2 px-2">Fournisseur</th>
                      <th className="py-2 px-2 text-right">CA</th>
                      <th className="py-2 px-2 text-right">Cout</th>
                      <th className="py-2 px-2 text-right">Marge</th>
                      <th className="py-2 px-2 text-right">Qty</th>
                      <th className="py-2 px-2 w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 100).map((p, i) => (
                      <tr
                        key={p.itemCode}
                        className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                        onClick={() => fetchProductDetail(p.itemCode)}
                      >
                        <td className="py-2 px-2 text-muted-foreground">{i + 1}</td>
                        <td className="py-2 px-2 font-mono text-xs">{p.itemCode}</td>
                        <td className="py-2 px-2 font-medium truncate max-w-[200px]" title={p.itemName}>
                          {p.itemName}
                        </td>
                        <td className="py-2 px-2 truncate max-w-[120px] text-muted-foreground">
                          {p.supplier || "-"}
                        </td>
                        <td className="py-2 px-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          {fmtMAD(p.revenue)}
                        </td>
                        <td className="py-2 px-2 text-right text-blue-600 dark:text-blue-400">
                          {fmtMAD(p.cost)}
                        </td>
                        <td className="py-2 px-2 text-right">
                          <Badge
                            variant={p.marginPercent > 15 ? "default" : p.marginPercent > 0 ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {fmtPct(p.marginPercent)}
                          </Badge>
                        </td>
                        <td className="py-2 px-2 text-right text-muted-foreground">{p.qtySold}</td>
                        <td className="py-2 px-2">
                          <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-700 text-xs">
                            Analyser &rarr;
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filtered.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun produit ne correspond a votre recherche
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ── KPI Card Component ────────────────────────────────────

function KPICard({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
  trendUp,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: string;
  trendUp?: boolean;
}) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">{title}</span>
          <div className={cn("p-2 rounded-lg", colorMap[color])}>
            {icon}
          </div>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <Badge variant={trendUp ? "default" : "destructive"} className="text-xs px-1.5 py-0">
              {trendUp ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
              {trend}
            </Badge>
          )}
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
