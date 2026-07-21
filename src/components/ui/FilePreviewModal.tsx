import { useState, useEffect } from "react";
import { X, Download, Loader2, FileText, ZoomIn, ZoomOut } from "lucide-react";

interface FilePreviewModalProps {
  url: string | null;
  onClose: () => void;
}

const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp", "gif", "svg"];
const PDF_EXTS = ["pdf"];

// Buang query string (mis. ?token=jwt — JWT mengandung titik sehingga merusak
// deteksi ekstensi) sebelum mengambil ekstensi/nama file.
function getPathOnly(url: string): string {
  return url.split("?")[0];
}

function getExt(url: string): string {
  return getPathOnly(url).split(".").pop()?.toLowerCase() || "";
}

function getFileName(url: string): string {
  return getPathOnly(url).split("/").pop() || getPathOnly(url);
}

export default function FilePreviewModal({ url, onClose }: FilePreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (!url) return;
    setLoading(true);
    setZoom(100);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [url, onClose]);

  if (!url) return null;

  const ext = getExt(url);
  const isImage = IMAGE_EXTS.includes(ext);
  const isPdf = PDF_EXTS.includes(ext);

  // Authenticated fetch URL — file served through /api/files/:filename
  const authUrl = url.startsWith("/api/files/") ? url : url;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 text-slate-500 shrink-0" />
            <span className="text-sm font-bold text-slate-700 truncate">{getFileName(url)}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isImage && (
              <>
                <button
                  onClick={() => setZoom((z) => Math.max(z - 25, 25))}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-xs font-bold text-slate-500 w-10 text-center">{zoom}%</span>
                <button
                  onClick={() => setZoom((z) => Math.min(z + 25, 300))}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </>
            )}
            <a
              href={authUrl}
              download={getFileName(url)}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center min-h-0 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
              <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
            </div>
          )}

          {isImage ? (
            <img
              src={authUrl}
              alt={getFileName(url)}
              style={{ transform: `scale(${zoom / 100})`, maxWidth: zoom <= 100 ? "100%" : "none", maxHeight: zoom <= 100 ? "100%" : "none" }}
              className="object-contain transition-transform"
              onLoad={() => setLoading(false)}
              onError={() => setLoading(false)}
            />
          ) : isPdf ? (
            <iframe
              src={authUrl}
              className="w-full h-full min-h-[70vh] border-0"
              onLoad={() => setLoading(false)}
              title={getFileName(url)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-10 text-center" onLoad={() => setLoading(false)}>
              <FileText className="h-16 w-16 text-slate-300 mb-4" />
              <p className="text-sm font-bold text-slate-600 mb-1">Preview tidak tersedia</p>
              <p className="text-xs text-slate-400 mb-4">Format .{ext} tidak dapat ditampilkan di sini</p>
              <a
                href={authUrl}
                download={getFileName(url)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-colors"
              >
                <Download className="h-4 w-4" /> Download Berkas
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
