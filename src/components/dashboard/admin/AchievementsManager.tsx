import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { downloadExcel, mapCsvRows, parseExcel } from "@/lib/utils";
import { Edit3, Trash2, Search, UploadCloud, Plus, Save, X, Upload, Download, Loader2 } from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { toast } from "sonner";

interface Achievement {
  id: number;
  nama: string;
  tahun: string;
  tingkat: string;
  penyelenggara: string;
  peserta: string;
  keterangan: string;
  foto: string;
}

const STORAGE_KEY_ACHIEVEMENTS = "pkbm_achievements_list";

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

export function AchievementsManager() {
  const confirm = useConfirm();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Upload dialog state & ref
  const importInputRef = useRef<HTMLInputElement>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Form states
  const [formVisible, setFormVisible] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [, setOriginalData] = useState<{ nama: string; tahun: string; tingkat: string; penyelenggara: string; peserta: string; keterangan: string; foto: string }>({ nama: "", tahun: "", tingkat: "", penyelenggara: "", peserta: "", keterangan: "", foto: "" });
  const [nama, setNama] = useState("");
  const [tahun, setTahun] = useState("");
  const [tingkat, setTingkat] = useState("");
  const [penyelenggara, setPenyelenggara] = useState("");
  const [peserta, setPeserta] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [foto, setFoto] = useState("");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAchievements = useCallback(async () => {
    try {
      const res = await fetch("/api/achievements");
      if (!res.ok) throw new Error("Gagal mengambil data dari server");
      const resData = await res.json();
      if (resData.success && resData.data) {
        setAchievements(resData.data);
        setSafeItem(STORAGE_KEY_ACHIEVEMENTS, JSON.stringify(resData.data));
      }
    } catch (err) {
      const saved = getSafeItem(STORAGE_KEY_ACHIEVEMENTS);
      if (saved) {
        try {
          setAchievements(JSON.parse(saved));
        } catch {
          setAchievements([]);
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const resetForm = () => {
    setNama("");
    setTahun("");
    setTingkat("");
    setPenyelenggara("");
    setPeserta("");
    setKeterangan("");
    setFoto("");
    setEditId(null);
    setIsEditing(false);
    setFormVisible(false);
  };

  const handleEditClick = (item: Achievement) => {
    setEditId(item.id);
    setOriginalData({ nama: item.nama, tahun: item.tahun || "", tingkat: item.tingkat || "", penyelenggara: item.penyelenggara || "", peserta: item.peserta || "", keterangan: item.keterangan || "", foto: item.foto || "" });
    setNama(item.nama);
    setTahun(item.tahun);
    setTingkat(item.tingkat);
    setPenyelenggara(item.penyelenggara);
    setPeserta(item.peserta);
    setKeterangan(item.keterangan);
    setFoto(item.foto);
    setIsEditing(false);
    setFormVisible(true);
  };

  const handleDeleteClick = async (id: number) => {
    if (!await confirm({
      title: "Konfirmasi Hapus",
      message: "Apakah Anda yakin ingin menghapus data prestasi ini?",
      variant: "danger"
    })) return;
    const token = getSafeItem("token");
    try {
      const res = await fetch(`/api/achievements/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        }
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success("Data prestasi berhasil dihapus!");
        fetchAchievements();
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
      toast.error("Nama Prestasi tidak boleh kosong!");
      return;
    }
    if (!tahun.trim()) {
      toast.error("Tahun tidak boleh kosong!");
      return;
    }
    if (!tingkat.trim()) {
      toast.error("Tingkat tidak boleh kosong!");
      return;
    }

    setSaving(true);
    const token = getSafeItem("token");
    const bodyData = {
      nama,
      tahun,
      tingkat,
      penyelenggara,
      peserta,
      keterangan,
      foto
    };

    try {
      let res;
      if (editId !== null) {
        res = await fetch(`/api/achievements/${editId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(bodyData),
        });
      } else {
        res = await fetch("/api/achievements", {
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
        toast.success(editId !== null ? "Data prestasi berhasil diperbarui!" : "Data prestasi baru berhasil ditambahkan!");
        resetForm();
        fetchAchievements();
      } else {
        toast.error(resData.message || "Gagal menyimpan data prestasi.");
      }
    } catch (err) {
      toast.error("Gagal menyimpan data ke server.");
    } finally {
      setSaving(false);
    }
  };

  // Excel Export Logic
  const handleExportExcel = () => {
    if (achievements.length === 0) {
      toast.error("Tidak ada data untuk diekspor!");
      return;
    }
    const headers = ["NAMA PRESTASI", "TAHUN", "TINGKAT", "PENYELENGGARA", "PESERTA", "KETERANGAN", "FOTO"];
    const rows = achievements.map(a => [
      a.nama || "",
      a.tahun || "",
      a.tingkat || "",
      a.penyelenggara || "",
      a.peserta || "",
      a.keterangan || "",
      a.foto || ""
    ]);
    downloadExcel(headers, rows, "prestasi.xlsx");
    toast.success("Berhasil mengunduh Excel!");
  };

  // Excel Import Logic
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    try {
      const rows = await parseExcel(file);

      const mapped = mapCsvRows(rows, [
        { key: "nama", aliases: ["nama", "name", "judul"], defaultIndex: 0 },
        { key: "tahun", aliases: ["tahun", "year"], defaultIndex: 1 },
        { key: "tingkat", aliases: ["tingkat", "level"], defaultIndex: 2 },
        { key: "penyelenggara", aliases: ["penyelenggara", "organizer", "kategori"], defaultIndex: 3 },
        { key: "peserta", aliases: ["peserta", "participant"], defaultIndex: 4 },
        { key: "keterangan", aliases: ["keterangan", "deskripsi", "description"], defaultIndex: 5 },
        { key: "foto", aliases: ["foto", "photo", "image", "gambar"], defaultIndex: 6 },
      ]);

      const importedData = mapped
        .filter((item) => item.nama && item.tahun && item.tingkat)
        .map((item) => ({
          nama: item.nama,
          tahun: item.tahun,
          tingkat: item.tingkat,
          penyelenggara: item.penyelenggara || "",
          peserta: item.peserta || "",
          keterangan: item.keterangan || "",
          foto: item.foto || "",
        }));

      if (importedData.length === 0) {
        toast.error("Format data kosong atau tidak valid! Pastikan Nama, Tahun, dan Tingkat tidak kosong.");
        return;
      }

      const token = getSafeItem("token");
      const res = await fetch("/api/achievements/import", {
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
        fetchAchievements();
        setShowUploadDialog(false);
      } else {
        toast.error(resData.message || "Gagal mengimpor data");
      }
    } catch (err) {
      toast.error("Kesalahan saat mengunggah file ke server.");
    }
    e.target.value = "";
  };

  // Search filter
  const filteredAchievements = achievements.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      (a.nama || "").toLowerCase().includes(q) ||
      (a.tahun || "").toLowerCase().includes(q) ||
      (a.tingkat || "").toLowerCase().includes(q) ||
      (a.penyelenggara || "").toLowerCase().includes(q) ||
      (a.peserta || "").toLowerCase().includes(q) ||
      (a.keterangan || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 relative pb-16 animate-in fade-in duration-300">

      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-cyan-900 tracking-tight flex items-center gap-2">
            <span>🏆</span> KELOLA WEBSITE PRESTASI
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Atur data prestasi dan penghargaan yang diraih oleh warga belajar maupun lembaga PKBM.
          </p>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {/* Table Search Bar + Action Buttons */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
            Daftar Prestasi ({filteredAchievements.length})
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
            <input
              type="file"
              ref={importInputRef}
              accept=".xlsx, .xls"
              onChange={handleImportExcel}
              className="hidden"
            />
            <Button
              onClick={() => setShowUploadDialog(true)}
              className="h-10 bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs px-4 rounded-xl cursor-pointer uppercase tracking-wider shadow-md shadow-purple-200/40 flex items-center justify-center gap-1.5 transition-all select-none active:scale-95 shrink-0"
            >
              <Upload className="h-4 w-4" /> UPLOAD EXCEL
            </Button>
            <Button
              onClick={handleExportExcel}
              className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 rounded-xl cursor-pointer uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0"
            >
              <Download className="h-4 w-4" /> DOWNLOAD EXCEL
            </Button>
            <Button
              onClick={() => {
                resetForm();
                setOriginalData({ nama: "", tahun: "", tingkat: "", penyelenggara: "", peserta: "", keterangan: "", foto: "" });
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
          <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-[#00badb] text-white font-black text-sm uppercase">
                <th className="py-4 px-6 border-r border-[#009cb9] text-center w-16">NO</th>
                <th className="py-4 px-6 border-r border-[#009cb9] w-48">NAMA PRESTASI</th>
                <th className="py-4 px-6 border-r border-[#009cb9] text-center w-24">TAHUN</th>
                <th className="py-4 px-6 border-r border-[#009cb9] w-36">TINGKAT</th>
                <th className="py-4 px-6 border-r border-[#009cb9] w-48">PENYELENGGARA</th>
                <th className="py-4 px-6 border-r border-[#009cb9] w-36">PESERTA</th>
                <th className="py-4 px-6 border-r border-[#009cb9]">KETERANGAN</th>
                <th className="py-4 px-6 border-r border-[#009cb9] text-center w-36">FOTO</th>
                <th className="py-4 px-6 text-center w-36">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredAchievements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center font-bold text-slate-400">
                    Tidak ada data prestasi ditemukan. Silakan tambahkan baru!
                  </td>
                </tr>
              ) : (
                filteredAchievements.map((item, idx) => (
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
                    <td className="py-4 px-6 border-r border-slate-100 font-extrabold text-slate-900 text-center font-mono">
                      {item.tahun}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 text-cyan-800 uppercase font-extrabold text-center">
                      {item.tingkat}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 font-semibold text-slate-700">
                      {item.penyelenggara}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 font-semibold text-slate-700 text-center">
                      {item.peserta}
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

      {/* UPLOAD EXCEL DIALOG */}
      {showUploadDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowUploadDialog(false)} />
          <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 border-4 border-cyan-400 z-10">
            <div className="bg-[#00badb] p-6 relative text-white text-left">
              <button
                onClick={() => setShowUploadDialog(false)}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-4">
                <span className="inline-block bg-[#9c27b0] text-white font-extrabold text-[11px] px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                  Upload Excel
                </span>
              </div>

              <div className="space-y-4 text-slate-800">
                <p className="text-xs font-semibold text-white/80 leading-normal">
                  Upload data prestasi dari file Excel. Silakan download format terlebih dahulu.
                </p>

                <div className="space-y-3">
                  <a
                    href="/templates/format-upload-prestasi.xlsx"
                    download
                    className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-widest transition-all shadow-md cursor-pointer"
                  >
                    <Download className="h-4 w-4" /> DOWNLOAD FORMAT
                  </a>

                  <Button
                    type="button"
                    onClick={() => {
                      setShowUploadDialog(false);
                      importInputRef.current?.click();
                    }}
                    className="w-full h-11 rounded-xl bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs uppercase tracking-widest transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Upload className="h-4 w-4" /> PILIH FILE EXCEL
                  </Button>

                  <Button
                    type="button"
                    onClick={() => setShowUploadDialog(false)}
                    className="w-full h-11 rounded-xl bg-slate-500 hover:bg-slate-600 text-white font-extrabold text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    BATAL
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

                {/* NAMA PRESTASI */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">
                    NAMA PRESTASI
                  </label>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Masukkan nama prestasi"
                    disabled={!isEditing}
                    className="w-full h-10 px-4 text-sm font-extrabold border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>

                {/* TAHUN & TINGKAT (Row) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">
                      TAHUN
                    </label>
                    <input
                      type="text"
                      value={tahun}
                      onChange={(e) => setTahun(e.target.value)}
                      placeholder="Contoh: 2026"
                      disabled={!isEditing}
                      className="w-full h-10 px-4 text-sm font-extrabold border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">
                      TINGKAT
                    </label>
                    <input
                      type="text"
                      value={tingkat}
                      onChange={(e) => setTingkat(e.target.value)}
                      placeholder="Contoh: Kabupaten Ciamis"
                      disabled={!isEditing}
                      className="w-full h-10 px-4 text-sm font-extrabold border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* PENYELENGGARA & PESERTA (Row) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">
                      PENYELENGGARA
                    </label>
                    <input
                      type="text"
                      value={penyelenggara}
                      onChange={(e) => setPenyelenggara(e.target.value)}
                      placeholder="Contoh: Disdik Kabupaten Ciamis"
                      disabled={!isEditing}
                      className="w-full h-10 px-4 text-sm font-extrabold border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner disabled:opacity-70 disabled:cursor-not-allowed"
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
                      placeholder="Contoh: Warga Belajar Paket C"
                      disabled={!isEditing}
                      className="w-full h-10 px-4 text-sm font-extrabold border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>
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
                    placeholder="Masukkan keterangan lengkap prestasi..."
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
                  onClick={() => { if (isEditing) document.getElementById("achievement-file-upload")?.click(); }}
                  className={`${!isEditing ? "pointer-events-none opacity-60 " : ""}w-full aspect-square border-4 border-dashed border-white/60 hover:border-white rounded-2xl flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all text-center bg-cyan-300/40 hover:bg-cyan-350/50 cursor-pointer`}
                >
                  <input
                    id="achievement-file-upload"
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
                        alt="Pratinjau Prestasi"
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
                  <label className="text-[10px] font-black uppercase text-cyan-50">URL Foto Prestasi</label>
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
                      onClick={resetForm}
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
