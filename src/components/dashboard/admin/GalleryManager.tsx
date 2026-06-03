import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Plus, Trash2, Save, HelpCircle, Download, Image } from "lucide-react";

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
          if (data.data.length > 0 && !selectedId && !isAdding) {
            selectItem(data.data[0]);
          }
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
  };

  const startAdd = () => {
    setIsAdding(true);
    setSelectedId(null);
    setNamaFile("");
    setKategori(GALLERY_CATEGORIES[0]);
    setTanggalPosting(new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }).toUpperCase());
    setFoto("");
    setStatus("PUBLISH");
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
        setIsAdding(false);
        fetchGallery();
      } else {
        alert("Gagal menyimpan: " + (data.message || "Error tidak diketahui"));
      }
    } catch (e) {
      alert("Terjadi kesalahan saat menyimpan data galeri");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm("Apakah Anda yakin ingin menghapus foto galeri ini?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/gallery/${selectedId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSelectedId(null);
        startAdd();
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
        const token = localStorage.getItem("token");
        let successCount = 0;
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.replace(/^"|"$/g, "").trim());
          if (cols.length < 2) continue;
          try {
            const res = await fetch("/api/gallery", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                namaFile: cols[0] || "",
                kategori: cols[1] || GALLERY_CATEGORIES[0],
                tanggalPosting: cols[2] || "",
                foto: cols[3] || "",
                status: cols[4] || "PUBLISH",
              }),
            });
            const data = await res.json();
            if (data.success) successCount++;
          } catch {}
        }
        alert(`Berhasil mengimpor ${successCount} data galeri!`);
        fetchGallery();
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
    <div className="bg-slate-50 min-h-screen text-slate-800 text-left p-2 sm:p-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-cyan-950 uppercase tracking-tight">Manajemen Galeri</h2>
          <p className="text-slate-500 text-xs font-semibold mt-1">Kelola foto kegiatan PKBM Menuju Makmur berdasarkan kategori</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={startAdd} className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl flex items-center gap-2">
            <Plus size={16} /> Tambah Data
          </Button>
          <input type="file" ref={importInputRef} className="hidden" accept=".csv" onChange={handleImportCSV} />
          <Button onClick={() => importInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl flex items-center gap-2">
            <Upload size={16} /> Upload CSV
          </Button>
          <Button onClick={handleExportCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl flex items-center gap-2">
            <Download size={16} /> Download CSV
          </Button>
        </div>
      </div>

      {/* Category Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#f28b82] rounded-2xl p-5 text-center text-xs font-black text-white uppercase leading-relaxed shadow-md">
          <div className="flex justify-start gap-1 mb-3">
            {[1,2,3,4].map(i => <div key={i} className={`h-3 w-3 rounded-full ${i === 1 ? 'bg-red-700' : i === 2 ? 'bg-yellow-400' : i === 3 ? 'bg-green-400' : 'bg-gray-300'}`} />)}
          </div>
          CATATAN : KATEGORI TETAP TIDAK BISA DITAMBAHKAN (KEGIATAN PEMBELAJARAN, KEGIATAN KURSUS DAN PELATIHAN, KEGIATAN LUAR KELAS, KEGIATAN UJIAN, KEGIATAN PENGABDIAN MASYARAKAT DAN LINGKUNGAN, KEGIATAN LEMBAGA, KEGIATAN LOMBA DAN KEGIATAN LAINNYA)
        </div>
        <div className="bg-[#f28b82] rounded-2xl p-5 text-center text-xs font-black text-white uppercase leading-relaxed shadow-md">
          <div className="flex justify-center gap-1.5 mb-3">
            {[1,2,3,4,5,6,7].map(i => <div key={i} className={`h-2.5 w-2.5 rounded-full ${i <= 3 ? 'bg-white' : 'bg-white/40'}`} />)}
          </div>
          CATATAN : APABILA SIMPAN LANGSUNG MASUK KE HALAMAN SESUAI KATEGORI
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 mb-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Cari Berdasarkan Kategori (Drop Down)</h3>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-48">
            <select
              className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              value={searchFilterKategori}
              onChange={(e) => setSearchFilterKategori(e.target.value)}
            >
              <option value="">Semua Kategori</option>
              {GALLERY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <Button onClick={handleFilter} className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs h-9 px-5">Filter</Button>
          <Button onClick={handleReset} variant="outline" className="rounded-xl text-xs font-bold text-slate-500 h-9 px-4">Reset</Button>
        </div>
      </div>

      {/* Table + Form Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Table */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <h3 className="font-black text-cyan-950 uppercase text-sm tracking-wide">Daftar Galeri ({totalItems})</h3>
            <span className="text-xs text-slate-400 font-semibold">Klik untuk edit</span>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
              <span className="text-slate-500 text-xs font-semibold">Memuat data...</span>
            </div>
          ) : totalItems === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-2xl">
              <HelpCircle size={40} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-500 text-xs font-bold">Belum ada data galeri.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                    <th className="p-3 text-center w-10">NO</th>
                    <th className="p-3">NAMA FILE</th>
                    <th className="p-3">KATEGORI</th>
                    <th className="p-3">TANGGAL POSTING</th>
                    <th className="p-3 text-center">FOTO</th>
                    <th className="p-3 text-center">STATUS</th>
                    <th className="p-3 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {currentItems.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/50 cursor-pointer transition font-medium ${selectedId === item.id ? "bg-purple-50/70" : ""}`}
                    >
                      <td className="p-3 text-center text-slate-400">{indexOfFirstItem + idx + 1}</td>
                      <td className="p-3 font-bold text-[#280f91] max-w-[120px] truncate">{item.namaFile}</td>
                      <td className="p-3 text-slate-600 text-[10px] max-w-[160px]">{item.kategori}</td>
                      <td className="p-3 text-slate-500">{item.tanggalPosting}</td>
                      <td className="p-3 text-center">
                        {item.foto ? (
                          <img src={item.foto} alt={item.namaFile} className="h-10 w-10 object-cover rounded-lg border border-slate-200 mx-auto" />
                        ) : (
                          <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center mx-auto">
                            <Image size={14} className="text-slate-400" />
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${item.status === "PUBLISH" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-600"}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => selectItem(item)}
                            className="text-[10px] font-black text-blue-600 hover:text-blue-800 px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => { selectItem(item); setTimeout(() => handleDelete(), 50); }}
                            className="text-[10px] font-black text-red-600 hover:text-red-800 px-2 py-0.5 rounded-lg bg-red-50 hover:bg-red-100 transition cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-400 font-semibold">
                {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, totalItems)} dari {totalItems}
              </span>
              <div className="flex items-center gap-1">
                <Button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} variant="outline" size="sm" className="rounded-lg text-xs">Previous</Button>
                <span className="text-xs font-black px-2">{currentPage}</span>
                <Button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} variant="outline" size="sm" className="rounded-lg text-xs">Next</Button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Form */}
        <div className="lg:col-span-5 bg-[#00bcd4] rounded-3xl p-6 shadow-md text-white border border-cyan-400">
          <div className="pb-4 border-b border-white/20 mb-5">
            <h3 className="text-base font-black uppercase tracking-wide">
              {isAdding ? "Tambah Foto Galeri" : "Detail Foto Galeri"}
            </h3>
            <p className="text-cyan-100 text-[11px] font-semibold mt-1">Isi informasi dan upload foto kegiatan</p>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-slate-800">
            {/* Nama File */}
            <div>
              <label className="block text-[10px] font-black uppercase text-white/95 mb-1">Nama File / Keterangan</label>
              <input
                type="text"
                required
                className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                placeholder="Contoh: Dokumentasi Ujian CBT 2024"
                value={namaFile}
                onChange={(e) => setNamaFile(e.target.value)}
              />
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-[10px] font-black uppercase text-white/95 mb-1">Kategori Kegiatan</label>
              <select
                className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
              >
                {GALLERY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Tanggal Posting */}
            <div>
              <label className="block text-[10px] font-black uppercase text-white/95 mb-1">Tanggal Posting</label>
              <input
                type="text"
                required
                className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                placeholder="Contoh: 20 JANUARI 2024"
                value={tanggalPosting}
                onChange={(e) => setTanggalPosting(e.target.value)}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] font-black uppercase text-white/95 mb-1">Status</label>
              <select
                className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="PUBLISH">PUBLISH</option>
                <option value="DRAFT">DRAFT</option>
              </select>
            </div>

            {/* Foto Upload */}
            <div>
              <label className="block text-[10px] font-black uppercase text-white/95 mb-1">Foto Kegiatan</label>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative w-full rounded-xl border-2 border-dashed cursor-pointer transition flex flex-col items-center justify-center text-center overflow-hidden ${dragActive ? "border-yellow-300 bg-yellow-50/20" : "border-white/30 bg-white/10 hover:bg-white/20"}`}
                style={{ minHeight: foto ? "auto" : "110px" }}
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
              {foto && (
                <input
                  type="text"
                  className="w-full mt-2 text-[10px] font-mono border border-transparent rounded-lg px-2.5 py-1.5 bg-white focus:outline-none"
                  value={foto}
                  onChange={(e) => setFoto(e.target.value)}
                  placeholder="URL foto"
                />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" className="flex-1 bg-white text-cyan-800 hover:bg-slate-100 font-black rounded-xl flex items-center justify-center gap-2 text-xs cursor-pointer">
                <Save size={15} /> Simpan
              </Button>
              {selectedId && !isAdding && (
                <Button type="button" onClick={handleDelete} variant="outline" className="bg-red-600 hover:bg-red-700 text-white border-red-600 font-black rounded-xl text-xs flex items-center gap-2 cursor-pointer">
                  <Trash2 size={15} /> Hapus
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
