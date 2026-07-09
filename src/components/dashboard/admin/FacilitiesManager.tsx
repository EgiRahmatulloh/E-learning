import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { downloadExcel, mapCsvRows, parseExcel } from "@/lib/utils";
import { Edit3, Trash2, Search, UploadCloud, Plus, Save, X, Upload, Download, Loader2 } from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { toast } from "sonner";

interface Facility {
  id: number;
  nama: string;
  keterangan: string;
  foto: string;
}

const STORAGE_KEY_FACILITIES = "pkbm_facilities_list";

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

export default function FacilitiesManager() {
  const confirm = useConfirm();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [formVisible, setFormVisible] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [nama, setNama] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [foto, setFoto] = useState("");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchFacilities = useCallback(async () => {
    try {
      const res = await fetch("/api/facilities");
      if (!res.ok) throw new Error("Gagal mengambil data dari server");
      const resData = await res.json();
      if (resData.success && resData.data) {
        setFacilities(resData.data);
        setSafeItem(STORAGE_KEY_FACILITIES, JSON.stringify(resData.data));
      }
    } catch (err) {
      const saved = getSafeItem(STORAGE_KEY_FACILITIES);
      if (saved) {
        try {
          setFacilities(JSON.parse(saved));
        } catch {
          setFacilities([]);
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  const resetForm = () => {
    setNama("");
    setKeterangan("");
    setFoto("");
    setEditId(null);
    setIsEditing(false);
    setFormVisible(false);
  };

  const handleEditClick = (item: Facility) => {
    setEditId(item.id);
    setNama(item.nama);
    setKeterangan(item.keterangan);
    setFoto(item.foto);
    setIsEditing(false);
    setFormVisible(true);
  };

  const handleDeleteClick = async (id: number) => {
    if (!await confirm({
      title: "Konfirmasi Hapus",
      message: "Apakah Anda yakin ingin menghapus sarana dan fasilitas ini?",
      variant: "danger"
    })) return;
    const token = getSafeItem("token");
    try {
      const res = await fetch(`/api/facilities/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        }
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success("Sarana dan fasilitas berhasil dihapus!");
        fetchFacilities();
      } else {
        toast.error(resData.message || "Gagal menghapus data");
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
        toast.success("Foto berhasil diunggah!");
      } else {
        throw new Error(data.message || "Gagal mengunggah gambar");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal mengunggah gambar.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!nama.trim()) {
      toast.error("Nama Sarana/Fasilitas tidak boleh kosong!");
      return;
    }

    setSaving(true);
    const token = getSafeItem("token");
    const bodyData = { nama, keterangan, foto };

    try {
      let res;
      if (editId !== null) {
        res = await fetch(`/api/facilities/${editId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(bodyData),
        });
      } else {
        res = await fetch("/api/facilities", {
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
        toast.success(editId !== null ? "Sarana berhasil diperbarui!" : "Sarana baru berhasil ditambahkan!");
        resetForm();
        fetchFacilities();
      } else {
        toast.error(resData.message || "Gagal menyimpan sarana.");
      }
    } catch (err) {
      toast.error("Gagal menyimpan data ke server.");
    } finally {
      setSaving(false);
    }
  };

  // Excel Export Logic
  const handleExportExcel = () => {
    if (facilities.length === 0) {
      toast.error("Tidak ada data untuk diekspor!");
      return;
    }
    const headers = ["NAMA", "KETERANGAN", "FOTO"];
    const rows = facilities.map(f => [
      f.nama || "",
      f.keterangan || "",
      f.foto || ""
    ]);
    downloadExcel(headers, rows, "sarana_dan_fasilitas.xlsx");
    toast.success("Berhasil mengunduh Excel!");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    try {
      const rows = await parseExcel(file);

      const mapped = mapCsvRows(rows, [
        { key: "nama", aliases: ["nama", "name", "fasilitas", "sarana"], defaultIndex: 0 },
        { key: "keterangan", aliases: ["keterangan", "deskripsi", "description"], defaultIndex: 1 },
        { key: "foto", aliases: ["foto", "photo", "image", "gambar"], defaultIndex: 2 },
      ]);

      const importedData = mapped
        .filter((item) => item.nama)
        .map((item) => ({
          nama: item.nama,
          keterangan: item.keterangan || "",
          foto: item.foto || "",
        }));

      if (importedData.length === 0) {
        toast.error("Format data kosong atau tidak valid!");
        return;
      }

      const token = getSafeItem("token");
      const res = await fetch("/api/facilities/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(importedData),
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success(resData.message || "Berhasil mengimpor data!");
        fetchFacilities();
      } else {
        toast.error(resData.message || "Gagal mengimpor data");
      }
    } catch (err) {
      toast.error("Kesalahan saat mengunggah file ke server.");
    }
    e.target.value = "";
  };

  // Search filter
  const filteredFacilities = facilities.filter((f) => {
    const q = searchQuery.toLowerCase();
    return (
      (f.nama || "").toLowerCase().includes(q) ||
      (f.keterangan || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 relative pb-16 animate-in fade-in duration-300">

      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-cyan-900 tracking-tight flex items-center gap-2">
            <span>🏫</span> KELOLA WEBSITE SARANA & FASILITAS
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Atur data sarana dan prasarana penunjang kegiatan belajar mengajar yang ada di lembaga.
          </p>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {/* Table Search Bar + Action Buttons */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
            Daftar Sarana dan Fasilitas ({filteredFacilities.length})
          </span>
          <div className="flex items-center gap-3 flex-wrap">
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
            <label className="h-10 bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs px-4 rounded-xl cursor-pointer uppercase tracking-wider shadow-md shadow-purple-200/40 flex items-center justify-center gap-1.5 transition-all select-none active:scale-95 shrink-0">
              <Upload className="h-4 w-4" /> UPLOAD EXCEL
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleImportExcel}
                className="hidden"
              />
            </label>
            <Button
              onClick={handleExportExcel}
              className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 rounded-xl cursor-pointer uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0"
            >
              <Download className="h-4 w-4" /> DOWNLOAD EXCEL
            </Button>
            <Button
              onClick={() => {
                resetForm();
                setIsEditing(true);
                setFormVisible(true);
              }}
              className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md shadow-purple-200 uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
            >
              <Plus className="h-4 w-4" /> TAMBAH DATA
            </Button>
          </div>
        </div>

        {/* Beautiful Mockup-aligned Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#00badb] text-white font-black text-sm uppercase">
                <th className="py-4 px-6 border-r border-[#009cb9] text-center w-16">NO</th>
                <th className="py-4 px-6 border-r border-[#009cb9] w-64">NAMA FASILITAS</th>
                <th className="py-4 px-6 border-r border-[#009cb9]">KETERANGAN</th>
                <th className="py-4 px-6 border-r border-[#009cb9] text-center w-48">FOTO</th>
                <th className="py-4 px-6 text-center w-36">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredFacilities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center font-bold text-slate-400">
                    Tidak ada sarana & fasilitas ditemukan. Silakan tambahkan baru!
                  </td>
                </tr>
              ) : (
                filteredFacilities.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 hover:bg-cyan-50/20 font-bold text-slate-700 transition-colors"
                  >
                    <td className="py-4 px-6 border-r border-slate-100 text-center text-slate-500 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 font-extrabold text-slate-900 uppercase">
                      {item.nama}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 text-slate-800 text-sm leading-relaxed font-semibold">
                      {item.keterangan}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 text-center">
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
                      <div className="flex items-center justify-center gap-3">
                        <Button
                          onClick={() => handleEditClick(item)}
                          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 h-9 px-3.5 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-xs transition-all"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-blue-600" /> Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(item.id)}
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

      {/* POPUP / MODAL FORM DIALOG */}
      {formVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={resetForm} />

          {/* Form Container */}
          <div className="relative bg-[#00badb] rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border-4 border-cyan-400 animate-in zoom-in-95 duration-200 text-white">

            {/* Close button */}
            <button
              onClick={resetForm}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-1.5 transition-colors cursor-pointer z-10"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Form Title */}
            <div className="p-6 sm:p-8 pb-4 shrink-0 border-b border-white/10 text-left">
              <span className="inline-block bg-[#9c27b0] text-white font-extrabold text-[11px] px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                {editId !== null ? "EDIT DATA" : "TAMBAH DATA"}
              </span>
            </div>

            <form className="flex-1 min-h-0 flex flex-col text-left" onSubmit={(e) => e.preventDefault()}>
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Form Inputs Grid */}
              <div className="md:col-span-3 space-y-4">

                {/* NAMA SARANA */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">
                    NAMA SARANA DAN FASILITAS
                  </label>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Masukkan nama sarana/fasilitas (Contoh: Ruang Belajar)"
                    disabled={!isEditing}
                    className="w-full h-11 px-4 text-sm font-extrabold border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>

                {/* KETERANGAN */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">
                    KETERANGAN
                  </label>
                  <textarea
                    rows={6}
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="Masukkan keterangan lengkap sarana dan fasilitas..."
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
                    const file = e.dataTransfer.files?.[0];
                    if (file) processUpload(file);
                  }}
                  onClick={() => document.getElementById("facility-file-upload")?.click()}
                  className="w-full aspect-square border-4 border-dashed border-white/60 hover:border-white rounded-2xl flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all text-center bg-cyan-300/40 hover:bg-cyan-350/50 cursor-pointer"
                >
                  <input
                    id="facility-file-upload"
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
                      <Loader2 className="h-8 w-8 text-white/60 animate-spin mb-2" />
                      <span className="text-[10px] font-black text-purple-950 uppercase tracking-wide">MENGUNGGAH...</span>
                    </div>
                  ) : foto ? (
                    <div className="w-full h-full relative group">
                      <img
                        src={foto}
                        alt="Pratinjau Fasilitas"
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

                <p className="text-[10px] font-bold text-white/80 mt-1.5 italic text-center">
                  * Batas maksimal ukuran foto adalah 5MB.
                </p>

                <div className="w-full mt-4 flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-black uppercase text-cyan-50">URL Foto Sarana</label>
                  <input
                    type="text"
                    placeholder="Masukkan URL foto..."
                    value={foto}
                    onChange={(e) => setFoto(e.target.value)}
                    disabled={!isEditing}
                    className="w-full text-xs font-semibold border-none rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              </div>

              {/* ACTION BUTTONS */}
              <div className="p-6 sm:p-8 pt-4 shrink-0 border-t border-white/10 flex items-center justify-end gap-3 bg-[#00badb] rounded-b-3xl">
                {isEditing ? (
                  <>
                    <Button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="bg-slate-500 hover:bg-slate-650 text-white font-extrabold text-xs px-8 h-11 rounded-xl cursor-pointer uppercase tracking-widest transition-all"
                    >
                      BATAL
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSave}
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
                      onClick={() => { if (editId !== null) handleDeleteClick(editId); }}
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
    </div>
  );
}
