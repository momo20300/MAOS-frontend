import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface CreateTenantModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const METIERS = [
    { value: 'RETAIL', label: 'Retail / Commerce' },
    { value: 'RESTAURATION', label: 'Restauration' },
    { value: 'MANUFACTURING', label: 'Manufacturing / Production' },
    { value: 'SERVICES', label: 'Services' },
    { value: 'DISTRIBUTION', label: 'Distribution / Grossiste' },
    { value: 'ECOMMERCE', label: 'E-Commerce' },
    { value: 'HEALTHCARE', label: 'Santé / Healthcare' },
    { value: 'EDUCATION', label: 'Éducation' },
    { value: 'CONSTRUCTION', label: 'Construction / BTP' },
    { value: 'AGRICULTURE', label: 'Agriculture' },
];

const PACKS = [
    { value: 'STANDARD', label: 'STANDARD', description: 'AI ESSENTIAL (60-65%)' },
    { value: 'PRO', label: 'PRO', description: 'AI OPERATIONAL (≈80%)' },
    { value: 'PRO_PLUS', label: 'PRO+', description: 'AI STRATEGIC (100%)' },
];

export function CreateTenantModal({ open, onClose, onSuccess }: CreateTenantModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        ownerEmail: '',
        metier: 'RETAIL',
        pack: 'STANDARD',
        erpnextUrl: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/superadmin/tenants/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error('Failed to create tenant');

            onSuccess();
            onClose();
            setFormData({
                name: '',
                slug: '',
                ownerEmail: '',
                metier: 'RETAIL',
                pack: 'STANDARD',
                erpnextUrl: '',
            });
        } catch (error) {
            console.error('Error creating tenant:', error);
            alert('Erreur lors de la création du tenant');
        } finally {
            setLoading(false);
        }
    };

    const handleNameChange = (name: string) => {
        setFormData({
            ...formData,
            name,
            slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Créer un Nouveau Tenant</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Company Name */}
                        <div className="col-span-2">
                            <Label htmlFor="name">Nom de l'Entreprise *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder="Ex: ACME Corporation"
                                required
                            />
                        </div>

                        {/* Slug */}
                        <div className="col-span-2">
                            <Label htmlFor="slug">Slug (URL) *</Label>
                            <Input
                                id="slug"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="acme-corporation"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                URL: app.maos.ma/{formData.slug}
                            </p>
                        </div>

                        {/* Owner Email */}
                        <div className="col-span-2">
                            <Label htmlFor="ownerEmail">Email du Propriétaire *</Label>
                            <Input
                                id="ownerEmail"
                                type="email"
                                value={formData.ownerEmail}
                                onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                                placeholder="owner@company.com"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Un compte sera créé automatiquement
                            </p>
                        </div>

                        {/* Metier */}
                        <div>
                            <Label htmlFor="metier">Secteur d'Activité *</Label>
                            <Select
                                value={formData.metier}
                                onValueChange={(value) => setFormData({ ...formData, metier: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {METIERS.map((metier) => (
                                        <SelectItem key={metier.value} value={metier.value}>
                                            {metier.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Pack */}
                        <div>
                            <Label htmlFor="pack">Pack d'Abonnement *</Label>
                            <Select
                                value={formData.pack}
                                onValueChange={(value) => setFormData({ ...formData, pack: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PACKS.map((pack) => (
                                        <SelectItem key={pack.value} value={pack.value}>
                                            <div>
                                                <div className="font-semibold">{pack.label}</div>
                                                <div className="text-xs text-gray-500">{pack.description}</div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Systeme ERP URL */}
                        <div className="col-span-2">
                            <Label htmlFor="erpnextUrl">URL Systeme ERP (optionnel)</Label>
                            <Input
                                id="erpnextUrl"
                                value={formData.erpnextUrl}
                                onChange={(e) => setFormData({ ...formData, erpnextUrl: e.target.value })}
                                placeholder="https://erp.company.com"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Créer le Tenant
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
