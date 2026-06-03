import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Search, Upload, Sparkles, Plus, Trash2, Save, X, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";

interface Tutor {
  id: number;
  nama: string;
  tutorMapel: string;
  program: string;
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
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);

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

  const openAddForm = () => {
    setIsAdding(true);
    setSelectedTutor(null);
    setFormData({
      nama: "",
      tutorMapel: "",
      program: "",
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
      if (data.success && data.filePath) {
        setFormData((prev) => ({ ...prev, foto: data.filePath }));
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

  // Save Tutor
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.tutorMapel) {
      alert("Nama dan Tutor Mapel wajib diisi!");
      return;
    }

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
        setFormOpen(false);
        fetchTutors();
      } else {
        alert("Gagal menyimpan data: " + (data.message || "Error tidak diketahui"));
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan sistem saat menyimpan");
    }
  };

  // Delete Tutor
  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data tutor ini?")) return;

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
        setFormOpen(false);
        fetchTutors();
      } else {
        alert("Gagal menghapus data: " + (data.message || "Error tidak diketahui"));
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan sistem saat menghapus");
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
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div className="space-y-1 text-left">
          <h1 className="text-2xl font-black text-[#1a0b70] uppercase flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[#9c27b0]" /> Manajemen Tutor
          </h1>
          <p className="text-slate-500 text-xs font-semibold">
            Kelola tenaga pendidik, bidang keahlian, tugas mengajar, NIK, dan kredensial tutor.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={openAddForm}
            className="rounded-xl bg-[#9c27b0] hover:bg-[#ff6105] text-white font-extrabold text-xs px-5 h-11 cursor-pointer transition-all shadow-md flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> TAMBAH TUTOR
          </Button>
        </div>
      </div>

      {/* FILTER & SEARCH PANEL (Matches Mockup 2 style buttons) */}
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

          <div className="flex gap-2 col-span-1 sm:col-span-2">
            <Button
              onClick={handleSearch}
              className="flex-1 h-11 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs cursor-pointer tracking-wider"
            >
              FILTER
            </Button>
            <Button
              onClick={handleReset}
              className="flex-1 h-11 rounded-xl bg-purple-650 hover:bg-purple-700 text-white font-black text-xs cursor-pointer tracking-wider"
            >
              RESET
            </Button>
          </div>
        </div>
      </div>

      {/* TUTORS GRID (Mockup 2 layout of tutor cards) */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3 bg-white rounded-3xl border border-slate-100">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#9c27b0] border-t-transparent" />
          <span className="text-xs font-extrabold text-[#9c27b0] uppercase tracking-widest">Memuat data tutor...</span>
        </div>
      ) : filteredTutors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {filteredTutors.map((tutor) => (
            <div
              key={tutor.id}
              className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 border border-slate-100 transition-all p-4 flex flex-col justify-between"
            >
              {/* Photo Frame with purple subject badge overlay */}
              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-slate-100 mb-4 border border-slate-150">
                {tutor.foto ? (
                  <img
                    src={tutor.foto}
                    alt={tutor.nama}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-200 text-slate-300">
                    {/* Default Silhouette icon */}
                    <svg className="w-24 h-24 mt-4 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
                {/* Purple Subject Overlay Tag */}
                <div className="absolute top-3 left-3 z-10 max-w-[90%]">
                  <span className="inline-block bg-[#9c27b0] text-white font-extrabold text-[9px] px-3.5 py-1.5 rounded-full uppercase shadow-md tracking-wider truncate">
                    {tutor.tutorMapel}
                  </span>
                </div>
              </div>

              {/* Name and Detail Profil button */}
              <div className="space-y-3.5 text-center">
                <h3 className="text-sm font-black text-slate-800 leading-tight uppercase line-clamp-1 px-1">
                  {tutor.nama}
                </h3>
                
                <Button
                  onClick={() => openEditForm(tutor)}
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
          <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">Tutor Tidak Ditemukan</h3>
          <p className="text-slate-500 font-bold text-xs">
            Belum ada data tutor yang sesuai dengan filter pencarian.
          </p>
        </div>
      )}

      {/* FORM DIALOG: ADD/EDIT TUTOR & VIEW DETAIL PROFIL (Mockup 2 Tampilan Tambah Tutor) */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-4xl bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl text-left overflow-y-auto max-h-[90vh]">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-lg font-black text-[#1a0b70] uppercase flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#9c27b0]" /> 
              {isAdding ? "Tambah Tutor Baru" : `Detail Profil / Edit Tutor: ${selectedTutor?.nama}`}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="py-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* LEFT & CENTER COLS: inputs list (Matches mockup 2 fields) */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">NAMA</label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan nama lengkap tutor"
                    value={formData.nama || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">TUTOR MAPEL</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Tutor Ekonomi / Tutor PJOK"
                    value={formData.tutorMapel || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, tutorMapel: e.target.value }))}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">PROGRAM (TUGAS)</label>
                  <input
                    type="text"
                    placeholder="Contoh: PAKET B / PAKET C"
                    value={formData.program || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, program: e.target.value }))}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">NUPTK</label>
                  <input
                    type="text"
                    placeholder="Masukkan 16 digit NUPTK (jika ada)"
                    value={formData.nuptk || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, nuptk: e.target.value }))}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">TEMPAT, TGL. LAHIR</label>
                  <input
                    type="text"
                    placeholder="Contoh: Ciamis, 15-08-1988"
                    value={formData.tempatTglLahir || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, tempatTglLahir: e.target.value }))}
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
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">AGAMA</label>
                  <input
                    type="text"
                    placeholder="Masukkan agama"
                    value={formData.agama || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, agama: e.target.value }))}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">PENDIDIKAN</label>
                  <input
                    type="text"
                    placeholder="Contoh: S1 Pendidikan Olahraga"
                    value={formData.pendidikan || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, pendidikan: e.target.value }))}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">EMAIL</label>
                  <input
                    type="email"
                    placeholder="Masukkan alamat email tutor"
                    value={formData.email || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">NIK</label>
                  <input
                    type="text"
                    placeholder="Masukkan 16 digit NIK tutor"
                    value={formData.nik || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, nik: e.target.value }))}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                  />
                </div>

                <div className="space-y-1.5 text-left sm:col-span-2">
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">ALAMAT</label>
                  <textarea
                    placeholder="Alamat tempat tinggal lengkap tutor"
                    value={formData.alamat || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, alamat: e.target.value }))}
                    className="w-full h-16 p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold"
                  />
                </div>

                <div className="space-y-1.5 text-left sm:col-span-2">
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider flex items-center justify-between">
                    <span>PASSWORD</span>
                    <span className="text-[9px] text-slate-400 font-normal normal-case">
                      {!isAdding && "(Kosongkan jika tidak ingin mengubah)"}
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder={isAdding ? "Buat password login tutor" : "Masukkan password baru jika ingin diubah"}
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

              {/* RIGHT COL: Drag & Drop Photo + Additional SK info */}
              <div className="space-y-5">
                
                {/* PHOTO UPLOADER (Mockup 2 area style) */}
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">FOTO TUTOR</label>
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
                        <Upload className="h-8 w-8 text-slate-450 mb-2" />
                        <p className="text-[10px] font-black text-[#1a0b70] uppercase tracking-wider">DRAG AND DROP A FILE</p>
                        <p className="text-[9px] text-slate-450 font-semibold uppercase mt-0.5">HERE OR CLICK</p>
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

                {/* Additional metadata info matching schema (Tanggal mulai tugas, SK Pengangkatan, SK Penugasan) */}
                <div className="bg-slate-55 p-4 rounded-2xl border border-slate-100 space-y-3.5 text-left">
                  <span className="block text-[10px] font-black text-[#9c27b0] tracking-wider uppercase border-b border-slate-200/60 pb-1.5">Info SK & Penugasan</span>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase">TGL MULAI TUGAS</label>
                    <input
                      type="text"
                      placeholder="Contoh: 2018-07-15"
                      value={formData.tanggalMulaiTugas || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, tanggalMulaiTugas: e.target.value }))}
                      className="w-full h-8 px-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400 font-semibold bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase">NOMOR SK PENGANGKATAN</label>
                    <input
                      type="text"
                      placeholder="Nomor SK Pengangkatan"
                      value={formData.nomorSkPengangkatan || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, nomorSkPengangkatan: e.target.value }))}
                      className="w-full h-8 px-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400 font-semibold bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase">LEMBAGA PENGANGKAT</label>
                    <input
                      type="text"
                      placeholder="Dinas Pendidikan / Yayasan"
                      value={formData.lembagaPengangkat || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, lembagaPengangkat: e.target.value }))}
                      className="w-full h-8 px-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400 font-semibold bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase">NOMOR SK PENUGASAN</label>
                    <input
                      type="text"
                      placeholder="Nomor SK Penugasan"
                      value={formData.nomorSkPenugasan || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, nomorSkPenugasan: e.target.value }))}
                      className="w-full h-8 px-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400 font-semibold bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase">LEMBAGA PENUGAS</label>
                    <input
                      type="text"
                      placeholder="Lembaga Penugas"
                      value={formData.lembagaPenugas || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, lembagaPenugas: e.target.value }))}
                      className="w-full h-8 px-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400 font-semibold bg-white"
                    />
                  </div>

                </div>

              </div>

            </div>

            {/* Dialog Footer with Action Buttons (Hapus, Edit, Simpan) */}
            <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                {!isAdding && selectedTutor && (
                  <Button
                    type="button"
                    onClick={() => handleDelete(selectedTutor.id)}
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

    </div>
  );
}
