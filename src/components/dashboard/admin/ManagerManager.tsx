import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Edit3,
  Save,
  Trash2,
  UploadCloud,
  UserPlus,
  Search,
  Filter,
  RotateCcw,
  Download,
  Upload,
} from "lucide-react";

interface ManagerData {
  id?: number;
  nama: string;
  nik: string;
  jabatan: string;
  nuptk: string;
  tempatTglLahir: string;
  jenisKelamin: string;
  agama: string;
  pendidikan: string;
  email: string;
  tanggalMulaiTugas: string;
  nomorSkPengangkatan: string;
  lembagaPengangkat: string;
  nomorSkPenugasan: string;
  lembagaPenugas: string;
  alamat: string;
  password: string;
  foto: string;
}

const STORAGE_KEY = "pkbm_managers_data";

const DEFAULT_MANAGER: ManagerData = {
  nama: "",
  nik: "",
  jabatan: "",
  nuptk: "",
  tempatTglLahir: "",
  jenisKelamin: "",
  agama: "",
  pendidikan: "",
  email: "",
  tanggalMulaiTugas: "",
  nomorSkPengangkatan: "",
  lembagaPengangkat: "",
  nomorSkPenugasan: "",
  lembagaPenugas: "",
  alamat: "",
  password: "",
  foto: "",
};

// Safe LocalStorage helpers
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
  } catch (e) {
    throw e;
  }
};

export default function ManagerManager() {
  const [managersList, setManagersList] = useState<ManagerData[]>([]);
  const [selectedManager, setSelectedManager] = useState<ManagerData>(DEFAULT_MANAGER);
  const [isNew, setIsNew] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [searchNik, setSearchNik] = useState("");
  const [activeFilter, setActiveFilter] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasUnsyncedOfflineData, setHasUnsyncedOfflineData] = useState(false);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: "", show: false });
  const toastTimeoutRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchManagers = async () => {
    try {
      const res = await fetch("/api/managers");
      const data = await res.json();
      if (data.success && data.data) {
        setManagersList(data.data);
        if (data.data.length > 0 && !selectedManager.nama) {
          setSelectedManager(data.data[0]);
        }
        try {
          setSafeItem(STORAGE_KEY, JSON.stringify(data.data));
        } catch {
          // ignore seeding write failures
        }
      } else {
        throw new Error("Invalid structure");
      }
    } catch (err) {
      setHasUnsyncedOfflineData(true);
      const saved = getSafeItem(STORAGE_KEY);
      if (saved) {
        try {
          const list = JSON.parse(saved);
          setManagersList(list);
          if (list.length > 0 && !selectedManager.nama) {
            setSelectedManager(list[0]);
          }
        } catch {
          setManagersList([]);
        }
      }
    }
  };

  const handleSyncData = async () => {
    const saved = getSafeItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const list: ManagerData[] = JSON.parse(saved);
      const token = getSafeItem("token");
      
      showToast("Sinkronisasi data pengelola ke server...");
      
      for (const manager of list) {
        const method = manager.id && String(manager.id).length < 10 ? "PUT" : "POST";
        const url = method === "PUT" ? `/api/managers/${manager.id}` : "/api/managers";
        
        await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(manager),
        });
      }
      showToast("Sinkronisasi data ke server berhasil!");
      setHasUnsyncedOfflineData(false);
      fetchManagers();
    } catch {
      showToast("⚠️ Gagal sinkronisasi. Periksa koneksi internet Anda!");
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

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

  const handleFieldChange = (field: keyof ManagerData, value: string) => {
    setSelectedManager((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectManager = (manager: ManagerData) => {
    setSelectedManager(manager);
    setIsNew(false);
    setIsLocked(true);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedManager({ ...DEFAULT_MANAGER });
    setIsNew(true);
    setIsLocked(false);
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!selectedManager.nama || !selectedManager.jabatan) {
      showToast("Nama dan Jabatan wajib diisi!");
      return;
    }

    const token = getSafeItem("token");
    let isNetworkError = false;

    try {
      const method = isNew ? "POST" : "PUT";
      const url = isNew ? "/api/managers" : `/api/managers/${selectedManager.id}`;
      
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(selectedManager),
      });
      const data = await res.json();
      if (data.success) {
        showToast(isNew ? "Pengelola baru berhasil ditambahkan!" : "Profil pengelola berhasil disimpan!");
        setIsLocked(true);
        setIsNew(false);
        fetchManagers();
        setHasUnsyncedOfflineData(false);
        if (data.data) {
          setSelectedManager(data.data);
        }
        return;
      } else {
        showToast(data.message || "Gagal menyimpan data pengelola");
      }
    } catch (err) {
      if (err instanceof TypeError) {
        isNetworkError = true;
      } else {
        showToast("Terjadi kesalahan sistem saat menyimpan.");
      }
    }

    // Local storage fallback ONLY on genuine fetch/network failures
    if (isNetworkError) {
      try {
        let updatedList = [...managersList];
        if (isNew) {
          const newId = Date.now();
          const newObj = { ...selectedManager, id: newId };
          updatedList.push(newObj);
          setSelectedManager(newObj);
        } else {
          updatedList = updatedList.map((m) => (m.id === selectedManager.id ? selectedManager : m));
        }

        setSafeItem(STORAGE_KEY, JSON.stringify(updatedList));
        setManagersList(updatedList);
        setHasUnsyncedOfflineData(true);
        showToast("Disimpan secara lokal (Offline)!");
        setIsLocked(true);
        setIsNew(false);
      } catch (e: any) {
        showToast("⚠️ Offline: Gagal menyimpan data.");
      }
    }
  };

  const handleDelete = async () => {
    if (isNew) {
      // Cancel add new
      if (managersList.length > 0) {
        setSelectedManager(managersList[0]);
      } else {
        setSelectedManager(DEFAULT_MANAGER);
      }
      setIsNew(false);
      setIsLocked(true);
      setIsFormOpen(false);
      return;
    }

    if (!selectedManager.id) return;

    if (!confirm(`Apakah Anda yakin ingin menghapus data pengelola ${selectedManager.nama}?`)) {
      return;
    }

    const token = getSafeItem("token");
    let isNetworkError = false;

    try {
      const res = await fetch(`/api/managers/${selectedManager.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        showToast("Data pengelola berhasil dihapus!");
        const remaining = managersList.filter((m) => m.id !== selectedManager.id);
        setManagersList(remaining);
        if (remaining.length > 0) {
          setSelectedManager(remaining[0]);
        } else {
          setSelectedManager(DEFAULT_MANAGER);
        }
        setIsLocked(true);
        setIsFormOpen(false);
        fetchManagers();
        return;
      } else {
        showToast(data.message || "Gagal menghapus data pengelola");
      }
    } catch (err) {
      if (err instanceof TypeError) {
        isNetworkError = true;
      } else {
        showToast("Terjadi kesalahan sistem saat menghapus.");
      }
    }

    if (isNetworkError) {
      const remaining = managersList.filter((m) => m.id !== selectedManager.id);
      try {
        setSafeItem(STORAGE_KEY, JSON.stringify(remaining));
        setManagersList(remaining);
        showToast("Dihapus secara lokal (Offline)!");
        if (remaining.length > 0) {
          setSelectedManager(remaining[0]);
        } else {
          setSelectedManager(DEFAULT_MANAGER);
        }
        setIsLocked(true);
        setIsFormOpen(false);
      } catch {
        showToast("⚠️ Offline: Gagal menghapus data.");
      }
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

    setUploadingFoto(true);
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
        handleFieldChange("foto", data.url);
        showToast("Foto berhasil diunggah!");
      } else {
        throw new Error(data.message || "Gagal mengunggah foto");
      }
    } catch (err: any) {
      if (err instanceof TypeError) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          if (base64Data.length > 1.5 * 1024 * 1024) { // Limit to 1.5MB base64 characters (~1.1MB file size) to prevent localStorage quota issues
            showToast("⚠️ Offline: Berkas gambar terlalu besar untuk disimpan offline (Maks 1MB)!");
            return;
          }
          handleFieldChange("foto", base64Data);
          showToast("Foto disimpan secara lokal (Offline)!");
        };
        reader.readAsDataURL(file);
      } else {
        showToast(err.message || "Gagal mengunggah foto.");
      }
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleDownloadData = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(managersList, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "data_pengelola.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Data pengelola berhasil diunduh!");
    } catch {
      showToast("Gagal mengunduh data pengelola.");
    }
  };

  const handleUploadData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          // Schema validation check for reliability
          const isValid = parsed.every(
            (item) => typeof item === "object" && item !== null && "nama" in item && "jabatan" in item
          );
          if (!isValid) {
            showToast("Format berkas JSON tidak valid! Tiap item wajib memiliki bidang 'nama' dan 'jabatan'.");
            return;
          }
          // Save list
          setManagersList(parsed);
          try {
            setSafeItem(STORAGE_KEY, JSON.stringify(parsed));
          } catch {}
          if (parsed.length > 0) {
            setSelectedManager(parsed[0]);
          }
          showToast("Data pengelola berhasil diunggah dan disimpan!");
        } else {
          showToast("Format berkas JSON tidak valid (harus berupa array).");
        }
      } catch {
        showToast("Gagal memproses berkas JSON.");
      }
    };
    reader.readAsText(file);
  };

  // Filtered List based on Search inputs
  const filteredList = managersList.filter((m) => {
    const matchName = m.nama.toLowerCase().includes(searchName.toLowerCase());
    const matchNik = m.nik.toLowerCase().includes(searchNik.toLowerCase());
    return matchName && matchNik;
  });

  return (
    <div className="space-y-6 relative pb-16 animate-in fade-in duration-300">
      
      {/* MOCKUP NAV TOP BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-cyan-900 tracking-tight flex items-center gap-2">
            <span>👥</span> DATA PENGELOLA
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Kelola data, NIK, dan peranan struktur pengelola PKBM Menuju Makmur.
          </p>
        </div>
      </div>

      {/* FILTER & CONTROL BAR (Vibrant design matches mockup) */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-100/80 rounded-2xl border border-slate-200/40">
        
        {/* SYNC DATA OFFLINE */}
        {hasUnsyncedOfflineData && (
          <Button
            onClick={handleSyncData}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 h-10 rounded-xl shadow-md uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer animate-pulse"
          >
            🔄 SYNC OFFLINE
          </Button>
        )}

        {/* ADD MANAGER BUTTON */}
        <Button
          onClick={handleAddNew}
          className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-4 h-10 rounded-xl shadow-md uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <UserPlus className="h-4 w-4" /> TAMBAH PENGELOLA
        </Button>

        {/* SEARCH BY NAME */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="CARI BERDASARKAN NAMA"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full h-10 pl-9 pr-4 text-xs font-bold border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-cyan-500 placeholder-slate-450 uppercase"
          />
        </div>

        {/* SEARCH BY NIK */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="CARI BERDASARKAN NIK"
            value={searchNik}
            onChange={(e) => setSearchNik(e.target.value)}
            className="w-full h-10 pl-9 pr-4 text-xs font-bold border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-cyan-500 placeholder-slate-450 uppercase"
          />
        </div>

        {/* FILTER BUTTON */}
        <Button
          onClick={() => {
            setActiveFilter(!activeFilter);
            showToast(activeFilter ? "Filter dimatikan." : "Filter diaktifkan.");
          }}
          className={`h-10 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
            activeFilter ? "bg-cyan-600 hover:bg-cyan-700 text-white" : "bg-cyan-500 hover:bg-cyan-600 text-white"
          }`}
        >
          <Filter className="h-4 w-4" /> FILTER
        </Button>

        {/* RESET BUTTON */}
        <Button
          onClick={() => {
            setSearchName("");
            setSearchNik("");
            setActiveFilter(false);
            showToast("Pencarian direset!");
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white h-10 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" /> RESET
        </Button>

        {/* UPLOAD DATA BUTTON */}
        <div className="relative">
          <input
            type="file"
            accept=".json"
            id="upload-json-data"
            onChange={handleUploadData}
            className="hidden"
          />
          <Button
            onClick={() => document.getElementById("upload-json-data")?.click()}
            className="bg-purple-600 hover:bg-purple-700 text-white h-10 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Upload className="h-4 w-4" /> UPLOAD
          </Button>
        </div>

        {/* DOWNLOAD DATA BUTTON */}
        <Button
          onClick={handleDownloadData}
          className="bg-purple-600 hover:bg-purple-700 text-white h-10 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Download className="h-4 w-4" /> DOWNLOAD
        </Button>
      </div>

      {/* MANAGERS GRID CARDS (Direct design mapping from Canva screenshot) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filteredList.map((m) => (
          <div
            key={m.id || m.nama}
            onClick={() => handleSelectManager(m)}
            className={`border-4 rounded-3xl p-3 flex flex-col items-center justify-between text-center relative overflow-hidden transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-lg ${
              selectedManager.id === m.id && !isNew
                ? "border-purple-600 bg-white"
                : "border-purple-900 bg-[#f8fafc]"
            }`}
          >
            {/* POSITION TAG IN CARD */}
            <div className="absolute top-2 left-2 bg-purple-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">
              {m.jabatan || "STAF"}
            </div>

            {/* AVATAR / IMAGE */}
            <div className="w-full aspect-square flex items-center justify-center p-2 mt-4 relative">
              {m.foto ? (
                <img
                  src={m.foto}
                  alt={m.nama}
                  className="w-full h-full object-contain rounded-2xl"
                />
              ) : (
                <div className="w-full h-full rounded-2xl bg-cyan-100 flex items-center justify-center text-cyan-600 text-2xl font-black">
                  {m.nama.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* NAME IN GREEN VIBRANT TEXT */}
            <div className="mt-3 w-full">
              <span className="block text-sm font-black text-[#00bcd4] uppercase tracking-wide truncate max-w-full">
                {m.nama || "BELUM ADA NAMA"}
              </span>
            </div>

            {/* DETAIL PROFIL BUTTON */}
            <Button
              className="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black uppercase tracking-wider py-1.5 h-8 rounded-xl shadow-inner transition-colors"
            >
              DETAIL PROFIL
            </Button>
          </div>
        ))}
      </div>

      {/* DETAIL PROFILE AND FORM EDIT PANEL POPUP MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-300">
          {/* Backdrop Click Closes Popup */}
          <div className="absolute inset-0 cursor-default" onClick={() => { setIsFormOpen(false); setIsLocked(true); setIsNew(false); }} />
          
          <div className="bg-[#00bcd4] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl border-4 border-white shadow-2xl relative animate-in slide-in-from-bottom-8 duration-300 text-white select-text">
            
            {/* Elegant Close Button */}
            <button
              onClick={() => { setIsFormOpen(false); setIsLocked(true); setIsNew(false); }}
              className="absolute top-4 right-4 h-8 w-8 rounded-xl bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer text-sm font-black shadow-inner"
            >
              ✕
            </button>
        
        {/* PANEL TITLE */}
        <div className="mb-6 flex justify-between items-center border-b border-white/20 pb-4">
          <h3 className="bg-purple-600 text-white font-extrabold text-xs px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md">
            TAMPILAN TAMBAH PENGELOLA DAN DETAIL PROFIL
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* FORM INPUT PANEL */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* NAMA */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">
                NAMA
              </label>
              <input
                type="text"
                disabled={isLocked}
                placeholder="Masukkan nama lengkap dengan gelar (contoh: H. Maman Suparman, S.Pd.)"
                value={selectedManager.nama}
                onChange={(e) => handleFieldChange("nama", e.target.value)}
                className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            {/* NIK */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">
                NIK
              </label>
              <input
                type="text"
                disabled={isLocked}
                placeholder="Masukkan 16 digit Nomor Induk Kependudukan"
                value={selectedManager.nik}
                onChange={(e) => handleFieldChange("nik", e.target.value)}
                className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            {/* JABATAN */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">
                JABATAN
              </label>
              <input
                type="text"
                disabled={isLocked}
                placeholder="Masukkan jabatan (contoh: Ketua PKBM, Bendahara)"
                value={selectedManager.jabatan}
                onChange={(e) => handleFieldChange("jabatan", e.target.value)}
                className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            {/* NUPTK */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">
                NUPTK
              </label>
              <input
                type="text"
                disabled={isLocked}
                placeholder="Masukkan Nomor Unik Pendidik dan Tenaga Kependidikan (jika ada)"
                value={selectedManager.nuptk}
                onChange={(e) => handleFieldChange("nuptk", e.target.value)}
                className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            {/* TEMPAT, TGL. LAHIR */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">
                TEMPAT, TGL. LAHIR
              </label>
              <input
                type="text"
                disabled={isLocked}
                placeholder="Contoh: Ciamis, 12-05-1970"
                value={selectedManager.tempatTglLahir}
                onChange={(e) => handleFieldChange("tempatTglLahir", e.target.value)}
                className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            {/* JENIS KELAMIN */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">
                JENIS KELAMIN
              </label>
              <input
                type="text"
                disabled={isLocked}
                placeholder="Laki-laki / Perempuan"
                value={selectedManager.jenisKelamin}
                onChange={(e) => handleFieldChange("jenisKelamin", e.target.value)}
                className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            {/* AGAMA */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">
                AGAMA
              </label>
              <input
                type="text"
                disabled={isLocked}
                placeholder="Contoh: Islam, Kristen, dll"
                value={selectedManager.agama}
                onChange={(e) => handleFieldChange("agama", e.target.value)}
                className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            {/* PENDIDIKAN */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">
                PENDIDIKAN
              </label>
              <input
                type="text"
                disabled={isLocked}
                placeholder="Contoh: S1 Pendidikan, SMA, dll"
                value={selectedManager.pendidikan}
                onChange={(e) => handleFieldChange("pendidikan", e.target.value)}
                className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            {/* EMAIL */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">
                EMAIL
              </label>
              <input
                type="email"
                disabled={isLocked}
                placeholder="Contoh: nama@pkbmmakmur.org"
                value={selectedManager.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            {/* TANGGAL MULAI TUGAS */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">
                TANGGAL MULAI TUGAS
              </label>
              <input
                type="text"
                disabled={isLocked}
                placeholder="Masukkan tanggal mulai tugas (contoh: YYYY-MM-DD)"
                value={selectedManager.tanggalMulaiTugas}
                onChange={(e) => handleFieldChange("tanggalMulaiTugas", e.target.value)}
                className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            {/* NOMOR SK PENGANGKATAN */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">
                NOMOR SK PENGANGKATAN
              </label>
              <input
                type="text"
                disabled={isLocked}
                placeholder="Masukkan nomor SK pengangkatan"
                value={selectedManager.nomorSkPengangkatan}
                onChange={(e) => handleFieldChange("nomorSkPengangkatan", e.target.value)}
                className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            {/* LEMBAGA YANG MENGELUARKAN SK PENGANGKATAN */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">
                LEMBAGA YANG MENGELUARKAN (SK PENGANGKATAN)
              </label>
              <input
                type="text"
                disabled={isLocked}
                placeholder="Masukkan nama lembaga yang mengeluarkan SK"
                value={selectedManager.lembagaPengangkat}
                onChange={(e) => handleFieldChange("lembagaPengangkat", e.target.value)}
                className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            {/* NOMOR SK PENUGASAN */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">
                NOMOR SK PENUGASAN
              </label>
              <input
                type="text"
                disabled={isLocked}
                placeholder="Masukkan nomor SK penugasan"
                value={selectedManager.nomorSkPenugasan}
                onChange={(e) => handleFieldChange("nomorSkPenugasan", e.target.value)}
                className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            {/* LEMBAGA YANG MENGELUARKAN SK PENUGASAN */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">
                LEMBAGA YANG MENGELUARKAN (SK PENUGASAN)
              </label>
              <input
                type="text"
                disabled={isLocked}
                placeholder="Masukkan nama lembaga yang menugaskan"
                value={selectedManager.lembagaPenugas}
                onChange={(e) => handleFieldChange("lembagaPenugas", e.target.value)}
                className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            {/* ALAMAT */}
            <div className="flex flex-col md:flex-row md:items-start gap-3">
              <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0 md:pt-2">
                ALAMAT
              </label>
              <textarea
                rows={2}
                disabled={isLocked}
                placeholder="Masukkan alamat domisili lengkap pengelola"
                value={selectedManager.alamat}
                onChange={(e) => handleFieldChange("alamat", e.target.value)}
                className="flex-1 p-2.5 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed resize-none transition-colors"
              />
            </div>

            {/* PASWORD */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">
                PASWORD
              </label>
              <input
                type={showPassword ? "text" : "password"}
                disabled={isLocked}
                placeholder="Masukkan sandi baru (kosongkan jika tidak ingin diubah)"
                value={selectedManager.password}
                onChange={(e) => handleFieldChange("password", e.target.value)}
                className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="h-9 px-3 rounded-lg border-2 border-white bg-white/10 hover:bg-white/20 text-[10px] font-black text-white shrink-0 cursor-pointer"
              >
                {showPassword ? "SEMBUNYIKAN" : "LIHAT"}
              </button>
            </div>
          </div>
          {/* FOTO UPLOAD PANEL */}
          <div className="lg:col-span-1 flex flex-col items-center gap-6">
            
            {/* PHOTO UPLOAD */}
            <div className="w-full text-center">
              <h4 className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wider mb-2">
                FOTO
              </h4>
              
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (isLocked) {
                    showToast("Buka kunci (Klik Edit) untuk mengubah Foto!");
                    return;
                  }
                  const file = e.dataTransfer.files?.[0];
                  if (file) processUpload(file);
                }}
                onClick={() => {
                  if (isLocked) {
                    showToast("Buka kunci (Klik Edit) untuk mengubah Foto!");
                    return;
                  }
                  fileInputRef.current?.click();
                }}
                className={`w-full aspect-square border-4 border-dashed rounded-2xl flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all text-center bg-white ${
                  isLocked
                    ? "border-slate-350 cursor-not-allowed opacity-80"
                    : "border-purple-400 hover:border-purple-600 hover:bg-purple-50/20 cursor-pointer"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  disabled={isLocked}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      processUpload(file);
                      e.target.value = "";
                    }
                  }}
                  className="hidden"
                />

                {uploadingFoto ? (
                  <div className="flex flex-col items-center text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-purple-600 mb-2" />
                    <span className="text-[10px] font-bold uppercase">UPLOADING...</span>
                  </div>
                ) : selectedManager.foto ? (
                  <div className="w-full h-full relative group">
                    <img
                      src={selectedManager.foto}
                      alt="Foto Pengelola"
                      className="w-full h-full object-contain rounded-lg"
                    />
                    {!isLocked && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <span className="text-white text-[10px] font-black uppercase tracking-wider">UBAH FOTO</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <UploadCloud className="h-10 w-10 text-purple-600 mb-2" />
                    <span className="text-[10px] font-black text-cyan-900 uppercase block tracking-wider leading-relaxed">
                      DRAG AND DROP A FILE
                    </span>
                    <span className="text-[8px] font-bold text-cyan-600 block mt-0.5">
                      HERE OR CLICK
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BUTTON PANEL (Hapus, Edit, Simpan matching Canva mockup locations) */}
        <div className="mt-8 pt-6 border-t border-white/20 flex flex-wrap items-center justify-between gap-4">
          
          {/* LEFT BUTTON: HAPUS */}
          <Button
            type="button"
            onClick={handleDelete}
            className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-6 h-10 rounded-xl cursor-pointer shadow-md uppercase tracking-wider flex items-center gap-1.5 transition-all"
          >
            <Trash2 className="h-4 w-4" /> HAPUS
          </Button>

          {/* RIGHT BUTTONS: EDIT & SIMPAN */}
          <div className="flex items-center gap-3">
            {isLocked ? (
              <Button
                type="button"
                onClick={() => setIsLocked(false)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-6 h-10 rounded-xl cursor-pointer shadow-md uppercase tracking-wider flex items-center gap-1.5 transition-all"
              >
                <Edit3 className="h-4 w-4" /> EDIT
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  onClick={() => {
                    if (isNew) {
                      if (managersList.length > 0) {
                        setSelectedManager(managersList[0]);
                      } else {
                        setSelectedManager(DEFAULT_MANAGER);
                      }
                      setIsNew(false);
                    }
                    setIsLocked(true);
                    setIsFormOpen(false);
                  }}
                  className="bg-slate-200 hover:bg-slate-350 text-slate-700 font-extrabold text-xs px-6 h-10 rounded-xl cursor-pointer uppercase tracking-wider transition-all"
                >
                  BATAL
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-6 h-10 rounded-xl cursor-pointer shadow-md uppercase tracking-wider flex items-center gap-1.5 transition-all"
                >
                  <Save className="h-4 w-4" /> SIMPAN
                </Button>
              </>
            )}
          </div>

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
