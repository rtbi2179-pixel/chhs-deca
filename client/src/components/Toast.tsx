import { useEffect, useState } from "react";
import { X } from "lucide-react";

export interface ToastMessage {
  id: string;
  message: string;
  type: "info" | "error" | "success" | "warning";
  duration?: number;
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const duration = toast.duration || 3000;
    const timer = setTimeout(() => {
      setIsVisible(false);
      onRemove(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const bgColor = {
    info: "bg-blue-600/20 border-blue-600 text-blue-400",
    error: "bg-red-600/20 border-red-600 text-red-400",
    success: "bg-green-600/20 border-green-600 text-green-400",
    warning: "bg-yellow-600/20 border-yellow-600 text-yellow-400",
  }[toast.type];

  if (!isVisible) return null;

  return (
    <div
      className={`${bgColor} border rounded-lg p-4 flex items-center justify-between gap-4 max-w-sm animate-in fade-in slide-in-from-top-2 duration-300`}
    >
      <p className="text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          onRemove(toast.id);
        }}
        className="text-current hover:opacity-70"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (
    message: string,
    type: "info" | "error" | "success" | "warning" = "info",
    duration = 3000
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, removeToast };
}
