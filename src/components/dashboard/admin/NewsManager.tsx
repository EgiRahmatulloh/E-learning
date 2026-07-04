import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Search, UploadCloud, Plus, Save, Edit3, Trash2, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { toast } from "sonner";

interface News {
  id: number;
  judul: string;
  kategori: string;
  pembuat: string;
  tanggalPosting: string;
  hits: number;
  status: string;
  foto: string;
  konten: string;
}

interface NewsCategory {
  id: number;
  nama: string;
}

const STORAGE_KEY_NEWS = "pkbm_news_list";
const STORAGE_KEY_CATEGORIES = "pkbm_news_categories";

const getSafeItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setSafeItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch { }
};

// Date Formatter in Indonesian uppercase
const getIndonesianDate = () => {
  const months = [
    "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
    "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
  ];
  const d = new Date();
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

export default function NewsManager() {
  const confirm = useConfirm();
  const [newsList, setNewsList] = useState<News[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals Visibility
  const [newsModalVisible, setNewsModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  // News Form States
  const [editId, setEditId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [originalData, setOriginalData] = useState<{ judul: string; kategori: string; tanggalPosting: string; status: string; foto: string; konten: string }>({ judul: "", kategori: "", tanggalPosting: "", status: "", foto: "", konten: "" });
  const [judul, setJudul] = useState("");
  const [kategori, setKategori] = useState("");
  const [tanggalPosting, setTanggalPosting] = useState("");
  const [status, setStatus] = useState("PUBLISH");
  const [foto, setFoto] = useState("");
  const [konten, setKonten] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Category Form States
  const [newCategoryName, setNewCategoryName] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error("Gagal mengambil data dari server");
      const resData = await res.json();
      if (resData.success && resData.data) {
        setNewsList(resData.data);
        setSafeItem(STORAGE_KEY_NEWS, JSON.stringify(resData.data));
      } else {
        throw new Error(resData.message || "Gagal mengambil data berita");
      }
    } catch (err) {
      const saved = getSafeItem(STORAGE_KEY_NEWS);
      if (saved) {
        try {
          setNewsList(JSON.parse(saved));
        } catch {
          setNewsList([]);
        }
      }
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/news-categories");
      if (!res.ok) throw new Error("Gagal mengambil data kategori");
      const resData = await res.json();
      if (resData.success && resData.data) {
        setCategories(resData.data);
        setSafeItem(STORAGE_KEY_CATEGORIES, JSON.stringify(resData.data));
      } else {
        throw new Error(resData.message || "Gagal mengambil kategori");
      }
    } catch (err) {
      const saved = getSafeItem(STORAGE_KEY_CATEGORIES);
      if (saved) {
        try {
          setCategories(JSON.parse(saved));
        } catch {
          setCategories([]);
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchNews();
    fetchCategories();
  }, [fetchNews, fetchCategories]);

  const resetNewsForm = () => {
    setJudul("");
    setKategori("");
    setTanggalPosting(getIndonesianDate());
    setStatus("PUBLISH");
    setFoto("");
    setKonten("");
    setEditId(null);
    setIsEditing(false);
    setNewsModalVisible(false);
  };

  const handleEditClick = (item: News) => {
    setEditId(item.id);
    setOriginalData({ judul: item.judul, kategori: item.kategori, tanggalPosting: item.tanggalPosting, status: item.status, foto: item.foto, konten: item.konten });
    setJudul(item.judul);
    setKategori(item.kategori);
    setTanggalPosting(item.tanggalPosting);
    setStatus(item.status);
    setFoto(item.foto);
    setKonten(item.konten);
    setIsEditing(false);
    setNewsModalVisible(true);
  };

  const handleDeleteNewsClick = async (id: number) => {
    if (!await confirm({
      title: "Hapus Berita",
      message: "Apakah Anda yakin ingin menghapus berita ini? Tindakan ini tidak dapat dibatalkan.",
      variant: "danger"
    })) return;

    const token = getSafeItem("token");
    try {
      const res = await fetch(`/api/news/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        }
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success("Berita berhasil dihapus!");
        fetchNews();
      } else {
        toast.error(resData.message || "Gagal menghapus berita");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan koneksi atau sistem.");
    }
  };

  const processUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Hanya berkas gambar yang diperbolehkan!");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran gambar melebihi batas 5MB!");
      return;
    }

    setUploading(true);
    const token = getSafeItem("token");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setFoto(data.url);
        toast.success("Foto berita berhasil diunggah!");
      } else {
        throw new Error(data.message || "Gagal mengunggah gambar");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal mengunggah gambar.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveNews = async () => {
    if (!judul.trim()) {
      toast.error("Judul berita tidak boleh kosong!");
      return;
    }
    if (!kategori.trim()) {
      toast.error("Pilih kategori berita terlebih dahulu!");
      return;
    }
    if (!tanggalPosting.trim()) {
      toast.error("Tanggal posting tidak boleh kosong!");
      return;
    }

    setSaving(true);
    const token = getSafeItem("token");
    const bodyData = {
      judul,
      kategori,
      tanggalPosting,
      status,
      foto,
      konten
    };

    try {
      let res;
      if (editId !== null) {
        res = await fetch(`/api/news/${editId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(bodyData),
        });
      } else {
        res = await fetch("/api/news", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(bodyData),
        });
      }

      const resData = await res.json();
      if (resData.success) {
        toast.success(editId !== null ? "Berita berhasil diperbarui!" : "Berita baru berhasil ditambahkan!");
        resetNewsForm();
        fetchNews();
      } else {
        toast.error(resData.message || "Gagal menyimpan berita.");
      }
    } catch (err) {
      toast.error("Gagal menyimpan berita ke server.");
    } finally {
      setSaving(false);
    }
  };

  // Add Category Handler
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Nama kategori tidak boleh kosong!");
      return;
    }

    const token = getSafeItem("token");
    try {
      const res = await fetch("/api/news-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ nama: newCategoryName.trim().toUpperCase() }),
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success("Kategori baru berhasil ditambahkan!");
        setNewCategoryName("");
        fetchCategories();
      } else {
        toast.error(resData.message || "Gagal menambahkan kategori.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan koneksi.");
    }
  };

  // Delete Category Handler
  const handleDeleteCategory = async (id: number) => {
    if (!await confirm({
      title: "Hapus Kategori",
      message: "Apakah Anda yakin ingin menghapus kategori ini?",
      variant: "danger"
    })) return;

    const token = getSafeItem("token");
    try {
      const res = await fetch(`/api/news-categories/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        }
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success("Kategori berhasil dihapus!");
        fetchCategories();
      } else {
        toast.error(resData.message || "Gagal menghapus kategori.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan koneksi.");
    }
  };

  // Search and Filter News
  const filteredNews = newsList.filter((n) => {
    const q = searchQuery.toLowerCase();
    return (
      (n.judul || "").toLowerCase().includes(q) ||
      (n.kategori || "").toLowerCase().includes(q) ||
      (n.pembuat || "").toLowerCase().includes(q) ||
      (n.konten || "").toLowerCase().includes(q)
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNewsPage = filteredNews.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-6 relative pb-16 animate-in fade-in duration-300">

      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-cyan-900 tracking-tight flex items-center gap-2">
            <span>📰</span> KELOLA WEBSITE BERITA
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Atur dan publikasikan berita kegiatan, artikel pendidikan, serta info penting lainnya.
          </p>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {/* Table Search Bar + Action Buttons */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
            Daftar Berita ({filteredNews.length})
          </span>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="cari"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 h-10 pl-9 pr-4 text-xs border border-slate-200 rounded-xl bg-white font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
              />
            </div>
            <Button
              onClick={() => setCategoryModalVisible(true)}
              className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md shadow-purple-200 uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" /> DATA KATEGORI
            </Button>
            <Button
              onClick={() => {
                resetNewsForm();
                setOriginalData({ judul: "", kategori: "", tanggalPosting: "", status: "", foto: "", konten: "" });
                setIsEditing(true);
                setNewsModalVisible(true);
              }}
              className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md shadow-purple-200 uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" /> TAMBAH DATA
            </Button>
          </div>
        </div>

        {/* Beautiful Mockup-aligned Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-[#00badb] text-white font-black text-sm uppercase">
                <th className="py-4 px-6 border-r border-[#009cb9] text-center w-16">NO</th>
                <th className="py-4 px-6 border-r border-[#009cb9] w-72">JUDUL</th>
                <th className="py-4 px-6 border-r border-[#009cb9] w-36">KATEGORI</th>
                <th className="py-4 px-6 border-r border-[#009cb9] w-28 text-center">PEMBUAT</th>
                <th className="py-4 px-6 border-r border-[#009cb9] w-36 text-center">TANGGAL POSTING</th>
                <th className="py-4 px-6 border-r border-[#009cb9] text-center w-20 font-mono">HITS</th>
                <th className="py-4 px-6 border-r border-[#009cb9] w-28 text-center">STATUS</th>
                <th className="py-4 px-6 border-r border-[#009cb9] text-center w-36">FOTO</th>
                <th className="py-4 px-6 text-center w-36">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {currentNewsPage.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center font-bold text-slate-400">
                    Tidak ada data berita ditemukan. Silakan tambahkan baru!
                  </td>
                </tr>
              ) : (
                currentNewsPage.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 hover:bg-cyan-50/20 font-bold text-slate-700 transition-colors"
                  >
                    <td className="py-4 px-6 border-r border-slate-100 text-center text-slate-500 font-mono">
                      {indexOfFirstItem + idx + 1}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 font-extrabold text-slate-900 leading-relaxed max-w-sm uppercase">
                      {item.judul}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 font-extrabold text-slate-800">
                      {item.kategori}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 font-semibold text-slate-650 text-center">
                      {item.pembuat}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 text-slate-750 font-bold text-center">
                      {item.tanggalPosting}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 text-center font-extrabold text-slate-800 font-mono">
                      {item.hits}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${item.status === 'PUBLISH'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 text-center">
                      {item.foto ? (
                        <img
                          src={item.foto}
                          alt={item.judul}
                          className="h-14 w-24 object-cover rounded-lg mx-auto shadow-xs border border-slate-200"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">TIDAK ADA FOTO</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Button
                          onClick={() => handleEditClick(item)}
                          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 h-9 px-3.5 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-xs transition-all"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-blue-600" /> Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteNewsClick(item.id)}
                          className="bg-white border border-slate-200 hover:bg-rose-50 text-rose-600 h-9 px-3.5 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-xs transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION CONTROLS (Yellow pill capsule styling) */}
      {totalPages > 1 && (
        <div className="flex justify-end items-center gap-2.5 mt-4">
          <Button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="bg-[#ffb300] hover:bg-[#ffa000] text-black font-extrabold text-xs h-9 px-4 rounded-xl cursor-pointer disabled:opacity-50 transition-all"
          >
            <ChevronLeft className="h-4 w-4 mr-0.5" /> Previous
          </Button>

          <span className="h-9 w-9 flex items-center justify-center bg-[#ffb300] text-black font-black text-sm rounded-xl">
            {currentPage}
          </span>

          <Button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="bg-[#ffb300] hover:bg-[#ffa000] text-black font-extrabold text-xs h-9 px-4 rounded-xl cursor-pointer disabled:opacity-50 transition-all"
          >
            Next <ChevronRight className="h-4 w-4 ml-0.5" />
          </Button>
        </div>
      )}

      {/* POPUP / MODAL FORM DIALOG: TAMBAH/EDIT BERITA */}
      {newsModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={resetNewsForm} />

          <div className="relative bg-[#00badb] rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border-4 border-cyan-400 animate-in zoom-in-95 duration-200 p-6 sm:p-8 text-white">

            <button
              onClick={resetNewsForm}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-1.5 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6 text-left">
              <span className="inline-block bg-[#9c27b0] text-white font-extrabold text-[11px] px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                {editId !== null ? (isEditing ? "EDIT DATA" : "DETAIL DATA") : "TAMBAH DATA"}
              </span>
            </div>

            <form className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left" onSubmit={(e) => e.preventDefault()}>
              <div className="md:col-span-3 space-y-4">

                {/* JUDUL */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">
                    JUDUL BERITA
                  </label>
                  <input
                    type="text"
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    placeholder="Masukkan judul berita"
                    disabled={!isEditing}
                    className="w-full h-10 px-4 text-sm font-extrabold border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>

                {/* KATEGORI & STATUS (Row) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">
                      KATEGORI
                    </label>
                    <select
                      value={kategori}
                      onChange={(e) => setKategori(e.target.value)}
                      disabled={!isEditing}
                      className="w-full h-10 px-4 text-sm font-extrabold border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <option value="">-- PILIH KATEGORI --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.nama}>
                          {cat.nama}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">
                      STATUS PUBLIKASI
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      disabled={!isEditing}
                      className="w-full h-10 px-4 text-sm font-extrabold border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <option value="PUBLISH">PUBLISH</option>
                      <option value="DRAFT">DRAFT</option>
                    </select>
                  </div>
                </div>

                {/* TANGGAL POSTING */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">
                    TANGGAL POSTING
                  </label>
                  <input
                    type="text"
                    value={tanggalPosting}
                    onChange={(e) => setTanggalPosting(e.target.value)}
                    disabled={!isEditing}
                    className="w-full h-10 px-4 text-sm font-extrabold border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>

                {/* KONTEN */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">
                    ISI KONTEN BERITA
                  </label>
                  <textarea
                    rows={5}
                    value={konten}
                    onChange={(e) => setKonten(e.target.value)}
                    placeholder="Tuliskan berita lengkap..."
                    disabled={!isEditing}
                    className="w-full p-4 text-sm font-extrabold border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner resize-none leading-relaxed disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* FOTO COLUMN (Right) */}
              <div className="md:col-span-1 flex flex-col items-center justify-start pt-2">
                <h4 className="text-xs font-black text-cyan-50 uppercase tracking-wider mb-2">
                  FOTO
                </h4>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (!isEditing) return;
                    const file = e.dataTransfer.files?.[0];
                    if (file) processUpload(file);
                  }}
                  onClick={() => { if (isEditing) document.getElementById("news-file-upload")?.click(); }}
                  className={`${!isEditing ? "pointer-events-none opacity-60 " : ""}w-full aspect-square border-4 border-dashed border-white/60 hover:border-white rounded-2xl flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all text-center bg-cyan-300/40 hover:bg-cyan-350/50 cursor-pointer`}
                >
                  <input
                    id="news-file-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        processUpload(file);
                        e.target.value = "";
                      }
                    }}
                    className="hidden"
                  />

                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-white/30 border-t-purple-600 mb-2" />
                      <span className="text-[10px] font-black text-purple-950 uppercase tracking-wide">MENGUNGGAH...</span>
                    </div>
                  ) : foto ? (
                    <div className="w-full h-full relative group">
                      <img
                        src={foto}
                        alt="Pratinjau Berita"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                        <span className="text-white text-[10px] font-black uppercase tracking-wider">UBAH FOTO</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <UploadCloud className="h-10 w-10 text-white mb-2" />
                      <span className="text-[9px] font-black text-purple-950 uppercase block tracking-wider leading-relaxed">
                        DRAG & DROP
                      </span>
                      <span className="text-[9px] font-black text-purple-950 block mt-0.5 uppercase tracking-wide">
                        OR CLICK
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] font-bold text-white/80 mt-1.5 italic text-center">
                  * Batas maksimal ukuran foto adalah 5MB.
                </p>

                <div className="w-full mt-4 flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-black uppercase text-cyan-50">URL Gambar Berita</label>
                  <input
                    type="text"
                    placeholder="Masukkan URL gambar..."
                    value={foto}
                    onChange={(e) => setFoto(e.target.value)}
                    disabled={!isEditing}
                    className="w-full text-xs font-semibold border-none rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="col-span-1 md:col-span-4 pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                {isEditing ? (
                  <>
                    <Button
                      type="button"
                      onClick={() => {
                        setJudul(originalData.judul);
                        setKategori(originalData.kategori);
                        setTanggalPosting(originalData.tanggalPosting);
                        setStatus(originalData.status);
                        setFoto(originalData.foto);
                        setKonten(originalData.konten);
                        setIsEditing(false);
                      }}
                      className="bg-slate-500 hover:bg-slate-650 text-white font-extrabold text-xs px-8 h-11 rounded-xl cursor-pointer uppercase tracking-widest transition-all"
                    >
                      BATAL
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSaveNews}
                      disabled={saving || uploading}
                      className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-black text-xs px-8 h-11 rounded-xl cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest flex items-center gap-1.5 transition-all disabled:opacity-70"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> MENYIMPAN...
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
                      onClick={() => { if (editId !== null) handleDeleteNewsClick(editId); }}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-8 h-11 rounded-xl cursor-pointer uppercase tracking-widest transition-all flex items-center gap-1.5"
                    >
                      <Trash2 className="h-4 w-4" /> HAPUS
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-black text-xs px-8 h-11 rounded-xl cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest flex items-center gap-1.5 transition-all"
                    >
                      <Edit3 className="h-4 w-4" /> EDIT
                    </Button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP / MODAL FORM DIALOG: KELOLA KATEGORI */}
      {categoryModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setCategoryModalVisible(false)} />

          <div className="relative bg-[#00badb] rounded-3xl overflow-hidden shadow-2xl w-full max-w-md border-4 border-cyan-400 animate-in zoom-in-95 duration-200 p-6 text-white">

            <button
              onClick={() => setCategoryModalVisible(false)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-1.5 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4 text-left">
              <span className="inline-block bg-[#9c27b0] text-white font-extrabold text-[11px] px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                TAMBAH DATA KATEGORI
              </span>
            </div>

            {/* Add input row */}
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="NAMA KATEGORI BARU"
                className="flex-1 h-10 px-4 text-sm font-extrabold border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner uppercase placeholder-slate-400"
              />
              <Button
                onClick={handleAddCategory}
                className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-black text-xs px-5 h-10 rounded-lg cursor-pointer shadow-sm transition-all"
              >
                TAMBAH
              </Button>
            </div>

            {/* List of categories with delete */}
            <div className="space-y-2 max-h-60 overflow-y-auto mb-6 text-left pr-1">
              <label className="text-[10px] font-black text-cyan-50 uppercase tracking-widest block mb-2.5">
                Daftar Kategori Terdaftar
              </label>
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between bg-cyan-950/20 border border-white/10 rounded-lg px-4 py-2 text-sm font-extrabold">
                    <span>{cat.nama}</span>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-red-200 hover:text-red-400 p-1 cursor-pointer transition-colors"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-cyan-100 text-xs font-bold uppercase">
                  Tidak ada kategori terdaftar
                </div>
              )}
            </div>

            {/* Close button */}
            <div className="flex justify-end pt-4 border-t border-white/10">
              <Button
                onClick={() => setCategoryModalVisible(false)}
                className="bg-slate-500 hover:bg-slate-650 text-white font-extrabold text-xs px-8 h-10 rounded-lg cursor-pointer uppercase tracking-widest transition-all"
              >
                TUTUP
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

