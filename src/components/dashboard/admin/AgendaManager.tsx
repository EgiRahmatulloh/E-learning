import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Search, UploadCloud, Plus, Save, Edit3, Trash2 } from "lucide-react";

interface Agenda {
  id: number;
  nama: string;
  pelaksanaan: string;
  waktu: string;
  peserta: string;
  lokasi: string;
  penyelenggara: string;
  penanggungjawab: string;
  keterangan: string;
  foto: string;
}

const STORAGE_KEY_AGENDAS = "pkbm_agendas_list";

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

export default function AgendaManager() {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form states
  const [editId, setEditId] = useState<number | null>(null);
  const [nama, setNama] = useState("");
  const [pelaksanaan, setPelaksanaan] = useState("");
  const [waktu, setWaktu] = useState("");
  const [peserta, setPeserta] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [penyelenggara, setPenyelenggara] = useState("");
  const [penanggungjawab, setPenanggungjawab] = useState("");
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

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const fetchAgendas = useCallback(async () => {
    try {
      const res = await fetch("/api/agendas");
      if (!res.ok) throw new Error("Gagal mengambil data dari server");
      const resData = await res.json();
      if (resData.success && resData.data) {
        setAgendas(resData.data);
        setSafeItem(STORAGE_KEY_AGENDAS, JSON.stringify(resData.data));
      }
    } catch (err) {
      const saved = getSafeItem(STORAGE_KEY_AGENDAS);
      if (saved) {
        try {
          setAgendas(JSON.parse(saved));
        } catch {
          setAgendas([]);
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchAgendas();
  }, [fetchAgendas]);

  const resetForm = () => {
    setNama("");
    setPelaksanaan("");
    setWaktu("");
    setPeserta("");
    setLokasi("");
    setPenyelenggara("");
    setPenanggungjawab("");
    setKeterangan("");
    setFoto("");
    setEditId(null);
  };

  const handleEditClick = (item: Agenda) => {
    setEditId(item.id);
    setNama(item.nama);
    setPelaksanaan(item.pelaksanaan);
    setWaktu(item.waktu);
    setPeserta(item.peserta);
    setLokasi(item.lokasi);
    setPenyelenggara(item.penyelenggara);
    setPenanggungjawab(item.penanggungjawab);
    setKeterangan(item.keterangan);
    setFoto(item.foto);
    
    // Scroll to form smoothly
    const formElement = document.getElementById("agenda-form-container");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleDeleteClick = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus agenda ini?")) return;
    const token = getSafeItem("token");
    try {
      const res = await fetch(`/api/agendas/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        }
      });
      const resData = await res.json();
      if (resData.success) {
        showToast("Agenda berhasil dihapus!");
        fetchAgendas();
      } else {
        showToast(resData.message || "Gagal menghapus agenda");
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
        showToast("Foto agenda berhasil diunggah!");
      } else {
        throw new Error(data.message || "Gagal mengunggah gambar");
      }
    } catch (err: any) {
      showToast(err.message || "Gagal mengunggah gambar.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!nama.trim()) {
      showToast("Nama Agenda tidak boleh kosong!");
      return;
    }
    if (!pelaksanaan.trim()) {
      showToast("Pelaksanaan tidak boleh kosong!");
      return;
    }
    if (!waktu.trim()) {
      showToast("Waktu tidak boleh kosong!");
      return;
    }

    const token = getSafeItem("token");
    const bodyData = {
      nama,
      pelaksanaan,
      waktu,
      peserta,
      lokasi,
      penyelenggara,
      penanggungjawab,
      keterangan,
      foto
    };

    try {
      let res;
      if (editId !== null) {
        res = await fetch(`/api/agendas/${editId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(bodyData),
        });
      } else {
        res = await fetch("/api/agendas", {
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
        showToast(editId !== null ? "Agenda berhasil diperbarui!" : "Agenda baru berhasil ditambahkan!");
        resetForm();
        fetchAgendas();
      } else {
        showToast(resData.message || "Gagal menyimpan agenda.");
      }
    } catch (err) {
      showToast("Gagal menyimpan agenda ke server.");
    }
  };

  const filteredAgendas = agendas.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      (a.nama || "").toLowerCase().includes(q) ||
      (a.pelaksanaan || "").toLowerCase().includes(q) ||
      (a.waktu || "").toLowerCase().includes(q) ||
      (a.peserta || "").toLowerCase().includes(q) ||
      (a.lokasi || "").toLowerCase().includes(q) ||
      (a.penyelenggara || "").toLowerCase().includes(q) ||
      (a.penanggungjawab || "").toLowerCase().includes(q) ||
      (a.keterangan || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 relative pb-16 animate-in fade-in duration-300">
      
      {/* TOP CONTROLS SECTION */}
      <div className="flex items-center justify-between gap-4">
        <Button
          onClick={() => {
            resetForm();
            const formElement = document.getElementById("agenda-form-container");
            if (formElement) {
              formElement.scrollIntoView({ behavior: "smooth" });
            }
          }}
          className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs px-6 h-10 rounded-lg cursor-pointer uppercase tracking-widest shadow-md shadow-purple-200/50 flex items-center gap-1.5 transition-all"
        >
          <Plus className="h-4 w-4" /> TAMBAH BARU
        </Button>

        {/* SEARCH BOX */}
        <div className="relative w-60 max-w-xs">
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
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-cyan-400 text-cyan-950 font-black text-xs uppercase tracking-wider border-b border-cyan-200">
              <th className="py-4 px-4 text-center w-16">NO</th>
              <th className="py-4 px-6 w-48">NAMA AGENDA</th>
              <th className="py-4 px-6 w-36">PELAKSANAAN</th>
              <th className="py-4 px-6 w-36">WAKTU</th>
              <th className="py-4 px-4 w-32">PESERTA</th>
              <th className="py-4 px-6 w-36">LOKASI</th>
              <th className="py-4 px-6 w-36">PENYELENGGARA</th>
              <th className="py-4 px-6 w-36">PENANGGUNGJAWAB</th>
              <th className="py-4 px-6">KETERANGAN</th>
              <th className="py-4 px-6 w-36 text-center">FOTO</th>
              <th className="py-4 px-6 w-32 text-center">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {filteredAgendas.length > 0 ? (
              filteredAgendas.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                  <td className="py-4 px-6 font-extrabold text-slate-900">{item.nama}</td>
                  <td className="py-4 px-6 font-extrabold text-slate-800">{item.pelaksanaan}</td>
                  <td className="py-4 px-6 font-extrabold text-slate-800">{item.waktu}</td>
                  <td className="py-4 px-4 text-slate-700 leading-relaxed font-semibold">{item.peserta}</td>
                  <td className="py-4 px-6 text-slate-700 leading-relaxed font-semibold">{item.lokasi}</td>
                  <td className="py-4 px-6 text-slate-700 leading-relaxed font-semibold">{item.penyelenggara}</td>
                  <td className="py-4 px-6 text-slate-700 leading-relaxed font-semibold">{item.penanggungjawab}</td>
                  <td className="py-4 px-6 text-slate-650 leading-relaxed font-medium">{item.keterangan}</td>
                  <td className="py-4 px-6 text-center">
                    {item.foto ? (
                      <img
                        src={item.foto}
                        alt={item.nama}
                        className="h-14 w-24 object-cover rounded-lg mx-auto shadow-xs border border-slate-200"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">TIDAK ADA FOTO</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
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
                <td colSpan={11} className="py-8 text-center text-slate-400 font-bold uppercase">
                  Tidak ada data agenda ditemukan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* INLINE FORM SECTION (bg-[#00badb]) */}
      <div 
        id="agenda-form-container"
        className="bg-[#00badb] rounded-3xl overflow-hidden shadow-2xl border-4 border-cyan-400 p-6 sm:p-8 text-white relative animate-in zoom-in-95 duration-200 mt-8"
      >
        
        {/* Form Title Badge */}
        <div className="mb-6 text-left">
          <span className="inline-block bg-[#9c27b0] text-white font-extrabold text-[11px] px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
            {editId !== null ? "TAMPILAN EDIT DATA" : "TAMPILAN TAMBAH BARU"}
          </span>
        </div>

        <form className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left" onSubmit={(e) => e.preventDefault()}>
          {/* Inputs Column */}
          <div className="md:col-span-3 space-y-4">
            
            {/* NAMA AGENDA */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">
                NAMA AGENDA
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Masukkan nama agenda"
                className="w-full h-10 px-4 text-sm font-extrabold border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner animate-all"
              />
            </div>

            {/* PELAKSANAAN */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">
                PELAKSANAAN
              </label>
              <input
                type="text"
                value={pelaksanaan}
                onChange={(e) => setPelaksanaan(e.target.value)}
                placeholder="Contoh: JUM'AT, 12 DESEMBER 2025"
                className="w-full h-10 px-4 text-sm font-extrabold border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner"
              />
            </div>

            {/* WAKTU & PESERTA (Row) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">
                  WAKTU
                </label>
                <input
                  type="text"
                  value={waktu}
                  onChange={(e) => setWaktu(e.target.value)}
                  placeholder="Contoh: 07.00 WIB S.D SELESAI"
                  className="w-full h-10 px-4 text-sm font-extrabold border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">
                  PESERTA
                </label>
                <input
                  type="text"
                  value={peserta}
                  onChange={(e) => setPeserta(e.target.value)}
                  placeholder="Contoh: WB KELAS X"
                  className="w-full h-10 px-4 text-sm font-extrabold border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner"
                />
              </div>
            </div>

            {/* LOKASI & PENYELENGGARA (Row) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">
                  LOKASI
                </label>
                <input
                  type="text"
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                  placeholder="Contoh: PKBM MENUJU MAKMUR"
                  className="w-full h-10 px-4 text-sm font-extrabold border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">
                  PENYELENGGARA
                </label>
                <input
                  type="text"
                  value={penyelenggara}
                  onChange={(e) => setPenyelenggara(e.target.value)}
                  placeholder="Contoh: PANITIA UPK"
                  className="w-full h-10 px-4 text-sm font-extrabold border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner"
                />
              </div>
            </div>

            {/* PENANGGUNGJAWAB */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">
                PENANGGUNGJAWAB
              </label>
              <input
                type="text"
                value={penanggungjawab}
                onChange={(e) => setPenanggungjawab(e.target.value)}
                placeholder="Contoh: ACENG G"
                className="w-full h-10 px-4 text-sm font-extrabold border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner"
              />
            </div>

            {/* KAETERANGAN */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">
                KAETERANGAN
              </label>
              <textarea
                rows={4}
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Masukkan keterangan lengkap agenda..."
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
              onClick={() => document.getElementById("agenda-file-upload")?.click()}
              className="w-full aspect-square border-4 border-dashed border-white/60 hover:border-white rounded-2xl flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all text-center bg-cyan-300/40 hover:bg-cyan-350/50 cursor-pointer"
            >
              <input
                id="agenda-file-upload"
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
                    alt="Pratinjau Agenda"
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
                    DRAG AND DROP A FILE
                  </span>
                  <span className="text-[9px] font-black text-purple-950 block mt-0.5 uppercase tracking-wide">
                    HERE OR CLICK
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ACTION BUTTONS (EDIT, SIMPAN) */}
          <div className="col-span-1 md:col-span-4 pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <Button
              type="button"
              onClick={resetForm}
              className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs px-8 h-11 rounded-xl cursor-pointer uppercase tracking-widest transition-all"
            >
              EDIT
            </Button>
            
            <Button
              type="button"
              onClick={handleSave}
              className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-black text-xs px-8 h-11 rounded-xl cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest flex items-center gap-1.5 transition-all"
            >
              <Save className="h-4 w-4" /> SIMPAN
            </Button>
          </div>
        </form>
      </div>

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
