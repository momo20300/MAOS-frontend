import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ArrowRight, Loader2, TrendingUp } from 'lucide-react';

interface PackChangeModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    tenant: {
        id: string;
        name: string;
        pack: string;
    };
}

const PACKS = [
    { value: 'STANDARD', label: 'STANDARD', price: 499, features: ['AI ESSENTIAL (60-65%)', 'Historique 30 jours', 'Support email'] },
    { value: 'PRO', label: 'PRO', price: 999, features: ['AI OPERATIONAL (≈80%)', 'Historique 90 jours', 'Support prioritaire', 'AI Recommendations', 'Export données'] },
    { value: 'PRO_PLUS', label: 'PRO+', price: 1999, features: ['AI STRATEGIC (100%)', 'Historique 1 an', 'Support dédié', 'Prévisions IA', 'Scénarios avancés', 'API illimité'] },
];

export function PackChangeModal({ open, onClose, onSuccess, tenant }: PackChangeModalProps) {
    const [loading, setLoading] = useState(false);
    const [newPack, setNewPack] = useState(tenant.pack);

    const currentPackInfo = PACKS.find(p => p.value === tenant.pack);
    const newPackInfo = PACKS.find(p => p.value === newPack);
    const isUpgrade = PACKS.findIndex(p => p.value === newPack) > PACKS.findIndex(p => p.value === tenant.pack);

    const priceDifference = (newPackInfo?.price || 0) - (currentPackInfo?.price || 0);

    const handleSubmit = async () => {
        setLoading(true);

        try {
            const res = await fetch(`/api/superadmin/tenants/${tenant.id}/pack`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pack: newPack }),
            });

            if (!res.ok) throw new Error('Failed to update pack');

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating pack:', error);
            alert('Erreur lors du changement de pack');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Changer le Pack - {tenant.name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Pack Selector */}
                    <div>
                        <Label>Nouveau Pack</Label>
                        <Select value={newPack} onValueChange={setNewPack}>
                            <SelectTrigger className="mt-2">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PACKS.map((pack) => (
                                    <SelectItem key={pack.value} value={pack.value}>
                                        <div className="flex items-center justify-between w-full">
                                            <span className="font-semibold">{pack.label}</span>
                                            <span className="text-sm text-gray-500 ml-4">{pack.price} Dirhams/mois</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Comparison */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Current Pack */}
                        <div className="p-4 border rounded-lg bg-gray-50">
                            <div className="text-sm text-gray-600 mb-2">Pack Actuel</div>
                            <div className="text-xl font-bold mb-1">{currentPackInfo?.label}</div>
                            <div className="text-lg text-gray-700 mb-3">{currentPackInfo?.price} Dirhams/mois</div>
                            <ul className="space-y-1 text-sm">
                                {currentPackInfo?.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* New Pack */}
                        <div className={`p-4 border-2 rounded-lg ${isUpgrade ? 'border-green-500 bg-green-50' : 'border-orange-500 bg-orange-50'}`}>
                            <div className="text-sm text-gray-600 mb-2">Nouveau Pack</div>
                            <div className="text-xl font-bold mb-1">{newPackInfo?.label}</div>
                            <div className="text-lg font-semibold mb-3 flex items-center gap-2">
                                {newPackInfo?.price} Dirhams/mois
                                {isUpgrade && <TrendingUp className="w-4 h-4 text-green-600" />}
                            </div>
                            <ul className="space-y-1 text-sm">
                                {newPackInfo?.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full ${isUpgrade ? 'bg-green-600' : 'bg-orange-600'}`}></span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Billing Impact */}
                    {newPack !== tenant.pack && (
                        <div className={`p-4 rounded-lg ${isUpgrade ? 'bg-blue-50 border border-blue-200' : 'bg-orange-50 border border-orange-200'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-gray-900">
                                        {isUpgrade ? 'Upgrade' : 'Downgrade'} - Impact Facturation
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {isUpgrade
                                            ? `Différence: +${priceDifference} Dirhams/mois (pro-rata appliqué)`
                                            : `Économie: ${Math.abs(priceDifference)} Dirhams/mois (crédit appliqué)`
                                        }
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold">
                                        {priceDifference > 0 ? '+' : ''}{priceDifference} Dirhams
                                    </p>
                                    <p className="text-xs text-gray-500">par mois</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || newPack === tenant.pack}
                        className={isUpgrade ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isUpgrade ? 'Upgrader' : 'Downgrader'} vers {newPackInfo?.label}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
