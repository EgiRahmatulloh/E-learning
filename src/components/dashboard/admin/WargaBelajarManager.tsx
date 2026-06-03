import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Search, Upload, Download, Sparkles, Plus, Trash2, Save, X, Eye, EyeOff, GraduationCap, ArrowUpCircle, RefreshCw, List, LayoutGrid, Filter, RotateCcw } from "lucide-react";

interface Student {
  id: number;
  nama: string;
  nik: string;
  program: string;
  kelas: string;
  nisn: string;
  nis: string;
  tempatTglLahir: string;
  titikLayanan: string;
  jenisKelamin: string;
  noHp: string;
  agama: string;
  namaAyah: string;
  email: string;
  namaIbu: string;
  alamat: string;
  password?: string;
  foto: string;
  status: string; // 'AKTIF', 'LULUS'
}

export default function WargaBelajarManager() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Search & Filters
  const [searchName, setSearchName] = useState("");
  const [searchNik, setSearchNik] = useState("");
  const [searchKelas, setSearchKelas] = useState("");
  const [searchProgram, setSearchProgram] = useState("");

  const [filterName, setFilterName] = useState("");
  const [filterNik, setFilterNik] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [filterProgram, setFilterProgram] = useState("");

  // Form dialog states
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Continuation program dialog states
  const [continueOpen, setContinueOpen] = useState(false);
  const [newProgram, setNewProgram] = useState("PAKET B");
  const [newKelas, setNewKelas] = useState("KELAS VII (TUJUH)");

  // Form Fields
  const [formData, setFormData] = useState<Partial<Student>>({
    nama: "",
    nik: "",
    program: "PAKET C",
    kelas: "KELAS X (SEPULUH)",
    nisn: "",
    nis: "",
    tempatTglLahir: "",
    titikLayanan: "",
    jenisKelamin: "Laki-laki",
    noHp: "",
    agama: "Islam",
    namaAyah: "",
    email: "",
    namaIbu: "",
    alamat: "",
    password: "",
    foto: "",
    status: "AKTIF",
  });

  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = () => {
    setLoading(true);
    fetch("/api/students")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setStudents(data.data);
        }
      })
      .catch((err) => console.error("Failed to load students:", err))
      .finally(() => setLoading(false));
  };

  const handleSearch = () => {
    setFilterName(searchName);
    setFilterNik(searchNik);
    setFilterKelas(searchKelas);
    setFilterProgram(searchProgram);
  };

  const handleReset = () => {
    setSearchName("");
    setSearchNik("");
    setSearchKelas("");
    setSearchProgram("");
    setFilterName("");
    setFilterNik("");
    setFilterKelas("");
    setFilterProgram("");
  };

  // CSV Export
  const handleExportCSV = () => {
    if (students.length === 0) {
      alert("Tidak ada data untuk diekspor!");
      return;
    }
    const headers = ["NAMA", "NIK", "PROGRAM", "KELAS", "NISN", "NIS", "TEMPAT TGL LAHIR", "TITIK LAYANAN", "JENIS KELAMIN", "NO HP", "AGAMA", "NAMA AYAH", "EMAIL", "NAMA IBU", "ALAMAT", "FOTO", "STATUS"];
    const rows = students.map(s => [
      `"${(s.nama || "").replace(/"/g, '""')}"`,
      `"${(s.nik || "").replace(/"/g, '""')}"`,
      `"${(s.program || "").replace(/"/g, '""')}"`,
      `"${(s.kelas || "").replace(/"/g, '""')}"`,
      `"${(s.nisn || "").replace(/"/g, '""')}"`,
      `"${(s.nis || "").replace(/"/g, '""')}"`,
      `"${(s.tempatTglLahir || "").replace(/"/g, '""')}"`,
      `"${(s.titikLayanan || "").replace(/"/g, '""')}"`,
      `"${(s.jenisKelamin || "").replace(/"/g, '""')}"`,
      `"${(s.noHp || "").replace(/"/g, '""')}"`,
      `"${(s.agama || "").replace(/"/g, '""')}"`,
      `"${(s.namaAyah || "").replace(/"/g, '""')}"`,
      `"${(s.email || "").replace(/"/g, '""')}"`,
      `"${(s.namaIbu || "").replace(/"/g, '""')}"`,
      `"${(s.alamat || "").replace(/"/g, '""')}"`,
      `"${(s.foto || "").replace(/"/g, '""')}"`,
      `"${(s.status || "").replace(/"/g, '""')}"`
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "warga_belajar.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import
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
        nik: string;
        program: string;
        kelas: string;
        nisn: string;
        nis: string;
        tempatTglLahir: string;
        titikLayanan: string;
        jenisKelamin: string;
        noHp: string;
        agama: string;
        namaAyah: string;
        email: string;
        namaIbu: string;
        alamat: string;
        foto: string;
        status: string;
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

        if (cleanCols[0]) {
          importedData.push({
            nama: cleanCols[0],
            nik: cleanCols[1] || "",
            program: cleanCols[2] || "",
            kelas: cleanCols[3] || "",
            nisn: cleanCols[4] || "",
            nis: cleanCols[5] || "",
            tempatTglLahir: cleanCols[6] || "",
            titikLayanan: cleanCols[7] || "",
            jenisKelamin: cleanCols[8] || "",
            noHp: cleanCols[9] || "",
            agama: cleanCols[10] || "",
            namaAyah: cleanCols[11] || "",
            email: cleanCols[12] || "",
            namaIbu: cleanCols[13] || "",
            alamat: cleanCols[14] || "",
            foto: cleanCols[15] || "",
            status: cleanCols[16] || "AKTIF",
          });
        }
      }

      if (importedData.length === 0) {
        alert("Format CSV kosong atau tidak valid!");
        return;
      }

      const token = localStorage.getItem("token");
      try {
        const res = await fetch("/api/students/import", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(importedData),
        });
        const resData = await res.json();
        if (resData.success) {
          alert(resData.message || "Berhasil mengimpor data!");
          fetchStudents();
        } else {
          alert(resData.message || "Gagal mengimpor data");
        }
      } catch (err) {
        alert("Kesalahan saat mengunggah CSV ke server.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const openAddForm = () => {
    setIsAdding(true);
    setSelectedStudent(null);
    setFormData({
      nama: "",
      nik: "",
      program: "PAKET C",
      kelas: "KELAS X (SEPULUH)",
      nisn: "",
      nis: "",
      tempatTglLahir: "",
      titikLayanan: "",
      jenisKelamin: "Laki-laki",
      noHp: "",
      agama: "Islam",
      namaAyah: "",
      email: "",
      namaIbu: "",
      alamat: "",
      password: "",
      foto: "",
      status: "AKTIF",
    });
    setFormOpen(true);
  };

  const openEditForm = (student: Student) => {
    setIsAdding(false);
    setSelectedStudent(student);
    setFormData({
      ...student,
      password: "", // Keep empty to indicate unchanged unless typed
    });
    setFormOpen(true);
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
      } else {
        alert("Upload gagal: " + (data.message || "Error tidak diketahui"));
      }
    } catch (e) {
      console.error(e);
      alert("Error mengupload file");
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama) {
      alert("Nama wajib diisi!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const url = isAdding ? "/api/students" : `/api/students/${selectedStudent?.id}`;
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
        setFormOpen(false);
        fetchStudents();
      } else {
        alert("Gagal menyimpan data: " + (data.message || "Error tidak diketahui"));
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan sistem saat menyimpan");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data warga belajar ini?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/students/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        setFormOpen(false);
        fetchStudents();
      } else {
        alert("Gagal menghapus data: " + (data.message || "Error tidak diketahui"));
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan sistem saat menghapus");
    }
  };

  // Promote (Naikkan Kelas)
  const handlePromote = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menaikkan tingkat kelas warga belajar ini?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/students/${id}/promote`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        alert("Warga belajar berhasil naik kelas!");
        setFormOpen(false);
        fetchStudents();
      } else {
        alert("Gagal memproses kenaikan kelas: " + (data.message || ""));
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan sistem atau koneksi saat memproses kenaikan kelas.");
    }
  };

  // Graduate (Luluskan)
  const handleGraduate = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin meluluskan warga belajar ini?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/students/${id}/graduate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        alert("Warga belajar telah dinyatakan lulus!");
        setFormOpen(false);
        fetchStudents();
      } else {
        alert("Gagal meluluskan warga belajar: " + (data.message || ""));
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan sistem atau koneksi saat meluluskan warga belajar.");
    }
  };

  // Continue (Melanjutkan Program)
  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/students/${selectedStudent.id}/continue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          program: newProgram,
          kelas: newKelas,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Program belajar berhasil diperbarui!");
        setContinueOpen(false);
        setFormOpen(false);
        fetchStudents();
      } else {
        alert("Gagal memproses kelanjutan program: " + (data.message || ""));
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan sistem atau koneksi saat memproses kelanjutan program.");
    }
  };

  // Filtered students based on search criteria
  const filteredStudents = students.filter((student) => {
    const matchesName = 
      !filterName || student.nama.toLowerCase().includes(filterName.toLowerCase());
    const matchesNik = 
      !filterNik || student.nik.includes(filterNik);
    const matchesKelas = 
      !filterKelas || student.kelas.toLowerCase().includes(filterKelas.toLowerCase());
    const matchesProgram = 
      !filterProgram || student.program.toLowerCase().includes(filterProgram.toLowerCase());
    return matchesName && matchesNik && matchesKelas && matchesProgram;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div className="space-y-1 text-left">
          <h1 className="text-2xl font-black text-[#1a0b70] uppercase flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[#9c27b0]" /> Manajemen Warga Belajar
          </h1>
          <p className="text-slate-500 text-xs font-semibold">
            Kelola warga belajar (siswa), kelas, kenaikan tingkat kelas, status kelulusan, dan penugasan program.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <input
            type="file"
            ref={importInputRef}
            className="hidden"
            accept=".csv"
            onChange={handleImportCSV}
          />
          <Button
            onClick={() => importInputRef.current?.click()}
            className="rounded-xl bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-[10px] px-4 h-11 cursor-pointer transition-all shadow-md flex items-center gap-1.5 active:scale-95"
          >
            <Upload className="h-4 w-4" /> UPLOAD CSV
          </Button>
          <Button
            onClick={handleExportCSV}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-4 h-11 cursor-pointer transition-all shadow-md flex items-center gap-1.5 active:scale-95"
          >
            <Download className="h-4 w-4" /> DOWNLOAD CSV
          </Button>
          <Button
            onClick={openAddForm}
            className="rounded-xl bg-[#9c27b0] hover:bg-[#ff6105] text-white font-extrabold text-xs px-5 h-11 cursor-pointer transition-all shadow-md flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> TAMBAH WB
          </Button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="CARI BERDASARKAN NAMA"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs font-bold border border-slate-200 rounded-xl bg-white text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 uppercase"
            />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="CARI BERDASARKAN NIK"
              value={searchNik}
              onChange={(e) => setSearchNik(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs font-bold border border-slate-200 rounded-xl bg-white text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="CARI BERDASARKAN KELAS"
              value={searchKelas}
              onChange={(e) => setSearchKelas(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs font-bold border border-slate-200 rounded-xl bg-white text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="CARI BERDASARKAN PROGRAM"
              value={searchProgram}
              onChange={(e) => setSearchProgram(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs font-bold border border-slate-200 rounded-xl bg-white text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div className="flex gap-2 md:col-span-4 justify-end">
            <Button
              onClick={handleSearch}
              className="w-32 h-10 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs cursor-pointer tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all uppercase"
            >
              <Filter className="h-4 w-4" /> FILTER
            </Button>
            <Button
              onClick={handleReset}
              className="w-32 h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs cursor-pointer tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all uppercase"
            >
              <RotateCcw className="h-4 w-4" /> RESET
            </Button>
          </div>
        </div>
      </div>

      {/* Grid Cards and Layout View */}
      <div className="space-y-6">
        {/* Warga Belajar List/Grid Card */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-4">
              <h3 className="font-black text-slate-500 uppercase text-xs tracking-widest">
                Daftar Warga Belajar ({filteredStudents.length})
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
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#9c27b0] border-t-transparent" />
                <span className="text-xs font-extrabold text-[#9c27b0] uppercase tracking-widest">Memuat warga belajar...</span>
              </div>
            ) : filteredStudents.length > 0 ? (
              viewMode === "cards" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => openEditForm(student)}
                      className="bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-purple-300 transition flex flex-col group cursor-pointer hover:shadow-md"
                    >
                      {/* Photo Frame with Program badge overlay */}
                      <div className="h-44 bg-slate-50 relative overflow-hidden">
                        {student.foto ? (
                          <img
                            src={student.foto}
                            alt={student.nama}
                            className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 font-black text-xs bg-slate-100">
                            FOTO
                          </div>
                        )}
                        {/* Purple Program Overlay Tag */}
                        <div className="absolute top-3 left-3 z-10 max-w-[90%]">
                          <span className="inline-block bg-[#9c27b0] text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase shadow-md tracking-wider truncate">
                            {student.program}
                          </span>
                        </div>
                      </div>

                      {/* Name info */}
                      <div className="p-4 flex-1 space-y-1 bg-white">
                        <h4 className="font-black text-[#280f91] text-xs group-hover:text-[#9c27b0] transition truncate uppercase">
                          {student.nama}
                        </h4>
                        <p className="text-slate-500 text-[10px] font-semibold uppercase">
                          NISN: {student.nisn || "-"}
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
                        <th className="p-4 border-r border-[#009cb9] w-48 text-center">NIK</th>
                        <th className="p-4 border-r border-[#009cb9] w-36 text-center">Program</th>
                        <th className="p-4 border-r border-[#009cb9] w-24 text-center">Kelas</th>
                        <th className="p-4 border-r border-[#009cb9] w-36 text-center">NISN</th>
                        <th className="p-4 border-r border-[#009cb9] w-36 text-center">NIS</th>
                        <th className="p-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {filteredStudents.map((student, idx) => (
                        <tr
                          key={student.id}
                          onClick={() => openEditForm(student)}
                          className="hover:bg-cyan-50/20 cursor-pointer transition"
                        >
                          <td className="p-4 text-center text-slate-500 font-mono border-r border-slate-100">{idx + 1}</td>
                          <td className="p-4 font-bold text-slate-800 border-r border-slate-100">{student.nama}</td>
                          <td className="p-4 text-center text-slate-600 font-mono border-r border-slate-100">{student.nik || "-"}</td>
                          <td className="p-4 text-center border-r border-slate-100 font-bold text-purple-700">{student.program}</td>
                          <td className="p-4 text-center border-r border-slate-100">{student.kelas}</td>
                          <td className="p-4 text-center border-r border-slate-100 font-mono">{student.nisn || "-"}</td>
                          <td className="p-4 text-center border-r border-slate-100 font-mono">{student.nis || "-"}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-block text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase text-white ${
                              student.status === "LULUS" ? "bg-purple-600" : "bg-emerald-600"
                            }`}>
                              {student.status || "AKTIF"}
                            </span>
                          </td>
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
                <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">Warga Belajar Tidak Ditemukan</h3>
                <p className="text-slate-500 font-bold text-xs">
                  Belum ada data warga belajar yang sesuai dengan filter pencarian.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* COMPREHENSIVE DETAIL / EDIT DIALOG FORM */}
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
                  {isAdding ? "Tambah Warga Belajar Baru" : `Profil / Edit Warga Belajar: ${selectedStudent?.nama}`}
                </span>
              </div>

              {/* Special Actions Menu for Promoting / Graduating / Continuing */}
              {!isAdding && selectedStudent && (
                <div className="bg-white/10 p-4 rounded-2xl border border-white/10 flex flex-wrap gap-2.5 items-center justify-between mb-4 text-xs font-bold text-white">
                  <div>
                    Menu Aksi Tingkat Kelas & Program Belajar:
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => handlePromote(selectedStudent.id)}
                      className="rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-[10px] px-3.5 h-9 flex items-center gap-1.5 shadow-sm cursor-pointer"
                      disabled={selectedStudent.status === "LULUS"}
                    >
                      <ArrowUpCircle className="h-3.5 w-3.5" /> NAIKKAN KELAS
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setContinueOpen(true)}
                      className="rounded-xl bg-[#ffb300] hover:bg-amber-600 text-white font-extrabold text-[10px] px-3.5 h-9 flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> MELANJUTKAN PROGRAM
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleGraduate(selectedStudent.id)}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-3.5 h-9 flex items-center gap-1.5 shadow-sm cursor-pointer"
                      disabled={selectedStudent.status === "LULUS"}
                    >
                      <GraduationCap className="h-3.5 w-3.5" /> LULUSKAN
                    </Button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSave} className="py-4 space-y-6 text-slate-800">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  
                  {/* LEFT 3 COLS: FORM INPUT PANEL */}
                  <div className="lg:col-span-3 space-y-4">
                    
                    {/* NAMA */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">NAMA</label>
                      <input
                        type="text"
                        required
                        placeholder="Nama lengkap warga belajar"
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
                        placeholder="Nomor Induk Kependudukan (16 digit)"
                        value={formData.nik || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, nik: e.target.value }))}
                        className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* PROGRAM */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">PROGRAM</label>
                      <select
                        value={formData.program || "PAKET C"}
                        onChange={(e) => setFormData(prev => ({ ...prev, program: e.target.value }))}
                        className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 transition-colors"
                      >
                        <option value="PAKET A">PAKET A</option>
                        <option value="PAKET B">PAKET B</option>
                        <option value="PAKET C">PAKET C</option>
                      </select>
                    </div>

                    {/* KELAS */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">KELAS</label>
                      <input
                        type="text"
                        placeholder="Contoh: KELAS X (SEPULUH) / KELAS VII"
                        value={formData.kelas || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, kelas: e.target.value }))}
                        className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* NISN */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">NISN</label>
                      <input
                        type="text"
                        placeholder="Nomor Induk Siswa Nasional"
                        value={formData.nisn || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, nisn: e.target.value }))}
                        className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* NIS */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">NIS</label>
                      <input
                        type="text"
                        placeholder="Nomor Induk Siswa"
                        value={formData.nis || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, nis: e.target.value }))}
                        className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* TEMPAT, TGL. LAHIR */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">TEMPAT, TGL. LAHIR</label>
                      <input
                        type="text"
                        placeholder="Contoh: Ciamis, 05-02-2008"
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
                        placeholder="Agama"
                        value={formData.agama || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, agama: e.target.value }))}
                        className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-850 placeholder-slate-400 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* EMAIL */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">EMAIL</label>
                      <input
                        type="email"
                        placeholder="Alamat email warga belajar"
                        value={formData.email || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-850 placeholder-slate-400 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* ALAMAT */}
                    <div className="flex flex-col md:flex-row md:items-start gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0 md:pt-2">ALAMAT</label>
                      <textarea
                        placeholder="Alamat tempat tinggal lengkap warga belajar"
                        value={formData.alamat || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, alamat: e.target.value }))}
                        className="flex-1 p-2.5 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 resize-none transition-colors"
                        rows={2}
                      />
                    </div>

                    {/* TITIK LAYANAN */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">TITIK LAYANAN</label>
                      <input
                        type="text"
                        placeholder="Titik layanan belajar"
                        value={formData.titikLayanan || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, titikLayanan: e.target.value }))}
                        className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* NO. HP */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">NO. HP</label>
                      <input
                        type="text"
                        placeholder="Nomor Handphone aktif"
                        value={formData.noHp || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, noHp: e.target.value }))}
                        className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* NAMA AYAH */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">NAMA AYAH</label>
                      <input
                        type="text"
                        placeholder="Nama lengkap ayah kandung"
                        value={formData.namaAyah || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, namaAyah: e.target.value }))}
                        className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* NAMA IBU */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">NAMA IBU</label>
                      <input
                        type="text"
                        placeholder="Nama lengkap ibu kandung"
                        value={formData.namaIbu || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, namaIbu: e.target.value }))}
                        className="flex-1 h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                      />
                    </div>

                    {/* PASSWORD */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                      <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-72 shrink-0">
                        PASSWORD AKUN LOGIN {!isAdding && "(KOSONGKAN JIKA TIDAK INGIN MENGUBAH)"}
                      </label>
                      <div className="flex-1 relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder={isAdding ? "Buat password login warga belajar" : "Masukkan password baru jika ingin diubah"}
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

                  {/* RIGHT 1 COL: Drag & Drop Photo + Additional Status info */}
                  <div className="lg:col-span-1 flex flex-col items-center gap-6">
                    
                    {/* PHOTO UPLOADER */}
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black text-cyan-50 uppercase tracking-wider block">FOTO PROFIL WB</label>
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
                              alt="Student Preview"
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
                      <input
                        type="text"
                        placeholder="Masukkan URL foto..."
                        value={formData.foto || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, foto: e.target.value }))}
                        className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white text-slate-800 mt-2"
                      />
                    </div>

                    {/* Additional Info / Status */}
                    <div className="bg-white/10 p-4 rounded-2xl border border-white/10 space-y-3.5 text-left text-white">
                      <span className="block text-[10px] font-black text-yellow-300 tracking-wider uppercase border-b border-white/20 pb-1.5">Info Akademik & Status</span>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-cyan-100 uppercase">STATUS WARGA BELAJAR</label>
                        <select
                          value={formData.status || "AKTIF"}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full h-8 px-2 text-[11px] border-0 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400 font-bold bg-white text-slate-800"
                        >
                          <option value="AKTIF">AKTIF</option>
                          <option value="LULUS">LULUS (ALUMNI)</option>
                        </select>
                      </div>

                      <div className="text-[9px] text-cyan-100/85 leading-relaxed font-semibold pt-1 border-t border-white/15 space-y-1">
                        <span className="block font-black text-[9px] text-yellow-300 uppercase tracking-wide">Catatan Penting:</span>
                        <p>NIK, No. HP, dan Password hanya dapat dilihat di Admin Panel ini.</p>
                        <p>Status LULUS otomatis menyembunyikan warga belajar dari halaman publik sekolah.</p>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Footer buttons */}
                <div className="border-t border-white/20 pt-4 flex items-center justify-end gap-3">
                  {!isAdding && selectedStudent && (
                    <Button
                      type="button"
                      onClick={() => handleDelete(selectedStudent.id)}
                      className="bg-rose-600 hover:bg-rose-700 text-white border-0 font-extrabold text-sm px-6 h-11 rounded-full cursor-pointer shadow-md shadow-rose-900/30 uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Trash2 className="h-4 w-4" /> HAPUS
                    </Button>
                  )}
                  <Button
                    type="submit"
                    className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-sm px-8 h-11 rounded-full cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Save className="h-4 w-4" /> SIMPAN
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CONTINUATION DIALOG FORM */}
      {continueOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setContinueOpen(false)} />

          {/* Container */}
          <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 border-4 border-cyan-400 z-10">
            {/* Column Header */}
            <div className="bg-[#00badb] p-6 relative text-white text-left">
              {/* Close Button */}
              <button
                onClick={() => setContinueOpen(false)}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-4">
                <span className="inline-block bg-[#9c27b0] text-white font-extrabold text-[11px] px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                  Melanjutkan Program Belajar
                </span>
              </div>

              <form onSubmit={handleContinue} className="space-y-4 text-slate-800">
                <p className="text-xs font-semibold text-white/80 leading-normal">
                  Pindahkan warga belajar ini ke program yang lebih tinggi (contoh: Lulus Paket B lalu melanjutkan ke Paket C).
                </p>

                <div className="space-y-3.5 text-white">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-cyan-50 uppercase">PROGRAM BARU</label>
                    <select
                      value={newProgram}
                      onChange={(e) => {
                        setNewProgram(e.target.value);
                        if (e.target.value === "PAKET C") setNewKelas("KELAS X (SEPULUH)");
                        else if (e.target.value === "PAKET B") setNewKelas("KELAS VII (TUJUH)");
                        else setNewKelas("KELAS I (SATU)");
                      }}
                      className="w-full h-11 px-4 text-xs border border-transparent rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white text-slate-800 font-bold"
                    >
                      <option value="PAKET B">PAKET B (Setara SMP)</option>
                      <option value="PAKET C">PAKET C (Setara SMA)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-cyan-50 uppercase">KELAS TUJUAN</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: KELAS X (SEPULUH)"
                      value={newKelas}
                      onChange={(e) => setNewKelas(e.target.value)}
                      className="w-full h-11 px-4 text-xs border border-transparent rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white text-slate-800 font-semibold"
                    />
                  </div>
                </div>

                <div className="border-t border-white/20 pt-4 flex justify-end gap-2 mt-4">
                  <Button
                    type="submit"
                    className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-sm px-6 h-11 rounded-full cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    Pindahkan Program
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
