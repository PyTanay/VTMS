import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

let toastId = 0;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast Container */}
      <div
        style={{
          position: "fixed",
          top: "16px",
          right: "16px",
          zIndex: 10000,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          maxWidth: "400px",
        }}
      >
        {toasts.map((toast) => {
          const colors: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
            success: { bg: "#dcfce7", border: "#bbf7d0", text: "#166534", icon: "✅" },
            error: { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", icon: "❌" },
            info: { bg: "#e0f2fe", border: "#bae6fd", text: "#075985", icon: "ℹ️" },
            warning: { bg: "#fef3c7", border: "#fde68a", text: "#92400e", icon: "⚠️" },
          };
          const c = colors[toast.type];
          return (
            <div
              key={toast.id}
              style={{
                padding: "12px 16px",
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: "10px",
                color: c.text,
                fontWeight: 500,
                fontSize: "14px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                animation: "slideIn 0.3s ease-out",
                cursor: "pointer",
              }}
              onClick={() => removeToast(toast.id)}
            >
              <span>{c.icon}</span>
              <span style={{ flex: 1 }}>{toast.message}</span>
              <span style={{ cursor: "pointer", opacity: 0.6 }}>✕</span>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
