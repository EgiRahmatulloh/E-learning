import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Trash2, Edit3, Plus, Search, UploadCloud, X } from "lucide-react";

interface SlideData {
  id: string;
  creator: string;
  title: string;
  status: "AKTIF" | "NON AKTIF";
  image: string;
}

const STORAGE_KEY = "pkbm_slider_data";

const DEFAULT_SLIDES: SlideData[] = [];

export function HeaderManager() {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: "", show: false });

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formStatus, setFormStatus] = useState<"AKTIF" | "NON AKTIF">("AKTIF");
  const [formImage, setFormImage] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchSliders = async () => {
    try {
      const res = await fetch("/api/sliders");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const mapped = data.data.map((item: any) => ({
          id: String(item.id),
          creator: item.creator || "ADMIN",
          title: item.title || "",
          status: item.status || "AKTIF",
          image: item.image || "",
        }));
        setSlides(mapped);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
      } else {
        throw new Error("Invalid structure");
      }
    } catch {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setSlides(JSON.parse(saved));
        } catch {
          setSlides(DEFAULT_SLIDES);
        }
      } else {
        setSlides(DEFAULT_SLIDES);
      }
    }
  };

  useEffect(() => {
    fetchSliders();
  }, []);

  const showToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => {
      setToast({ message: "", show: false });
    }, 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast("Judul tidak boleh kosong!");
      return;
    }
    if (!formImage) {
      showToast("Gambar harus diunggah atau diisi!");
      return;
    }

    const token = localStorage.getItem("token");
    let apiSuccess = false;
    let apiErrorMessage = "";
    let isNetworkError = false;

    try {
      if (editId && !isNaN(Number(editId)) && !String(editId).startsWith("local-")) {
        // Edit mode (database record)
        const res = await fetch(`/api/sliders/${editId}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            title: formTitle,
            image: formImage,
            status: formStatus,
          }),
        });
        const data = await res.json();
        if (data.success) {
          showToast("Slider berhasil diperbarui!");
          apiSuccess = true;
        } else {
          apiErrorMessage = data.message || "Gagal memperbarui data slider";
        }
      } else {
        // Add mode (database record)
        const res = await fetch("/api/sliders", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            title: formTitle,
            image: formImage,
            status: formStatus,
          }),
        });
        const data = await res.json();
        if (data.success) {
          showToast("Slider baru berhasil ditambahkan!");
          apiSuccess = true;
        } else {
          apiErrorMessage = data.message || "Gagal menambahkan data slider";
        }
      }

      if (apiSuccess) {
        fetchSliders();
        closeForm();
        return;
      } else {
        showToast(apiErrorMessage);
        return;
      }
    } catch (err) {
      if (err instanceof TypeError) {
        isNetworkError = true;
      } else {
        showToast("Terjadi kesalahan sistem saat menyimpan.");
        return;
      }
    }

    // Local storage fallback ONLY on genuine fetch/network failures
    if (isNetworkError) {
      let updatedSlides: SlideData[] = [];
      if (editId) {
        updatedSlides = slides.map((slide) =>
          slide.id === editId
            ? {
                ...slide,
                title: formTitle,
                status: formStatus,
                image: formImage,
              }
            : slide
        );
        showToast("Slider diperbarui secara lokal (Offline)!");
      } else {
        const newSlide: SlideData = {
          id: "local-" + Date.now().toString(),
          creator: "ADMIN",
          title: formTitle,
          status: formStatus,
          image: formImage,
        };
        updatedSlides = [...slides, newSlide];
        showToast("Slider ditambahkan secara lokal (Offline)!");
      }
      setSlides(updatedSlides);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSlides));
      closeForm();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus slider ini?")) {
      const token = localStorage.getItem("token");
      try {
        if (!isNaN(Number(id)) && !String(id).startsWith("local-")) {
          const res = await fetch(`/api/sliders/${id}`, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          const data = await res.json();
          if (data.success) {
            showToast("Slider berhasil dihapus!");
            fetchSliders();
            return;
          } else {
            showToast(data.message || "Gagal menghapus data dari server");
            return;
          }
        } else {
          throw new TypeError("Local item");
        }
      } catch (err) {
        if (err instanceof TypeError) {
          const updated = slides.filter((slide) => slide.id !== id);
          setSlides(updated);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          showToast("Slider berhasil dihapus secara lokal!");
        } else {
          showToast("Terjadi kesalahan saat menghapus.");
        }
      }
    }
  };

  const openAddForm = () => {
    setEditId(null);
    setFormTitle("");
    setFormStatus("AKTIF");
    setFormImage("");
    setIsFormOpen(true);
  };

  const openEditForm = (slide: SlideData) => {
    setEditId(slide.id);
    setFormTitle(slide.title);
    setFormStatus(slide.status);
    setFormImage(slide.image);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditId(null);
  };

  // Image Upload helper (converts to Base64)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    // Validasi tipe berkas di sisi klien
    if (!file.type.startsWith("image/")) {
      showToast("Hanya berkas gambar yang diperbolehkan!");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Ukuran gambar melebihi batas 5MB!");
      return;
    }

    setUploading(true);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setFormImage(data.url);
        showToast("Gambar berhasil diunggah!");
      } else {
        throw new Error(data.message || "Gagal mengunggah gambar");
      }
    } catch (err: any) {
      // Local fallback: convert to Base64 ONLY on offline/TypeError network errors
      if (err instanceof TypeError) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormImage(reader.result as string);
          showToast("Gambar disimpan secara lokal (Offline)!");
        };
        reader.readAsDataURL(file);
      } else {
        showToast(err.message || "Gagal mengunggah gambar.");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Filter slides based on search input
  const filteredSlides = slides.filter((slide) =>
    slide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    slide.creator.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 relative pb-10">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-cyan-900 tracking-tight flex items-center gap-2">
            <span>⚙️</span> KELOLA HEADER / SLIDER
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Atur cover dan slide gambar yang tampil pada bagian atas (Hero Section) landing page utama.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={openAddForm}
            className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md shadow-purple-200 uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" /> TAMBAH BARU
          </Button>
        </div>
      </div>

      {/* TABLE AND FILTERS CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {/* Table Search Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
            Daftar Slider Aktif ({filteredSlides.length})
          </span>
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Cari..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs border border-slate-200 rounded-xl bg-white font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
            />
          </div>
        </div>

        {/* The Beautiful Mockup-aligned Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#00badb] text-white font-black text-sm uppercase">
                <th className="py-4 px-6 border-r border-[#009cb9] text-center w-16">NO</th>
                <th className="py-4 px-6 border-r border-[#009cb9]">PEMBUAT</th>
                <th className="py-4 px-6 border-r border-[#009cb9]">JUDUL</th>
                <th className="py-4 px-6 border-r border-[#009cb9] text-center w-36">STATUS</th>
                <th className="py-4 px-6 border-r border-[#009cb9] text-center w-48">GAMBAR</th>
                <th className="py-4 px-6 text-center w-40">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredSlides.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center font-bold text-slate-400">
                    Tidak ada data slider ditemukan. Silakan tambahkan baru!
                  </td>
                </tr>
              ) : (
                filteredSlides.map((slide, idx) => (
                  <tr
                    key={slide.id}
                    className="border-b border-slate-100 hover:bg-cyan-50/20 font-bold text-slate-700 transition-colors"
                  >
                    <td className="py-4 px-6 border-r border-slate-100 text-center text-slate-500 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 uppercase text-[#280f91]">
                      {slide.creator}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 text-slate-800 text-base">
                      {slide.title}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 text-center">
                      <span
                        className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-black uppercase tracking-wider ${
                          slide.status === "AKTIF"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-rose-100 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {slide.status}
                      </span>
                    </td>
                    <td className="py-3 px-6 border-r border-slate-100 text-center">
                      <div className="w-36 h-20 rounded-xl overflow-hidden border border-slate-200 mx-auto shadow-inner bg-slate-50 flex items-center justify-center">
                        {slide.image ? (
                          <img
                            src={slide.image}
                            alt={slide.title}
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400">Tanpa Gambar</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          onClick={() => openEditForm(slide)}
                          className="bg-[#fafafa] border border-slate-200 hover:bg-slate-100 text-slate-700 h-9 px-3 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1 transition-all"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-blue-600" /> Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(slide.id)}
                          className="bg-[#fafafa] border border-slate-200 hover:bg-rose-50 text-rose-600 h-9 px-3 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1 transition-all"
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

      {/* POPUP FORM DIALOG (MOCKUP STYLED MODAL) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={closeForm} />

          {/* Form Container */}
          <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200 border-4 border-cyan-400">
            
            {/* Actual Form Column */}
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
                  {editId ? "TAMPILAN EDIT DATA" : "TAMPILAN TAMBAH BARU"}
                </span>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-left">
                {/* JUDUL */}
                <div className="space-y-1">
                  <label className="text-xs font-extrabold tracking-wider uppercase text-cyan-50 block">
                    JUDUL
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan judul slider..."
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full h-11 px-4 text-sm border-0 rounded-lg bg-white font-extrabold text-slate-800 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all shadow-inner"
                  />
                </div>

                {/* STATUS */}
                <div className="space-y-1">
                  <label className="text-xs font-extrabold tracking-wider uppercase text-cyan-50 block">
                    STATUS
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as "AKTIF" | "NON AKTIF")}
                    className="w-full h-11 px-4 text-sm border-0 rounded-lg bg-white font-extrabold text-slate-800 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all cursor-pointer shadow-inner"
                  >
                    <option value="AKTIF">AKTIF (DITAMPILKAN)</option>
                    <option value="NON AKTIF">NON AKTIF (DISEMBUNYIKAN)</option>
                  </select>
                </div>

                {/* GAMBAR (DRAG AND DROP OR SELECT) */}
                <div className="space-y-1">
                  <label className="text-xs font-extrabold tracking-wider uppercase text-cyan-50 block">
                    GAMBAR
                  </label>

                  {/* Drag and Drop Container */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("file-upload")?.click()}
                    className={`border-4 border-dashed rounded-xl p-5 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center relative overflow-hidden bg-white/5 ${
                      dragOver
                        ? "border-[#9c27b0] bg-white/20 scale-[0.99]"
                        : "border-white/40 hover:border-white/80 hover:bg-white/10"
                    }`}
                  >
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {uploading ? (
                      <div className="flex flex-col items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-purple-600 mb-2" />
                        <span className="text-xs font-black tracking-wider uppercase block text-white/90">
                          SEDANG MENGUNGGAH...
                        </span>
                      </div>
                    ) : formImage ? (
                      <div className="relative w-full h-24 flex items-center justify-center">
                        <img
                          src={formImage}
                          alt="preview"
                          className="max-h-full max-w-full rounded-lg object-contain border border-white/20"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormImage("");
                          }}
                          className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="h-10 w-10 text-white mb-2 animate-pulse" />
                        <span className="text-xs font-black tracking-wider uppercase block text-white/90">
                          DRAG AND DROP A FILE HERE OR CLICK
                        </span>
                        <span className="text-[10px] text-cyan-100 font-bold block mt-1">
                          Max: 5000px | 5MB
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* URL INPUT OPTION */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold tracking-wider uppercase text-cyan-100 block">
                    Atau gunakan URL Gambar eksternal
                  </label>
                  <input
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    value={formImage.startsWith("data:") ? "" : formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    className="w-full h-9 px-3 text-xs border-0 rounded-lg bg-white/90 font-medium text-slate-800 focus:outline-none focus:bg-white transition-all shadow-inner"
                  />
                </div>

                {/* BUTTON SUBMIT */}
                <div className="pt-2 text-right">
                  <Button
                    type="submit"
                    className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-sm px-8 h-11 rounded-lg cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 inline-flex"
                  >
                    SIMPAN
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Floating Modern Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900/95 backdrop-blur-md text-white px-5 py-4 rounded-2xl shadow-2xl border border-slate-800 animate-in slide-in-from-bottom-6 duration-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-bold tracking-tight">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
