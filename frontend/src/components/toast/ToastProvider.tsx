// src/components/toast/ToastProvider.tsx
import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import "./ToastProvider.css"; // Добавь стили для тоста, если нужно
type ToastType = "success" | "error";

interface ToastContextProps {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
  <div
    className={`toast ${toast.type === "success" ? "toast-success" : "toast-error"}`}
  >
    {toast.message}
  </div>
)}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextProps => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};
