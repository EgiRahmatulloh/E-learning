import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Edit3, Trash2, Search, UploadCloud, Plus, Save, X } from "lucide-react";

interface EducationProgram {
  id: number;
  program: string;
  penjab: string;
  keterangan: string;
  foto: string;
}

interface Manager {
  id: number;
  nama: string;
}

const STORAGE_KEY_PROGRAMS = "pkbm_education_programs";
const STORAGE_KEY_MANAGERS = "pkbm_managers_list";

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
  } catch {}
};

export default function EducationProgramManager() {
  const [programs, setPrograms] = useState<EducationProgram[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form states
  const [formVisible, setFormVisible] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [program, setProgram] = useState("");
  const [penjab, setPenjab] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [foto, setFoto] = useState("");
  
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: "", show: false });
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, show: true });
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ message: "", show: false });
      toastTimeoutRef.current = null;
    }, 3000);
  };

  // Clean up toast timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const fetchPrograms = useCallback(async () => {
    try {
      const res = await fetch("/api/education-programs");
      const resData = await res.json();
      if (resData.success && resData.data) {
        setPrograms(resData.data);
        setSafeItem(STORAGE_KEY_PROGRAMS, JSON.stringify(resData.data));
      }
    } catch (err) {
      const saved = getSafeItem(STORAGE_KEY_PROGRAMS);
      if (saved) {
        try {
          setPrograms(JSON.parse(saved));
        } catch {
          setPrograms([]);
        }
      }
    }
  }, []);

  const fetchManagers = useCallback(async () => {
    try {
      const token = getSafeItem("token");
      const res = await fetch("/api/managers", {
        headers: {
          "Authorization": `Bearer ${token}`,
        }
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        setManagers(resData.data);
        setSafeItem(STORAGE_KEY_MANAGERS, JSON.stringify(resData.data));
      }
    } catch (err) {
      const saved = getSafeItem(STORAGE_KEY_MANAGERS);
      if (saved) {
        try {
          setManagers(JSON.parse(saved));
        } catch {
          setManagers([]);
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
    fetchManagers();
  }, [fetchPrograms, fetchManagers]);

  const resetForm = () => {
    setProgram("");
    setPenjab("");
    setKeterangan("");
    setFoto("");
    setEditId(null);
    setFormVisible(false);
  };

  const handleEditClick = (item: EducationProgram) => {
    setEditId(item.id);
    setProgram(item.program);
    setPenjab(item.penjab);
    setKeterangan(item.keterangan);
    setFoto(item.foto);
    setFormVisible(true);
  };

  const handleDeleteClick = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus program ini?")) return;
    const token = getSafeItem("token");
    try {
      const res = await fetch(`/api/education-programs/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        }
      });
      const resData = await res.json();
      if (resData.success) {
        showToast("Program pendidikan berhasil dihapus!");
        fetchPrograms();
      } else {
        showToast(resData.message || "Gagal menghapus program");
      }
    } catch (err) {
      showToast("Terjadi kesalahan koneksi atau sistem.");
    }
  };

  const processUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Hanya berkas gambar yang diperbolehkan!");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Ukuran gambar melebihi batas 5MB!");
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
        showToast("Foto berhasil diunggah!");
      } else {
        throw new Error(data.message || "Gagal mengunggah gambar");
      }
    } catch (err: any) {
      if (err instanceof TypeError) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFoto(reader.result as string);
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

  const handleSave = async () => {
    if (!program.trim()) {
      showToast("Nama Program tidak boleh kosong!");
      return;
    }

    const token = getSafeItem("token");
    const bodyData = { program, penjab, keterangan, foto };

    try {
      let res;
      if (editId !== null) {
        // Edit Mode
        res = await fetch(`/api/education-programs/${editId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(bodyData),
        });
      } else {
        // Add Mode
        res = await fetch("/api/education-programs", {
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
        showToast(editId !== null ? "Program berhasil diperbarui!" : "Program baru berhasil ditambahkan!");
        resetForm();
        fetchPrograms();
      } else {
        showToast(resData.message || "Gagal menyimpan program.");
      }
    } catch (err) {
      showToast("Gagal menyimpan data ke server.");
    }
  };

  // Search logic filter
  const filteredPrograms = programs.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.program.toLowerCase().includes(q) ||
      p.penjab.toLowerCase().includes(q) ||
      p.keterangan.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 relative pb-16 animate-in fade-in duration-300">
      
      {/* TOP CONTROLS SECTION */}
      <div className="flex items-center justify-between gap-4">
        <Button
          onClick={() => {
            resetForm();
            setFormVisible(true);
          }}
          className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs px-6 h-10 rounded-full cursor-pointer uppercase tracking-widest shadow-md shadow-purple-200/50 flex items-center gap-1.5 transition-all"
        >
          <Plus className="h-4 w-4" /> TAMBAH BARU
        </Button>

        {/* SEARCH BOX */}
        <div className="relative w-64 max-w-xs">
          <input
            type="text"
            placeholder="cari"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-4 pr-10 text-xs font-semibold border-none rounded-full bg-[#fdeee4] text-[#8c5b3f] placeholder-[#c49f88] focus:outline-none focus:ring-2 focus:ring-orange-200/60 shadow-inner"
          />
          <Search className="absolute right-3.5 top-3 h-4 w-4 text-[#8c5b3f]/70" />
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="overflow-x-auto rounded-2xl border border-cyan-200/80 bg-white shadow-sm">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-cyan-400 text-cyan-950 font-black text-xs uppercase tracking-wider border-b border-cyan-200">
              <th className="py-4 px-4 text-center w-16">NO</th>
              <th className="py-4 px-6 w-48">PROGRAM</th>
              <th className="py-4 px-6 w-48">PENJAB</th>
              <th className="py-4 px-6">KETERANGAN</th>
              <th className="py-4 px-6 w-40 text-center">FOTO</th>
              <th className="py-4 px-6 w-32 text-center">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {filteredPrograms.length > 0 ? (
              filteredPrograms.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                  <td className="py-4 px-6 font-extrabold text-slate-900">{item.program}</td>
                  <td className="py-4 px-6 font-extrabold text-cyan-800">{item.penjab}</td>
                  <td className="py-4 px-6 text-slate-650 leading-relaxed font-medium line-clamp-3 md:line-clamp-none mt-2">{item.keterangan}</td>
                  <td className="py-4 px-6 text-center">
                    {item.foto ? (
                      <img
                        src={item.foto}
                        alt={item.program}
                        className="h-14 w-24 object-cover rounded-lg mx-auto shadow-xs border border-slate-200"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">TIDAK ADA FOTO</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="inline-flex items-center gap-1 text-[10px] font-black text-slate-600 hover:text-cyan-600 cursor-pointer uppercase transition-colors"
                      >
                        <Edit3 className="h-3 w-3" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(item.id)}
                        className="inline-flex items-center gap-1 text-[10px] font-black text-red-500 hover:text-red-700 cursor-pointer uppercase transition-colors"
                      >
                        <Trash2 className="h-3 w-3" /> Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 font-bold uppercase">
                  Tidak ada program pendidikan ditemukan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* POPUP / MODAL FORM DIALOG (MATCHING INTERACTIVE UI MODALS) */}
      {formVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={resetForm} />

          {/* Form Container */}
          <div className="relative bg-[#00badb] rounded-3xl overflow-hidden shadow-2xl w-full max-w-3xl border-4 border-cyan-400 animate-in zoom-in-95 duration-200 p-6 sm:p-8 text-white">
            
            {/* Close button inside modal */}
            <button
              onClick={resetForm}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-1.5 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Form Title */}
            <div className="mb-6 text-left">
              <span className="inline-block bg-[#9c27b0] text-white font-extrabold text-[11px] px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                {editId !== null ? "TAMPILAN EDIT DATA" : "TAMPILAN TAMBAH BARU"}
              </span>
            </div>

            <form className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left" onSubmit={(e) => e.preventDefault()}>
              {/* Form Inputs Grid */}
              <div className="md:col-span-3 space-y-4">
                
                {/* NAMA PROGRAM */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">
                    NAMA PROGRAM
                  </label>
                  <input
                    type="text"
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    placeholder="Masukkan nama program (Contoh: Paket C)"
                    className="w-full h-11 px-4 text-sm font-extrabold border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner"
                  />
                </div>

                {/* PENJAB */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">
                    PENJAB
                  </label>
                  <select
                    value={penjab}
                    onChange={(e) => setPenjab(e.target.value)}
                    className="w-full h-11 px-4 text-sm font-extrabold border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner cursor-pointer"
                  >
                    <option value="" disabled>Pilih Penanggung Jawab (Dropdown Pengelola)</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.nama}>
                        {m.nama}
                      </option>
                    ))}
                  </select>
                </div>

                {/* KETERANGAN */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">
                    KETERANGAN
                  </label>
                  <textarea
                    rows={4}
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="Deskripsikan penjelasan singkat tentang program ini..."
                    className="w-full p-4 text-sm font-extrabold border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner resize-none leading-relaxed"
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
                    const file = e.dataTransfer.files?.[0];
                    if (file) processUpload(file);
                  }}
                  onClick={() => document.getElementById("program-file-upload")?.click()}
                  className="w-full aspect-square border-4 border-dashed border-white/60 hover:border-white rounded-2xl flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all text-center bg-cyan-300/40 hover:bg-cyan-350/50 cursor-pointer"
                >
                  <input
                    id="program-file-upload"
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
                        alt="Pratinjau Program"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                        <span className="text-white text-[10px] font-black uppercase tracking-wider">UBAH FOTO</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="h-10 w-10 text-white mb-2" />
                      <span className="text-[9px] font-black text-purple-950 uppercase block tracking-wider leading-relaxed">
                        DRAG & DROP
                      </span>
                      <span className="text-[9px] font-black text-purple-900 block mt-0.5 uppercase tracking-wide">
                        OR CLICK
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* ACTION BUTTONS (Bottom-right inside modal) */}
              <div className="col-span-1 md:col-span-4 pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  onClick={resetForm}
                  className="bg-slate-200 hover:bg-slate-350 text-slate-700 font-extrabold text-xs px-8 h-11 rounded-full cursor-pointer uppercase tracking-widest transition-all"
                >
                  BATAL
                </Button>
                
                <Button
                  type="button"
                  onClick={handleSave}
                  className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-black text-xs px-8 h-11 rounded-full cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest flex items-center gap-1.5 transition-all"
                >
                  <Save className="h-4 w-4" /> SIMPAN
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900/95 backdrop-blur-md text-white px-5 py-4 rounded-2xl shadow-2xl border border-slate-800 animate-in slide-in-from-bottom-6 duration-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-bold tracking-tight">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
