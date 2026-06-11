import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { parseCSV, downloadCSV, mapCsvRows, parseExcel } from "@/lib/utils";
import { Upload, Plus, Trash2, Save, HelpCircle, Download, LayoutGrid, List, Search, X, Loader2 } from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { toast } from "sonner";

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
  cerita: string;
  foto: string;
}

export default function AlumniManager() {
  const confirm = useConfirm();
  const [alumniList, setAlumniList] = useState<AlumniItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // View state (Cards or Table)
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Search & Filter States
  const [searchName, setSearchName] = useState("");
  const [searchNik, setSearchNik] = useState("");
  const [searchTahun, setSearchTahun] = useState("");
  const [searchProgram, setSearchProgram] = useState("");

  const [filterName, setFilterName] = useState("");
  const [filterNik, setFilterNik] = useState("");
  const [filterTahun, setFilterTahun] = useState("");
  const [filterProgram, setFilterProgram] = useState("");

  // Selected alumnus / Form state
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

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
  const [cerita, setCerita] = useState("");
  const [foto, setFoto] = useState("");

  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

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

  const handleFilter = () => {
    setFilterName(searchName);
    setFilterNik(searchNik);
    setFilterTahun(searchTahun);
    setFilterProgram(searchProgram);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchName("");
    setSearchNik("");
    setSearchTahun("");
    setSearchProgram("");
    setFilterName("");
    setFilterNik("");
    setFilterTahun("");
    setFilterProgram("");
    setCurrentPage(1);
  };

  const selectAlumni = (item: AlumniItem) => {
    setIsAdding(false);
    setSelectedId(item.id);
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
    setCerita(item.cerita);
    setFoto(item.foto);
    setIsFormOpen(true);
  };

  const startAddAlumni = () => {
    setIsAdding(true);
    setSelectedId(null);
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
    setCerita("");
    setFoto("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedId(null);
    setIsAdding(false);
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
        alert("Hanya file gambar yang diperbolehkan");
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
      noHp, namaAyah, namaIbu, jenisKelamin, agama, email, alamat, cerita, foto
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

  // CSV Export
  const handleExportCSV = () => {
    if (alumniList.length === 0) return;
    const headers = ["Nama", "NIK", "Program", "Tahun Lulus", "NISN", "NIS", "Tempat Tgl Lahir", "No HP", "Nama Ayah", "Nama Ibu", "Jenis Kelamin", "Agama", "Email", "Alamat", "Cerita Sukses"];
    const rows = alumniList.map((item) => [
      `"${item.nama.replace(/"/g, '""')}"`,
      `"${item.nik}"`,
      `"${item.program}"`,
      `"${item.tahunLulus}"`,
      `"${item.nisn}"`,
      `"${item.nis}"`,
      `"${item.tempatTglLahir.replace(/"/g, '""')}"`,
      `"${item.noHp}"`,
      `"${item.namaAyah.replace(/"/g, '""')}"`,
      `"${item.namaIbu.replace(/"/g, '""')}"`,
      `"${item.jenisKelamin}"`,
      `"${item.agama}"`,
      `"${item.email}"`,
      `"${item.alamat.replace(/"/g, '""')}"`,
      `"${item.cerita.replace(/"/g, '""')}"`
    ]);
    downloadCSV(headers, rows, `data-alumni-${Date.now()}.csv`);
  };

  // CSV/Excel Import
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        let rows: string[][] = [];
        if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
          rows = await parseExcel(file);
        } else {
          const text = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target?.result as string || "");
            reader.readAsText(file);
          });
          rows = parseCSV(text);
        }
        
        if (rows.length <= 1) return;

        const token = localStorage.getItem("token");
        
        const mapped = mapCsvRows(rows, [
          { key: "nama", aliases: ["nama", "name"], defaultIndex: 0 },
          { key: "nik", aliases: ["nik", "identitas"], defaultIndex: 1 },
          { key: "program", aliases: ["program", "paket", "kelas"], defaultIndex: 2 },
          { key: "tahunLulus", aliases: ["tahun lulus", "tahunlulus", "tahun", "graduated", "graduation"], defaultIndex: 3 },
          { key: "nisn", aliases: ["nisn"], defaultIndex: 4 },
          { key: "nis", aliases: ["nis"], defaultIndex: 5 },
          { key: "tempatTglLahir", aliases: ["tempat/tgl lahir", "tempat lahir", "tanggal lahir", "tempat tgllahir", "birth"], defaultIndex: 6 },
          { key: "noHp", aliases: ["no. hp", "no hp", "hp", "telepon", "phone"], defaultIndex: 7 },
          { key: "namaAyah", aliases: ["nama ayah", "ayah", "father"], defaultIndex: 8 },
          { key: "namaIbu", aliases: ["nama ibu", "ibu", "mother"], defaultIndex: 9 },
          { key: "jenisKelamin", aliases: ["jenis kelamin", "gender", "jk"], defaultIndex: 10 },
          { key: "agama", aliases: ["agama", "religion"], defaultIndex: 11 },
          { key: "email", aliases: ["email", "e-mail"], defaultIndex: 12 },
          { key: "alamat", aliases: ["alamat", "address"], defaultIndex: 13 },
          { key: "cerita", aliases: ["cerita", "story", "testimoni", "keterangan"], defaultIndex: 14 },
        ]);

        const imports = mapped
          .filter(item => item.nama)
          .map(item => ({
            nama: item.nama,
            nik: item.nik || "",
            program: item.program || "PAKET C",
            tahunLulus: item.tahunLulus || "",
            nisn: item.nisn || "",
            nis: item.nis || "",
            tempatTglLahir: item.tempatTglLahir || "",
            noHp: item.noHp || "",
            namaAyah: item.namaAyah || "",
            namaIbu: item.namaIbu || "",
            jenisKelamin: item.jenisKelamin || "Laki-laki",
            agama: item.agama || "Islam",
            email: item.email || "",
            alamat: item.alamat || "",
            cerita: item.cerita || "",
            foto: ""
          }));

        if (imports.length === 0) {
          alert("Tidak ada data valid untuk diimpor");
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
          alert(data.message || `Berhasil mengimpor ${imports.length} data alumni!`);
        } else {
          alert("Gagal mengimpor data alumni: " + (data.message || "Error tidak diketahui"));
        }
        fetchAlumni();
      } catch (err) {
        console.error("Import failed:", err);
        alert("Terjadi kesalahan saat mengimpor data alumni");
      }
    }
  };

  // Filtered List
  const filteredAlumni = alumniList.filter((item) => {
    const matchName = item.nama.toLowerCase().includes(filterName.toLowerCase());
    const matchNik = item.nik.includes(filterNik);
    const matchTahun = item.tahunLulus.includes(filterTahun);
    const matchProgram = filterProgram ? item.program === filterProgram : true;
    return matchName && matchNik && matchTahun && matchProgram;
  });

  // Pagination Logic
  const totalItems = filteredAlumni.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAlumni.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-6 pb-24 relative animate-in fade-in duration-300">
      
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
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            ref={importInputRef}
            className="hidden"
            accept=".csv, .xlsx, .xls"
            onChange={handleImportCSV}
          />
          <Button onClick={() => importInputRef.current?.click()} className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer tracking-wider flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-purple-200 uppercase">
            <Upload size={16} /> Upload CSV / Excel
          </Button>
          <Button onClick={handleExportCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer tracking-wider flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-emerald-200 uppercase">
            <Download size={16} /> Download CSV
          </Button>
          <Button onClick={startAddAlumni} className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer tracking-wider flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-purple-200 uppercase">
            <Plus className="h-4 w-4" /> TAMBAH DATA
          </Button>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Filter Pencarian Alumni</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              className="w-full h-10 pl-9 pr-4 text-xs border border-slate-200 rounded-xl bg-white font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
            />
          </div>
          <div>
            <select
              className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 font-bold bg-white text-slate-700 shadow-inner"
              value={searchProgram}
              onChange={(e) => setSearchProgram(e.target.value)}
            >
              <option value="">Semua Program</option>
              <option value="PAKET A">PAKET A (Setara SD)</option>
              <option value="PAKET B">PAKET B (Setara SMP)</option>
              <option value="PAKET C">PAKET C (Setara SMA)</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
          <Button onClick={handleReset} className="bg-slate-500 hover:bg-slate-650 text-white text-xs font-bold rounded-xl h-10 px-6 active:scale-95 transition-all">
            Reset
          </Button>
          <Button onClick={handleFilter} className="bg-[#00badb] hover:bg-[#009cb9] text-white text-xs font-bold rounded-xl h-10 px-6 active:scale-95 transition-all">
            Filter
          </Button>
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
                      className={`rounded-2xl overflow-hidden border-2 cursor-pointer transition flex flex-col group ${
                        isActive ? "border-purple-600 shadow-md ring-2 ring-purple-100" : "border-slate-100 hover:border-purple-300"
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
                        <span className={`absolute top-3 left-3 text-[9px] font-black uppercase px-2 py-0.5 rounded-full text-white ${
                          item.program === "PAKET A" ? "bg-green-600" : item.program === "PAKET B" ? "bg-blue-600" : "bg-orange-500"
                        }`}>
                          {item.program}
                        </span>
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
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-[#00badb] text-white font-black text-xs uppercase">
                      <th className="p-4 w-16 text-center border-r border-[#009cb9]">No</th>
                      <th className="p-4 border-r border-[#009cb9]">Nama</th>
                      <th className="p-4 border-r border-[#009cb9] w-48 text-center">Tahun Lulus</th>
                      <th className="p-4 border-r border-[#009cb9] w-48 text-center">Program</th>
                      <th className="p-4 border-r border-[#009cb9] w-36 text-center">NISN</th>
                      <th className="p-4 text-center">Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {currentItems.map((item, idx) => (
                      <tr
                        key={item.id}
                        onClick={() => selectAlumni(item)}
                        className={`hover:bg-cyan-50/20 cursor-pointer transition ${
                          selectedId === item.id ? "bg-purple-50/75 text-purple-900 font-bold" : ""
                        }`}
                      >
                        <td className="p-4 text-center text-slate-500 font-mono border-r border-slate-100">{indexOfFirstItem + idx + 1}</td>
                        <td className="p-4 font-bold text-slate-800 border-r border-slate-100">{item.nama}</td>
                        <td className="p-4 text-center border-r border-slate-100 font-bold text-purple-700">{item.tahunLulus}</td>
                        <td className="p-4 text-center border-r border-slate-100 font-mono">{item.program || "-"}</td>
                        <td className="p-4 text-center border-r border-slate-100 font-mono">{item.nisn || "-"}</td>
                        <td className="p-4 text-center text-slate-500 font-mono">{item.email || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-50 flex items-center justify-between mt-4">
                <span className="text-xs text-slate-400 font-bold uppercase">
                  Halaman {currentPage} dari {totalPages}
                </span>

                <div className="flex gap-1">
                  <Button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-xs"
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }, (_, pIdx) => (
                    <Button
                      key={pIdx}
                      onClick={() => setCurrentPage(pIdx + 1)}
                      variant={currentPage === pIdx + 1 ? "default" : "outline"}
                      size="sm"
                      className="rounded-lg text-xs"
                    >
                      {pIdx + 1}
                    </Button>
                  ))}
                  <Button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-xs"
                  >
                    Next
                  </Button>
                </div>
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
          <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-2xl animate-in zoom-in-95 duration-200 border-4 border-cyan-400 z-10 max-h-[90vh] flex flex-col">
            {/* Form Column (Cyan Background) */}
            <div className="bg-[#00badb] p-6 relative text-white flex-1 overflow-y-auto">
              {/* Close Button */}
              <button
                onClick={closeForm}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-6">
                <span className="inline-block bg-[#9c27b0] text-white font-extrabold text-[11px] px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                  {isAdding ? "TAMBAH ALUMNI BARU" : "EDIT PROFIL ALUMNI"}
                </span>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-slate-800">
                {/* Row 1: Nama & NIK */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-cyan-50 mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                      placeholder="Contoh: Ageng LS Suhendi"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-cyan-50 mb-1">NIK (16 Digit)</label>
                    <input
                      type="text"
                      required
                      maxLength={16}
                      className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                      placeholder="Contoh: 320712..."
                      value={nik}
                      onChange={(e) => setNik(e.target.value)}
                    />
                  </div>
                </div>

                {/* Row 2: Program & Tahun Lulus */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-cyan-50 mb-1">Program Pendidikan</label>
                    <select
                      className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                      value={program}
                      onChange={(e) => setProgram(e.target.value)}
                    >
                      <option value="PAKET A">PAKET A (Setara SD)</option>
                      <option value="PAKET B">PAKET B (Setara SMP)</option>
                      <option value="PAKET C">PAKET C (Setara SMA)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-cyan-50 mb-1">Tahun Lulus</label>
                    <input
                      type="text"
                      required
                      className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                      placeholder="Contoh: 2020"
                      value={tahunLulus}
                      onChange={(e) => setTahunLulus(e.target.value)}
                    />
                  </div>
                </div>

                {/* Row 3: NISN, NIS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-cyan-50 mb-1">NISN</label>
                    <input
                      type="text"
                      required
                      className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                      placeholder="Masukkan NISN..."
                      value={nisn}
                      onChange={(e) => setNisn(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-cyan-50 mb-1">NIS</label>
                    <input
                      type="text"
                      required
                      className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                      placeholder="Masukkan NIS..."
                      value={nis}
                      onChange={(e) => setNis(e.target.value)}
                    />
                  </div>
                </div>

                {/* Row 4: Tempat, Tgl. Lahir & Jenis Kelamin */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-cyan-50 mb-1">Tempat, Tgl. Lahir</label>
                    <input
                      type="text"
                      required
                      className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                      placeholder="Contoh: Ciamis, 15-08-2002"
                      value={tempatTglLahir}
                      onChange={(e) => setTempatTglLahir(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-cyan-50 mb-1">Jenis Kelamin</label>
                    <select
                      className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                      value={jenisKelamin}
                      onChange={(e) => setJenisKelamin(e.target.value)}
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                </div>

                {/* Row 5: No HP, Email, Agama */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-cyan-50 mb-1">No. HP / WA</label>
                    <input
                      type="text"
                      required
                      className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                      placeholder="Contoh: 0821..."
                      value={noHp}
                      onChange={(e) => setNoHp(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-cyan-50 mb-1">Agama</label>
                    <input
                      type="text"
                      required
                      className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                      placeholder="Contoh: Islam"
                      value={agama}
                      onChange={(e) => setAgama(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-cyan-50 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                      placeholder="Contoh: aceng@mail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Row 6: Nama Ayah & Nama Ibu */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-cyan-50 mb-1">Nama Ayah</label>
                    <input
                      type="text"
                      required
                      className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                      placeholder="Nama ayah kandung..."
                      value={namaAyah}
                      onChange={(e) => setNamaAyah(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-cyan-50 mb-1">Nama Ibu</label>
                    <input
                      type="text"
                      required
                      className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                      placeholder="Nama ibu kandung..."
                      value={namaIbu}
                      onChange={(e) => setNamaIbu(e.target.value)}
                    />
                  </div>
                </div>

                {/* Row 7: Alamat */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-cyan-50 mb-1">Alamat Lengkap</label>
                  <textarea
                    required
                    rows={2}
                    className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white resize-none"
                    placeholder="Tulis alamat rumah lengkap alumni..."
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                  />
                </div>

                {/* Row 8: Cerita Sukses */}
                <div>
                  <label className="block text-[10px] font-black uppercase text-cyan-50 mb-1">Cerita Sukses Alumni</label>
                  <textarea
                    required
                    rows={3}
                    className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white resize-none"
                    placeholder="Bagikan cerita sukses, kesan pesan, atau kutipan motivasi dari alumni..."
                    value={cerita}
                    onChange={(e) => setCerita(e.target.value)}
                  />
                </div>

                {/* Row 9: Foto Upload & URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-cyan-50 mb-1">URL Foto Alumni</label>
                    <input
                      type="text"
                      className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-slate-50 text-slate-500"
                      placeholder="URL Foto..."
                      value={foto}
                      onChange={(e) => setFoto(e.target.value)}
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-cyan-50 mb-1">Unggah Foto Fisik</label>
                    <p className="text-[10px] font-semibold text-white/60 mb-2">* Maksimal ukuran foto adalah 5MB.</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          await handleImageUpload(e.target.files[0]);
                        }
                      }}
                    />
                    <div
                      className={`border-2 border-dashed rounded-xl p-3 text-center transition cursor-pointer text-xs ${
                        dragActive ? "border-purple-600 bg-white/20" : "border-white/40 hover:border-white hover:bg-white/10"
                      }`}
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <span className="font-bold text-white block">
                        {uploading ? "Mengunggah..." : "Tarik Foto / Klik di sini"}
                      </span>
                      <span className="text-[10px] text-cyan-100 block mt-0.5">Mendukung format JPG, PNG, WEBP (Maksimal 5MB)</span>
                    </div>
                  </div>
                </div>

                {/* Buttons Footer Form */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/20">
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
                        <Save size={15} /> SIMPAN
                      </>
                    )}
                  </Button>
                  {selectedId && (
                    <Button
                      type="button"
                      disabled={saving}
                      onClick={handleDelete}
                      className="bg-rose-600 hover:bg-rose-700 text-white border-0 font-extrabold text-sm px-6 h-11 rounded-full cursor-pointer shadow-md shadow-rose-900/30 uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Trash2 size={15} /> HAPUS
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
