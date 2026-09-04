import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { downloadExcel, mapCsvRows, parseExcel } from "@/lib/utils";
import { Edit3, Trash2, Search, UploadCloud, Plus, Save, X, Upload, Download, Loader2 } from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { uploadFile, validateImageFile } from "@/lib/upload";
import { toast } from "sonner";

interface ServicePoint {
  id: number;
  nama: string;
  alamat: string;
  penjab: string;
  waktuPembelajaran: string;
  jumlahWb: string;
  keterangan: string;
  foto: string;
}

interface Manager {
  id: number;
  nama: string;
  jabatan: string;
}

const STORAGE_KEY_SERVICE_POINTS = "pkbm_service_points_list";

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

export function ServicePointsManager() {
  const confirm = useConfirm();
  const [servicePoints, setServicePoints] = useState<ServicePoint[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Upload dialog state & ref
  const importInputRef = useRef<HTMLInputElement>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Form states
  const [formVisible, setFormVisible] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [nama, setNama] = useState("");
  const [alamat, setAlamat] = useState("");
  const [penjab, setPenjab] = useState("");
  const [waktuPembelajaran, setWaktuPembelajaran] = useState("");
  const [jumlahWb, setJumlahWb] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [foto, setFoto] = useState("");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchServicePoints = useCallback(async () => {
    try {
      const res = await fetch("/api/service-points");
      if (!res.ok) throw new Error("Gagal mengambil data dari server");
      const resData = await res.json();
      if (resData.success && resData.data) {
        setServicePoints(resData.data);
        setSafeItem(STORAGE_KEY_SERVICE_POINTS, JSON.stringify(resData.data));
      }
    } catch (err) {
      const saved = getSafeItem(STORAGE_KEY_SERVICE_POINTS);
      if (saved) {
        try {
          setServicePoints(JSON.parse(saved));
        } catch {
          setServicePoints([]);
        }
      }
    }
  }, []);

  const fetchManagers = useCallback(async () => {
    const token = getSafeItem("token");
    try {
      const res = await fetch("/api/managers", {
        headers: {
          "Authorization": `Bearer ${token}`,
        }
      });
      if (res.ok) {
        const resData = await res.json();
        if (resData.success && resData.data) {
          setManagers(resData.data);
        }
      }
    } catch (err) {
      console.error("Gagal memuat data pengelola", err);
    }
  }, []);

  useEffect(() => {
    fetchServicePoints();
    fetchManagers();
  }, [fetchServicePoints, fetchManagers]);

  const resetForm = () => {
    setNama("");
    setAlamat("");
    setPenjab("");
    setWaktuPembelajaran("");
    setJumlahWb("");
    setKeterangan("");
    setFoto("");
    setEditId(null);
    setIsEditing(false);
    setFormVisible(false);
  };

  const handleEditClick = (item: ServicePoint) => {
    setEditId(item.id);
    setNama(item.nama);
    setAlamat(item.alamat);
    setPenjab(item.penjab);
    setWaktuPembelajaran(item.waktuPembelajaran);
    setJumlahWb(item.jumlahWb);
    setKeterangan(item.keterangan);
    setFoto(item.foto);
    setIsEditing(false);
    setFormVisible(true);
  };

  const handleDeleteClick = async (id: number) => {
    if (!await confirm({
      title: "Konfirmasi Hapus",
      message: "Apakah Anda yakin ingin menghapus titik layanan ini?",
      variant: "danger"
    })) return;
    const token = getSafeItem("token");
    try {
      const res = await fetch(`/api/service-points/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        }
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success("Titik layanan berhasil dihapus!");
        fetchServicePoints();
      } else {
        toast.error(resData.message || "Gagal menghapus data");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan koneksi atau sistem.");
    }
  };

  const processUpload = async (file: File) => {
    const invalid = validateImageFile(file);
    if (invalid) {
      toast.error(invalid);
      return;
    }

    setUploading(true);
    try {
      setFoto(await uploadFile(file));
      toast.success("Foto berhasil diunggah!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah gambar.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!nama.trim()) {
      toast.error("Nama Titik Layanan tidak boleh kosong!");
      return;
    }
    if (!alamat.trim()) {
      toast.error("Alamat tidak boleh kosong!");
      return;
    }
    if (!penjab.trim()) {
      toast.error("Penanggung Jawab (Penjab) tidak boleh kosong!");
      return;
    }

    setSaving(true);
    const token = getSafeItem("token");
    const bodyData = {
      nama,
      alamat,
      penjab,
      waktuPembelajaran,
      jumlahWb,
      keterangan,
      foto
    };

    try {
      let res;
      if (editId !== null) {
        res = await fetch(`/api/service-points/${editId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(bodyData),
        });
      } else {
        res = await fetch("/api/service-points", {
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
        toast.success(editId !== null ? "Titik layanan berhasil diperbarui!" : "Titik layanan baru berhasil ditambahkan!");
        resetForm();
        fetchServicePoints();
      } else {
        toast.error(resData.message || "Gagal menyimpan titik layanan.");
      }
    } catch (err) {
      toast.error("Gagal menyimpan data ke server.");
    } finally {
      setSaving(false);
    }
  };

  // Excel Export Logic
  const handleExportExcel = () => {
    if (servicePoints.length === 0) {
      toast.error("Tidak ada data untuk diekspor!");
      return;
    }
    const headers = ["NAMA TITIK LAYANAN", "ALAMAT", "PENJAB", "WAKTU PEMBELAJARAN", "JUMLAH WB", "KETERANGAN", "FOTO"];
    const rows = servicePoints.map(s => [
      s.nama || "",
      s.alamat || "",
      s.penjab || "",
      s.waktuPembelajaran || "",
      s.jumlahWb || "",
      s.keterangan || "",
      s.foto || ""
    ]);
    downloadExcel(headers, rows, "titik_layanan.xlsx");
    toast.success("Berhasil mengunduh Excel!");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    try {
      const rows = await parseExcel(file);

      const mapped = mapCsvRows(rows, [
        { key: "nama", aliases: ["nama", "name", "titik layanan", "titiklayanan", "titik"], defaultIndex: 0 },
        { key: "alamat", aliases: ["alamat", "address"], defaultIndex: 1 },
        { key: "penjab", aliases: ["penjab", "penanggung jawab", "penanggungjawab", "pic"], defaultIndex: 2 },
        { key: "waktuPembelajaran", aliases: ["waktu pembelajaran", "waktu", "waktupembelajaran", "schedule", "time"], defaultIndex: 3 },
        { key: "jumlahWb", aliases: ["jumlah wb", "jumlah warga belajar", "jumlah siswa", "wb", "jumlahwb", "students count"], defaultIndex: 4 },
        { key: "keterangan", aliases: ["keterangan", "deskripsi", "description"], defaultIndex: 5 },
        { key: "foto", aliases: ["foto", "photo", "image", "gambar"], defaultIndex: 6 },
      ]);

      const importedData = mapped
        .filter((item) => item.nama && item.alamat && item.penjab)
        .map((item) => ({
          nama: item.nama,
          alamat: item.alamat,
          penjab: item.penjab,
          waktuPembelajaran: item.waktuPembelajaran || "",
          jumlahWb: item.jumlahWb || "",
          keterangan: item.keterangan || "",
          foto: item.foto || "",
        }));

      if (importedData.length === 0) {
        toast.error("Format data kosong atau tidak valid! Pastikan Nama, Alamat, dan Penjab tidak kosong.");
        return;
      }

      const token = getSafeItem("token");
      const res = await fetch("/api/service-points/import", {
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
        fetchServicePoints();
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
  const filteredServicePoints = servicePoints.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      (s.nama || "").toLowerCase().includes(q) ||
      (s.alamat || "").toLowerCase().includes(q) ||
      (s.penjab || "").toLowerCase().includes(q) ||
      (s.waktuPembelajaran || "").toLowerCase().includes(q) ||
      (s.jumlahWb || "").toLowerCase().includes(q) ||
      (s.keterangan || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 relative pb-16 animate-in fade-in duration-300">

      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-cyan-900 tracking-tight flex items-center gap-2">
            <span>📍</span> KELOLA WEBSITE TITIK LAYANAN
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Atur data lokasi titik layanan pembelajaran kesetaraan PKBM Menuju Makmur.
          </p>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {/* Table Search Bar + Action Buttons */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
            Daftar Titik Layanan ({filteredServicePoints.length})
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
                <th className="py-4 px-6 border-r border-[#009cb9] w-48">NAMA TITIK LAYANAN</th>
                <th className="py-4 px-6 border-r border-[#009cb9] w-56">ALAMAT</th>
                <th className="py-4 px-6 border-r border-[#009cb9] w-40 text-center">PENJAB</th>
                <th className="py-4 px-6 border-r border-[#009cb9] w-48">WAKTU PEMBELAJARAN</th>
                <th className="py-4 px-6 border-r border-[#009cb9] text-center w-28">JUMLAH WB</th>
                <th className="py-4 px-6 border-r border-[#009cb9]">KETERANGAN</th>
                <th className="py-4 px-6 border-r border-[#009cb9] text-center w-36">FOTO</th>
                <th className="py-4 px-6 text-center w-36">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredServicePoints.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center font-bold text-slate-400">
                    Tidak ada data titik layanan ditemukan. Silakan tambahkan baru!
                  </td>
                </tr>
              ) : (
                filteredServicePoints.map((item, idx) => (
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
                    <td className="py-4 px-6 border-r border-slate-100 text-slate-650 leading-relaxed font-semibold">
                      {item.alamat}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 font-extrabold text-[#9c27b0] uppercase text-center">
                      {item.penjab}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 text-slate-650 font-semibold">
                      {item.waktuPembelajaran}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 text-center font-extrabold text-slate-900 font-mono">
                      {item.jumlahWb}
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
            <div className="bg-white p-6 relative text-left">
              <button
                onClick={() => setShowUploadDialog(false)}
                className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-4">
                <span className="inline-block bg-[#9c27b0] text-white font-extrabold text-[11px] px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                  Upload Excel
                </span>
              </div>

              <div className="space-y-4 text-slate-800">
                <p className="text-xs font-semibold text-slate-500 leading-normal">
                  Upload data titik layanan dari file Excel. Silakan download format terlebih dahulu.
                </p>

                <div className="space-y-3">
                  <a
                    href="/templates/format-upload-titik-layanan.xlsx"
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
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border-4 border-cyan-400 animate-in zoom-in-95 duration-200">

            {/* Close button */}
            <button
              onClick={resetForm}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full p-1.5 transition-colors cursor-pointer z-10"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Form Title */}
            <div className="p-6 sm:p-8 pb-4 shrink-0 border-b border-slate-200 text-left">
              <span className="inline-block bg-[#9c27b0] text-white font-extrabold text-[11px] px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                {editId !== null ? "EDIT DATA" : "TAMBAH DATA"}
              </span>
            </div>

            <form className="flex-1 min-h-0 flex flex-col text-left" onSubmit={(e) => e.preventDefault()}>
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Form Inputs Grid */}
              <div className="md:col-span-3 space-y-4">

                {/* NAMA TITIK LAYANAN */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">
                    NAMA TITIK LAYANAN
                  </label>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Masukkan nama titik layanan"
                    disabled={!isEditing}
                    className="w-full h-10 px-4 text-sm font-extrabold rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>

                {/* ALAMAT */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">
                    ALAMAT
                  </label>
                  <input
                    type="text"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    placeholder="Masukkan alamat lengkap titik layanan"
                    disabled={!isEditing}
                    className="w-full h-10 px-4 text-sm font-extrabold rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>

                {/* PENJAB (Dropdown Data Pengelola) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">
                    PENJAB (PENANGGUNG JAWAB)
                  </label>
                  <select
                    value={penjab}
                    onChange={(e) => setPenjab(e.target.value)}
                    disabled={!isEditing}
                    className="w-full h-10 px-4 text-sm font-extrabold rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <option value="">-- PILIH PENANGGUNG JAWAB --</option>
                    {penjab && !managers.some((m) => m.nama === penjab) && (
                      <option value={penjab}>{penjab} (Tidak Terdaftar)</option>
                    )}
                    {managers.map((m) => (
                      <option key={m.id} value={m.nama}>
                        {m.nama} ({m.jabatan})
                      </option>
                    ))}
                  </select>
                </div>

                {/* WAKTU PEMBELAJARAN & JUMLAH WB (Row) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wide">
                      WAKTU PEMBELAJARAN
                    </label>
                    <input
                      type="text"
                      value={waktuPembelajaran}
                      onChange={(e) => setWaktuPembelajaran(e.target.value)}
                      placeholder="Contoh: Jum'at s.d Minggu Pukul 14.00"
                      disabled={!isEditing}
                      className="w-full h-10 px-4 text-sm font-extrabold rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wide">
                      JUMLAH WB (WARGA BELAJAR)
                    </label>
                    <input
                      type="text"
                      value={jumlahWb}
                      onChange={(e) => setJumlahWb(e.target.value)}
                      placeholder="Contoh: 45 WB"
                      disabled={!isEditing}
                      className="w-full h-10 px-4 text-sm font-extrabold rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* KETERANGAN */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">
                    KETERANGAN
                  </label>
                  <textarea
                    rows={4}
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="Masukkan keterangan lengkap..."
                    disabled={!isEditing}
                    className="w-full p-4 text-sm font-extrabold rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner resize-none leading-relaxed disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* FOTO COLUMN (Right) */}
              <div className="md:col-span-1 flex flex-col items-center justify-start pt-2">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
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
                  onClick={() => { if (isEditing) document.getElementById("service-point-file-upload")?.click(); }}
                  className={`${!isEditing ? "pointer-events-none opacity-60 " : ""}w-full aspect-square border-4 border-dashed border-cyan-300 hover:border-cyan-400 rounded-2xl flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all text-center bg-cyan-50 hover:bg-cyan-100 cursor-pointer`}
                >
                  <input
                    id="service-point-file-upload"
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
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-purple-600 mb-2" />
                      <span className="text-[10px] font-black text-purple-950 uppercase tracking-wide">MENGUNGGAH...</span>
                    </div>
                  ) : foto ? (
                    <div className="w-full h-full relative group">
                      <img
                        src={foto}
                        alt="Pratinjau Titik Layanan"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                        <span className="text-white text-[10px] font-black uppercase tracking-wider">UBAH FOTO</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="h-10 w-10 text-cyan-600 mb-2" />
                      <span className="text-[9px] font-black text-purple-950 uppercase block tracking-wider leading-relaxed">
                        DRAG & DROP
                      </span>
                      <span className="text-[9px] font-black text-purple-900 block mt-0.5 uppercase tracking-wide">
                        OR CLICK
                      </span>
                    </>
                  )}
                </div>

                <p className="text-[10px] font-bold text-slate-400 mt-1.5 italic text-center">
                  * Batas maksimal ukuran foto adalah 5MB.
                </p>

                <div className="w-full mt-4 flex flex-col gap-1 text-left">
                  <label className="text-[10px] font-black uppercase text-slate-500">URL Foto Titik Layanan</label>
                  <input
                    type="text"
                    placeholder="Masukkan URL foto..."
                    value={foto}
                    onChange={(e) => setFoto(e.target.value)}
                    disabled={!isEditing}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              </div>

              {/* ACTION BUTTONS */}
              <div className="p-6 sm:p-8 pt-4 shrink-0 border-t border-slate-200 flex items-center justify-end gap-3 bg-white rounded-b-3xl">
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
