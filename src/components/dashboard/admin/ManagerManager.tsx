import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { parseCSV, downloadCSV, mapCsvRows, parseExcel } from "@/lib/utils";
import {
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
  List,
  LayoutGrid,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { toast } from "sonner";

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
  const confirm = useConfirm();
  const [managersList, setManagersList] = useState<ManagerData[]>([]);
  const [selectedManager, setSelectedManager] = useState<ManagerData>(DEFAULT_MANAGER);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [isNew, setIsNew] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [searchNik, setSearchNik] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterNik, setFilterNik] = useState("");
  const [activeFilter, setActiveFilter] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasUnsyncedOfflineData, setHasUnsyncedOfflineData] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [dbManagerIds, setDbManagerIds] = useState<Set<number>>(new Set());

  const fetchManagers = async () => {
    try {
      const token = getSafeItem("token");
      const res = await fetch("/api/managers", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && data.data) {
        const sanitized = data.data.map((item: any) => ({
          ...DEFAULT_MANAGER,
          ...item,
        }));
        setManagersList(sanitized);
        setDbManagerIds(new Set(sanitized.map((m: any) => Number(m.id))));
        if (sanitized.length > 0 && !selectedManager.nama) {
          setSelectedManager(sanitized[0]);
        }
        try {
          setSafeItem(STORAGE_KEY, JSON.stringify(sanitized));
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
          const sanitized = list.map((item: any) => ({
            ...DEFAULT_MANAGER,
            ...item,
          }));
          setManagersList(sanitized);
          const dbIds = sanitized.filter((m: any) => m.id && String(m.id).length < 10).map((m: any) => Number(m.id));
          setDbManagerIds(new Set(dbIds));
          if (sanitized.length > 0 && !selectedManager.nama) {
            setSelectedManager(sanitized[0]);
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
      
      toast.info("Sinkronisasi data pengelola ke server...");

      // 1. Sync offline deletions first
      const deletedIdsStr = getSafeItem("pkbm_managers_deleted_ids") || "[]";
      const deletedIds: number[] = JSON.parse(deletedIdsStr);
      if (deletedIds.length > 0) {
        for (const delId of deletedIds) {
          try {
            await fetch(`/api/managers/${delId}`, {
              method: "DELETE",
              headers: {
                "Authorization": `Bearer ${token}`,
              },
            });
          } catch {
            // If deleting a specific record fails on server, keep trying others
          }
        }
        setSafeItem("pkbm_managers_deleted_ids", "[]");
      }
      
      // 2. Sync creations and updates
      let updatedList = [...list];
      
      for (let i = 0; i < updatedList.length; i++) {
        const manager = updatedList[i];
        
        // Determine method based on whether the ID exists in our known server database records
        const method = manager.id && dbManagerIds.has(Number(manager.id)) ? "PUT" : "POST";
        const url = method === "PUT" ? `/api/managers/${manager.id}` : "/api/managers";
        
        // Strip the id property from the body payload for both POST and PUT requests to prevent validation failures
        const { id: _, ...bodyToSend } = manager;
        
        const res = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(bodyToSend),
        });
        
        const resData = await res.json();
        if (resData.success && resData.data) {
          // Update the specific record in the local list with the server-returned data (has correct DB id)
          updatedList[i] = resData.data;
          // Update localStorage immediately after each record to prevent duplication on partial sync failures
          setSafeItem(STORAGE_KEY, JSON.stringify(updatedList));
          setManagersList(updatedList);
        } else {
          throw new Error(resData.message || "Gagal sinkronisasi data");
        }
      }
      
      toast.success("Sinkronisasi data ke server berhasil!");
      setHasUnsyncedOfflineData(false);
      fetchManagers();
    } catch (err: any) {
      toast.error(`Sinkronisasi terhenti: ${err.message || 'Periksa koneksi internet!'}`);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  const handleCloseForm = async () => {
    if (isFormDirty && !await confirm({
      title: "Perubahan Belum Disimpan",
      message: "Ada perubahan yang belum disimpan. Yakin ingin menutup?",
      variant: "danger"
    })) return;
    setIsFormOpen(false);
    setIsLocked(true);
    setIsNew(false);
    setIsFormDirty(false);
  };

  const handleFieldChange = (field: keyof ManagerData, value: string) => {
    if (!isLocked) setIsFormDirty(true);
    setSelectedManager((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectManager = (manager: ManagerData) => {
    setSelectedManager(manager);
    setIsFormDirty(false);
    setIsNew(false);
    setIsLocked(true);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedManager({ ...DEFAULT_MANAGER });
    setIsFormDirty(false);
    setIsNew(true);
    setIsLocked(false);
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!selectedManager.nama || !selectedManager.jabatan) {
      toast.error("Nama dan Jabatan wajib diisi!");
      return;
    }

    setSaving(true);
    const token = getSafeItem("token");
    let isNetworkError = false;

    try {
      const method = isNew ? "POST" : "PUT";
      const url = isNew ? "/api/managers" : `/api/managers/${selectedManager.id}`;
      
      // Strip ID from the request body to prevent backend schema validation failures
      const { id, ...payload } = selectedManager;
      
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isNew ? "Pengelola baru berhasil ditambahkan!" : "Profil pengelola berhasil disimpan!");
        setIsFormDirty(false);
        setIsLocked(true);
        setIsNew(false);
        fetchManagers();
        setHasUnsyncedOfflineData(false);
        if (data.data) {
          setSelectedManager(data.data);
        }
        return;
      } else {
        toast.error(data.message || "Gagal menyimpan data pengelola");
      }
    } catch (err) {
      if (err instanceof TypeError) {
        isNetworkError = true;
      } else {
        toast.error("Terjadi kesalahan sistem saat menyimpan.");
      }
    } finally {
      setSaving(false);
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
        setIsFormDirty(false);
        toast.success("Disimpan secara lokal (Offline)!");
        setIsLocked(true);
        setIsNew(false);
      } catch (e: any) {
        toast.error("⚠️ Offline: Gagal menyimpan data.");
      }
    }
  };

  const handleDelete = async () => {
    if (isNew) {
      if (isFormDirty && !await confirm({
        title: "Perubahan Belum Disimpan",
        message: "Ada perubahan yang belum disimpan. Yakin ingin menutup?",
        variant: "danger"
      })) return;
      if (managersList.length > 0) {
        setSelectedManager(managersList[0]);
      } else {
        setSelectedManager(DEFAULT_MANAGER);
      }
      setIsFormDirty(false);
      setIsNew(false);
      setIsLocked(true);
      setIsFormOpen(false);
      return;
    }

    if (!selectedManager.id) return;

    if (!await confirm({
      title: "Hapus Data Pengelola",
      message: `Apakah Anda yakin ingin menghapus data pengelola ${selectedManager.nama}?`,
      variant: "danger"
    })) {
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
        toast.success("Data pengelola berhasil dihapus!");
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
        toast.error(data.message || "Gagal menghapus data pengelola");
      }
    } catch (err) {
      if (err instanceof TypeError) {
        isNetworkError = true;
      } else {
        toast.error("Terjadi kesalahan sistem saat menghapus.");
      }
    }

    if (isNetworkError) {
      const remaining = managersList.filter((m) => m.id !== selectedManager.id);
      try {
        // Track offline deletion if it was a saved server record (existed in dbManagerIds)
        if (selectedManager.id && dbManagerIds.has(Number(selectedManager.id))) {
          const deletedIdsStr = getSafeItem("pkbm_managers_deleted_ids") || "[]";
          const deletedIds: number[] = JSON.parse(deletedIdsStr);
          if (!deletedIds.includes(Number(selectedManager.id))) {
            deletedIds.push(Number(selectedManager.id));
            setSafeItem("pkbm_managers_deleted_ids", JSON.stringify(deletedIds));
          }
        }
        setSafeItem(STORAGE_KEY, JSON.stringify(remaining));
        setManagersList(remaining);
        toast.success("Dihapus secara lokal (Offline)!");
        if (remaining.length > 0) {
          setSelectedManager(remaining[0]);
        } else {
          setSelectedManager(DEFAULT_MANAGER);
        }
        setIsLocked(true);
        setIsFormOpen(false);
      } catch {
        toast.error("⚠️ Offline: Gagal menghapus data.");
      }
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
        toast.success("Foto berhasil diunggah!");
      } else {
        throw new Error(data.message || "Gagal mengunggah foto");
      }
    } catch (err: any) {
      if (err instanceof TypeError) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          if (base64Data.length > 1.5 * 1024 * 1024) { // Limit to 1.5MB base64 characters (~1.1MB file size) to prevent localStorage quota issues
            toast.error("⚠️ Offline: Berkas gambar terlalu besar untuk disimpan offline (Maks 1MB)!");
            return;
          }
          handleFieldChange("foto", base64Data);
          toast.success("Foto disimpan secara lokal (Offline)!");
        };
        reader.readAsDataURL(file);
      } else {
        toast.error(err.message || "Gagal mengunggah foto.");
      }
    } finally {
      setUploadingFoto(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (managersList.length === 0) {
      toast.error("Tidak ada data untuk diekspor!");
      return;
    }
    const headers = ["NAMA", "NIK", "JABATAN", "NUPTK", "TEMPAT TGL LAHIR", "JENIS KELAMIN", "AGAMA", "PENDIDIKAN", "EMAIL", "TANGGAL MULAI TUGAS", "NOMOR SK PENGANGKATAN", "LEMBAGA PENGANGKAT", "NOMOR SK PENUGASAN", "LEMBAGA PENUGAS", "ALAMAT", "FOTO"];
    const rows = managersList.map(m => [
      `"${(m.nama || "").replace(/"/g, '""')}"`,
      `"${(m.nik || "").replace(/"/g, '""')}"`,
      `"${(m.jabatan || "").replace(/"/g, '""')}"`,
      `"${(m.nuptk || "").replace(/"/g, '""')}"`,
      `"${(m.tempatTglLahir || "").replace(/"/g, '""')}"`,
      `"${(m.jenisKelamin || "").replace(/"/g, '""')}"`,
      `"${(m.agama || "").replace(/"/g, '""')}"`,
      `"${(m.pendidikan || "").replace(/"/g, '""')}"`,
      `"${(m.email || "").replace(/"/g, '""')}"`,
      `"${(m.tanggalMulaiTugas || "").replace(/"/g, '""')}"`,
      `"${(m.nomorSkPengangkatan || "").replace(/"/g, '""')}"`,
      `"${(m.lembagaPengangkat || "").replace(/"/g, '""')}"`,
      `"${(m.nomorSkPenugasan || "").replace(/"/g, '""')}"`,
      `"${(m.lembagaPenugas || "").replace(/"/g, '""')}"`,
      `"${(m.alamat || "").replace(/"/g, '""')}"`,
      `"${(m.foto || "").replace(/"/g, '""')}"`
    ]);
    downloadCSV(headers, rows, "data_pengelola.csv");
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
        { key: "nama", aliases: ["nama", "name"], defaultIndex: 0 },
        { key: "nik", aliases: ["nik", "identitas"], defaultIndex: 1 },
        { key: "jabatan", aliases: ["jabatan", "role", "position"], defaultIndex: 2 },
        { key: "nuptk", aliases: ["nuptk"], defaultIndex: 3 },
        { key: "tempatTglLahir", aliases: ["tempat/tgl lahir", "tempat lahir", "tanggal lahir", "tempat tgllahir", "birth"], defaultIndex: 4 },
        { key: "jenisKelamin", aliases: ["jenis kelamin", "gender", "jk"], defaultIndex: 5 },
        { key: "agama", aliases: ["agama", "religion"], defaultIndex: 6 },
        { key: "pendidikan", aliases: ["pendidikan", "education"], defaultIndex: 7 },
        { key: "email", aliases: ["email", "e-mail"], defaultIndex: 8 },
        { key: "tanggalMulaiTugas", aliases: ["tanggal mulai tugas", "tmt", "start date", "tanggalmulaitugas"], defaultIndex: 9 },
        { key: "nomorSkPengangkatan", aliases: ["nomor sk pengangkatan", "sk pengangkatan", "skpengangkatan"], defaultIndex: 10 },
        { key: "lembagaPengangkat", aliases: ["lembaga pengangkat", "lembagapengangkat"], defaultIndex: 11 },
        { key: "nomorSkPenugasan", aliases: ["nomor sk penugasan", "sk penugasan", "skpenugasan"], defaultIndex: 12 },
        { key: "lembagaPenugas", aliases: ["lembaga penugas", "lembagapenugas"], defaultIndex: 13 },
        { key: "alamat", aliases: ["alamat", "address"], defaultIndex: 14 },
        { key: "foto", aliases: ["foto", "photo", "image", "gambar"], defaultIndex: 15 },
      ]);

      const importedData = mapped
        .filter((item) => item.nama)
        .map((item) => ({
          nama: item.nama,
          nik: item.nik || "",
          jabatan: item.jabatan || "",
          nuptk: item.nuptk || "",
          tempatTglLahir: item.tempatTglLahir || "",
          jenisKelamin: item.jenisKelamin || "",
          agama: item.agama || "",
          pendidikan: item.pendidikan || "",
          email: item.email || "",
          tanggalMulaiTugas: item.tanggalMulaiTugas || "",
          nomorSkPengangkatan: item.nomorSkPengangkatan || "",
          lembagaPengangkat: item.lembagaPengangkat || "",
          nomorSkPenugasan: item.nomorSkPenugasan || "",
          lembagaPenugas: item.lembagaPenugas || "",
          alamat: item.alamat || "",
          foto: item.foto || "",
        }));

      if (importedData.length === 0) {
        toast.error("Format data kosong atau tidak valid!");
        return;
      }

      const token = getSafeItem("token");
      const res = await fetch("/api/managers/import", {
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
        fetchManagers();
      } else {
        toast.error(resData.message || "Gagal mengimpor data");
      }
    } catch (err) {
      toast.error("Kesalahan saat mengunggah file ke server.");
    }
    e.target.value = "";
  };


  const handleSearch = () => {
    setFilterName(searchName);
    setFilterNik(searchNik);
    setActiveFilter(true);
  };

  const handleReset = () => {
    setSearchName("");
    setSearchNik("");
    setFilterName("");
    setFilterNik("");
    setActiveFilter(false);
  };

  // Filtered List based on Search inputs
  const filteredList = managersList.filter((m) => {
    const matchName = !filterName || (m.nama || "").toLowerCase().includes(filterName.toLowerCase());
    const matchNik = !filterNik || (m.nik || "").toLowerCase().includes(filterNik.toLowerCase());
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

      {/* FILTER & SEARCH PANEL */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        {/* SYNC DATA OFFLINE */}
        {hasUnsyncedOfflineData && (
          <div className="mb-4">
            <Button
              onClick={handleSyncData}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 h-10 rounded-xl shadow-md uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer animate-pulse"
            >
              🔄 SYNC OFFLINE
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
          {/* SEARCH BY NAME */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="CARI NAMA PENGELOLA"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs border border-slate-200 rounded-xl bg-white font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner uppercase"
            />
          </div>

          {/* SEARCH BY NIK */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="CARI NIK"
              value={searchNik}
              onChange={(e) => setSearchNik(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs border border-slate-200 rounded-xl bg-white font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner uppercase"
            />
          </div>

          {/* BUTTONS */}
          <div className="flex gap-2 col-span-1 sm:col-span-2 items-center flex-wrap">
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              ref={csvInputRef}
              onChange={handleImportCSV}
              className="hidden"
            />
            <Button
              onClick={() => csvInputRef.current?.click()}
              className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-[10px] px-4 py-2.5 rounded-xl cursor-pointer uppercase tracking-wider shadow-md shadow-purple-200/40 flex items-center justify-center gap-1.5 transition-all select-none active:scale-95"
            >
              <Upload className="h-4 w-4" /> UPLOAD CSV / EXCEL
            </Button>

            <Button
              onClick={handleExportCSV}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-4 py-2.5 rounded-xl cursor-pointer uppercase tracking-wider shadow-md flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Download className="h-4 w-4" /> DOWNLOAD CSV
            </Button>

            <Button
              onClick={handleAddNew}
              className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md shadow-purple-200 uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95"
            >
              <UserPlus className="h-4 w-4" /> TAMBAH PENGELOLA
            </Button>

            <Button
              onClick={handleSearch}
              className={`flex-1 h-10 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeFilter ? "bg-[#009cb9] hover:bg-[#008aa7] text-white" : "bg-[#00badb] hover:bg-[#009cb9] text-white"
              }`}
            >
              <Filter className="h-4 w-4" /> FILTER
            </Button>

            <Button
              onClick={handleReset}
              className="flex-1 h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs cursor-pointer tracking-wider flex items-center justify-center gap-1.5 transition-all uppercase"
            >
              <RotateCcw className="h-4 w-4" /> RESET
            </Button>
          </div>
        </div>
      </div>

      {/* Grid Cards and Layout View */}
      <div className="space-y-6">
        {/* Managers List/Grid Card */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-4">
              <h3 className="font-black text-slate-500 uppercase text-xs tracking-widest">
                Daftar Pengelola Lembaga ({filteredList.length})
              </h3>
              <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                <button
                  onClick={() => setViewMode("cards")}
                  className={`p-1.5 transition ${viewMode === "cards" ? "bg-white shadow-xs text-purple-650" : "text-slate-400 hover:text-slate-600"}`}
                  title="Card View"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 transition ${viewMode === "table" ? "bg-white shadow-xs text-purple-650" : "text-slate-400 hover:text-slate-600"}`}
                  title="Table View"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {filteredList.length > 0 ? (
              viewMode === "cards" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                  {filteredList.map((m) => {
                    const isActive = selectedManager.id === m.id && !isNew;
                    return (
                      <div
                        key={m.id || m.nama}
                        onClick={() => handleSelectManager(m)}
                        className={`bg-white rounded-2xl overflow-hidden border-2 cursor-pointer transition flex flex-col group ${
                          isActive ? "border-purple-600 shadow-md ring-2 ring-purple-100" : "border-slate-100 hover:border-purple-300"
                        }`}
                      >
                        {/* Photo Frame with Position badge overlay */}
                        <div className="h-44 bg-slate-50 relative overflow-hidden">
                          {m.foto ? (
                            <img
                              src={m.foto}
                              alt={m.nama}
                              className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-black text-xs bg-slate-100">
                              FOTO
                            </div>
                          )}
                          {/* Position Tag overlay */}
                          <div className="absolute top-3 left-3 z-10 max-w-[90%]">
                            <span className="inline-block bg-purple-600 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase shadow-md tracking-wider truncate">
                              {m.jabatan || "STAF"}
                            </span>
                          </div>
                        </div>

                        {/* Name info */}
                        <div className="p-4 flex-1 space-y-1 bg-white">
                          <h4 className="font-black text-[#280f91] text-xs group-hover:text-purple-600 transition truncate uppercase">
                            {m.nama || "BELUM ADA NAMA"}
                          </h4>
                          <p className="text-slate-500 text-[10px] font-semibold uppercase">
                            NIK: {m.nik || "-"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Table View */
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-[#00badb] text-white font-black text-sm uppercase">
                        <th className="p-4 w-16 text-center border-r border-[#009cb9]">No</th>
                        <th className="p-4 border-r border-[#009cb9]">Nama</th>
                        <th className="p-4 border-r border-[#009cb9] w-48 text-center">Jabatan</th>
                        <th className="p-4 border-r border-[#009cb9] w-48 text-center">NIK</th>
                        <th className="p-4 border-r border-[#009cb9] w-36 text-center">Pendidikan</th>
                        <th className="p-4 text-center">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {filteredList.map((m, idx) => (
                        <tr
                          key={m.id || m.nama}
                          onClick={() => handleSelectManager(m)}
                          className={`hover:bg-cyan-50/20 cursor-pointer transition ${
                            selectedManager.id === m.id && !isNew ? "bg-purple-50/75 text-purple-900 font-bold" : ""
                          }`}
                        >
                          <td className="p-4 text-center text-slate-500 font-mono border-r border-slate-100">{idx + 1}</td>
                          <td className="p-4 font-bold text-slate-800 border-r border-slate-100">{m.nama || "-"}</td>
                          <td className="p-4 text-center border-r border-slate-100 font-bold text-purple-700">{m.jabatan || "-"}</td>
                          <td className="p-4 text-center border-r border-slate-100 font-mono">{m.nik || "-"}</td>
                          <td className="p-4 text-center border-r border-slate-100">{m.pendidikan || "-"}</td>
                          <td className="p-4 text-center text-slate-500 font-mono">{m.email || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="max-w-md mx-auto bg-white border border-slate-100 rounded-3xl p-10 text-center space-y-4 shadow-sm">
                <div className="h-16 w-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto">
                  <ShieldAlert className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">Pengelola Tidak Ditemukan</h3>
                <p className="text-slate-500 font-bold text-xs">
                  Belum ada data pengelola yang sesuai dengan filter pencarian.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DETAIL PROFILE AND FORM EDIT PANEL POPUP MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-300">
          {/* Backdrop Click Closes Popup */}
          <div className="absolute inset-0 cursor-default" onClick={handleCloseForm} />
          
          <div className="bg-[#00badb] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl border-4 border-cyan-400 shadow-2xl relative animate-in slide-in-from-bottom-8 duration-300 text-white select-text">
            
            {/* Elegant Close Button */}
            <button
              onClick={handleCloseForm}
              className="absolute top-4 right-4 h-8 w-8 rounded-xl bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer text-sm font-black shadow-inner"
            >
              ✕
            </button>
        
        {/* PANEL TITLE */}
        <div className="mb-6 flex justify-between items-center border-b border-white/20 pb-4">
          <h3 className="bg-[#9c27b0] text-white font-extrabold text-xs px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md">
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
                className="flex-1 h-10 px-4 text-xs font-black border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
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
                className="flex-1 h-10 px-4 text-xs font-black border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
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
                className="flex-1 h-10 px-4 text-xs font-black border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
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
                className="flex-1 h-10 px-4 text-xs font-black border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
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
                className="flex-1 h-10 px-4 text-xs font-black border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
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
                className="flex-1 h-10 px-4 text-xs font-black border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
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
                className="flex-1 h-10 px-4 text-xs font-black border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
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
                className="flex-1 h-10 px-4 text-xs font-black border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
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
                className="flex-1 h-10 px-4 text-xs font-black border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
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
                className="flex-1 h-10 px-4 text-xs font-black border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
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
                className="flex-1 h-10 px-4 text-xs font-black border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
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
                className="flex-1 h-10 px-4 text-xs font-black border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
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
                className="flex-1 h-10 px-4 text-xs font-black border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
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
                className="flex-1 h-10 px-4 text-xs font-black border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
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
                className="flex-1 p-2.5 text-xs font-black border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed resize-none transition-colors"
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
                className="flex-1 h-10 px-4 text-xs font-black border-none rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="h-10 px-4 rounded-lg border-none bg-white/10 hover:bg-white/20 text-[10px] font-black text-white shrink-0 cursor-pointer"
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
                    toast.error("Buka kunci (Klik Edit) untuk mengubah Foto!");
                    return;
                  }
                  const file = e.dataTransfer.files?.[0];
                  if (file) processUpload(file);
                }}
                onClick={() => {
                  if (isLocked) {
                    toast.error("Buka kunci (Klik Edit) untuk mengubah Foto!");
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
              <p className="text-[10px] font-bold text-white/80 mt-1.5 italic text-center">
                  * Batas maksimal ukuran foto adalah 5MB.
                </p>

                <div className="w-full mt-4 flex flex-col gap-1 text-left">
                <label className="text-[10px] font-black uppercase text-cyan-50">URL Foto Pengelola</label>
                <input
                  type="text"
                  disabled={isLocked}
                  placeholder="Masukkan URL foto..."
                  value={selectedManager.foto || ""}
                  onChange={(e) => handleFieldChange("foto", e.target.value)}
                  className="w-full text-xs font-semibold border-none rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#9c27b0] disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
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
                  onClick={async () => {
                    if (isFormDirty && !await confirm("Ada perubahan yang belum disimpan. Yakin ingin menutup?")) return;
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
                    setIsFormDirty(false);
                  }}
                  className="bg-slate-200 hover:bg-slate-350 text-slate-700 font-extrabold text-xs px-6 h-10 rounded-xl cursor-pointer uppercase tracking-wider transition-all"
                >
                  BATAL
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-6 h-10 rounded-xl cursor-pointer shadow-md uppercase tracking-wider flex items-center gap-1.5 transition-all"
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
            )}
          </div>

        </div>

       </div>
      </div>
      )}
    </div>
  );
}
