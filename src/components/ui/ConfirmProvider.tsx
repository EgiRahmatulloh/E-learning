import React, { createContext, useContext, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, HelpCircle } from "lucide-react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context.confirm;
};

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: "" });
  const [resolveFn, setResolveFn] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opt: ConfirmOptions | string) => {
    return new Promise<boolean>((resolve) => {
      if (typeof opt === "string") {
        setOptions({
          message: opt,
          title: "Konfirmasi Tindakan",
          confirmText: "Ya, Lanjutkan",
          cancelText: "Batal",
          variant: opt.toLowerCase().includes("hapus") ? "danger" : "warning",
        });
      } else {
        setOptions({
          title: opt.title || "Konfirmasi Tindakan",
          message: opt.message,
          confirmText: opt.confirmText || "Ya, Lanjutkan",
          cancelText: opt.cancelText || "Batal",
          variant: opt.variant || (opt.message.toLowerCase().includes("hapus") ? "danger" : "warning"),
        });
      }
      setResolveFn(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const handleConfirm = () => {
    if (resolveFn) resolveFn(true);
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (resolveFn) resolveFn(false);
    setIsOpen(false);
  };

  // Expose to window object for legacy code to call as async confirm
  React.useEffect(() => {
    (window as any).asyncConfirm = confirm;
  }, [confirm]);

  const getIcon = () => {
    switch (options.variant) {
      case "danger":
        return <AlertTriangle className="h-10 w-10 text-red-500 bg-red-50 p-2 rounded-full animate-bounce" />;
      case "info":
        return <Info className="h-10 w-10 text-blue-500 bg-blue-50 p-2 rounded-full" />;
      default:
        return <HelpCircle className="h-10 w-10 text-amber-500 bg-amber-50 p-2 rounded-full" />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (options.variant) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all focus:ring-red-500 duration-200";
      case "info":
        return "bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all focus:ring-blue-500 duration-200";
      default:
        return "bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all focus:ring-amber-500 duration-200";
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl p-6 rounded-2xl bg-white overflow-hidden" showCloseButton={false}>
          <div className="flex flex-col items-center text-center gap-4 py-2">
            <div className="flex items-center justify-center">
              {getIcon()}
            </div>
            
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-xl font-semibold text-slate-900 tracking-tight">
                {options.title}
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-sm leading-relaxed px-2">
                {options.message}
              </DialogDescription>
            </DialogHeader>
          </div>

          <DialogFooter className="mt-4 flex gap-2 sm:justify-center border-t border-slate-100 pt-4 bg-transparent -mx-6 -mb-6 p-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1 border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-800 transition-colors duration-200 font-medium py-2.5 rounded-xl"
            >
              {options.cancelText}
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              className={`flex-1 font-medium py-2.5 rounded-xl ${getConfirmButtonClass()}`}
            >
              {options.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
};
