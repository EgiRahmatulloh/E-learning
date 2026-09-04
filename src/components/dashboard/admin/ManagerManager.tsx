import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { downloadExcel, mapCsvRows, parseExcel } from "@/lib/utils";
import {
  Save,
  Trash2,
  UploadCloud,
  UserPlus,
  Search,
  Download,
  Upload,
  List,
  LayoutGrid,
  ShieldAlert,
  Loader2,
  Edit3,
X,
} from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { commitUploads, discardUpload, discardUploads, isNetworkError, uploadFile, validateImageFile } from "@/lib/upload";
import { toast } from "sonner";
import BerkasUpload, { type BerkasItem } from "@/components/ui/BerkasUpload";

interface ManagerData {
  id?: number;
  nama: string;
  nik: string;
  jabatan: string;
  nip: string;
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
  rt: string;
  rw: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  password: string;
  foto: string;
  berkas?: Record<string, string>;
}

const STORAGE_KEY = "pkbm_managers_data";

const DEFAULT_MANAGER: ManagerData = {
  nama: "",
  nik: "",
  jabatan: "",
  nip: "",
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
  rt: "",
  rw: "",
  desa: "",
  kecamatan: "",
  kabupaten: "",
  provinsi: "",
  password: "",
  foto: "",
  berkas: {},
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

  const MANAGER_BERKAS_TYPES: BerkasItem[] = [
    { label: "KK (Kartu Keluarga)", key: "kk" },
    { label: "KTP", key: "ktp" },
    { label: "SK Pengangkatan", key: "sk_pengangkatan" },
    { label: "SK Penugasan", key: "sk_penugasan" },
    { label: "Ijazah", key: "ijazah" },
  ];
  const [managersList, setManagersList] = useState<ManagerData[]>([]);
  const [selectedManager, setSelectedManager] = useState<ManagerData>(DEFAULT_MANAGER);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [isNew, setIsNew] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [searchNik, setSearchNik] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasUnsyncedOfflineData, setHasUnsyncedOfflineData] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [, setOriginalManager] = useState<ManagerData | null>(null);
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

  // Foto/berkas yang sedang ada di form. Dipakai untuk membuang unggahan yang
  // batal dipakai, dan untuk menandai unggahan yang sudah tersimpan.
  const formUploadUrls = () => [
    selectedManager.foto,
    ...Object.values(selectedManager.berkas || {}),
  ];

  const handleCloseForm = async () => {
    if (isFormDirty && !await confirm({
      title: "Perubahan Belum Disimpan",
      message: "Ada perubahan yang belum disimpan. Yakin ingin menutup?",
      variant: "danger"
    })) return;
    // Unggahan yang belum tersimpan dibuang dari storage; yang sudah tersimpan
    // di DB dilewati discardUploads.
    void discardUploads(formUploadUrls());
    setIsFormOpen(false);
    setIsEditing(false);
    setIsNew(false);
    setIsFormDirty(false);
  };

  const handleFieldChange = (field: keyof ManagerData, value: string) => {
    if (isEditing) setIsFormDirty(true);
    setSelectedManager((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelectManager = async (manager: ManagerData) => {
    if (isFormDirty) {
      const ok = await confirm("Ada perubahan yang belum disimpan. Yakin ingin beralih?");
      if (!ok) return;
    }
    setOriginalManager({ ...manager });
    setSelectedManager(manager);
    setIsFormDirty(false);
    setIsNew(false);
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedManager({ ...DEFAULT_MANAGER });
    setIsFormDirty(false);
    setIsNew(true);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!selectedManager.nama || !selectedManager.jabatan) {
      toast.error("Nama dan Jabatan wajib diisi!");
      return;
    }
    if (!selectedManager.nik || selectedManager.nik.length !== 16) {
      toast.error("NIK wajib diisi dan harus 16 digit!");
      return;
    }
    if (!selectedManager.nip) {
      toast.error("NIP wajib diisi!");
      return;
    }
    if (!selectedManager.email) {
      toast.error("Email wajib diisi!");
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
        commitUploads(formUploadUrls());
        setIsFormDirty(false);
        setIsEditing(false);
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
        // Data tersimpan lokal masih memakai unggahannya — jangan dibuang
        commitUploads(formUploadUrls());
        setIsEditing(false);
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
      // Form "tambah data" dibatalkan — unggahannya belum masuk DB sama sekali
      void discardUploads(formUploadUrls());
      if (managersList.length > 0) {
        setSelectedManager(managersList[0]);
      } else {
        setSelectedManager(DEFAULT_MANAGER);
      }
      setIsFormDirty(false);
      setIsNew(false);
      setIsEditing(false);
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
        // Berkasnya sudah dilepas server saat barisnya dihapus
        commitUploads(formUploadUrls());
        const remaining = managersList.filter((m) => m.id !== selectedManager.id);
        setManagersList(remaining);
        if (remaining.length > 0) {
          setSelectedManager(remaining[0]);
        } else {
          setSelectedManager(DEFAULT_MANAGER);
        }
        setIsEditing(false);
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
        // Barisnya masih ada di server sampai sinkronisasi berikutnya
        commitUploads(formUploadUrls());
        if (remaining.length > 0) {
          setSelectedManager(remaining[0]);
        } else {
          setSelectedManager(DEFAULT_MANAGER);
        }
        setIsEditing(false);
        setIsFormOpen(false);
      } catch {
        toast.error("⚠️ Offline: Gagal menghapus data.");
      }
    }
  };

  const processUpload = async (file: File) => {
    const invalid = validateImageFile(file);
    if (invalid) {
      toast.error(invalid);
      return;
    }

    setUploadingFoto(true);
    try {
      const previous = selectedManager.foto;
      handleFieldChange("foto", await uploadFile(file));
      // Ganti foto sebelum disimpan: unggahan sebelumnya tidak akan dipakai lagi
      void discardUpload(previous);
      toast.success("Foto berhasil diunggah!");
    } catch (err) {
      // Fallback lokal: simpan sebagai Base64 HANYA saat koneksi gagal (offline)
      if (isNetworkError(err)) {
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
        toast.error(err instanceof Error ? err.message : "Gagal mengunggah foto.");
      }
    } finally {
      setUploadingFoto(false);
    }
  };

  // Excel Export
  const handleExportExcel = () => {
    if (managersList.length === 0) {
      toast.error("Tidak ada data untuk diekspor!");
      return;
    }
    const headers = [
      "No",
      "Nama",
      "NIK",
      "NUPTK / NIP",
      "JK",
      "Tempat Lahir",
      "Tanggal Lahir",
      "Agama",
      "Pendidikan Terakhir",
      "Alamat",
      "RT",
      "RW",
      "Desa",
      "Kecamatan",
      "Kabupaten",
      "Provinsi",
      "HP",
      "E-Mail",
      "Status Kepegawaian",
      "No. SK Pengangkatan Awal",
      "Lembaga Pengangkat",
      "No. SK Penugasan Terakhir",
      "Lembaga Penugas",
      "Jabatan",
      "TMT Kerja"
    ];
    const rows = managersList.map((m, idx) => {
      const tempatTgl = (m.tempatTglLahir || "").split(",").map(p => p.trim());
      const tempat = tempatTgl[0] || "";
      const tglLahir = tempatTgl.length > 1 ? tempatTgl.slice(1).join(", ") : "";
      return [
        idx + 1,
        m.nama || "",
        m.nik || "",
        m.nip || "",
        m.jenisKelamin || "",
        tempat,
        tglLahir,
        m.agama || "",
        m.pendidikan || "",
        m.alamat || "",
        m.rt || "", m.rw || "", m.desa || "", m.kecamatan || "", m.kabupaten || "", m.provinsi || "",
        "", // HP
        m.email || "",
        "", // Status Kepegawaian
        m.nomorSkPengangkatan || "",
        m.lembagaPengangkat || "",
        m.nomorSkPenugasan || "",
        m.lembagaPenugas || "",
        m.jabatan || "",
        m.tanggalMulaiTugas || "",
      ];
    });
    downloadExcel(headers, rows, "data_pengelola.xlsx");
    toast.success("Berhasil mengunduh Excel!");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    try {
      const rows = await parseExcel(file);

      const mapped = mapCsvRows(rows, [
        { key: "nama", aliases: ["nama", "name"], defaultIndex: 1 },
        { key: "nik", aliases: ["nik", "identitas"], defaultIndex: 2 },
        { key: "nip", aliases: ["nip", "nuptk"], defaultIndex: 3 },
        { key: "jenisKelamin", aliases: ["jenis kelamin", "gender", "jk"], defaultIndex: 4 },
        { key: "tempatTglLahir", aliases: ["tempat lahir", "tempat/tgl lahir", "tempat tgllahir", "birth"], defaultIndex: 5 },
        { key: "tanggalLahir", aliases: ["tanggal lahir", "tgl lahir"], defaultIndex: 6 },
        { key: "agama", aliases: ["agama", "religion"], defaultIndex: 7 },
        { key: "pendidikan", aliases: ["pendidikan", "pendidikan terakhir", "pendidikan_terakhir"], defaultIndex: 8 },
        { key: "alamat", aliases: ["alamat", "address"], defaultIndex: 9 },
        { key: "rt", aliases: ["rt"], defaultIndex: 10 },
        { key: "rw", aliases: ["rw"], defaultIndex: 11 },
        { key: "desa", aliases: ["desa", "kelurahan"], defaultIndex: 12 },
        { key: "kecamatan", aliases: ["kecamatan"], defaultIndex: 13 },
        { key: "kabupaten", aliases: ["kabupaten", "kota"], defaultIndex: 14 },
        { key: "provinsi", aliases: ["provinsi"], defaultIndex: 15 },
        { key: "hp", aliases: ["hp", "no hp", "telepon", "phone"], defaultIndex: 16 },
        { key: "email", aliases: ["email", "e-mail"], defaultIndex: 17 },
        { key: "statusKepegawaian", aliases: ["status kepegawaian", "status"], defaultIndex: 18 },
        { key: "nomorSkPengangkatan", aliases: ["no. sk pengangkatan awal", "nomor sk pengangkatan", "sk pengangkatan", "skpengangkatan"], defaultIndex: 19 },
        { key: "lembagaPengangkat", aliases: ["lembaga pengangkat", "lembagapengangkat"], defaultIndex: 20 },
        { key: "nomorSkPenugasan", aliases: ["no. sk penugasan terakhir", "nomor sk penugasan", "sk penugasan", "skpenugasan"], defaultIndex: 21 },
        { key: "lembagaPenugas", aliases: ["lembaga penugas", "lembagapenugas"], defaultIndex: 22 },
        { key: "jabatan", aliases: ["jabatan", "role", "position"], defaultIndex: 23 },
        { key: "tanggalMulaiTugas", aliases: ["tmt kerja", "tanggal mulai tugas", "tmt", "start date", "tanggalmulaitugas"], defaultIndex: 24 },
        { key: "password", aliases: ["password", "kata sandi", "pass"], defaultIndex: 25 },
        { key: "foto", aliases: ["foto", "photo", "image", "gambar"], defaultIndex: -1 },
      ]);

      const importedData = mapped
        .filter((item) => item.nama)
        .map((item) => {
          // Combine Tempat Lahir and Tanggal Lahir into tempatTglLahir
          const tempat = item.tempatTglLahir || "";
          const tgl = item.tanggalLahir || "";
          const tempatTglLahir = tempat && tgl ? `${tempat}, ${tgl}` : tempat || tgl;

          return {
            nama: item.nama,
            nik: item.nik || "",
            jabatan: item.jabatan || "",
            nip: item.nip || "",
            tempatTglLahir,
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
            rt: item.rt || "",
            rw: item.rw || "",
            desa: item.desa || "",
            kecamatan: item.kecamatan || "",
            kabupaten: item.kabupaten || "",
            provinsi: item.provinsi || "",
            password: item.password || "",
            foto: item.foto || "",
            berkas: {},
          };
        });

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
        setShowUploadDialog(false);
      } else {
        toast.error(resData.message || "Gagal mengimpor data");
      }
    } catch (err) {
      toast.error("Kesalahan saat mengunggah file ke server.");
    }
    e.target.value = "";
  };


  // Filtered List based on Search inputs
  const filteredList = managersList.filter((m) => {
    const matchName = !searchName || (m.nama || "").toLowerCase().includes(searchName.toLowerCase());
    const matchNik = !searchNik || (m.nik || "").toLowerCase().includes(searchNik.toLowerCase());
    return matchName && matchNik;
  });

  return (
    <>
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

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          <div className="grid grid-cols-1 gap-3 md:col-span-2">
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
          </div>

          {/* BUTTONS */}
          <div className="grid grid-cols-3 gap-2 md:col-span-3">
            <input
              type="file"
              accept=".xlsx, .xls"
              ref={csvInputRef}
              onChange={handleImportExcel}
              className="hidden"
            />
            <Button
              onClick={() => setShowUploadDialog(true)}
              className="h-10 bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs px-4 rounded-xl cursor-pointer uppercase tracking-wider shadow-md shadow-purple-200/40 flex items-center justify-center gap-1.5 transition-all select-none active:scale-95"
            >
              <Upload className="h-4 w-4" /> UPLOAD EXCEL
            </Button>
            <Button
              onClick={handleExportExcel}
              className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 rounded-xl cursor-pointer uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Download className="h-4 w-4" /> DOWNLOAD EXCEL
            </Button>
            <Button
              onClick={handleAddNew}
              className="h-10 bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs px-4 rounded-xl cursor-pointer shadow-md shadow-purple-200 uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <UserPlus className="h-4 w-4" /> TAMBAH DATA
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
                        className={`bg-white rounded-2xl overflow-hidden border-2 cursor-pointer transition flex flex-col group ${isActive ? "border-purple-600 shadow-md ring-2 ring-purple-100" : "border-slate-100 hover:border-purple-300"
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
                  <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-[#00badb] text-white font-black text-sm uppercase">
                        <th className="py-4 px-6 w-16 text-center border-r border-[#009cb9]">NO</th>
                        <th className="py-4 px-6 border-r border-[#009cb9]">NAMA</th>
                        <th className="py-4 px-6 border-r border-[#009cb9] w-48 text-center">JABATAN</th>
                        <th className="py-4 px-6 border-r border-[#009cb9] w-48 text-center">NIK</th>
                        <th className="py-4 px-6 border-r border-[#009cb9] w-36 text-center">PENDIDIKAN</th>
                        <th className="py-4 px-6 text-center">EMAIL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {filteredList.map((m, idx) => (
                        <tr
                          key={m.id || m.nama}
                          onClick={() => handleSelectManager(m)}
                          className={`hover:bg-cyan-50/20 cursor-pointer transition ${selectedManager.id === m.id && !isNew ? "bg-purple-50/75 text-purple-900 font-bold" : ""
                            }`}
                        >
                          <td className="py-4 px-6 text-center text-slate-500 font-mono border-r border-slate-100">{idx + 1}</td>
                          <td className="py-4 px-6 font-bold text-slate-800 border-r border-slate-100">{m.nama || "-"}</td>
                          <td className="py-4 px-6 text-center border-r border-slate-100 font-bold text-purple-700">{m.jabatan || "-"}</td>
                          <td className="py-4 px-6 text-center border-r border-slate-100 font-mono">{m.nik || "-"}</td>
                          <td className="py-4 px-6 text-center border-r border-slate-100">{m.pendidikan || "-"}</td>
                          <td className="py-4 px-6 text-center text-slate-500 font-mono">{m.email || "-"}</td>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-300">
          {/* Backdrop Click Closes Popup */}
          <div className="absolute inset-0 cursor-default" onClick={handleCloseForm} />

          <div className="bg-white w-full max-w-4xl max-h-[90vh] flex flex-col p-3 rounded-3xl border-4 border-cyan-400 shadow-2xl relative animate-in zoom-in-95 duration-200 select-text">

            {/* Elegant Close Button */}
            <button
              onClick={handleCloseForm}
              className="absolute top-4 right-4 h-8 w-8 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer text-sm font-black shadow-inner"
            >
              ✕
            </button>

            {/* PANEL TITLE */}
            <div className="mb-4 pr-10 shrink-0 flex justify-between items-center border-b border-slate-200 pb-4">
              <h3 className="bg-[#9c27b0] text-white font-extrabold text-xs px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                {isNew ? "TAMBAH DATA" : (isEditing ? "EDIT DATA" : "DETAIL DATA")}
              </h3>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0 overflow-y-auto pr-1">

              {/* FORM INPUT PANEL */}
              <div className="flex-1 lg:min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1.5">

                {/* Row 1: NAMA | NIK */}
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">NAMA <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="Masukkan nama lengkap dengan gelar (contoh: H. Maman Suparman, S.Pd.)"
                    value={selectedManager.nama}
                    onChange={(e) => handleFieldChange("nama", e.target.value)}
                    className="h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">NIK <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={16}
                    disabled={!isEditing}
                    placeholder="Masukkan 16 digit Nomor Induk Kependudukan"
                    value={selectedManager.nik}
                    onChange={(e) => handleFieldChange("nik", e.target.value.replace(/\D/g, "").slice(0, 16))}
                    className="h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                  />
                </div>

                {/* Row 2: JABATAN | NIP */}
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">JABATAN <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="Masukkan jabatan (contoh: Ketua PKBM, Bendahara)"
                    value={selectedManager.jabatan}
                    onChange={(e) => handleFieldChange("jabatan", e.target.value)}
                    className="h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">NIP <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    placeholder="Masukkan Nomor Induk Pegawai"
                    value={selectedManager.nip}
                    onChange={(e) => handleFieldChange("nip", e.target.value)}
                    className="h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                  />
                </div>

                {/* Row 3: TEMPAT/TGL.LAHIR | JK */}
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">TEMPAT, TGL. LAHIR</label>
                  <input
                    type="text"

                    placeholder="Contoh: Ciamis, 12-05-1970"
                    value={selectedManager.tempatTglLahir}
                    onChange={(e) => handleFieldChange("tempatTglLahir", e.target.value)}
                    disabled={!isEditing}
                    className="h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">JENIS KELAMIN</label>
                  <select
                    value={selectedManager.jenisKelamin}
                    onChange={(e) => handleFieldChange("jenisKelamin", e.target.value)}
                    disabled={!isEditing}
                    className="h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                  >
                    <option value="" disabled>Pilih Jenis Kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                {/* Row 4: AGAMA | PENDIDIKAN */}
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">AGAMA</label>
                  <input
                    type="text"

                    placeholder="Contoh: Islam, Kristen, dll"
                    value={selectedManager.agama}
                    onChange={(e) => handleFieldChange("agama", e.target.value)}
                    disabled={!isEditing}
                    className="h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">PENDIDIKAN</label>
                  <input
                    type="text"

                    placeholder="Contoh: S1 Pendidikan, SMA, dll"
                    value={selectedManager.pendidikan}
                    onChange={(e) => handleFieldChange("pendidikan", e.target.value)}
                    disabled={!isEditing}
                    className="h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                  />
                </div>

                {/* Row 5: EMAIL | TANGGAL MULAI TUGAS */}
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">EMAIL <span className="text-rose-500">*</span></label>
                  <input
                    type="email"

                    placeholder="Contoh: nama@pkbmmakmur.org"
                    value={selectedManager.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    disabled={!isEditing}
                    className="h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">TANGGAL MULAI TUGAS</label>
                  <input
                    type="text"

                    placeholder="Masukkan tanggal mulai tugas (contoh: YYYY-MM-DD)"
                    value={selectedManager.tanggalMulaiTugas}
                    onChange={(e) => handleFieldChange("tanggalMulaiTugas", e.target.value)}
                    disabled={!isEditing}
                    className="h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                  />
                </div>

                {/* Row 6: NOMOR SK PENGANGKATAN | LEMBAGA PENGANGKAT */}
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">NOMOR SK PENGANGKATAN</label>
                  <input
                    type="text"

                    placeholder="Masukkan nomor SK pengangkatan"
                    value={selectedManager.nomorSkPengangkatan}
                    onChange={(e) => handleFieldChange("nomorSkPengangkatan", e.target.value)}
                    disabled={!isEditing}
                    className="h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">LEMBAGA PENGANGKAT</label>
                  <input
                    type="text"

                    placeholder="Masukkan nama lembaga yang mengeluarkan SK"
                    value={selectedManager.lembagaPengangkat}
                    onChange={(e) => handleFieldChange("lembagaPengangkat", e.target.value)}
                    disabled={!isEditing}
                    className="h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                  />
                </div>

                {/* Row 7: NOMOR SK PENUGASAN | LEMBAGA PENUGAS */}
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">NOMOR SK PENUGASAN</label>
                  <input
                    type="text"

                    placeholder="Masukkan nomor SK penugasan"
                    value={selectedManager.nomorSkPenugasan}
                    onChange={(e) => handleFieldChange("nomorSkPenugasan", e.target.value)}
                    disabled={!isEditing}
                    className="h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">LEMBAGA PENUGAS</label>
                  <input
                    type="text"

                    placeholder="Masukkan nama lembaga yang menugaskan"
                    value={selectedManager.lembagaPenugas}
                    onChange={(e) => handleFieldChange("lembagaPenugas", e.target.value)}
                    disabled={!isEditing}
                    className="h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                  />
                </div>

                {/* Row 8: ALAMAT JALAN (full width) */}
                <div className="sm:col-span-2 flex flex-col gap-0.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">ALAMAT JALAN</label>
                  <textarea
                    rows={2}
                    placeholder="Masukkan alamat domisili (nama jalan/dusun)"
                    value={selectedManager.alamat}
                    onChange={(e) => handleFieldChange("alamat", e.target.value)}
                    disabled={!isEditing}
                    className="p-2.5 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 resize-none transition-colors"
                  />
                </div>

                {/* Row 8b: RT, RW, Desa, Kecamatan, Kabupaten, Provinsi */}
                <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-1.5">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wide">RT</label>
                    <input type="text" maxLength={3} disabled={!isEditing} placeholder="001" value={selectedManager.rt || ""} onChange={(e) => handleFieldChange("rt", e.target.value)}
                      className="h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wide">RW</label>
                    <input type="text" maxLength={3} disabled={!isEditing} placeholder="002" value={selectedManager.rw || ""} onChange={(e) => handleFieldChange("rw", e.target.value)}
                      className="h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wide">DESA/KELURAHAN</label>
                    <input type="text" disabled={!isEditing} placeholder="Nama desa/kelurahan" value={selectedManager.desa || ""} onChange={(e) => handleFieldChange("desa", e.target.value)}
                      className="h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wide">KECAMATAN</label>
                    <input type="text" disabled={!isEditing} placeholder="Nama kecamatan" value={selectedManager.kecamatan || ""} onChange={(e) => handleFieldChange("kecamatan", e.target.value)}
                      className="h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wide">KABUPATEN/KOTA</label>
                    <input type="text" disabled={!isEditing} placeholder="Nama kabupaten/kota" value={selectedManager.kabupaten || ""} onChange={(e) => handleFieldChange("kabupaten", e.target.value)}
                      className="h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wide">PROVINSI</label>
                    <input type="text" disabled={!isEditing} placeholder="Nama provinsi" value={selectedManager.provinsi || ""} onChange={(e) => handleFieldChange("provinsi", e.target.value)}
                      className="h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors" />
                  </div>
                </div>

                {/* Row 9: PASSWORD (full width) */}
                <div className="sm:col-span-2 flex flex-col gap-0.5">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wide">PASWORD</label>
                  <div className="flex gap-2">
                    <input
                      type={showPassword ? "text" : "password"}

                      placeholder="Masukkan sandi baru (kosongkan jika tidak ingin diubah)"
                      value={selectedManager.password}
                      onChange={(e) => handleFieldChange("password", e.target.value)}
                      disabled={!isEditing}
                      className="flex-1 h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="h-10 px-4 rounded-lg border-none bg-slate-100 hover:bg-slate-200 text-[10px] font-black text-slate-500 shrink-0 cursor-pointer"
                    >
                      {showPassword ? "SEMBUNYIKAN" : "LIHAT"}
                    </button>
                  </div>
                </div>

              </div>

              {/* FOTO UPLOAD PANEL — compact sidebar */}
              <div className="lg:w-[230px] lg:shrink-0 w-full flex flex-col gap-4">

                {/* PHOTO UPLOAD */}
                <div className="w-full text-center">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                    FOTO
                  </h4>

                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (!isEditing) { toast.warning("Klik EDIT terlebih dahulu untuk mengubah foto!"); return; }
                      const file = e.dataTransfer.files?.[0];
                      if (file) processUpload(file);
                    }}
                    onClick={() => {
                      if (isEditing) fileInputRef.current?.click();
                    }}
                    className={`${!isEditing ? "pointer-events-none opacity-60 " : ""}w-full h-44 border-4 border-dashed rounded-xl flex flex-col items-center justify-center p-3 relative overflow-hidden transition-all text-center bg-cyan-50 border-cyan-300 hover:border-cyan-400 hover:bg-cyan-100 cursor-pointer`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      disabled={!isEditing}

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
                        <div className="animate-spin rounded-full h-6 w-6 border-3 border-slate-200 border-t-purple-600 mb-1.5" />
                        <span className="text-[9px] font-bold uppercase">UPLOADING...</span>
                      </div>
                    ) : selectedManager.foto ? (
                      <div className="w-full h-full relative group">
                        <img
                          src={selectedManager.foto}
                          alt="Foto Pengelola"
                          className="w-full h-full object-contain rounded-lg"
                        />
                        {isEditing && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                            <span className="text-white text-[9px] font-black uppercase tracking-wider">UBAH FOTO</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="h-7 w-7 text-cyan-600 mb-1.5" />
                        <span className="text-[9px] font-black text-purple-950 uppercase block tracking-wider leading-relaxed">
                          DRAG AND DROP
                        </span>
                        <span className="text-[7px] font-bold text-cyan-700 block mt-0.5">
                          KLIK UNTUK BROWSE
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-[8px] font-medium text-slate-400 mt-1 italic text-center">
                    * Maks 5MB
                  </p>

                  <div className="w-full mt-2 flex flex-col gap-0.5 text-left">
                    <label className="text-[9px] font-black uppercase text-slate-500">URL Foto</label>
                    <input
                      type="text"

                      placeholder="atau masukkan URL..."
                      value={selectedManager.foto || ""}
                      onChange={(e) => handleFieldChange("foto", e.target.value)}
                      disabled={!isEditing}
                      className="w-full text-[11px] font-semibold border border-slate-200 rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-purple-400 focus:outline-none bg-slate-50 text-slate-800 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                    />
                  </div>

                  {/* BERKAS DOKUMEN */}
                  <div className="mt-3">
                    <BerkasUpload
                      berkasTypes={MANAGER_BERKAS_TYPES}
                      value={selectedManager.berkas || {}}
                      onChange={(data) => setSelectedManager((prev) => ({ ...prev, berkas: data }))}
                      isEditing={isEditing}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* BUTTON PANEL */}
            <div className="mt-3 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-end gap-3 shrink-0">
              {isNew && isEditing ? (
                <>
                  <Button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      setIsFormOpen(false);
                      setIsEditing(false);
                      setIsNew(false);
                    }}
                    className="bg-slate-500 hover:bg-slate-650 text-white font-extrabold text-xs px-8 h-11 rounded-xl cursor-pointer uppercase tracking-widest transition-all disabled:opacity-70"
                  >
                    BATAL
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
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
              ) : !isNew && !isEditing ? (
                <>
                  <Button
                    type="button"
                    onClick={(e) => { e.preventDefault(); handleDelete(); }}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-8 h-11 rounded-xl cursor-pointer uppercase tracking-widest transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="h-4 w-4" /> HAPUS
                  </Button>
                  <Button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
                    className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-black text-xs px-8 h-11 rounded-xl cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest flex items-center gap-1.5 transition-all"
                  >
                    <Edit3 className="h-4 w-4" /> EDIT
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    onClick={handleCloseForm}
                    className="bg-slate-500 hover:bg-slate-650 text-white font-extrabold text-xs px-8 h-11 rounded-xl cursor-pointer uppercase tracking-widest transition-all"
                  >
                    BATAL
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
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
              )}
            </div>

          </div>
        </div>
      )}
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
                  Upload data pengelola dari file Excel. Silakan download format terlebih dahulu.
                </p>

                <div className="space-y-3">
                  <a
                    href="/templates/format-upload-pengelola.xlsx"
                    download
                    className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-widest transition-all shadow-md cursor-pointer"
                  >
                    <Download className="h-4 w-4" /> DOWNLOAD FORMAT
                  </a>

                  <Button
                    type="button"
                    onClick={() => {
                      setShowUploadDialog(false);
                      setTimeout(() => csvInputRef.current?.click(), 100);
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
    </>
  );
}
