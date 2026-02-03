"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, ShoppingCart, User, Calendar, Trash2, Plus, Package } from "lucide-react";
import { DocumentHeader } from "@/components/ui/document-header";

interface OrderItem {
  item_code: string;
  qty: number;
  rate: number;
}

interface OrderFormData {
  customer: string;
  delivery_date: string;
  items: OrderItem[];
}

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: OrderFormData) => Promise<void>;
  customers: Array<{ name: string; customer_name: string }>;
  items: Array<{ item_code: string; item_name: string; standard_rate: number }>;
  type?: "order" | "quotation";
}

export function OrderForm({
  open,
  onOpenChange,
  onSubmit,
  customers,
  items: availableItems,
  type = "order",
}: OrderFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [customer, setCustomer] = React.useState("");
  const [deliveryDate, setDeliveryDate] = React.useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] as string
  );
  const [orderItems, setOrderItems] = React.useState<OrderItem[]>([
    { item_code: "", qty: 1, rate: 0 },
  ]);

  const addItem = () => {
    setOrderItems([...orderItems, { item_code: "", qty: 1, rate: 0 }]);
  };

  const removeItem = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    setOrderItems(prev => {
      const updated = [...prev];
      const currentItem = updated[index];
      if (!currentItem) return prev;

      if (field === "item_code") {
        const selectedItem = availableItems.find((i) => i.item_code === value);
        updated[index] = {
          item_code: value as string,
          qty: currentItem.qty,
          rate: selectedItem?.standard_rate || 0,
        };
      } else if (field === "qty") {
        updated[index] = { item_code: currentItem.item_code, qty: value as number, rate: currentItem.rate };
      } else if (field === "rate") {
        updated[index] = { item_code: currentItem.item_code, qty: currentItem.qty, rate: value as number };
      }
      return updated;
    });
  };

  const total = orderItems.reduce((sum, item) => sum + item.qty * item.rate, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || orderItems.some((item) => !item.item_code)) return;

    setLoading(true);
    try {
      await onSubmit({
        customer,
        delivery_date: deliveryDate,
        items: orderItems.filter((item) => item.item_code),
      });
      onOpenChange(false);
      setCustomer("");
      setOrderItems([{ item_code: "", qty: 1, rate: 0 }]);
    } finally {
      setLoading(false);
    }
  };

  const title = type === "order" ? "Nouvelle Commande" : "Nouveau Devis";
  const icon = type === "order" ? ShoppingCart : Package;
  const Icon = icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DocumentHeader title={type === "order" ? "Commande (SO)" : "Devis (QTN)"} />
            <DialogTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              {title}
            </DialogTitle>
            <DialogDescription>
              Selectionnez un client et ajoutez les articles.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="customer" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Client *
                </Label>
                <Select value={customer} onValueChange={setCustomer}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selectionnez un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.name} value={c.name}>
                        {c.customer_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="delivery_date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {type === "order" ? "Date de livraison" : "Valide jusqu'au"}
                </Label>
                <Input
                  id="delivery_date"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Articles</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="rounded-xl"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>

              <div className="space-y-2">
                {orderItems.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-end p-3 rounded-xl bg-muted/50"
                  >
                    <div className="col-span-5">
                      <Label className="text-xs text-muted-foreground">Article</Label>
                      <Select
                        value={item.item_code}
                        onValueChange={(value) => updateItem(index, "item_code", value)}
                      >
                        <SelectTrigger className="rounded-lg h-9">
                          <SelectValue placeholder="Selectionnez" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableItems.map((i) => (
                            <SelectItem key={i.item_code} value={i.item_code}>
                              {i.item_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">Quantite</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) =>
                          updateItem(index, "qty", parseInt(e.target.value) || 1)
                        }
                        className="rounded-lg h-9"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">Prix</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) =>
                          updateItem(index, "rate", parseFloat(e.target.value) || 0)
                        }
                        className="rounded-lg h-9"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">Total</Label>
                      <div className="h-9 flex items-center font-medium">
                        {(item.qty * item.rate).toLocaleString()} MAD
                      </div>
                    </div>

                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={orderItems.length === 1}
                        className="h-9 w-9 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2 border-t">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{total.toLocaleString()} MAD</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !customer || orderItems.some((item) => !item.item_code)}
              className="rounded-xl"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Creer {type === "order" ? "la commande" : "le devis"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
