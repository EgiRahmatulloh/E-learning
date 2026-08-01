import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { downloadExcel, mapCsvRows, parseExcel } from "@/lib/utils";
import { Upload, Plus, Trash2, Save, HelpCircle, Download, LayoutGrid, List, Search, X, Loader2, ChevronLeft, ChevronRight, Edit3 } from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { toast } from "sonner";
import BerkasUpload, { type BerkasItem } from "@/components/ui/BerkasUpload";

interface AlumniItem {
  id: number;
  nama: string;
  nik: string;
  program: string;
  tahunLulus: string;
  nisn: string;
  nis: string;
  tempatTglLahir: string;
  noHp: string;
  namaAyah: string;
  namaIbu: string;
  jenisKelamin: string;
  agama: string;
  email: string;
  alamat: string;
  rt: string;
  rw: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  melanjutkanKe: string;
  pekerjaan: string;
  cerita: string;
  foto: string;
  berkas?: Record<string, string>;
}

export default function AlumniManager() {
  const confirm = useConfirm();

  const ALUMNI_BERKAS_TYPES: BerkasItem[] = [
    { label: "KK (Kartu Keluarga)", key: "kk" },
    { label: "KTP", key: "ktp" },
    { label: "Ijazah", key: "ijazah" },
    { label: "SKHUN", key: "skhun" },
    { label: "Akta Kelahiran", key: "akta" },
  ];
  const [alumniList, setAlumniList] = useState<AlumniItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // View state (Cards or Table)
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Search States
  const [searchName, setSearchName] = useState("");
  const [searchNik, setSearchNik] = useState("");
  const [searchTahun, setSearchTahun] = useState("");
  const [searchProgram, setSearchProgram] = useState("");

  // Selected alumnus / Form state
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [, setOriginalData] = useState<{ nama: string; nik: string; program: string; tahunLulus: string; nisn: string; nis: string; tempatTglLahir: string; noHp: string; namaAyah: string; namaIbu: string; jenisKelamin: string; agama: string; email: string; alamat: string; rt: string; rw: string; desa: string; kecamatan: string; kabupaten: string; provinsi: string; melanjutkanKe: string; pekerjaan: string; cerita: string; foto: string; berkas: Record<string, string> }>({ nama: "", nik: "", program: "", tahunLulus: "", nisn: "", nis: "", tempatTglLahir: "", noHp: "", namaAyah: "", namaIbu: "", jenisKelamin: "", agama: "", email: "", alamat: "", rt: "", rw: "", desa: "", kecamatan: "", kabupaten: "", provinsi: "", melanjutkanKe: "", pekerjaan: "", cerita: "", foto: "", berkas: {} });

  // Form inputs
  const [nama, setNama] = useState("");
  const [nik, setNik] = useState("");
  const [program, setProgram] = useState("PAKET C");
  const [tahunLulus, setTahunLulus] = useState("");
  const [nisn, setNisn] = useState("");
  const [nis, setNis] = useState("");
  const [tempatTglLahir, setTempatTglLahir] = useState("");
  const [noHp, setNoHp] = useState("");
  const [namaAyah, setNamaAyah] = useState("");
  const [namaIbu, setNamaIbu] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("Laki-laki");
  const [agama, setAgama] = useState("Islam");
  const [email, setEmail] = useState("");
  const [alamat, setAlamat] = useState("");
  const [rt, setRt] = useState("");
  const [rw, setRw] = useState("");
  const [desa, setDesa] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [kabupaten, setKabupaten] = useState("");
  const [provinsi, setProvinsi] = useState("");
  const [cerita, setCerita] = useState("");
  const [melanjutkanKe, setMelanjutkanKe] = useState("");
  const [pekerjaan, setPekerjaan] = useState("");
  const [foto, setFoto] = useState("");
  const [berkas, setBerkas] = useState<Record<string, string>>({});

  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Reset to first page whenever the (live) search narrows the list,
  // otherwise a stale currentPage can leave the user on an empty page
  // with the pager hidden (totalPages becomes 1).
  useEffect(() => {
    setCurrentPage(1);
  }, [searchName, searchNik, searchTahun, searchProgram]);

  useEffect(() => {
    fetchAlumni();
  }, []);

  const fetchAlumni = () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    fetch("/api/alumni/admin", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setAlumniList(data.data);
        }
      })
      .catch((err) => console.error("Failed to load alumni:", err))
      .finally(() => setLoading(false));
  };

  const selectAlumni = (item: AlumniItem) => {
    setIsAdding(false);
    setSelectedId(item.id);
    setOriginalData({ nama: item.nama, nik: item.nik, program: item.program, tahunLulus: item.tahunLulus, nisn: item.nisn, nis: item.nis, tempatTglLahir: item.tempatTglLahir, noHp: item.noHp, namaAyah: item.namaAyah, namaIbu: item.namaIbu, jenisKelamin: item.jenisKelamin, agama: item.agama, email: item.email, alamat: item.alamat, rt: item.rt || "", rw: item.rw || "", desa: item.desa || "", kecamatan: item.kecamatan || "", kabupaten: item.kabupaten || "", provinsi: item.provinsi || "", melanjutkanKe: item.melanjutkanKe || "", pekerjaan: item.pekerjaan || "", cerita: item.cerita, foto: item.foto, berkas: item.berkas || {} });
    setNama(item.nama);
    setNik(item.nik);
    setProgram(item.program);
    setTahunLulus(item.tahunLulus);
    setNisn(item.nisn);
    setNis(item.nis);
    setTempatTglLahir(item.tempatTglLahir);
    setNoHp(item.noHp);
    setNamaAyah(item.namaAyah);
    setNamaIbu(item.namaIbu);
    setJenisKelamin(item.jenisKelamin);
    setAgama(item.agama);
    setEmail(item.email);
    setAlamat(item.alamat);
    setRt(item.rt || "");
    setRw(item.rw || "");
    setDesa(item.desa || "");
    setKecamatan(item.kecamatan || "");
    setKabupaten(item.kabupaten || "");
    setProvinsi(item.provinsi || "");
    setCerita(item.cerita);
    setMelanjutkanKe(item.melanjutkanKe || "");
    setPekerjaan(item.pekerjaan || "");
    setFoto(item.foto);
    setBerkas(item.berkas || {});
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const startAddAlumni = () => {
    setIsAdding(true);
    setSelectedId(null);
    setOriginalData({ nama: "", nik: "", program: "", tahunLulus: "", nisn: "", nis: "", tempatTglLahir: "", noHp: "", namaAyah: "", namaIbu: "", jenisKelamin: "", agama: "", email: "", alamat: "", rt: "", rw: "", desa: "", kecamatan: "", kabupaten: "", provinsi: "", melanjutkanKe: "", pekerjaan: "", cerita: "", foto: "", berkas: {} });
    setNama("");
    setNik("");
    setProgram("PAKET C");
    setTahunLulus(new Date().getFullYear().toString());
    setNisn("");
    setNis("");
    setTempatTglLahir("");
    setNoHp("");
    setNamaAyah("");
    setNamaIbu("");
    setJenisKelamin("Laki-laki");
    setAgama("Islam");
    setEmail("");
    setAlamat("");
    setRt("");
    setRw("");
    setDesa("");
    setKecamatan("");
    setKabupaten("");
    setProvinsi("");
    setCerita("");
    setMelanjutkanKe("");
    setPekerjaan("");
    setFoto("");
    setBerkas({});
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedId(null);
    setIsAdding(false);
    setIsEditing(false);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const body = new FormData();
    body.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setFoto(data.url);
        toast.success("Foto berhasil diunggah!");
      } else {
        toast.error("Upload gagal: " + (data.message || "Error tidak diketahui"));
      }
    } catch (e) {
      toast.error("Error mengunggah foto");
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        await handleImageUpload(file);
      } else {
        toast.error("Hanya file gambar yang diperbolehkan");
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      toast.error("Nama wajib diisi!");
      return;
    }

    setSaving(true);
    const token = localStorage.getItem("token");

    const payload = {
      nama, nik, program, tahunLulus, nisn, nis, tempatTglLahir,
      noHp, namaAyah, namaIbu, jenisKelamin, agama, email, alamat, rt, rw, desa, kecamatan, kabupaten, provinsi, melanjutkanKe, pekerjaan, cerita, foto, berkas
    };

    try {
      let res;
      if (isAdding) {
        res = await fetch("/api/alumni", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/alumni/${selectedId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (data.success) {
        toast.success(isAdding ? "Alumni berhasil ditambahkan!" : "Data alumni berhasil diperbarui!");
        closeForm();
        fetchAlumni();
      } else {
        toast.error("Gagal menyimpan data: " + (data.message || "Error tidak diketahui"));
      }
    } catch (e) {
      console.error(e);
      toast.error("Terjadi kesalahan sistem saat menyimpan data alumni");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const idToDelete = selectedId;
    if (!idToDelete) return;
    if (!await confirm({
      title: "Hapus Alumni",
      message: "Apakah Anda yakin ingin menghapus data alumni ini? Tindakan ini tidak dapat dibatalkan.",
      variant: "danger"
    })) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/alumni/${idToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Data alumni berhasil dihapus!");
        closeForm();
        fetchAlumni();
      } else {
        toast.error("Gagal menghapus alumni: " + (data.message || "Error tidak diketahui"));
      }
    } catch (e) {
      toast.error("Terjadi kesalahan saat menghapus data alumni");
    }
  };

  // Excel Export
  const handleExportExcel = () => {
    if (alumniList.length === 0) {
      toast.error("Tidak ada data untuk diekspor!");
      return;
    }
    const headers = ["No", "Nama", "NIK", "JK", "Tempat Lahir", "Tanggal Lahir", "Alamat", "RT", "RW", "Desa", "Kecamatan", "Kabupaten", "Provinsi", "HP", "E-Mail", "PROGRAM YANG DIAMBIL", "TAHUN LULUS", "MELANJUTKAN KE", "PEKERJAAN", "CERITA"];
    const rows = alumniList.map((item, index) => {
      const tempatTgl = (item.tempatTglLahir || "").split(",").map(p => p.trim());
      const tempat = tempatTgl[0] || "";
      const tglLahir = tempatTgl.length > 1 ? tempatTgl.slice(1).join(", ") : "";
      return [
        index + 1,
        item.nama || "",
        item.nik || "",
        item.jenisKelamin || "",
        tempat,
        tglLahir,
        item.alamat || "",
        item.rt || "",
        item.rw || "",
        item.desa || "",
        item.kecamatan || "",
        item.kabupaten || "",
        item.provinsi || "",
        item.noHp || "",
        item.email || "",
        item.program || "",
        item.tahunLulus || "",
        item.melanjutkanKe || "",
        item.pekerjaan || "",
        item.cerita || ""
      ];
    });
    downloadExcel(headers, rows, `data-alumni-${Date.now()}.xlsx`);
    toast.success("Berhasil mengekspor Excel");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      e.target.value = "";
      try {
        const rows = await parseExcel(file);

        if (rows.length <= 1) return;

        const token = localStorage.getItem("token");

        const mapped = mapCsvRows(rows, [
          { key: "nama", aliases: ["nama", "name"], defaultIndex: 1 },
          { key: "nik", aliases: ["nik", "identitas"], defaultIndex: 2 },
          { key: "jenisKelamin", aliases: ["jenis kelamin", "gender", "jk"], defaultIndex: 3 },
          { key: "tempatLahir", aliases: ["tempat lahir"], defaultIndex: 4 },
          { key: "tanggalLahir", aliases: ["tanggal lahir"], defaultIndex: 5 },
          { key: "alamat", aliases: ["alamat", "address"], defaultIndex: 6 },
          { key: "rt", aliases: ["rt"], defaultIndex: 7 },
          { key: "rw", aliases: ["rw"], defaultIndex: 8 },
          { key: "desa", aliases: ["desa"], defaultIndex: 9 },
          { key: "kecamatan", aliases: ["kecamatan"], defaultIndex: 10 },
          { key: "kabupaten", aliases: ["kabupaten", "kota"], defaultIndex: 11 },
          { key: "provinsi", aliases: ["provinsi"], defaultIndex: 12 },
          { key: "noHp", aliases: ["no. hp", "no hp", "hp", "telepon", "phone"], defaultIndex: 13 },
          { key: "email", aliases: ["email", "e-mail"], defaultIndex: 14 },
          { key: "program", aliases: ["program", "paket", "kelas", "program yang diambil"], defaultIndex: 15 },
          { key: "tahunLulus", aliases: ["tahun lulus", "tahunlulus", "tahun", "graduated", "graduation"], defaultIndex: 16 },
          { key: "melanjutkanKe", aliases: ["melanjutkan ke"], defaultIndex: 17 },
          { key: "pekerjaan", aliases: ["pekerjaan"], defaultIndex: 18 },
          { key: "cerita", aliases: ["cerita", "story", "testimoni", "keterangan"], defaultIndex: 19 },
        ]);

        const imports = mapped
          .filter(item => item.nama)
          .map(item => ({
            nama: item.nama,
            nik: item.nik || "",
            program: item.program || "PAKET C",
            tahunLulus: item.tahunLulus || "",
            nisn: "",
            nis: "",
            tempatTglLahir: [item.tempatLahir, item.tanggalLahir].filter(Boolean).join(", "),
            noHp: item.noHp || "",
            namaAyah: "",
            namaIbu: "",
            jenisKelamin: item.jenisKelamin || "Laki-laki",
            agama: "",
            email: item.email || "",
            alamat: item.alamat || "",
            rt: item.rt || "",
            rw: item.rw || "",
            desa: item.desa || "",
            kecamatan: item.kecamatan || "",
            kabupaten: item.kabupaten || "",
            provinsi: item.provinsi || "",
            melanjutkanKe: item.melanjutkanKe || "",
            pekerjaan: item.pekerjaan || "",
            cerita: item.cerita || "",
            foto: "",
            berkas: {}
          }));

        if (imports.length === 0) {
          toast.error("Tidak ada data valid untuk diimpor");
          return;
        }

        const res = await fetch("/api/alumni/import", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(imports),
        });
        const data = await res.json();
        if (data.success) {
          toast.success(data.message || `Berhasil mengimpor ${imports.length} data alumni!`);
          setShowUploadDialog(false);
        } else {
          toast.error("Gagal mengimpor data alumni: " + (data.message || "Error tidak diketahui"));
        }
        fetchAlumni();
      } catch (err) {
        console.error("Import failed:", err);
        toast.error("Terjadi kesalahan saat mengimpor data alumni");
      }
    }
  };

  // Filtered List
  const filteredAlumni = alumniList.filter((item) => {
    const matchName = item.nama.toLowerCase().includes(searchName.toLowerCase());
    const matchNik = item.nik.includes(searchNik);
    const matchTahun = item.tahunLulus.includes(searchTahun);
    const matchProgram = searchProgram ? item.program === searchProgram : true;
    return matchName && matchNik && matchTahun && matchProgram;
  });

  // Pagination Logic
  const totalItems = filteredAlumni.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAlumni.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-6 relative pb-16 animate-in fade-in duration-300">

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-cyan-900 tracking-tight flex items-center gap-2">
            <span>🎓</span> KELOLA WEBSITE ALUMNI
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Kelola data lulusan pendidikan kesetaraan PKBM Menuju Makmur.
          </p>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:col-span-2">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="CARI NAMA ALUMNI"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full h-10 pl-9 pr-4 text-xs border border-slate-200 rounded-xl bg-white font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner uppercase"
              />
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="CARI NIK"
                value={searchNik}
                onChange={(e) => setSearchNik(e.target.value)}
                className="w-full h-10 pl-9 pr-4 text-xs border border-slate-200 rounded-xl bg-white font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
              />
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="CARI TAHUN LULUS"
                value={searchTahun}
                onChange={(e) => setSearchTahun(e.target.value)}
                className="w-full h-10 pl-9 pr-4 text-xs border border-slate-200 rounded-xl bg-white font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner uppercase"
              />
            </div>
            <select
              className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 font-bold bg-white text-slate-700 shadow-inner transition-colors"
              value={searchProgram}
              onChange={(e) => setSearchProgram(e.target.value)}
            >
              <option value="">Semua Program</option>
              <option value="PAKET A">PAKET A (Setara SD)</option>
              <option value="PAKET B">PAKET B (Setara SMP)</option>
              <option value="PAKET C">PAKET C (Setara SMA)</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2 md:col-span-3">
            <input
              type="file"
              ref={importInputRef}
              className="hidden"
              accept=".xlsx, .xls"
              onChange={handleImportExcel}
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
              onClick={startAddAlumni}
              className="h-10 bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs px-4 rounded-xl cursor-pointer shadow-md shadow-purple-200 uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" /> TAMBAH DATA
            </Button>
          </div>
        </div>
      </div>

      {/* Grid Cards and Layout View */}
      <div className="space-y-6">
        {/* Alumni List/Grid Card */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-4">
              <h3 className="font-black text-slate-500 uppercase text-xs tracking-widest">
                Daftar Alumni ({totalItems})
              </h3>
              <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                <button
                  onClick={() => setViewMode("cards")}
                  className={`p-1.5 transition ${viewMode === "cards" ? "bg-white shadow-xs text-purple-600" : "text-slate-400 hover:text-slate-600"}`}
                  title="Card View"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 transition ${viewMode === "table" ? "bg-white shadow-xs text-purple-600" : "text-slate-400 hover:text-slate-600"}`}
                  title="Table View"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-semibold">Klik salah satu untuk melihat detail & edit</span>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="py-20 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-slate-500 text-xs font-semibold">Memuat data alumni...</span>
              </div>
            ) : totalItems === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                <HelpCircle size={40} className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 text-xs font-bold">Tidak ada alumni yang sesuai filter.</p>
              </div>
            ) : viewMode === "cards" ? (
              /* Cards View */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {currentItems.map((item) => {
                  const isActive = selectedId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => selectAlumni(item)}
                      className={`rounded-2xl overflow-hidden border-2 cursor-pointer transition flex flex-col group ${isActive ? "border-purple-600 shadow-md ring-2 ring-purple-100" : "border-slate-100 hover:border-purple-300"
                        }`}
                    >
                      <div className="h-44 bg-slate-50 relative overflow-hidden">
                        {item.foto ? (
                          <img src={item.foto} alt={item.nama} className="w-full h-full object-cover group-hover:scale-103 transition duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 font-black text-xs bg-slate-100">
                            FOTO
                          </div>
                        )}
                        <div className="absolute top-3 left-3 z-10 max-w-[90%]">
                          <span className="inline-block bg-[#9c27b0] text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase shadow-md tracking-wider truncate">
                            {item.program}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 flex-1 space-y-1 bg-white">
                        <h4 className="font-black text-[#280f91] text-xs group-hover:text-purple-600 transition truncate">{item.nama}</h4>
                        <p className="text-slate-500 text-[10px] font-semibold uppercase">TAHUN LULUS: {item.tahunLulus || "-"}</p>
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
                      <th className="py-4 px-6 border-r border-[#009cb9] w-48 text-center">TAHUN LULUS</th>
                      <th className="py-4 px-6 border-r border-[#009cb9] w-48 text-center">PROGRAM</th>
                      <th className="py-4 px-6 border-r border-[#009cb9] w-36 text-center">NISN</th>
                      <th className="py-4 px-6 text-center">EMAIL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {currentItems.map((item, idx) => (
                      <tr
                        key={item.id}
                        onClick={() => selectAlumni(item)}
                        className={`hover:bg-cyan-50/20 cursor-pointer transition ${selectedId === item.id ? "bg-purple-50/75 text-purple-900 font-bold" : ""
                          }`}
                      >
                        <td className="py-4 px-6 text-center text-slate-500 font-mono border-r border-slate-100">{indexOfFirstItem + idx + 1}</td>
                        <td className="py-4 px-6 font-bold text-slate-800 border-r border-slate-100">{item.nama}</td>
                        <td className="py-4 px-6 text-center border-r border-slate-100 font-bold text-purple-700">{item.tahunLulus}</td>
                        <td className="py-4 px-6 text-center border-r border-slate-100 font-mono">{item.program || "-"}</td>
                        <td className="py-4 px-6 text-center border-r border-slate-100 font-mono">{item.nisn || "-"}</td>
                        <td className="py-4 px-6 text-center text-slate-500 font-mono">{item.email || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-end items-center gap-2.5 p-4 border-t border-slate-100">
                <Button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="bg-[#ffb300] hover:bg-[#ffa000] text-black font-extrabold text-xs h-9 px-4 rounded-xl cursor-pointer disabled:opacity-50 transition-all"
                >
                  <ChevronLeft className="h-4 w-4 mr-0.5" /> Previous
                </Button>

                <span className="h-9 w-9 flex items-center justify-center bg-[#ffb300] text-black font-black text-sm rounded-xl">
                  {currentPage}
                </span>

                <Button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="bg-[#ffb300] hover:bg-[#ffa000] text-black font-extrabold text-xs h-9 px-4 rounded-xl cursor-pointer disabled:opacity-50 transition-all"
                >
                  Next <ChevronRight className="h-4 w-4 ml-0.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* POPUP / MODAL FORM DIALOG */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={closeForm} />

          {/* Form Container */}
          <div className="relative bg-[#00badb] rounded-3xl overflow-hidden shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 border-4 border-cyan-400 z-10">
            {/* Form Column (Cyan Background) */}
            <div className="p-3 relative text-white flex flex-col flex-1 min-h-0">
              {/* Close Button */}
              <button
                onClick={closeForm}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-3 pr-10 shrink-0">
                <span className="inline-block bg-[#9c27b0] text-white font-extrabold text-[11px] px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                  {isAdding ? "TAMBAH DATA ALUMNI" : (!isEditing ? "DETAIL DATA" : "EDIT DATA")}
                </span>
              </div>

              <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 text-slate-800">
                <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0 overflow-y-auto pr-1 py-4 space-y-6">
                  {/* LEFT COLUMN: All Form Fields */}
                  <div className="flex-1 lg:min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1.5">
                    {/* Row 1: NAMA | NIK */}
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-black text-cyan-50 uppercase tracking-wide">NAMA</label>
                      <input
                        type="text"
                        required
                        disabled={!isEditing}
                        placeholder="Nama lengkap alumni"
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                        className="h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-black text-cyan-50 uppercase tracking-wide">NIK</label>
                      <input
                        type="text"
                        required
                        maxLength={16}
                        disabled={!isEditing}
                        placeholder="Masukkan 16 digit NIK"
                        value={nik}
                        onChange={(e) => setNik(e.target.value)}
                        className="h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* Row 2: PROGRAM PENDIDIKAN | TAHUN LULUS */}
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-black text-cyan-50 uppercase tracking-wide">PROGRAM / PAKET</label>
                      <select
                        value={program}
                        disabled={!isEditing}
                        onChange={(e) => setProgram(e.target.value)}
                        className="h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      >
                        <option value="PAKET A">PAKET A (Setara SD)</option>
                        <option value="PAKET B">PAKET B (Setara SMP)</option>
                        <option value="PAKET C">PAKET C (Setara SMA)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-black text-cyan-50 uppercase tracking-wide">TAHUN LULUS</label>
                      <input
                        type="text"
                        required
                        disabled={!isEditing}
                        placeholder="Contoh: 2020"
                        value={tahunLulus}
                        onChange={(e) => setTahunLulus(e.target.value)}
                        className="h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* Row 3: NISN | NIS */}
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-black text-cyan-50 uppercase tracking-wide">NISN</label>
                      <input
                        type="text"
                        required
                        disabled={!isEditing}
                        placeholder="Masukkan NISN"
                        value={nisn}
                        onChange={(e) => setNisn(e.target.value)}
                        className="h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-black text-cyan-50 uppercase tracking-wide">NIS</label>
                      <input
                        type="text"
                        required
                        disabled={!isEditing}
                        placeholder="Masukkan NIS"
                        value={nis}
                        onChange={(e) => setNis(e.target.value)}
                        className="h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* Row 4: TEMPAT/TGL LAHIR | JK */}
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-black text-cyan-50 uppercase tracking-wide">TEMPAT, TGL. LAHIR</label>
                      <input
                        type="text"
                        required
                        disabled={!isEditing}
                        placeholder="Contoh: Ciamis, 15-08-2002"
                        value={tempatTglLahir}
                        onChange={(e) => setTempatTglLahir(e.target.value)}
                        className="h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-black text-cyan-50 uppercase tracking-wide">JENIS KELAMIN</label>
                      <select
                        value={jenisKelamin}
                        disabled={!isEditing}
                        onChange={(e) => setJenisKelamin(e.target.value)}
                        className="h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>

                    {/* Row 5: NO.HP/WA | AGAMA */}
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-black text-cyan-50 uppercase tracking-wide">NO. HP / WA</label>
                      <input
                        type="text"
                        required
                        disabled={!isEditing}
                        placeholder="Contoh: 0821..."
                        value={noHp}
                        onChange={(e) => setNoHp(e.target.value)}
                        className="h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-black text-cyan-50 uppercase tracking-wide">AGAMA</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        placeholder="Contoh: Islam"
                        value={agama}
                        onChange={(e) => setAgama(e.target.value)}
                        className="h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* Row 6: EMAIL | NAMA AYAH */}
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-black text-cyan-50 uppercase tracking-wide">EMAIL</label>
                      <input
                        type="email"
                        disabled={!isEditing}
                        placeholder="Contoh: alumni@mail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-black text-cyan-50 uppercase tracking-wide">NAMA AYAH</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        placeholder="Nama ayah kandung"
                        value={namaAyah}
                        onChange={(e) => setNamaAyah(e.target.value)}
                        className="h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* Row 7: NAMA IBU */}
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-black text-cyan-50 uppercase tracking-wide">NAMA IBU</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        placeholder="Nama ibu kandung"
                        value={namaIbu}
                        onChange={(e) => setNamaIbu(e.target.value)}
                        className="h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* Row 8: ALAMAT JALAN (full width) */}
                    <div className="sm:col-span-2 flex flex-col gap-0.5">
                      <label className="text-[10px] font-black text-cyan-50 uppercase tracking-wide">ALAMAT JALAN</label>
                      <textarea
                        rows={2}
                        disabled={!isEditing}
                        placeholder="Tulis alamat rumah alumni (nama jalan/dusun)..."
                        value={alamat}
                        onChange={(e) => setAlamat(e.target.value)}
                        className="p-2.5 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 resize-none transition-colors"
                      />
                    </div>

                    {/* Row 8b: RT, RW, Desa, Kecamatan, Kabupaten, Provinsi */}
                    <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-1.5">
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[10px] font-black text-cyan-50 uppercase tracking-wide">RT</label>
                        <input type="text" maxLength={3} disabled={!isEditing} placeholder="001" value={rt} onChange={(e) => setRt(e.target.value)}
                          className="h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[10px] font-black text-cyan-50 uppercase tracking-wide">RW</label>
                        <input type="text" maxLength={3} disabled={!isEditing} placeholder="002" value={rw} onChange={(e) => setRw(e.target.value)}
                          className="h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[10px] font-black text-cyan-50 uppercase tracking-wide">DESA/KELURAHAN</label>
                        <input type="text" disabled={!isEditing} placeholder="Nama desa/kelurahan" value={desa} onChange={(e) => setDesa(e.target.value)}
                          className="h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[10px] font-black text-cyan-50 uppercase tracking-wide">KECAMATAN</label>
                        <input type="text" disabled={!isEditing} placeholder="Nama kecamatan" value={kecamatan} onChange={(e) => setKecamatan(e.target.value)}
                          className="h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[10px] font-black text-cyan-50 uppercase tracking-wide">KABUPATEN/KOTA</label>
                        <input type="text" disabled={!isEditing} placeholder="Nama kabupaten/kota" value={kabupaten} onChange={(e) => setKabupaten(e.target.value)}
                          className="h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[10px] font-black text-cyan-50 uppercase tracking-wide">PROVINSI</label>
                        <input type="text" disabled={!isEditing} placeholder="Nama provinsi" value={provinsi} onChange={(e) => setProvinsi(e.target.value)}
                          className="h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors" />
                      </div>
                    </div>

                    {/* Row 9: MELANJUTKAN KE & PEKERJAAN */}
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-black text-cyan-50 uppercase tracking-wide">MELANJUTKAN KE</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        placeholder="Contoh: Perguruan Tinggi, Kursus, dll"
                        value={melanjutkanKe}
                        onChange={(e) => setMelanjutkanKe(e.target.value)}
                        className="h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-[10px] font-black text-cyan-50 uppercase tracking-wide">PEKERJAAN</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        placeholder="Contoh: Guru, Wiraswasta, dll"
                        value={pekerjaan}
                        onChange={(e) => setPekerjaan(e.target.value)}
                        className="h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* Row 10: CERITA SUKSES ALUMNI (full width) */}
                    <div className="sm:col-span-2 flex flex-col gap-0.5">
                      <label className="text-[10px] font-black text-cyan-50 uppercase tracking-wide">CERITA SUKSES ALUMNI</label>
                      <textarea
                        rows={3}
                        disabled={!isEditing}
                        placeholder="Bagikan cerita sukses, kesan pesan, atau kutipan motivasi dari alumni..."
                        value={cerita}
                        onChange={(e) => setCerita(e.target.value)}
                        className="p-2.5 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 resize-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Photo Uploader — compact sidebar */}
                  <div className="lg:w-[220px] lg:shrink-0 w-full flex flex-col gap-4">

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-cyan-50 uppercase tracking-wider block">FOTO ALUMNI</label>
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-2.5 text-center transition-all ${!isEditing && "pointer-events-none opacity-60"} ${dragActive ? "border-yellow-300 bg-yellow-50/20" : "border-white/30 bg-white/10 hover:bg-white/20"
                          } h-44 flex flex-col justify-center items-center relative overflow-hidden`}
                      >
                        {foto ? (
                          <div className="w-full h-full relative group">
                            <img
                              src={foto}
                              alt="Alumni Preview"
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => setFoto("")}
                              className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-6 w-6 text-white/50 mb-1" />
                            <p className="text-[9px] font-black text-white uppercase tracking-wider">DRAG AND DROP</p>
                            <p className="text-[8px] text-white/70 font-semibold uppercase mt-0.5">CLICK TO BROWSE</p>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                if (e.target.files && e.target.files[0]) {
                                  await handleImageUpload(e.target.files[0]);
                                  if (e.target) e.target.value = "";
                                }
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              disabled={!isEditing || uploading}
                            />
                          </>
                        )}
                        {uploading && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#9c27b0] border-t-transparent" />
                          </div>
                        )}
                      </div>
                      <p className="text-[9px] font-medium text-white/70 italic text-center">
                        * Maks 5MB
                      </p>
                      <input type="text" placeholder="atau masukkan URL foto..."
                        value={foto || ""}
                        disabled={!isEditing}
                        onChange={(e) => setFoto(e.target.value)}
                        className="w-full text-[11px] font-black border border-transparent rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-purple-400 focus:outline-none bg-white text-slate-800"
                      />
                    </div>

                    {/* BERKAS DOKUMEN */}
                    <BerkasUpload
                      berkasTypes={ALUMNI_BERKAS_TYPES}
                      value={berkas}
                      onChange={setBerkas}
                      isEditing={isEditing}
                    />

                  </div>
                </div>

                {/* Buttons Footer Form */}
                <div className="col-span-1 md:col-span-4 pt-4 mt-3 border-t border-white/10 flex items-center justify-end gap-3 shrink-0">
                  {isAdding ? (
                    <>
                      <Button
                        type="button"
                        onClick={closeForm}
                        className="bg-slate-500 hover:bg-slate-650 text-white font-extrabold text-xs px-8 h-11 rounded-xl cursor-pointer uppercase tracking-widest transition-all"
                      >
                        BATAL
                      </Button>
                      <Button
                        type="submit"
                        disabled={saving || uploading}
                        className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-black text-xs px-8 h-11 rounded-xl cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest flex items-center gap-1.5 transition-all disabled:opacity-70"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> MENYIMPAN...
                          </>
                        ) : (
                          <>
                            <Save size={15} /> SIMPAN
                          </>
                        )}
                      </Button>
                    </>
                  ) : isEditing ? (
                    <>
                      <Button
                        type="button"
                        onClick={closeForm}
                        className="bg-slate-500 hover:bg-slate-650 text-white font-extrabold text-xs px-8 h-11 rounded-xl cursor-pointer uppercase tracking-widest transition-all"
                      >
                        BATAL
                      </Button>
                      <Button
                        type="submit"
                        disabled={saving || uploading}
                        className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-black text-xs px-8 h-11 rounded-xl cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest flex items-center gap-1.5 transition-all disabled:opacity-70"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> MENYIMPAN...
                          </>
                        ) : (
                          <>
                            <Save size={15} /> SIMPAN
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        disabled={saving}
                        onClick={(e) => { e.preventDefault(); handleDelete(); }}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-8 h-11 rounded-xl cursor-pointer uppercase tracking-widest transition-all flex items-center gap-1.5"
                      >
                        <Trash2 size={15} /> HAPUS
                      </Button>
                      <Button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
                        className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-black text-xs px-8 h-11 rounded-xl cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest flex items-center gap-1.5 transition-all"
                      >
                        <Edit3 size={15} /> EDIT
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
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
                  Upload data alumni dari file Excel. Silakan download format terlebih dahulu.
                </p>

                <div className="space-y-3">
                  <a
                    href="/templates/format-upload-alumni.xlsx"
                    download
                    className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-widest transition-all shadow-md cursor-pointer"
                  >
                    <Download className="h-4 w-4" /> DOWNLOAD FORMAT
                  </a>

                  <Button
                    type="button"
                    onClick={() => importInputRef.current?.click()}
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
    </div>
  );
}
