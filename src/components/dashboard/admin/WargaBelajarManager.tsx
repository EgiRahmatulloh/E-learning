import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Search, Upload, Sparkles, Plus, Trash2, Save, X, Eye, EyeOff, GraduationCap, ArrowUpCircle, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";

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
        alert("Gagal memproses kelanjutan program");
      }
    } catch (e) {
      console.error(e);
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

        <div className="flex gap-2">
          <Button
            onClick={openAddForm}
            className="rounded-xl bg-[#9c27b0] hover:bg-[#ff6105] text-white font-extrabold text-xs px-5 h-11 cursor-pointer transition-all shadow-md flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> TAMBAH WB
          </Button>
        </div>
      </div>

      {/* FILTER & SEARCH PANEL (Matches Mockup 1 style buttons) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="CARI BERDASARKAN NAMA"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full h-11 pl-4 pr-10 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="CARI BERDASARKAN NIK"
              value={searchNik}
              onChange={(e) => setSearchNik(e.target.value)}
              className="w-full h-11 pl-4 pr-10 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="CARI BERDASARKAN KELAS"
              value={searchKelas}
              onChange={(e) => setSearchKelas(e.target.value)}
              className="w-full h-11 pl-4 pr-10 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="CARI BERDASARKAN PROGRAM"
              value={searchProgram}
              onChange={(e) => setSearchProgram(e.target.value)}
              className="w-full h-11 pl-4 pr-10 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
          </div>

          <div className="flex gap-2 md:col-span-4 justify-end">
            <Button
              onClick={handleSearch}
              className="w-32 h-11 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs cursor-pointer tracking-wider"
            >
              FILTER
            </Button>
            <Button
              onClick={handleReset}
              className="w-32 h-11 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs cursor-pointer tracking-wider"
            >
              RESET
            </Button>
          </div>
        </div>
      </div>

      {/* WARGA BELAJAR GRID (Mockup 1 style card layout) */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3 bg-white rounded-3xl border border-slate-100">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#9c27b0] border-t-transparent" />
          <span className="text-xs font-extrabold text-[#9c27b0] uppercase tracking-widest">Memuat warga belajar...</span>
        </div>
      ) : filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 border border-slate-100 transition-all p-4 flex flex-col justify-between"
            >
              {/* Photo Frame with Program badge overlay */}
              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-slate-100 mb-4 border border-slate-200">
                {student.foto ? (
                  <img
                    src={student.foto}
                    alt={student.nama}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-200 text-slate-350">
                    <svg className="w-24 h-24 mt-4 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
                {/* Program overlay tag (top-left) */}
                <div className="absolute top-3 left-3 z-10">
                  <span className={`inline-block text-white font-extrabold text-[9px] px-3.5 py-1.5 rounded-full uppercase shadow-md tracking-wider ${
                    student.program.includes("C") ? "bg-[#ffb300]" : student.program.includes("B") ? "bg-blue-650" : "bg-emerald-600"
                  }`}>
                    {student.program}
                  </span>
                </div>

                {/* Status overlay tag if Lulus */}
                {student.status === "LULUS" && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="inline-block bg-purple-700 text-white font-extrabold text-[9px] px-3 py-1 rounded-full uppercase tracking-wider shadow-md animate-bounce">
                      LULUS
                    </span>
                  </div>
                )}
              </div>

              {/* Name & Class in bright green overlay style, plus DETAIL button */}
              <div className="space-y-3.5 text-center">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-800 leading-tight uppercase line-clamp-1">
                    {student.nama}
                  </h3>
                  <p className="text-[#0ff60a] text-xs font-black uppercase">
                    {student.kelas}
                  </p>
                </div>

                <Button
                  onClick={() => openEditForm(student)}
                  className="w-full rounded-xl bg-[#9c27b0] hover:bg-[#ff6105] text-white font-extrabold text-[10px] uppercase py-2 h-9 cursor-pointer transition-all shadow-sm"
                >
                  DETAIL PROFIL
                </Button>
              </div>
            </div>
          ))}
        </div>
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

      {/* COMPREHENSIVE DETAIL / EDIT DIALOG FORM */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-4xl bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl text-left overflow-y-auto max-h-[90vh]">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-lg font-black text-[#1a0b70] uppercase flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#9c27b0]" /> 
              {isAdding ? "Tambah Warga Belajar Baru" : `Profil / Edit Warga Belajar: ${selectedStudent?.nama}`}
            </DialogTitle>
          </DialogHeader>

          {/* Special Actions Menu for Promoting / Graduating / Continuing */}
          {!isAdding && selectedStudent && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-wrap gap-2.5 items-center justify-between">
              <div className="text-xs font-bold text-slate-700">
                Menu Aksi Tingkat Kelas & Program Belajar:
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => handlePromote(selectedStudent.id)}
                  className="rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-[10px] px-3.5 h-9 flex items-center gap-1.5 shadow-sm"
                  disabled={selectedStudent.status === "LULUS"}
                >
                  <ArrowUpCircle className="h-3.5 w-3.5" /> NAIKKAN KELAS
                </Button>
                <Button
                  type="button"
                  onClick={() => setContinueOpen(true)}
                  className="rounded-xl bg-[#ffb300] hover:bg-amber-600 text-white font-extrabold text-[10px] px-3.5 h-9 flex items-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> MELANJUTKAN PROGRAM
                </Button>
                <Button
                  type="button"
                  onClick={() => handleGraduate(selectedStudent.id)}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-3.5 h-9 flex items-center gap-1.5 shadow-sm"
                  disabled={selectedStudent.status === "LULUS"}
                >
                  <GraduationCap className="h-3.5 w-3.5" /> LULUSKAN
                </Button>
              </div>
            </div>
          )}

          <form onSubmit={handleSave} className="py-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* LEFT & CENTER COLS */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">NAMA</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap warga belajar"
                    value={formData.nama || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">NIK</label>
                  <input
                    type="text"
                    placeholder="Nomor Induk Kependudukan (16 digit)"
                    value={formData.nik || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, nik: e.target.value }))}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">PROGRAM</label>
                  <select
                    value={formData.program || "PAKET C"}
                    onChange={(e) => setFormData(prev => ({ ...prev, program: e.target.value }))}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-bold bg-white"
                  >
                    <option value="PAKET A">PAKET A</option>
                    <option value="PAKET B">PAKET B</option>
                    <option value="PAKET C">PAKET C</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">KELAS</label>
                  <input
                    type="text"
                    placeholder="Contoh: KELAS X (SEPULUH) / KELAS VII"
                    value={formData.kelas || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, kelas: e.target.value }))}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">NISN</label>
                  <input
                    type="text"
                    placeholder="Nomor Induk Siswa Nasional"
                    value={formData.nisn || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, nisn: e.target.value }))}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">NIS</label>
                  <input
                    type="text"
                    placeholder="Nomor Induk Siswa"
                    value={formData.nis || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, nis: e.target.value }))}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">TEMPAT, TGL. LAHIR</label>
                  <input
                    type="text"
                    placeholder="Contoh: Ciamis, 05-02-2008"
                    value={formData.tempatTglLahir || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, tempatTglLahir: e.target.value }))}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">TITIK LAYANAN</label>
                  <input
                    type="text"
                    placeholder="Titik layanan belajar"
                    value={formData.titikLayanan || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, titikLayanan: e.target.value }))}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">JENIS KELAMIN</label>
                  <select
                    value={formData.jenisKelamin || "Laki-laki"}
                    onChange={(e) => setFormData(prev => ({ ...prev, jenisKelamin: e.target.value }))}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-bold bg-white"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">NO. HP</label>
                  <input
                    type="text"
                    placeholder="Nomor Handphone aktif"
                    value={formData.noHp || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, noHp: e.target.value }))}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">AGAMA</label>
                  <input
                    type="text"
                    placeholder="Agama"
                    value={formData.agama || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, agama: e.target.value }))}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">NAMA AYAH</label>
                  <input
                    type="text"
                    placeholder="Nama lengkap ayah kandung"
                    value={formData.namaAyah || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, namaAyah: e.target.value }))}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">EMAIL</label>
                  <input
                    type="email"
                    placeholder="Alamat email warga belajar"
                    value={formData.email || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">NAMA IBU</label>
                  <input
                    type="text"
                    placeholder="Nama lengkap ibu kandung"
                    value={formData.namaIbu || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, namaIbu: e.target.value }))}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                  />
                </div>

                <div className="space-y-1.5 text-left sm:col-span-2">
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">ALAMAT</label>
                  <textarea
                    placeholder="Alamat tempat tinggal lengkap warga belajar"
                    value={formData.alamat || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, alamat: e.target.value }))}
                    className="w-full h-16 p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                  />
                </div>

                <div className="space-y-1.5 text-left sm:col-span-2">
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider flex items-center justify-between">
                    <span>PASSWORD AKUN LOGIN</span>
                    <span className="text-[9px] text-slate-450 font-semibold italic">
                      {!isAdding && "(Kosongkan jika tidak ingin mengubah)"}
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder={isAdding ? "Buat password login warga belajar" : "Masukkan password baru jika ingin diubah"}
                      value={formData.password || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full h-10 pl-3 pr-10 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

              </div>

              {/* RIGHT COL: Drag & Drop Photo + Additional Status info */}
              <div className="space-y-5">
                
                {/* PHOTO UPLOADER */}
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">FOTO FOTO FOTO</label>
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all ${
                      dragActive ? "border-[#9c27b0] bg-purple-50/50" : "border-slate-200 bg-slate-50"
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
                        <Upload className="h-8 w-8 text-slate-400 mb-2" />
                        <p className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">DRAG AND DROP A FILE</p>
                        <p className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">HERE OR CLICK</p>
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
                </div>

                {/* Additional Info / Status */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3.5 text-left">
                  <span className="block text-[10px] font-black text-[#9c27b0] tracking-wider uppercase border-b border-slate-200/60 pb-1.5">Info & Status</span>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase">STATUS WARGA BELAJAR</label>
                    <select
                      value={formData.status || "AKTIF"}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full h-9 px-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400 font-bold bg-white"
                    >
                      <option value="AKTIF">AKTIF</option>
                      <option value="LULUS">LULUS (ALUMNI)</option>
                    </select>
                  </div>

                  <div className="text-[10px] text-slate-400 font-semibold leading-relaxed border-t border-slate-200/60 pt-3 space-y-1 bg-white/30 p-2.5 rounded-xl">
                    <span className="block font-black text-[9px] text-slate-500 uppercase tracking-wide">Catatan Penting:</span>
                    <p>NIK, No. HP, dan Password hanya dapat dilihat di Admin Panel ini.</p>
                    <p className="mt-1">Status LULUS otomatis menyembunyikan warga belajar dari halaman publik sekolah.</p>
                  </div>
                </div>

              </div>

            </div>

            {/* Dialog Footer with Action Buttons */}
            <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                {!isAdding && selectedStudent && (
                  <Button
                    type="button"
                    onClick={() => handleDelete(selectedStudent.id)}
                    className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold h-11 px-5 cursor-pointer shadow-md flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" /> HAPUS
                  </Button>
                )}
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="flex-1 sm:flex-none rounded-xl h-11 px-6 font-bold cursor-pointer">
                    Batal
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  className="flex-1 sm:flex-none rounded-xl bg-[#9c27b0] hover:bg-[#ff6105] text-white font-bold h-11 px-7 cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" /> SIMPAN
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* CONTINUATION DIALOG FORM */}
      <Dialog open={continueOpen} onOpenChange={setContinueOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl text-left">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-[#1a0b70] uppercase flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-[#ffb300]" /> Melanjutkan Program Belajar
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleContinue} className="space-y-4 py-4">
            <p className="text-xs font-semibold text-slate-500 leading-normal">
              Pindahkan warga belajar ini ke program yang lebih tinggi (contoh: Lulus Paket B lalu melanjutkan ke Paket C).
            </p>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#1a0b70] uppercase">PROGRAM BARU</label>
                <select
                  value={newProgram}
                  onChange={(e) => {
                    setNewProgram(e.target.value);
                    if (e.target.value === "PAKET C") setNewKelas("KELAS X (SEPULUH)");
                    else if (e.target.value === "PAKET B") setNewKelas("KELAS VII (TUJUH)");
                    else setNewKelas("KELAS I (SATU)");
                  }}
                  className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-bold bg-white"
                >
                  <option value="PAKET B">PAKET B (Setara SMP)</option>
                  <option value="PAKET C">PAKET C (Setara SMA)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#1a0b70] uppercase">KELAS TUJUAN</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: KELAS X (SEPULUH)"
                  value={newKelas}
                  onChange={(e) => setNewKelas(e.target.value)}
                  className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setContinueOpen(false)} className="rounded-xl h-11 px-5 font-bold cursor-pointer">
                Batal
              </Button>
              <Button type="submit" className="rounded-xl bg-[#ffb300] hover:bg-amber-600 text-white font-bold h-11 px-6 cursor-pointer shadow-md">
                Pindahkan Program
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
