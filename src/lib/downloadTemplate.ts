import { toast } from "sonner";

/**
 * Download an xlsx file from a server template endpoint.
 */
export async function downloadFromTemplate(endpoint: string, filename: string) {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Sesi tidak ditemukan, silakan masuk kembali");
      return;
    }
    const res = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.message || `HTTP ${res.status}`);
    }

    const contentType = res.headers.get("content-type") || "";
    const isSpreadsheet = contentType.includes("spreadsheetml")
      || contentType.includes("application/vnd.ms-excel")
      || contentType.includes("application/octet-stream");
    if (!isSpreadsheet) {
      // Unexpected content type — likely an error response with 200 status
      const text = await res.text().catch(() => "");
      throw new Error(text || "Server mengembalikan respons dengan format tidak dikenal");
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Small delay before revoking to ensure the browser starts the download
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    toast.success(`Berhasil mengunduh ${filename}`);
  } catch (err: any) {
    toast.error("Gagal mengunduh laporan", { description: err.message });
  }
}
