import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Plus, Trash2, Save, HelpCircle, Download, Image, X, Edit3, Filter, RotateCcw } from "lucide-react";

const GALLERY_CATEGORIES = [
  "KEGIATAN PEMBELAJARAN",
  "KEGIATAN KURSUS DAN PELATIHAN",
  "KEGIATAN LUAR KELAS",
  "KEGIATAN UJIAN",
  "KEGIATAN PENGABDIAN MASYARAKAT DAN LINGKUNGAN",
  "KEGIATAN LEMBAGA",
  "KEGIATAN LOMBA",
  "KEGIATAN LAINNYA",
];

interface GalleryItem {
  id: number;
  namaFile: string;
  kategori: string;
  tanggalPosting: string;
  foto: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function GalleryManager() {
  const [galleryList, setGalleryList] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [filterKategori, setFilterKategori] = useState("");
  const [searchFilterKategori, setSearchFilterKategori] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected / Form state
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form inputs
  const [namaFile, setNamaFile] = useState("");
  const [kategori, setKategori] = useState(GALLERY_CATEGORIES[0]);
  const [tanggalPosting, setTanggalPosting] = useState(new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }).toUpperCase());
  const [foto, setFoto] = useState("");
  const [status, setStatus] = useState("PUBLISH");
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    fetch("/api/gallery/admin", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setGalleryList(data.data);
        }
      })
      .catch((err) => console.error("Failed to load gallery:", err))
      .finally(() => setLoading(false));
  };

  const selectItem = (item: GalleryItem) => {
    setIsAdding(false);
    setSelectedId(item.id);
    setNamaFile(item.namaFile);
    setKategori(item.kategori);
    setTanggalPosting(item.tanggalPosting);
    setFoto(item.foto);
    setStatus(item.status);
    setIsFormOpen(true);
  };

  const startAdd = () => {
    setIsAdding(true);
    setSelectedId(null);
    setNamaFile("");
    setKategori(GALLERY_CATEGORIES[0]);
    setTanggalPosting(new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }).toUpperCase());
    setFoto("");
    setStatus("PUBLISH");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedId(null);
    setIsAdding(false);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
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
        setFoto(data.url);
      } else {
        alert("Upload gagal: " + (data.message || "Error tidak diketahui"));
      }
    } catch (e) {
      alert("Error mengunggah foto");
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        await handleImageUpload(file);
      } else {
        alert("Hanya file gambar yang diperbolehkan");
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const payload = { namaFile, kategori, tanggalPosting, foto, status };

    try {
      let res;
      if (isAdding) {
        res = await fetch("/api/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/gallery/${selectedId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (data.success) {
        alert("Data galeri berhasil disimpan!");
        closeForm();
        fetchGallery();
      } else {
        alert("Gagal menyimpan: " + (data.message || "Error tidak diketahui"));
      }
    } catch (e) {
      alert("Terjadi kesalahan saat menyimpan data galeri");
    }
  };

  const handleDelete = async (itemId?: number) => {
    const idToDelete = itemId || selectedId;
    if (!idToDelete) return;
    if (!confirm("Apakah Anda yakin ingin menghapus foto galeri ini?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/gallery/${idToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        closeForm();
        fetchGallery();
      } else {
        alert("Gagal menghapus: " + (data.message || "Error tidak diketahui"));
      }
    } catch (e) {
      alert("Terjadi kesalahan saat menghapus data galeri");
    }
  };

  const handleExportCSV = () => {
    if (galleryList.length === 0) return;
    const headers = ["Nama File", "Kategori", "Tanggal Posting", "Foto", "Status"];
    const csvContent = [
      headers.join(","),
      ...galleryList.map((item) =>
        [
          `"${item.namaFile.replace(/"/g, '""')}"`,
          `"${item.kategori}"`,
          `"${item.tanggalPosting}"`,
          `"${item.foto}"`,
          `"${item.status}"`,
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `data-galeri-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length <= 1) return;
        
        const importedList = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.replace(/^"|"$/g, "").trim());
          if (cols.length < 2) continue;
          importedList.push({
            namaFile: cols[0] || "",
            kategori: cols[1] || GALLERY_CATEGORIES[0],
            tanggalPosting: cols[2] || "",
            foto: cols[3] || "",
            status: cols[4] || "PUBLISH",
          });
        }

        if (importedList.length === 0) return;

        const token = localStorage.getItem("token");
        try {
          const res = await fetch("/api/gallery/import", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(importedList),
          });
          const data = await res.json();
          if (data.success) {
            alert(data.message || `Berhasil mengimpor data galeri!`);
            fetchGallery();
          } else {
            alert("Gagal mengimpor: " + (data.message || "Error tidak diketahui"));
          }
        } catch (e) {
          alert("Terjadi kesalahan saat mengimpor data galeri");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFilter = () => {
    setFilterKategori(searchFilterKategori);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchFilterKategori("");
    setFilterKategori("");
    setCurrentPage(1);
  };

  const filteredList = galleryList.filter((item) => {
    return filterKategori ? item.kategori === filterKategori : true;
  });

  const totalItems = filteredList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-cyan-900 tracking-tight flex items-center gap-2">
            <span>🖼️</span> MANAJEMEN GALERI
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Kelola foto kegiatan PKBM Menuju Makmur berdasarkan kategori.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={startAdd}
            className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md shadow-purple-200 uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" /> TAMBAH BARU
          </Button>
          <input type="file" ref={importInputRef} className="hidden" accept=".csv" onChange={handleImportCSV} />
          <Button
            onClick={() => importInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md shadow-blue-200 uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Upload className="h-4 w-4" /> UPLOAD CSV
          </Button>
          <Button
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md shadow-emerald-200 uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Download className="h-4 w-4" /> DOWNLOAD CSV
          </Button>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <select
            value={searchFilterKategori}
            onChange={(e) => setSearchFilterKategori(e.target.value)}
            className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 font-bold bg-white text-slate-700 shadow-inner"
          >
            <option value="">CARI BERDASARKAN KATEGORI (DROP DOWN)</option>
            {GALLERY_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <Button
              onClick={handleFilter}
              className="flex-1 h-10 rounded-xl bg-[#00badb] hover:bg-[#009cb9] text-white font-extrabold text-xs cursor-pointer tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all uppercase"
            >
              <Filter className="h-4 w-4" /> FILTER
            </Button>
            <Button
              onClick={handleReset}
              className="flex-1 h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs cursor-pointer tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all uppercase"
            >
              <RotateCcw className="h-4 w-4" /> RESET
            </Button>
          </div>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
            Daftar Galeri ({totalItems})
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#9c27b0] border-t-transparent" />
            <span className="text-xs font-extrabold text-[#9c27b0] uppercase tracking-widest">Memuat galeri...</span>
          </div>
        ) : currentItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#00badb] text-white font-black text-sm uppercase">
                  <th className="py-4 px-6 border-r border-[#009cb9] text-center w-16">NO</th>
                  <th className="py-4 px-6 border-r border-[#009cb9]">NAMA FILE</th>
                  <th className="py-4 px-6 border-r border-[#009cb9] w-72">KATEGORI</th>
                  <th className="py-4 px-6 border-r border-[#009cb9] text-center w-48">TANGGAL POSTING</th>
                  <th className="py-4 px-6 border-r border-[#009cb9] text-center w-28">FOTO</th>
                  <th className="py-4 px-6 border-r border-[#009cb9] text-center w-36">STATUS</th>
                  <th className="py-4 px-6 text-center w-48">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {currentItems.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 hover:bg-cyan-50/20 font-bold text-slate-700 transition-colors"
                  >
                    <td className="py-4 px-6 border-r border-slate-100 text-center text-slate-500 font-mono">
                      {indexOfFirstItem + idx + 1}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 font-bold text-slate-800">
                      {item.namaFile}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100">
                      <span className="inline-flex items-center rounded-full bg-purple-50 border border-purple-100 px-2.5 py-0.5 text-[10px] font-extrabold text-purple-700 uppercase tracking-wide">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 text-center font-mono text-slate-500">
                      {item.tanggalPosting}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 text-center">
                      {item.foto ? (
                        <img src={item.foto} alt={item.namaFile} className="h-10 w-10 object-cover rounded-lg border border-slate-200 mx-auto shadow-xs" />
                      ) : (
                        <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center mx-auto border border-slate-200">
                          <Image size={14} className="text-slate-400" />
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 text-center">
                      <span
                        className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-black uppercase tracking-wider ${
                          item.status === "PUBLISH"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Button
                          onClick={() => selectItem(item)}
                          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 h-9 px-3.5 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-xs transition-all"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-blue-600" /> Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(item.id)}
                          className="bg-white border border-slate-200 hover:bg-rose-50 text-rose-600 h-9 px-3.5 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-xs transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 space-y-2 border-t border-slate-100">
            <HelpCircle size={40} className="text-slate-300" />
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Belum ada data galeri.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-5 border-t border-slate-100 bg-slate-50/50">
            <span className="text-xs text-slate-400 font-semibold">
              Menampilkan {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, totalItems)} dari {totalItems} data
            </span>
            <div className="flex items-center gap-1">
              <Button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} variant="outline" size="sm" className="rounded-lg text-xs font-bold text-slate-500">Previous</Button>
              <span className="text-xs font-black px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-xs">{currentPage}</span>
              <Button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} variant="outline" size="sm" className="rounded-lg text-xs font-bold text-slate-500">Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* POPUP / MODAL FORM DIALOG */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={closeForm} />

          {/* Form Container */}
          <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200 border-4 border-cyan-400 z-10">
            {/* Form Column (Cyan Background) */}
            <div className="bg-[#00badb] p-6 relative text-white">
              {/* Close Button */}
              <button
                onClick={closeForm}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-6">
                <span className="inline-block bg-[#9c27b0] text-white font-extrabold text-[11px] px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                  {isAdding ? "TAMBAH FOTO GALERI" : "EDIT FOTO GALERI"}
                </span>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-left">
                {/* Nama File */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black tracking-wider uppercase text-cyan-50 block">Nama File / Keterangan</label>
                  <input
                    type="text"
                    required
                    className="w-full h-11 px-4 text-sm border-0 rounded-lg bg-white font-bold text-slate-800 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all shadow-inner placeholder-slate-400"
                    placeholder="Contoh: Dokumentasi Ujian CBT 2024"
                    value={namaFile}
                    onChange={(e) => setNamaFile(e.target.value)}
                  />
                </div>

                {/* Kategori */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black tracking-wider uppercase text-cyan-50 block">Kategori Kegiatan</label>
                  <select
                    className="w-full h-11 px-4 text-sm border-0 rounded-lg bg-white font-bold text-slate-800 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all cursor-pointer shadow-inner uppercase tracking-wider"
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                  >
                    {GALLERY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Tanggal Posting */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black tracking-wider uppercase text-cyan-50 block">Tanggal Posting</label>
                  <input
                    type="text"
                    required
                    className="w-full h-11 px-4 text-sm border-0 rounded-lg bg-white font-bold text-slate-800 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all shadow-inner placeholder-slate-400 uppercase tracking-wider"
                    placeholder="Contoh: 20 JANUARI 2024"
                    value={tanggalPosting}
                    onChange={(e) => setTanggalPosting(e.target.value)}
                  />
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black tracking-wider uppercase text-cyan-50 block">Status</label>
                  <select
                    className="w-full h-11 px-4 text-sm border-0 rounded-lg bg-white font-bold text-slate-800 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all cursor-pointer shadow-inner uppercase tracking-wider"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="PUBLISH">PUBLISH</option>
                    <option value="DRAFT">DRAFT</option>
                  </select>
                </div>

                {/* Foto Upload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black tracking-wider uppercase text-cyan-50 block">Foto Kegiatan</label>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative w-full rounded-xl border-2 border-dashed cursor-pointer transition flex flex-col items-center justify-center text-center overflow-hidden min-h-[110px] ${
                      dragActive ? "border-yellow-300 bg-yellow-50/20" : "border-white/30 bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    {uploading ? (
                      <div className="py-6 flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-white" />
                        <span className="text-[10px] font-bold text-white">Mengunggah...</span>
                      </div>
                    ) : foto ? (
                      <div className="w-full">
                        <img src={foto} alt="Preview" className="w-full h-44 object-cover rounded-xl" />
                        <p className="text-[9px] text-white/70 font-bold py-1.5">Klik untuk ganti foto</p>
                      </div>
                    ) : (
                      <div className="py-6 space-y-2">
                        <Image size={28} className="text-white/60 mx-auto" />
                        <p className="text-[10px] font-bold text-white/80">Klik atau drag & drop foto di sini</p>
                        <p className="text-[9px] text-white/50">JPG, PNG, WEBP</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    className="w-full mt-2 text-[10px] font-mono border border-transparent rounded-lg px-2.5 py-2 bg-white text-slate-800 focus:outline-none"
                    value={foto}
                    onChange={(e) => setFoto(e.target.value)}
                    placeholder="Masukkan URL foto..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2 justify-end">
                  <Button
                    type="submit"
                    className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-sm px-8 h-11 rounded-full cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Save size={15} /> SIMPAN
                  </Button>
                  {selectedId && (
                    <Button
                      type="button"
                      onClick={() => handleDelete()}
                      className="bg-rose-600 hover:bg-rose-700 text-white border-0 font-extrabold text-sm px-6 h-11 rounded-full cursor-pointer shadow-md shadow-rose-900/30 uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Trash2 size={15} /> HAPUS
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
