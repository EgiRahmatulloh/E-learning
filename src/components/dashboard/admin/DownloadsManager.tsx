import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Upload, Plus, Trash2, Edit, Save, FileText, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";

interface DownloadItem {
  id: number;
  namaFile: string;
  kategori: string;
  fileUrl: string;
  hits: number;
  status: string; // 'PUBLISH', 'DRAFT'
  tanggalUpload: string;
}

const STATIC_CATEGORIES = [
  "MODUL PEMBELAJARAN",
  "ADMINISTRASI KURIKULUM",
  "ADMINISTRASI TUTOR",
  "ADMINISTRASI WB",
  "ADMINISTRASI KELEMBAGAAN"
];

export default function DownloadsManager() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [selectedCategory, setSelectedCategory] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Form Dialog States
  const [formOpen, setFormOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(true);
  const [selectedItem, setSelectedItem] = useState<DownloadItem | null>(null);

  // Form inputs
  const [namaFile, setNamaFile] = useState("");
  const [kategori, setKategori] = useState(STATIC_CATEGORIES[0]);
  const [fileUrl, setFileUrl] = useState("");
  const [status, setStatus] = useState("PUBLISH");
  const [tanggalUpload, setTanggalUpload] = useState("");

  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchDownloads();
  }, []);

  const fetchDownloads = () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    fetch("/api/downloads/admin", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setDownloads(data.data);
        }
      })
      .catch((err) => console.error("Failed to load downloads:", err))
      .finally(() => setLoading(false));
  };

  const handleFilter = () => {
    setFilterCategory(selectedCategory);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSelectedCategory("");
    setFilterCategory("");
    setCurrentPage(1);
  };

  const openAddForm = () => {
    setIsAdding(true);
    setSelectedItem(null);
    setNamaFile("");
    setKategori(STATIC_CATEGORIES[0]);
    setFileUrl("");
    setStatus("PUBLISH");
    setTanggalUpload(new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }));
    setFormOpen(true);
  };

  const openEditForm = (item: DownloadItem) => {
    setIsAdding(false);
    setSelectedItem(item);
    setNamaFile(item.namaFile);
    setKategori(item.kategori);
    setFileUrl(item.fileUrl);
    setStatus(item.status);
    setTanggalUpload(item.tanggalUpload);
    setFormOpen(true);
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    const body = new FormData();
    body.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setFileUrl(data.url);
      } else {
        alert("Upload gagal: " + (data.message || "Error tidak diketahui"));
      }
    } catch (e) {
      console.error(e);
      alert("Error mengupload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileUpload(e.target.files[0]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaFile || !fileUrl) {
      alert("Nama File dan Berkas File wajib diisi!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const url = isAdding ? "/api/downloads" : `/api/downloads/${selectedItem?.id}`;
      const method = isAdding ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          namaFile,
          kategori,
          fileUrl,
          status,
          tanggalUpload,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFormOpen(false);
        fetchDownloads();
      } else {
        alert("Gagal menyimpan dokumen: " + (data.message || ""));
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan sistem saat menyimpan data.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus file ini?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/downloads/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        fetchDownloads();
      } else {
        alert("Gagal menghapus file: " + (data.message || ""));
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan sistem saat menghapus data.");
    }
  };

  // Filter list
  const filteredDownloads = downloads.filter((item) => {
    return !filterCategory || item.kategori === filterCategory;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredDownloads.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDownloads.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div className="space-y-1 text-left">
          <h1 className="text-2xl font-black text-[#1a0b70] uppercase flex items-center gap-2">
            <FileText className="h-6 w-6 text-[#9c27b0]" /> Manajemen File Download
          </h1>
          <p className="text-slate-500 text-xs font-semibold">
            Unggah modul pembelajaran, administrasi kurikulum, administrasi tutor, administrasi WB, dan administrasi kelembagaan.
          </p>
        </div>

        <Button
          onClick={openAddForm}
          className="rounded-xl bg-[#9c27b0] hover:bg-[#ff6105] text-white font-extrabold text-xs px-5 h-11 cursor-pointer transition-all shadow-md flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> TAMBAH DATA
        </Button>
      </div>

      {/* FILTER & NOTE ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Filter Dropdown */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="space-y-4 text-left">
            <h3 className="text-sm font-black text-[#1a0b70] uppercase">Cari & Filter Kategori</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-11 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-bold bg-white"
              >
                <option value="">CARI BERDASARKAN KATEGORI (DROP DOWN)</option>
                {STATIC_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <Button
                  onClick={handleFilter}
                  className="flex-1 h-11 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs cursor-pointer tracking-wider"
                >
                  FILTER
                </Button>
                <Button
                  onClick={handleReset}
                  className="flex-1 h-11 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs cursor-pointer tracking-wider"
                >
                  RESET
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Pink notebook sticky-note matching mockup */}
        <div className="bg-[#ffb3c1] rounded-3xl shadow-lg border border-[#ffa3b6] relative p-5 text-left overflow-hidden">
          {/* Binder holes at the top */}
          <div className="flex justify-center gap-5 -mt-3.5 mb-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-slate-800 border border-white"></div>
                <div className="h-2 w-1.5 bg-slate-400/40 -mt-0.5 rounded-b-md"></div>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-[#7d0022]">
            <h4 className="text-[10px] font-black tracking-widest uppercase border-b border-[#ffa3b6] pb-1">Catatan Sistem</h4>
            <p className="text-[11px] font-extrabold leading-relaxed">
              KATEGORI TETAP TIDAK BISA DITAMBAHKAN (MODUL PEMBELAJARAN, ADMINISTRASI KURIKULUM, ADMINISTRASI TUTOR, ADMINISTRASI WB, ADMINISTRASI KELEMBAGAAN)
            </p>
          </div>
        </div>

      </div>

      {/* TABLE PANEL */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-black text-[#1a0b70] uppercase">Daftar Dokumen</h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            Total: {filteredDownloads.length} data
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#9c27b0] border-t-transparent" />
            <span className="text-xs font-extrabold text-[#9c27b0] uppercase tracking-widest">Memuat file download...</span>
          </div>
        ) : currentItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-450 font-black uppercase">
                  <th className="py-4 px-6 text-center w-12">NO</th>
                  <th className="py-4 px-6">NAMA FILE</th>
                  <th className="py-4 px-6">KATEGORI</th>
                  <th className="py-4 px-6">TANGGAL POSTING</th>
                  <th className="py-4 px-6 text-center">HITS</th>
                  <th className="py-4 px-6 text-center">STATUS</th>
                  <th className="py-4 px-6 text-center w-36">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                {currentItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 text-center text-slate-400 font-mono">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-slate-800">
                      {item.namaFile}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="inline-flex items-center rounded-full bg-purple-50 border border-purple-100 px-2.5 py-0.5 text-[10px] font-extrabold text-purple-700 uppercase tracking-wide">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-500">
                      {item.tanggalUpload}
                    </td>
                    <td className="py-3.5 px-6 text-center font-mono">
                      <span className="bg-slate-100 text-slate-600 font-black px-2 py-0.5 rounded text-[10px]">
                        {item.hits} Download
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        item.status === 'PUBLISH'
                          ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                          : "bg-amber-50 border border-amber-200 text-amber-700"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <div className="flex justify-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditForm(item)}
                          className="h-8 w-8 rounded-lg text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                          className="h-8 w-8 rounded-lg text-red-500 hover:text-red-650 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase">
                  Halaman {currentPage} dari {totalPages}
                </span>

                <div className="flex gap-1">
                  <Button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg bg-white border border-slate-200 text-[#280f91] hover:bg-slate-50 font-bold text-xs h-9 px-3 disabled:opacity-50 cursor-pointer"
                  >
                    Sebelumnya
                  </Button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-9 w-9 rounded-lg text-xs font-black transition-all ${
                        currentPage === page
                          ? "bg-[#280f91] text-white"
                          : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <Button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg bg-white border border-slate-200 text-[#280f91] hover:bg-slate-50 font-bold text-xs h-9 px-3 disabled:opacity-50 cursor-pointer"
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-14 text-center space-y-3">
            <div className="h-14 w-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto border border-orange-100">
              <ShieldAlert className="h-7 w-7 text-orange-500" />
            </div>
            <h4 className="text-sm font-black text-slate-800 uppercase">Tidak Ada Data Dokumen</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Silakan tambahkan dokumen baru menggunakan tombol Tambah Data.
            </p>
          </div>
        )}
      </div>

      {/* ADD / EDIT DIALOG FORM */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-xl bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl text-left overflow-y-auto max-h-[85vh]">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-lg font-black text-[#1a0b70] uppercase flex items-center gap-2">
              {isAdding ? <Plus className="h-5 w-5 text-[#9c27b0]" /> : <Edit className="h-5 w-5 text-[#9c27b0]" />}
              {isAdding ? "Tambah Dokumen Baru" : "Edit Data Dokumen"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="py-4 space-y-4 text-xs font-semibold text-slate-700">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">NAMA FILE</label>
              <input
                type="text"
                required
                placeholder="Nama dokumen file, e.g. MODUL SEJARAH KELAS XII"
                value={namaFile}
                onChange={(e) => setNamaFile(e.target.value)}
                className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">KATEGORI DOKUMEN</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-bold bg-white"
              >
                {STATIC_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">STATUS</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-bold bg-white"
                >
                  <option value="PUBLISH">PUBLISH</option>
                  <option value="DRAFT">DRAFT</option>
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">TANGGAL UPLOAD</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 20 Januari 2020"
                  value={tanggalUpload}
                  onChange={(e) => setTanggalUpload(e.target.value)}
                  className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                />
              </div>
            </div>

            {/* Drag & Drop File Document Uploader */}
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">BERKAS DOKUMEN (PDF/DOCX/ETC)</label>
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all ${
                  dragActive ? "border-[#9c27b0] bg-purple-50/50" : "border-slate-200 bg-slate-50"
                } h-36 flex flex-col justify-center items-center relative overflow-hidden`}
              >
                {fileUrl ? (
                  <div className="space-y-2">
                    <FileText className="h-10 w-10 text-emerald-600 mx-auto" />
                    <p className="text-[10px] font-black text-emerald-700 truncate max-w-sm">
                      {fileUrl}
                    </p>
                    <button
                      type="button"
                      onClick={() => setFileUrl("")}
                      className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer"
                    >
                      Hapus Berkas
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-slate-400 mx-auto" />
                    <p className="text-[10px] text-slate-500 font-bold">
                      {uploading ? "Mengupload..." : "Tarik berkas Anda ke sini, atau klik untuk memilih"}
                    </p>
                    <input
                      type="file"
                      onChange={handleFileInput}
                      disabled={uploading}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="rounded-xl border border-slate-200 font-extrabold px-6 h-11 text-xs text-slate-655 hover:bg-slate-55 cursor-pointer">
                  Batal
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={uploading}
                className="rounded-xl bg-[#9c27b0] hover:bg-[#ff6105] text-white font-extrabold text-xs px-6 h-11 shadow-md shadow-purple-500/20 cursor-pointer flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" /> Simpan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
