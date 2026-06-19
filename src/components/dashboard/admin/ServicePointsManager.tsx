import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { parseCSV, downloadCSV, mapCsvRows, parseExcel } from "@/lib/utils";
import { Edit3, Trash2, Search, UploadCloud, Plus, Save, X, Upload, Download, Loader2 } from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmProvider";
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
  } catch {}
};

export function ServicePointsManager() {
  const confirm = useConfirm();
  const [servicePoints, setServicePoints] = useState<ServicePoint[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form states
  const [formVisible, setFormVisible] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
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

  // CSV Export Logic
  const handleExportCSV = () => {
    if (servicePoints.length === 0) {
      toast.error("Tidak ada data untuk diekspor!");
      return;
    }
    const headers = ["NAMA TITIK LAYANAN", "ALAMAT", "PENJAB", "WAKTU PEMBELAJARAN", "JUMLAH WB", "KETERANGAN", "FOTO"];
    const rows = servicePoints.map(s => [
      `"${(s.nama || "").replace(/"/g, '""')}"`,
      `"${(s.alamat || "").replace(/"/g, '""')}"`,
      `"${(s.penjab || "").replace(/"/g, '""')}"`,
      `"${(s.waktuPembelajaran || "").replace(/"/g, '""')}"`,
      `"${(s.jumlahWb || "").replace(/"/g, '""')}"`,
      `"${(s.keterangan || "").replace(/"/g, '""')}"`,
      `"${(s.foto || "").replace(/"/g, '""')}"`
    ]);
    downloadCSV(headers, rows, "titik_layanan.csv");
    toast.success("Berhasil mengunduh CSV!");
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    
    try {
      let rows: string[][] = [];
      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
        rows = await parseExcel(file);
      } else {
        const text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string || "");
          reader.onerror = (err) => reject(err);
          reader.readAsText(file);
        });
        rows = parseCSV(text);
      }

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
        <div className="flex items-center gap-3">
          <label className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-[10px] px-4 py-2.5 rounded-xl cursor-pointer uppercase tracking-wider shadow-md shadow-purple-200/40 flex items-center justify-center gap-1.5 transition-all select-none active:scale-95">
            <Upload className="h-4 w-4" /> UPLOAD CSV / EXCEL
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleImportCSV}
              className="hidden"
            />
          </label>
          <Button
            onClick={handleExportCSV}
            className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-[10px] px-4 py-2.5 rounded-xl cursor-pointer uppercase tracking-wider shadow-md shadow-purple-200/40 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Download className="h-4 w-4" /> EKSPOR CSV
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setFormVisible(true);
            }}
            className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md shadow-purple-200 uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" /> TAMBAH BARU
          </Button>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {/* Table Search Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
            Daftar Titik Layanan ({filteredServicePoints.length})
          </span>
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="cari"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs border border-slate-200 rounded-xl bg-white font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
            />
          </div>
        </div>

        {/* Beautiful Mockup-aligned Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[1000px]">
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

      {/* POPUP / MODAL FORM DIALOG */}
      {formVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={resetForm} />

          {/* Form Container */}
          <div className="relative bg-[#00badb] rounded-3xl overflow-hidden shadow-2xl w-full max-w-3xl border-4 border-cyan-400 animate-in zoom-in-95 duration-200 p-6 sm:p-8 text-white">
            
            {/* Close button */}
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
                
                {/* NAMA TITIK LAYANAN */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">
                    NAMA TITIK LAYANAN
                  </label>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Masukkan nama titik layanan"
                    className="w-full h-10 px-4 text-sm font-extrabold border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner"
                  />
                </div>

                {/* ALAMAT */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">
                    ALAMAT
                  </label>
                  <input
                    type="text"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    placeholder="Masukkan alamat lengkap titik layanan"
                    className="w-full h-10 px-4 text-sm font-extrabold border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner"
                  />
                </div>

                {/* PENJAB (Dropdown Data Pengelola) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">
                    PENJAB (PENANGGUNG JAWAB)
                  </label>
                  <select
                    value={penjab}
                    onChange={(e) => setPenjab(e.target.value)}
                    className="w-full h-10 px-4 text-sm font-extrabold border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner"
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
                    <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">
                      WAKTU PEMBELAJARAN
                    </label>
                    <input
                      type="text"
                      value={waktuPembelajaran}
                      onChange={(e) => setWaktuPembelajaran(e.target.value)}
                      placeholder="Contoh: Jum'at s.d Minggu Pukul 14.00"
                      className="w-full h-10 px-4 text-sm font-extrabold border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">
                      JUMLAH WB (WARGA BELAJAR)
                    </label>
                    <input
                      type="text"
                      value={jumlahWb}
                      onChange={(e) => setJumlahWb(e.target.value)}
                      placeholder="Contoh: 45 WB"
                      className="w-full h-10 px-4 text-sm font-extrabold border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner"
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
                    placeholder="Masukkan keterangan lengkap..."
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
                  onClick={() => document.getElementById("service-point-file-upload")?.click()}
                  className="w-full aspect-square border-4 border-dashed border-white/60 hover:border-white rounded-2xl flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all text-center bg-cyan-300/40 hover:bg-cyan-350/50 cursor-pointer"
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
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-white/30 border-t-purple-600 mb-2" />
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
                  <label className="text-[10px] font-black uppercase text-cyan-50">URL Foto Titik Layanan</label>
                  <input
                    type="text"
                    placeholder="Masukkan URL foto..."
                    value={foto}
                    onChange={(e) => setFoto(e.target.value)}
                    className="w-full text-xs font-semibold border-none rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>

              {/* ACTION BUTTONS */}
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
                  disabled={saving || uploading}
                  className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-black text-xs px-8 h-11 rounded-full cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest flex items-center gap-1.5 transition-all"
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
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
