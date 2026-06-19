import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { parseCSV, downloadCSV, mapCsvRows, parseExcel } from "@/lib/utils";
import { ShieldAlert, Search, Upload, Download, Plus, Trash2, Save, X, Eye, EyeOff, List, LayoutGrid, Filter, RotateCcw, Loader2 } from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { toast } from "sonner";

interface Tutor {
  id: number;
  nama: string;
  tutorMapel: string;
  program: string;
  kelas?: string;
  nuptk: string;
  tempatTglLahir: string;
  jenisKelamin: string;
  agama: string;
  pendidikan: string;
  email: string;
  nik: string;
  alamat: string;
  password?: string;
  foto: string;
  tanggalMulaiTugas: string;
  nomorSkPengangkatan: string;
  lembagaPengangkat: string;
  nomorSkPenugasan: string;
  lembagaPenugas: string;
}

export default function TutorManager() {
  const confirm = useConfirm();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Search & Filters
  const [searchName, setSearchName] = useState("");
  const [searchNik, setSearchNik] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterNik, setFilterNik] = useState("");

  // Selected tutor for details / edit / add form
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState<Partial<Tutor>>({
    nama: "",
    tutorMapel: "",
    program: "",
    kelas: "",
    nuptk: "",
    tempatTglLahir: "",
    jenisKelamin: "Laki-laki",
    agama: "Islam",
    pendidikan: "",
    email: "",
    nik: "",
    alamat: "",
    password: "",
    foto: "",
    tanggalMulaiTugas: "",
    nomorSkPengangkatan: "",
    lembagaPengangkat: "",
    nomorSkPenugasan: "",
    lembagaPenugas: "",
  });

  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTutors();
  }, []);

  const fetchTutors = () => {
    setLoading(true);
    fetch("/api/tutors")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setTutors(data.data);
        }
      })
      .catch((err) => console.error("Failed to load tutors:", err))
      .finally(() => setLoading(false));
  };

  const handleSearch = () => {
    setFilterName(searchName);
    setFilterNik(searchNik);
  };

  const handleReset = () => {
    setSearchName("");
    setSearchNik("");
    setFilterName("");
    setFilterNik("");
  };

  // CSV Export
  const handleExportCSV = () => {
    if (tutors.length === 0) {
      toast.error("Tidak ada data untuk diekspor!");
      return;
    }
    const headers = ["NAMA", "PROGRAM", "NUPTK", "TEMPAT TGL LAHIR", "JENIS KELAMIN", "AGAMA", "PENDIDIKAN", "EMAIL", "NIK", "ALAMAT", "FOTO", "TANGGAL MULAI TUGAS", "NOMOR SK PENGANGKATAN", "LEMBAGA PENGANGKAT", "NOMOR SK PENUGASAN", "LEMBAGA PENUGAS"];
    const rows = tutors.map(t => [
      `"${(t.nama || "").replace(/"/g, '""')}"`,
      `"${(t.program || "").replace(/"/g, '""')}"`,
      `"${(t.nuptk || "").replace(/"/g, '""')}"`,
      `"${(t.tempatTglLahir || "").replace(/"/g, '""')}"`,
      `"${(t.jenisKelamin || "").replace(/"/g, '""')}"`,
      `"${(t.agama || "").replace(/"/g, '""')}"`,
      `"${(t.pendidikan || "").replace(/"/g, '""')}"`,
      `"${(t.email || "").replace(/"/g, '""')}"`,
      `"${(t.nik || "").replace(/"/g, '""')}"`,
      `"${(t.alamat || "").replace(/"/g, '""')}"`,
      `"${(t.foto || "").replace(/"/g, '""')}"`,
      `"${(t.tanggalMulaiTugas || "").replace(/"/g, '""')}"`,
      `"${(t.nomorSkPengangkatan || "").replace(/"/g, '""')}"`,
      `"${(t.lembagaPengangkat || "").replace(/"/g, '""')}"`,
      `"${(t.nomorSkPenugasan || "").replace(/"/g, '""')}"`,
      `"${(t.lembagaPenugas || "").replace(/"/g, '""')}"`
    ]);
    downloadCSV(headers, rows, "tutor.csv");
    toast.success("Berhasil mengekspor CSV");
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
        { key: "program", aliases: ["program", "paket"], defaultIndex: 1 },
        { key: "nuptk", aliases: ["nuptk"], defaultIndex: 2 },
        { key: "tempatTglLahir", aliases: ["tempat/tgl lahir", "tempat lahir", "tanggal lahir", "tempat tgllahir", "birth"], defaultIndex: 3 },
        { key: "jenisKelamin", aliases: ["jenis kelamin", "gender", "jk"], defaultIndex: 4 },
        { key: "agama", aliases: ["agama", "religion"], defaultIndex: 5 },
        { key: "pendidikan", aliases: ["pendidikan", "education"], defaultIndex: 6 },
        { key: "email", aliases: ["email", "e-mail"], defaultIndex: 7 },
        { key: "nik", aliases: ["nik", "identitas"], defaultIndex: 8 },
        { key: "alamat", aliases: ["alamat", "address"], defaultIndex: 9 },
        { key: "foto", aliases: ["foto", "photo", "image", "gambar"], defaultIndex: 10 },
        { key: "tanggalMulaiTugas", aliases: ["tanggal mulai tugas", "tmt", "start date", "tanggalmulaitugas"], defaultIndex: 11 },
        { key: "nomorSkPengangkatan", aliases: ["nomor sk pengangkatan", "sk pengangkatan", "skpengangkatan"], defaultIndex: 12 },
        { key: "lembagaPengangkat", aliases: ["lembaga pengangkat", "lembagapengangkat"], defaultIndex: 13 },
        { key: "nomorSkPenugasan", aliases: ["nomor sk penugasan", "sk penugasan", "skpenugasan"], defaultIndex: 14 },
        { key: "lembagaPenugas", aliases: ["lembaga penugas", "lembagapenugas"], defaultIndex: 15 },
      ]);

      const importedData = mapped
        .filter((item) => item.nama)
        .map((item) => ({
          nama: item.nama,
          program: item.program || "",
          nuptk: item.nuptk || "",
          tempatTglLahir: item.tempatTglLahir || "",
          jenisKelamin: item.jenisKelamin || "",
          agama: item.agama || "",
          pendidikan: item.pendidikan || "",
          email: item.email || "",
          nik: item.nik || "",
          alamat: item.alamat || "",
          foto: item.foto || "",
          tanggalMulaiTugas: item.tanggalMulaiTugas || "",
          nomorSkPengangkatan: item.nomorSkPengangkatan || "",
          lembagaPengangkat: item.lembagaPengangkat || "",
          nomorSkPenugasan: item.nomorSkPenugasan || "",
          lembagaPenugas: item.lembagaPenugas || "",
        }));

      if (importedData.length === 0) {
        toast.error("Format data kosong atau tidak valid! Pastikan Nama tidak kosong.");
        return;
      }

      const token = localStorage.getItem("token");
      const res = await fetch("/api/tutors/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(importedData),
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success(resData.message || "Berhasil mengimpor data!");
        fetchTutors();
      } else {
        toast.error(resData.message || "Gagal mengimpor data");
      }
    } catch (err) {
      toast.error("Kesalahan saat mengunggah file ke server.");
    }
    e.target.value = "";
  };

  const openAddForm = () => {
    setIsAdding(true);
    setSelectedTutor(null);
    setFormData({
      nama: "",
      tutorMapel: "",
      program: "",
      kelas: "",
      nuptk: "",
      tempatTglLahir: "",
      jenisKelamin: "Laki-laki",
      agama: "Islam",
      pendidikan: "",
      email: "",
      nik: "",
      alamat: "",
      password: "",
      foto: "",
      tanggalMulaiTugas: "",
      nomorSkPengangkatan: "",
      lembagaPengangkat: "",
      nomorSkPenugasan: "",
      lembagaPenugas: "",
    });
    setFormOpen(true);
  };

  const openEditForm = (tutor: Tutor) => {
    setIsAdding(false);
    setSelectedTutor(tutor);
    setFormData({
      ...tutor,
      password: "", // Keep empty to indicate unchanged unless typed
    });
    setFormOpen(true);
  };

  // Drag and drop photo upload handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const uploadPhotoFile = async (file: File) => {
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
        setFormData((prev) => ({ ...prev, foto: data.url }));
        toast.success("Foto berhasil diunggah");
      } else {
        toast.error("Upload gagal: " + (data.message || "Error tidak diketahui"));
      }
    } catch (e) {
      console.error(e);
      toast.error("Error mengupload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadPhotoFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadPhotoFile(e.target.files[0]);
    }
  };

  // Save Tutor
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama) {
      toast.error("Nama wajib diisi!");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const url = isAdding ? "/api/tutors" : `/api/tutors/${selectedTutor?.id}`;
      const method = isAdding ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(isAdding ? "Tutor berhasil ditambahkan" : "Tutor berhasil diperbarui");
        setFormOpen(false);
        fetchTutors();
      } else {
        toast.error("Gagal menyimpan data: " + (data.message || "Error tidak diketahui"));
      }
    } catch (e) {
      console.error(e);
      toast.error("Terjadi kesalahan sistem saat menyimpan");
    } finally {
      setSaving(false);
    }
  };

  // Delete Tutor
  const handleDelete = async (id: number) => {
    if (!await confirm({
      title: "Konfirmasi Hapus",
      message: "Apakah Anda yakin ingin menghapus data tutor ini?",
      variant: "danger"
    })) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/tutors/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Data tutor berhasil dihapus");
        setFormOpen(false);
        fetchTutors();
      } else {
        toast.error("Gagal menghapus data: " + (data.message || "Error tidak diketahui"));
      }
    } catch (e) {
      console.error(e);
      toast.error("Terjadi kesalahan sistem saat menghapus");
    }
  };

  // Filtered tutors based on search criteria
  const filteredTutors = tutors.filter((tutor) => {
    const matchesName = 
      !filterName || tutor.nama.toLowerCase().includes(filterName.toLowerCase());
    const matchesNik = 
      !filterNik || tutor.nik.includes(filterNik);
    return matchesName && matchesNik;
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-cyan-900 tracking-tight flex items-center gap-2">
            <span>👨‍🏫</span> KELOLA WEBSITE DATA TUTOR
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Kelola tenaga pendidik, bidang keahlian, tugas mengajar, NIK, dan kredensial tutor.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="file"
            ref={importInputRef}
            className="hidden"
            accept=".csv, .xlsx, .xls"
            onChange={handleImportCSV}
          />
          <Button
            onClick={() => importInputRef.current?.click()}
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
            onClick={openAddForm}
            className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md shadow-purple-200 uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" /> TAMBAH TUTOR
          </Button>
        </div>
      </div>

      {/* FILTER & SEARCH PANEL */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="CARI NAMA TUTOR"
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

          <div className="flex gap-2 col-span-1 sm:col-span-2">
            <Button
              onClick={handleSearch}
              className="flex-1 h-10 rounded-xl bg-[#00badb] hover:bg-[#009cb9] text-white font-extrabold text-xs cursor-pointer tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all uppercase"
            >
              <Filter className="h-4 w-4" /> FILTER
            </Button>
            <Button
              onClick={handleReset}
              className="flex-1 h-10 rounded-xl bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs cursor-pointer tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all uppercase"
            >
              <RotateCcw className="h-4 w-4" /> RESET
            </Button>
          </div>
        </div>
      </div>

      {/* Grid Cards and Layout View */}
      <div className="space-y-6">
        {/* Tutor List/Grid Card */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-4">
              <h3 className="font-black text-slate-500 uppercase text-xs tracking-widest">
                Daftar Tutor ({filteredTutors.length})
              </h3>
              <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                <button
                  onClick={() => setViewMode("cards")}
                  className={`p-1.5 transition ${viewMode === "cards" ? "bg-white shadow-xs text-[#9c27b0]" : "text-slate-400 hover:text-slate-600"}`}
                  title="Card View"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 transition ${viewMode === "table" ? "bg-white shadow-xs text-[#9c27b0]" : "text-slate-400 hover:text-slate-600"}`}
                  title="Table View"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#9c27b0] border-t-transparent" />
                <span className="text-xs font-extrabold text-[#9c27b0] uppercase tracking-widest">Memuat data tutor...</span>
              </div>
            ) : filteredTutors.length > 0 ? (
              viewMode === "cards" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                  {filteredTutors.map((tutor) => (
                    <div
                      key={tutor.id}
                      onClick={() => openEditForm(tutor)}
                      className="bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-purple-300 transition-all flex flex-col group cursor-pointer hover:shadow-md"
                    >
                      {/* Photo Frame with Subject badge overlay */}
                      <div className="h-44 bg-slate-50 relative overflow-hidden">
                        {tutor.foto ? (
                          <img
                            src={tutor.foto}
                            alt={tutor.nama}
                            className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 font-black text-xs bg-slate-100">
                            FOTO
                          </div>
                        )}
                        {/* Purple Subject Overlay Tag */}
                        <div className="absolute top-3 left-3 z-10 max-w-[90%]">
                          <span className="inline-block bg-[#9c27b0] text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase shadow-md tracking-wider truncate">
                            {tutor.tutorMapel}
                          </span>
                        </div>
                      </div>

                      {/* Name info */}
                      <div className="p-4 flex-1 space-y-1 bg-white">
                        <h4 className="font-black text-[#280f91] text-xs group-hover:text-[#9c27b0] transition truncate uppercase">
                          {tutor.nama}
                        </h4>
                        <p className="text-slate-500 text-[10px] font-semibold uppercase">
                          {tutor.nuptk || "NUPTK: -"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Table View */
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-[#00badb] text-white font-black text-xs uppercase">
                        <th className="p-4 w-16 text-center border-r border-[#009cb9]">No</th>
                        <th className="p-4 border-r border-[#009cb9]">Nama</th>
                        <th className="p-4 border-r border-[#009cb9] w-48 text-center">Program</th>
                        <th className="p-4 border-r border-[#009cb9] w-48 text-center">NUPTK</th>
                        <th className="p-4 border-r border-[#009cb9] w-36 text-center">Pendidikan</th>
                        <th className="p-4 text-center">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {filteredTutors.map((tutor, idx) => (
                        <tr
                          key={tutor.id}
                          onClick={() => openEditForm(tutor)}
                          className="hover:bg-cyan-50/20 cursor-pointer transition"
                        >
                          <td className="p-4 text-center text-slate-500 font-mono border-r border-slate-100">{idx + 1}</td>
                          <td className="p-4 font-bold text-slate-800 border-r border-slate-100">{tutor.nama}</td>
                          <td className="p-4 text-center border-r border-slate-100 font-bold text-purple-700">{tutor.program}</td>
                          <td className="p-4 text-center border-r border-slate-100 font-mono">{tutor.nuptk || "-"}</td>
                          <td className="p-4 text-center border-r border-slate-100">{tutor.pendidikan || "-"}</td>
                          <td className="p-4 text-center text-slate-500 font-mono">{tutor.email || "-"}</td>
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
                <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">Tutor Tidak Ditemukan</h3>
                <p className="text-slate-500 font-bold text-xs">
                  Belum ada data tutor yang sesuai dengan filter pencarian.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FORM DIALOG: ADD/EDIT TUTOR & VIEW DETAIL PROFIL (Mockup 2 Tampilan Tambah Tutor) */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setFormOpen(false)} />

          {/* Form Container */}
          <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-4xl animate-in zoom-in-95 duration-200 border-4 border-cyan-400 z-10 max-h-[90vh] flex flex-col">
            {/* Form Column (Cyan Background) */}
            <div className="bg-[#00badb] p-6 relative text-white flex-1 overflow-y-auto">
              {/* Close Button */}
              <button
                onClick={() => setFormOpen(false)}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-6">
                <span className="inline-block bg-[#9c27b0] text-white font-extrabold text-[11px] px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                  {isAdding ? "TAMBAH TUTOR BARU" : `EDIT TUTOR: ${selectedTutor?.nama}`}
                </span>
              </div>

              <form onSubmit={handleSave} className="space-y-6 text-slate-800">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  
                  {/* LEFT 3 COLS: FORM INPUT PANEL */}
                  <div className="lg:col-span-3 space-y-4">
                    
                    {/* NAMA */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">NAMA</label>
                      <input
                        type="text"
                        required
                        placeholder="Masukkan nama lengkap tutor"
                        value={formData.nama || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                        className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* NIK */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">NIK</label>
                      <input
                        type="text"
                        placeholder="Masukkan 16 digit NIK tutor"
                        value={formData.nik || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, nik: e.target.value }))}
                        className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* PROGRAM (TUGAS) */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">PROGRAM / PAKET</label>
                      <select
                        required
                        value={formData.program || ""}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, program: e.target.value, kelas: "", tutorMapel: "" }));
                        }}
                        className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 transition-colors"
                      >
                        <option value="" disabled>Pilih Program / Paket</option>
                        <option value="Paket A">Paket A</option>
                        <option value="Paket B">Paket B</option>
                        <option value="Paket C">Paket C</option>
                      </select>
                    </div>

                    {/* KELAS */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">KELAS</label>
                      <select
                        required
                        disabled={!formData.program}
                        value={formData.kelas || ""}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, kelas: e.target.value, tutorMapel: "" }));
                        }}
                        className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      >
                        <option value="" disabled>Pilih Kelas</option>
                        {formData.program === "Paket A" && (
                          <>
                            <option value="Kelas I">Kelas I</option>
                            <option value="Kelas II">Kelas II</option>
                            <option value="Kelas III">Kelas III</option>
                            <option value="Kelas IV">Kelas IV</option>
                            <option value="Kelas V">Kelas V</option>
                            <option value="Kelas VI">Kelas VI</option>
                          </>
                        )}
                        {formData.program === "Paket B" && (
                          <>
                            <option value="Kelas VII">Kelas VII</option>
                            <option value="Kelas VIII">Kelas VIII</option>
                            <option value="Kelas IX">Kelas IX</option>
                          </>
                        )}
                        {formData.program === "Paket C" && (
                          <>
                            <option value="Kelas X">Kelas X</option>
                            <option value="Kelas XI">Kelas XI</option>
                            <option value="Kelas XII">Kelas XII</option>
                          </>
                        )}
                      </select>
                    </div>


                    {/* NUPTK */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">NUPTK</label>
                      <input
                        type="text"
                        placeholder="Masukkan 16 digit NUPTK (jika ada)"
                        value={formData.nuptk || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, nuptk: e.target.value }))}
                        className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* TEMPAT, TGL. LAHIR */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">TEMPAT, TGL. LAHIR</label>
                      <input
                        type="text"
                        placeholder="Contoh: Ciamis, 15-08-1988"
                        value={formData.tempatTglLahir || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, tempatTglLahir: e.target.value }))}
                        className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* JENIS KELAMIN */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">JENIS KELAMIN</label>
                      <select
                        value={formData.jenisKelamin || "Laki-laki"}
                        onChange={(e) => setFormData(prev => ({ ...prev, jenisKelamin: e.target.value }))}
                        className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 transition-colors"
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>

                    {/* AGAMA */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">AGAMA</label>
                      <input
                        type="text"
                        placeholder="Masukkan agama"
                        value={formData.agama || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, agama: e.target.value }))}
                        className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* PENDIDIKAN */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">PENDIDIKAN</label>
                      <input
                        type="text"
                        placeholder="Contoh: S1 Pendidikan Olahraga"
                        value={formData.pendidikan || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, pendidikan: e.target.value }))}
                        className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* EMAIL */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">EMAIL</label>
                      <input
                        type="email"
                        placeholder="Masukkan alamat email tutor"
                        value={formData.email || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* TGL MULAI TUGAS */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">TGL MULAI TUGAS</label>
                      <input
                        type="text"
                        placeholder="Contoh: 2018-07-15"
                        value={formData.tanggalMulaiTugas || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, tanggalMulaiTugas: e.target.value }))}
                        className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* NOMOR SK PENGANGKATAN */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">NOMOR SK PENGANGKATAN</label>
                      <input
                        type="text"
                        placeholder="Nomor SK Pengangkatan"
                        value={formData.nomorSkPengangkatan || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, nomorSkPengangkatan: e.target.value }))}
                        className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* LEMBAGA PENGANGKAT */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">LEMBAGA PENGANGKAT</label>
                      <input
                        type="text"
                        placeholder="Dinas Pendidikan / Yayasan"
                        value={formData.lembagaPengangkat || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, lembagaPengangkat: e.target.value }))}
                        className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* NOMOR SK PENUGASAN */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">NOMOR SK PENUGASAN</label>
                      <input
                        type="text"
                        placeholder="Nomor SK Penugasan"
                        value={formData.nomorSkPenugasan || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, nomorSkPenugasan: e.target.value }))}
                        className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* LEMBAGA PENUGAS */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">LEMBAGA PENUGAS</label>
                      <input
                        type="text"
                        placeholder="Lembaga Penugas"
                        value={formData.lembagaPenugas || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, lembagaPenugas: e.target.value }))}
                        className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* ALAMAT */}
                    <div className="flex flex-col md:flex-row md:items-start gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0 md:pt-2">ALAMAT</label>
                      <textarea
                        placeholder="Alamat tempat tinggal lengkap tutor"
                        value={formData.alamat || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, alamat: e.target.value }))}
                        className="flex-1 p-2.5 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 resize-none transition-colors"
                        rows={2}
                      />
                    </div>

                    {/* PASSWORD */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">
                        PASSWORD {!isAdding && "(KOSONGKAN JIKA TIDAK INGIN MENGUBAH)"}
                      </label>
                      <div className="flex-1 relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder={isAdding ? "Buat password login tutor" : "Masukkan password baru jika ingin diubah"}
                          value={formData.password || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full h-9 pl-3 pr-10 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* RIGHT 1 COL: Drag & Drop Photo + Additional SK info */}
                  <div className="lg:col-span-1 flex flex-col items-center gap-6">
                    
                    {/* PHOTO UPLOADER (Mockup 2 area style) */}
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black text-cyan-50 uppercase tracking-wider block">FOTO TUTOR</label>
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all ${
                          dragActive ? "border-yellow-300 bg-yellow-50/20" : "border-white/30 bg-white/10 hover:bg-white/20"
                        } h-56 flex flex-col justify-center items-center relative overflow-hidden`}
                      >
                        {formData.foto ? (
                          <div className="w-full h-full relative group">
                            <img
                              src={formData.foto}
                              alt="Tutor Preview"
                              className="w-full h-full object-cover rounded-xl"
                            />
                            <button
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, foto: "" }))}
                              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-white/60 mb-2" />
                            <p className="text-[10px] font-black text-white uppercase tracking-wider">DRAG AND DROP A FILE</p>
                            <p className="text-[9px] text-white/70 font-semibold uppercase mt-0.5">HERE OR CLICK</p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileInput}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              disabled={uploading}
                            />
                          </>
                        )}
                        {uploading && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#9c27b0] border-t-transparent" />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-white/80 mt-1 italic text-center">
                        * Batas maksimal ukuran foto adalah 5MB.
                      </p>
                      <input type="text" placeholder="Masukkan URL foto..."
                        value={formData.foto || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, foto: e.target.value }))}
                        className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white text-slate-800 mt-2"
                      />
                    </div>

                  </div>

                </div>

                {/* Footer with Action Buttons */}
                <div className="border-t border-white/20 pt-4 flex items-center justify-end gap-3">
                  {selectedTutor && (
                    <Button
                      type="button"
                      onClick={() => handleDelete(selectedTutor.id)}
                      className="bg-rose-600 hover:bg-rose-700 text-white border-0 font-extrabold text-sm px-6 h-11 rounded-full cursor-pointer shadow-md shadow-rose-900/30 uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Trash2 className="h-4 w-4" /> HAPUS
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={saving || uploading}
                    className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-sm px-8 h-11 rounded-full cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5"
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
        </div>
      )}

    </div>
  );
}
