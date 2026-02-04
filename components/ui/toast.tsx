"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  title: string;
  description?: string;
  variant?: "default" | "success" | "error";
  onClose?: () => void;
}

export function Toast({ title, description, variant = "default", onClose }: ToastProps) {
  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-sm transition-all animate-in slide-in-from-bottom-5",
        variant === "success" && "border-success-100 bg-success-50/90 dark:border-green-800 dark:bg-green-950/90",
        variant === "error" && "border-danger-100 bg-red-50/90 dark:border-red-800 dark:bg-red-950/90",
        variant === "default" && "border-border bg-background/90"
      )}
    >
      <div className="flex-1">
        <p className={cn(
          "text-sm font-semibold",
          variant === "success" && "text-green-900 dark:text-green-100",
          variant === "error" && "text-red-900 dark:text-red-100"
        )}>
          {title}
        </p>
        {description && (
          <p className={cn(
            "text-sm mt-1",
            variant === "success" && "text-success-500 dark:text-success-100",
            variant === "error" && "text-danger-500 dark:text-danger-100",
            variant === "default" && "text-muted-foreground"
          )}>
            {description}
          </p>
        )}
      </div>
      {onClose && (
        <button onClick={onClose} className="rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/5">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// Toast context for global toast management
interface ToastContextType {
  showToast: (props: Omit<ToastProps, "onClose">) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<(ToastProps & { id: number })[]>([]);
  const idRef = React.useRef(0);

  const showToast = React.useCallback((props: Omit<ToastProps, "onClose">) => {
    const id = idRef.current++;
    setToasts((prev) => [...prev, { ...props, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
