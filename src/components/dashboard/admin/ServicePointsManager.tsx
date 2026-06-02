import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Edit3, Trash2, Search, UploadCloud, Plus, Save, X, Upload, Download } from "lucide-react";

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
    if (!confirm("Apakah Anda yakin ingin menghapus titik layanan ini?")) return;
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
        showToast("Titik layanan berhasil dihapus!");
        fetchServicePoints();
      } else {
        showToast(resData.message || "Gagal menghapus data");
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
      showToast(err.message || "Gagal mengunggah gambar.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!nama.trim()) {
      showToast("Nama Titik Layanan tidak boleh kosong!");
      return;
    }
    if (!alamat.trim()) {
      showToast("Alamat tidak boleh kosong!");
      return;
    }
    if (!penjab.trim()) {
      showToast("Penanggung Jawab (Penjab) tidak boleh kosong!");
      return;
    }

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
        showToast(editId !== null ? "Titik layanan berhasil diperbarui!" : "Titik layanan baru berhasil ditambahkan!");
        resetForm();
        fetchServicePoints();
      } else {
        showToast(resData.message || "Gagal menyimpan titik layanan.");
      }
    } catch (err) {
      showToast("Gagal menyimpan data ke server.");
    }
  };

  // CSV Export Logic
  const handleExportCSV = () => {
    if (servicePoints.length === 0) {
      showToast("Tidak ada data untuk diekspor!");
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
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "titik_layanan.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Berhasil mengunduh CSV!");
  };

  // CSV Import Logic
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      
      const lines = text.split("\n");
      const importedData: {
        nama: string;
        alamat: string;
        penjab: string;
        waktuPembelajaran: string;
        jumlahWb: string;
        keterangan: string;
        foto: string;
      }[] = [];
      
      let startIdx = 0;
      if (lines[0] && (lines[0].toLowerCase().includes("nama") || lines[0].toLowerCase().includes("name"))) {
        startIdx = 1;
      }
      
      const parseCSVLine = (textLine: string): string[] => {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < textLine.length; i++) {
          const char = textLine[i];
          if (char === '"') {
            if (inQuotes && textLine[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const cleanCols = parseCSVLine(line);
        
        if (cleanCols[0] && cleanCols[1] && cleanCols[2]) {
          importedData.push({
            nama: cleanCols[0],
            alamat: cleanCols[1],
            penjab: cleanCols[2],
            waktuPembelajaran: cleanCols[3] || "",
            jumlahWb: cleanCols[4] || "",
            keterangan: cleanCols[5] || "",
            foto: cleanCols[6] || "",
          });
        }
      }
      
      if (importedData.length === 0) {
        showToast("Format CSV kosong atau tidak valid! Pastikan Nama, Alamat, dan Penjab tidak kosong.");
        return;
      }
      
      const token = getSafeItem("token");
      try {
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
          showToast(resData.message || "Berhasil mengimpor data!");
          fetchServicePoints();
        } else {
          showToast(resData.message || "Gagal mengimpor data");
        }
      } catch (err) {
        showToast("Kesalahan saat mengunggah CSV ke server.");
      }
    };
    reader.readAsText(file);
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

        {/* SEARCH & IMPORT EXPORT BUTTONS */}
        <div className="flex items-center gap-3">
          {/* UPLOAD BUTTON */}
          <label className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-[10px] px-5 h-10 rounded-full cursor-pointer uppercase tracking-widest shadow-md shadow-purple-200/40 flex items-center justify-center gap-1.5 transition-all select-none">
            <Upload className="h-3.5 w-3.5" /> UPLOAD
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
          </label>

          {/* DOWNLOAD BUTTON */}
          <Button
            onClick={handleExportCSV}
            className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-[10px] px-5 h-10 rounded-full cursor-pointer uppercase tracking-widest shadow-md shadow-purple-200/40 flex items-center gap-1.5 transition-all"
          >
            <Download className="h-3.5 w-3.5" /> DOWNLOAD
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
      </div>

      {/* TABLE SECTION */}
      <div className="overflow-x-auto rounded-2xl border border-cyan-200/80 bg-white shadow-sm">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-cyan-400 text-cyan-950 font-black text-xs uppercase tracking-wider border-b border-cyan-200">
              <th className="py-4 px-4 text-center w-16">NO</th>
              <th className="py-4 px-6 w-48">NAMA TITIK LAYANAN</th>
              <th className="py-4 px-6 w-56">ALAMAT</th>
              <th className="py-4 px-6 w-40">PENJAB</th>
              <th className="py-4 px-6 w-48">WAKTU PEMBELAJARAN</th>
              <th className="py-4 px-4 text-center w-28">JUMLAH WB</th>
              <th className="py-4 px-6">KETERANGAN</th>
              <th className="py-4 px-6 w-36 text-center">FOTO</th>
              <th className="py-4 px-6 w-32 text-center">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {filteredServicePoints.length > 0 ? (
              filteredServicePoints.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                  <td className="py-4 px-6 font-extrabold text-slate-900">{item.nama}</td>
                  <td className="py-4 px-6 text-slate-650 leading-relaxed font-semibold">{item.alamat}</td>
                  <td className="py-4 px-6 font-extrabold text-[#9c27b0]">{item.penjab}</td>
                  <td className="py-4 px-6 text-slate-650 font-semibold">{item.waktuPembelajaran}</td>
                  <td className="py-4 px-4 text-center font-extrabold text-slate-900">{item.jumlahWb}</td>
                  <td className="py-4 px-6 text-slate-650 leading-relaxed font-medium line-clamp-3 md:line-clamp-none mt-2">{item.keterangan}</td>
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
                <td colSpan={9} className="py-8 text-center text-slate-400 font-bold uppercase">
                  Tidak ada data titik layanan ditemukan
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
