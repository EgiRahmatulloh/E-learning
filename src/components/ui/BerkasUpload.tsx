import { useState, useRef } from "react";
import { X, Eye, Loader2, CheckCircle2, FileUp } from "lucide-react";
import { toast } from "sonner";
import FilePreviewModal from "./FilePreviewModal";

export interface BerkasItem {
  label: string;
  key: string;
}

interface BerkasUploadProps {
  berkasTypes: BerkasItem[];
  value: Record<string, string>;
  onChange: (data: Record<string, string>) => void;
  isEditing: boolean;
  label?: string;
}

export default function BerkasUpload({
  berkasTypes,
  value,
  onChange,
  isEditing,
  label = "BERKAS DOKUMEN",
}: BerkasUploadProps) {
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleUpload = async (file: File, key: string) => {
    setUploadingKey(key);
    const body = new FormData();
    body.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = await res.json();
      if (data.success && data.url) {
        onChange({ ...value, [key]: data.url });
        toast.success(`${berkasTypes.find((b) => b.key === key)?.label || "Berkas"} berhasil diunggah!`);
      } else {
        toast.error("Upload gagal: " + (data.message || "Error tidak diketahui"));
      }
    } catch {
      toast.error("Error mengunggah berkas");
    } finally {
      setUploadingKey(null);
    }
  };

  const handleDelete = (key: string) => {
    const newData = { ...value };
    delete newData[key];
    onChange(newData);
  };

  const handlePreview = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Append token for authenticated preview
    const token = localStorage.getItem("token");
    const separator = url.includes("?") ? "&" : "?";
    setPreviewUrl(`${url}${separator}token=${token}`);
  };

  const uploadedCount = berkasTypes.filter((b) => value[b.key]).length;

  return (
    <>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black text-cyan-50 uppercase tracking-wider">
            {label}
          </label>
          <span className="text-[8px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
            {uploadedCount}/{berkasTypes.length}
          </span>
        </div>

        <div className="bg-white rounded-lg border-2 border-white divide-y divide-slate-100 overflow-hidden">
          {berkasTypes.map((berkas) => {
            const url = value[berkas.key];
            const isUploading = uploadingKey === berkas.key;

            return (
              <div
                key={berkas.key}
                onClick={() => {
                  if (!url && isEditing && !isUploading) fileInputRefs.current[berkas.key]?.click();
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 group transition-colors ${!url && isEditing ? "cursor-pointer hover:bg-purple-50" : "hover:bg-slate-50"}`}
              >
                <input
                  ref={(el) => { fileInputRefs.current[berkas.key] = el; }}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.zip,.rar,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) { handleUpload(file, berkas.key); e.target.value = ""; }
                  }}
                  className="hidden"
                  disabled={!isEditing || isUploading}
                />

                {/* Label */}
                <span className={`text-[9px] font-black flex-1 min-w-0 truncate ${url ? "text-slate-700" : "text-slate-400"}`}>
                  {berkas.label}
                </span>

                {/* Actions */}
                {isUploading ? (
                  <Loader2 className="h-3 w-3 text-purple-500 animate-spin shrink-0" />
                ) : url ? (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <button
                      type="button"
                      onClick={(e) => handlePreview(url, e)}
                      className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      title="Preview"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDelete(berkas.key); }}
                        className="p-0.5 rounded hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Hapus"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ) : isEditing ? (
                  <FileUp className="h-3 w-3 text-purple-400 group-hover:text-purple-600 shrink-0 transition-colors" />
                ) : (
                  <FileUp className="h-3 w-3 text-slate-300 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview Modal */}
      <FilePreviewModal
        url={previewUrl}
        onClose={() => setPreviewUrl(null)}
      />
    </>
  );
}
