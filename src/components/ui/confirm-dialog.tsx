import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title = "Konfirmasi Hapus",
  description = "Apakah Anda yakin ingin menghapus item ini? Tindakan ini tidak dapat dibatalkan.",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 relative">
        <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{description}</p>
        <div className="flex justify-end gap-3">
          <Button
            onClick={onCancel}
            variant="outline"
            className="border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Batal
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-rose-600 hover:bg-rose-700 text-white shadow-md"
          >
            Hapus
          </Button>
        </div>
      </div>
    </div>
  );
}
