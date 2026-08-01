import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Upload, Plus, Trash2, Edit3, Save, FileText, Download, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { toast } from "sonner";

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
  const confirm = useConfirm();
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
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

  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const openAddForm = () => {
    setIsAdding(true);
    setSelectedItem(null);
    setNamaFile("");
    setKategori(STATIC_CATEGORIES[0]);
    setFileUrl("");
    setStatus("PUBLISH");
    setTanggalUpload(new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }));
    setIsEditing(true);
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
    setIsEditing(false);
    setFormOpen(true);
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    // File Pusat Unduhan harus bisa diunduh pengunjung publik tanpa login
    body.append("public", "true");

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
        toast.success("File berhasil diunggah!");
      } else {
        toast.error("Upload gagal: " + (data.message || "Error tidak diketahui"));
      }
    } catch (e) {
      console.error(e);
      toast.error("Error mengupload file");
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
      toast.error("Nama File dan Berkas File wajib diisi!");
      return;
    }

    setSaving(true);
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
        toast.success(isAdding ? "Dokumen berhasil ditambahkan!" : "Dokumen berhasil diperbarui!");
        setFormOpen(false);
        fetchDownloads();
      } else {
        toast.error("Gagal menyimpan dokumen: " + (data.message || ""));
      }
    } catch (e) {
      console.error(e);
      toast.error("Terjadi kesalahan sistem saat menyimpan data.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!await confirm({
      title: "Konfirmasi Hapus",
      message: "Apakah Anda yakin ingin menghapus file ini?",
      variant: "danger"
    })) return;

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
        toast.success("File berhasil dihapus!");
        setFormOpen(false);
        fetchDownloads();
      } else {
        toast.error("Gagal menghapus file: " + (data.message || ""));
      }
    } catch (e) {
      console.error(e);
      toast.error("Terjadi kesalahan sistem saat menghapus data.");
    }
  };

  const handleCategoryChange = (value: string) => {
    setFilterCategory(value);
    setCurrentPage(1);
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
    <div className="space-y-6 relative pb-16 animate-in fade-in duration-300">

      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-cyan-900 tracking-tight flex items-center gap-2">
            <span>📁</span> KELOLA WEBSITE FILE DOWNLOAD
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Unggah modul pembelajaran, administrasi kurikulum, administrasi tutor, administrasi WB, dan administrasi kelembagaan.
          </p>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {/* Table Search Bar + Action Buttons */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
            Daftar Dokumen ({filteredDownloads.length})
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full sm:w-64 h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 font-bold bg-white text-slate-700 shadow-inner"
            >
              <option value="">CARI BERDASARKAN KATEGORI</option>
              {STATIC_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <Button
              onClick={openAddForm}
              className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md shadow-purple-200 uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
            >
              <Plus className="h-4 w-4" /> TAMBAH DATA
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="h-10 w-10 text-[#9c27b0] animate-spin" />
            <span className="text-xs font-extrabold text-[#9c27b0] uppercase tracking-widest">Memuat file download...</span>
          </div>
        ) : currentItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#00badb] text-white font-black text-sm uppercase">
                  <th className="py-4 px-6 border-r border-[#009cb9] text-center w-16">NO</th>
                  <th className="py-4 px-6 border-r border-[#009cb9]">NAMA FILE</th>
                  <th className="py-4 px-6 border-r border-[#009cb9] w-64">KATEGORI</th>
                  <th className="py-4 px-6 border-r border-[#009cb9] text-center w-48">TANGGAL POSTING</th>
                  <th className="py-4 px-6 border-r border-[#009cb9] text-center w-32 font-mono">HITS</th>
                  <th className="py-4 px-6 border-r border-[#009cb9] text-center w-36">STATUS</th>
                  <th className="py-4 px-6 text-center w-36">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {currentItems.map((item, index) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-cyan-50/20 font-bold text-slate-700 transition-colors">
                    <td className="py-4 px-6 border-r border-slate-100 text-center text-slate-500 font-mono">
                      {indexOfFirstItem + index + 1}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 font-extrabold text-slate-900">
                      {item.namaFile}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100">
                      <span className="inline-flex items-center rounded-full bg-purple-50 border border-purple-100 px-2.5 py-0.5 text-[10px] font-extrabold text-purple-700 uppercase tracking-wide">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 font-mono text-slate-500 text-center">
                      {item.tanggalUpload}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 text-center font-mono">
                      <span className="bg-slate-100 text-slate-600 font-black px-2 py-0.5 rounded text-[10px]">
                        {item.hits} Download
                      </span>
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${item.status === 'PUBLISH'
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                        : "bg-amber-50 border border-amber-200 text-amber-700"
                        }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Button
                          onClick={() => openEditForm(item)}
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
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 h-9 px-3.5 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5 text-cyan-600" /> Unduh
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-end items-center gap-2.5 p-4 border-t border-slate-100">
                <Button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="bg-[#ffb300] hover:bg-[#ffa000] text-black font-extrabold text-xs h-9 px-4 rounded-xl cursor-pointer disabled:opacity-50 transition-all"
                >
                  <ChevronLeft className="h-4 w-4 mr-0.5" /> Previous
                </Button>

                <span className="h-9 w-9 flex items-center justify-center bg-[#ffb300] text-black font-black text-sm rounded-xl">
                  {currentPage}
                </span>

                <Button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="bg-[#ffb300] hover:bg-[#ffa000] text-black font-extrabold text-xs h-9 px-4 rounded-xl cursor-pointer disabled:opacity-50 transition-all"
                >
                  Next <ChevronRight className="h-4 w-4 ml-0.5" />
                </Button>
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
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => { setFormOpen(false); setIsEditing(false); }} />

          {/* Form Container */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 border-4 border-cyan-400 z-10">
            {/* Form Column (Cyan Background) */}
            <div className="bg-white p-6 relative">
              {/* Close Button */}
              <button
                onClick={() => { setFormOpen(false); setIsEditing(false); }}
                className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-6">
                <span className="inline-block bg-[#9c27b0] text-white font-extrabold text-[11px] px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                  {isAdding ? "TAMBAH DATA" : (!isEditing ? "DETAIL DATA" : "EDIT DATA")}
                </span>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-slate-800">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-black tracking-wider uppercase text-slate-500 block">NAMA FILE</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama dokumen file, e.g. MODUL SEJARAH KELAS XII"
                    value={namaFile}
                    onChange={(e) => setNamaFile(e.target.value)}
                    disabled={!isEditing}
                    className="w-full h-11 px-4 text-sm rounded-lg bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all shadow-inner placeholder-slate-400 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-black tracking-wider uppercase text-slate-500 block">KATEGORI DOKUMEN</label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    disabled={!isEditing}
                    className="w-full h-11 px-4 text-sm border-0 rounded-lg bg-white font-bold text-slate-800 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all cursor-pointer shadow-inner uppercase tracking-wider disabled:opacity-60"
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
                    <label className="text-xs font-black tracking-wider uppercase text-slate-500 block">STATUS</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      disabled={!isEditing}
                    className="w-full h-11 px-4 text-sm rounded-lg bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all cursor-pointer shadow-inner uppercase tracking-wider disabled:opacity-60"
                    >
                      <option value="PUBLISH">PUBLISH</option>
                      <option value="DRAFT">DRAFT</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-black tracking-wider uppercase text-slate-500 block">TANGGAL UPLOAD</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 20 Januari 2020"
                      value={tanggalUpload}
                      onChange={(e) => setTanggalUpload(e.target.value)}
                      disabled={!isEditing}
                      className="w-full h-11 px-4 text-sm rounded-lg bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all shadow-inner placeholder-slate-400 uppercase tracking-wider disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Drag & Drop File Document Uploader */}
                <div className="space-y-2 text-left">
                  <label className="text-xs font-black tracking-wider uppercase text-slate-500 block">BERKAS DOKUMEN (PDF/DOCX/ETC)</label>
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${dragActive ? "border-yellow-300 bg-yellow-50/20" : "border-cyan-300 bg-cyan-50 hover:bg-cyan-100"
                      } h-36 flex flex-col justify-center items-center relative overflow-hidden ${!isEditing && "pointer-events-none opacity-60"}`}
                  >
                    {fileUrl ? (
                      <div className="space-y-2 text-slate-500">
                        <FileText className="h-10 w-10 text-emerald-600 mx-auto" />
                        <p className="text-[10px] font-black text-emerald-700 truncate max-w-sm">
                          {fileUrl}
                        </p>
                        <button
                          type="button"
                          onClick={() => setFileUrl("")}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                        >
                          Hapus Berkas
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 text-slate-500">
                        {uploading ? <Loader2 className="h-8 w-8 text-slate-400 animate-spin mx-auto" /> : <Upload className="h-8 w-8 text-slate-400 mx-auto" />}
                        <p className="text-[10px] font-bold">
                          {uploading ? "Mengupload..." : "Tarik berkas Anda ke sini, atau klik untuk memilih"}
                        </p>
                        <input
                          type="file"
                          onChange={handleFileInput}
                          disabled={uploading || !isEditing}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 mt-1 italic">
                    * Batas maksimal ukuran dokumen adalah 100MB.
                  </p>
                  <input
                    type="text"
                    placeholder="Masukkan URL berkas..."
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    disabled={!isEditing}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-slate-50 text-slate-800 mt-2 disabled:opacity-60"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  {isAdding ? (
                    <>
                      <Button
                        type="button"
                        onClick={() => { setFormOpen(false); setIsEditing(false); }}
                        className="bg-slate-500 hover:bg-slate-650 text-white font-extrabold text-xs px-8 h-11 rounded-xl cursor-pointer uppercase tracking-widest transition-all"
                      >
                        BATAL
                      </Button>
                      <Button
                        type="submit"
                        disabled={uploading || saving}
                        className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-black text-xs px-8 h-11 rounded-xl cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest flex items-center gap-1.5 transition-all disabled:opacity-70"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> SIMPAN
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" /> SIMPAN
                          </>
                        )}
                      </Button>
                    </>
                  ) : isEditing ? (
                    <>
                      <Button
                        type="button"
                        onClick={() => { setFormOpen(false); setIsEditing(false); }}
                        className="bg-slate-500 hover:bg-slate-650 text-white font-extrabold text-xs px-8 h-11 rounded-xl cursor-pointer uppercase tracking-widest transition-all"
                      >
                        BATAL
                      </Button>
                      <Button
                        type="submit"
                        disabled={uploading || saving}
                        className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-black text-xs px-8 h-11 rounded-xl cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest flex items-center gap-1.5 transition-all disabled:opacity-70"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> SIMPAN
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" /> SIMPAN
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        onClick={(e) => { e.preventDefault(); if (selectedItem) handleDelete(selectedItem.id); }}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-8 h-11 rounded-xl cursor-pointer uppercase tracking-widest transition-all flex items-center gap-1.5"
                      >
                        <Trash2 size={15} /> HAPUS
                      </Button>
                      <Button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
                        className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-black text-xs px-8 h-11 rounded-xl cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest flex items-center gap-1.5 transition-all"
                      >
                        <Edit3 size={15} /> EDIT
                      </Button>
                    </>
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
