"use client";

import { useState } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    CreditCard,
    TrendingUp,
    Sparkles,
    Check,
    ArrowRight,
    Loader2,
    Download,
    Calendar
} from "lucide-react";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Pack pricing
const PACKS = {
    STARTER: {
        price: 49,
        currency: 'USD',
        name: 'Starter',
        features: [
            '5 users included',
            'Basic modules (Sales, Stock)',
            '10,000 AI tokens/month',
            'Email support',
            'Mobile app access'
        ]
    },
    BUSINESS: {
        price: 149,
        currency: 'USD',
        name: 'Business',
        features: [
            '25 users included',
            'All modules (Sales, CRM, Finance, HR)',
            '50,000 AI tokens/month',
            'Priority support',
            'API access',
            'Custom reports'
        ]
    },
    ENTERPRISE: {
        price: 499,
        currency: 'USD',
        name: 'Enterprise',
        features: [
            'Unlimited users',
            'All modules + custom features',
            'Unlimited AI tokens',
            'Dedicated support manager',
            'White-label option',
            'SLA guarantee',
            'Custom integrations'
        ]
    }
};

interface Invoice {
    id: string;
    invoiceNumber: string;
    amount: number;
    status: string;
    period: string;
    dueDate: string;
    paidAt?: string;
}

interface Subscription {
    pack: keyof typeof PACKS;
    status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
    currentPeriodStart: string;
    currentPeriodEnd: string;
}

// Payment Form Component
function CheckoutForm({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setIsProcessing(true);
        setErrorMessage(null);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/billing/success`,
            },
        });

        if (error) {
            setErrorMessage(error.message || 'Payment failed');
            setIsProcessing(false);
        } else {
            onSuccess();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />

            {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {errorMessage}
                </div>
            )}

            <Button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full"
                size="lg"
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay Now
                    </>
                )}
            </Button>
        </form>
    );
}

export default function OwnerBillingPage() {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [selectedPack, setSelectedPack] = useState<keyof typeof PACKS | null>(null);

    // Fetch subscription and invoices
    useState(() => {
        fetchBillingData();
    });

    const fetchBillingData = async () => {
        try {
            const [subRes, invRes] = await Promise.all([
                fetch('/api/billing/subscription'),
                fetch('/api/billing/invoices')
            ]);

            const subData = await subRes.json();
            const invData = await invRes.json();

            setSubscription(subData);
            setInvoices(invData);
        } catch (error) {
            console.error('Failed to fetch billing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (pack: keyof typeof PACKS) => {
        try {
            const res = await fetch('/api/billing/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pack })
            });

            const { clientSecret } = await res.json();
            setClientSecret(clientSecret);
            setSelectedPack(pack);
        } catch (error) {
            console.error('Failed to create payment intent:', error);
            alert('Failed to upgrade. Please try again.');
        }
    };

    const downloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
        try {
            const res = await fetch(`/api/billing/invoices/${invoiceId}/download`);
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${invoiceNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to download invoice:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Billing & Subscription</h1>
                <p className="text-muted-foreground mt-1">Manage your subscription and invoices</p>
            </div>

            {/* Current Subscription */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-primary" />
                                Current Plan: {subscription?.pack || 'STARTER'}
                            </CardTitle>
                            <CardDescription>
                                {subscription?.status === 'ACTIVE' ? (
                                    <span className="text-green-600">Active</span>
                                ) : (
                                    <span className="text-red-600">{subscription?.status}</span>
                                )}
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-lg px-4 py-2">
                            ${PACKS[subscription?.pack || 'STARTER'].price}/month
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Current Period</p>
                                <p className="font-medium">
                                    {subscription?.currentPeriodStart && new Date(subscription.currentPeriodStart).toLocaleDateString()} - {subscription?.currentPeriodEnd && new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Next Billing Date</p>
                                <p className="font-medium flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {subscription?.currentPeriodEnd && new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Upgrade Options */}
            {!clientSecret && (
                <div>
                    <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {Object.entries(PACKS).map(([key, pack]) => {
                            const current = subscription?.pack === key;
                            const canUpgrade = !current;

                            return (
                                <Card key={key} className={current ? 'border-primary shadow-lg' : ''}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            {pack.name}
                                            {current && <Badge variant="default">Current</Badge>}
                                        </CardTitle>
                                        <div className="text-3xl font-bold mt-2">
                                            ${pack.price}
                                            <span className="text-base font-normal text-muted-foreground">/month</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <ul className="space-y-2">
                                            {pack.features.map((feature, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm">
                                                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        {canUpgrade && (
                                            <Button
                                                onClick={() => handleUpgrade(key as keyof typeof PACKS)}
                                                className="w-full"
                                                variant={current ? "outline" : "default"}
                                            >
                                                {current ? 'Current Plan' : 'Upgrade Now'}
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Payment Form (when upgrading) */}
            {clientSecret && selectedPack && (
                <Card>
                    <CardHeader>
                        <CardTitle>Complete Your Upgrade to {PACKS[selectedPack].name}</CardTitle>
                        <CardDescription>
                            You'll be charged ${PACKS[selectedPack].price}/month starting today
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                            <CheckoutForm
                                clientSecret={clientSecret}
                                onSuccess={() => {
                                    setClientSecret(null);
                                    setSelectedPack(null);
                                    fetchBillingData();
                                }}
                            />
                        </Elements>
                    </CardContent>
                </Card>
            )}

            {/* Invoices History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Invoices
                    </CardTitle>
                    <CardDescription>View and download your invoices</CardDescription>
                </CardHeader>
                <CardContent>
                    {invoices.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No invoices yet</p>
                    ) : (
                        <div className="space-y-2">
                            {invoices.map((invoice) => (
                                <div
                                    key={invoice.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition"
                                >
                                    <div className="flex-1">
                                        <div className="font-medium">{invoice.invoiceNumber}</div>
                                        <div className="text-sm text-muted-foreground">
                                            Period: {invoice.period}
                                        </div>
                                    </div>

                                    <div className="text-right mr-4">
                                        <div className="font-bold">${invoice.amount}</div>
                                        <Badge
                                            variant={
                                                invoice.status === 'PAID' ? 'default' :
                                                    invoice.status === 'OVERDUE' ? 'destructive' : 'outline'
                                            }
                                            className="text-xs"
                                        >
                                            {invoice.status}
                                        </Badge>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => downloadInvoice(invoice.id, invoice.invoiceNumber)}
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        PDF
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
