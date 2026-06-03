import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Plus, Trash2, Save, HelpCircle, Download, LayoutGrid, List } from "lucide-react";

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
  const [alumniList, setAlumniList] = useState<AlumniItem[]>([]);
  const [loading, setLoading] = useState(true);

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
          // Auto select first if exists
          if (data.data.length > 0 && !selectedId && !isAdding) {
            selectAlumni(data.data[0]);
          }
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
      } else {
        alert("Upload gagal: " + (data.message || "Error tidak diketahui"));
      }
    } catch (e) {
      console.error(e);
      alert("Error mengunggah foto");
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
        alert("Data alumni berhasil disimpan!");
        setIsAdding(false);
        fetchAlumni();
      } else {
        alert("Gagal menyimpan data: " + (data.message || "Error tidak diketahui"));
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan sistem saat menyimpan data alumni");
    }
  };

  const handleDelete = async () => {
    const idToDelete = selectedId;
    if (!idToDelete) return;
    if (!confirm("Apakah Anda yakin ingin menghapus data alumni ini?")) return;

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
        setSelectedId(null);
        startAddAlumni();
        fetchAlumni();
      } else {
        alert("Gagal menghapus alumni: " + (data.message || "Error tidak diketahui"));
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan saat menghapus data alumni");
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (alumniList.length === 0) return;
    const headers = ["Nama", "NIK", "Program", "Tahun Lulus", "NISN", "NIS", "Tempat Tgl Lahir", "No HP", "Nama Ayah", "Nama Ibu", "Jenis Kelamin", "Agama", "Email", "Alamat", "Cerita Sukses"];
    const csvContent = [
      headers.join(","),
      ...alumniList.map((item) =>
        [
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
        ].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `data-alumni-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
        if (lines.length <= 1) return;

        const token = localStorage.getItem("token");
        let successCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const columns = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.replace(/^"|"$/g, "").trim());
          if (columns.length < 4) continue;

          const payload = {
            nama: columns[0] || "",
            nik: columns[1] || "",
            program: columns[2] || "PAKET C",
            tahunLulus: columns[3] || "",
            nisn: columns[4] || "",
            nis: columns[5] || "",
            tempatTglLahir: columns[6] || "",
            noHp: columns[7] || "",
            namaAyah: columns[8] || "",
            namaIbu: columns[9] || "",
            jenisKelamin: columns[10] || "Laki-laki",
            agama: columns[11] || "Islam",
            email: columns[12] || "",
            alamat: columns[13] || "",
            cerita: columns[14] || "",
            foto: ""
          };

          try {
            const res = await fetch("/api/alumni", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) successCount++;
          } catch (err) {
            console.error("Import row failed:", err);
          }
        }

        alert(`Berhasil mengimpor ${successCount} data alumni!`);
        fetchAlumni();
      };
      reader.readAsText(file);
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
    <div className="bg-slate-50 min-h-screen text-slate-800 text-left p-2 sm:p-6">
      {/* Top Banner Control */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-cyan-950 uppercase tracking-tight">Manajemen Alumni</h2>
          <p className="text-slate-500 text-xs font-semibold mt-1">Kelola data lulusan pendidikan kesetaraan PKBM Menuju Makmur</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={startAddAlumni} className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl flex items-center gap-2">
            <Plus size={16} />
            Tambah Alumni
          </Button>

          <input
            type="file"
            ref={importInputRef}
            className="hidden"
            accept=".csv"
            onChange={handleImportCSV}
          />
          <Button onClick={() => importInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl flex items-center gap-2">
            <Upload size={16} />
            Upload CSV
          </Button>
          <Button onClick={handleExportCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl flex items-center gap-2">
            <Download size={16} />
            Download CSV
          </Button>
          <div className="border-l border-slate-200 pl-3 flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className={`rounded-xl h-9 w-9 p-0 ${viewMode === "cards" ? "bg-cyan-50 border-cyan-200 text-cyan-700" : ""}`}
              onClick={() => setViewMode("cards")}
            >
              <LayoutGrid size={16} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={`rounded-xl h-9 w-9 p-0 ${viewMode === "table" ? "bg-cyan-50 border-cyan-200 text-cyan-700" : ""}`}
              onClick={() => setViewMode("table")}
            >
              <List size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 mb-6">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Filter Pencarian Alumni</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cari Berdasarkan Nama</label>
            <input
              type="text"
              className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              placeholder="Ketik nama alumni..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cari Berdasarkan NIK</label>
            <input
              type="text"
              className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              placeholder="Masukkan NIK alumni..."
              value={searchNik}
              onChange={(e) => setSearchNik(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cari Berdasarkan Tahun</label>
            <input
              type="text"
              className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
              placeholder="Contoh: 2020"
              value={searchTahun}
              onChange={(e) => setSearchTahun(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cari Berdasarkan Program</label>
            <select
              className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
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
        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-50">
          <Button onClick={handleReset} variant="outline" className="rounded-xl text-xs font-bold text-slate-500 h-9 px-4">
            Reset
          </Button>
          <Button onClick={handleFilter} className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl h-9 px-5">
            Filter
          </Button>
        </div>
      </div>

      {/* Grid Cards and Layout View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Alumni List/Grid */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <h3 className="font-black text-cyan-950 uppercase text-sm tracking-wide">
              Daftar Alumni ({totalItems})
            </h3>
            <span className="text-xs text-slate-400 font-semibold">Klik salah satu untuk melihat detail & edit</span>
          </div>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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
                      <h4 className="font-black text-[#280f91] text-sm group-hover:text-purple-600 transition truncate">{item.nama}</h4>
                      <p className="text-slate-500 text-[11px] font-bold">Lulus Tahun {item.tahunLulus}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                    <th className="p-3 w-10 text-center">No</th>
                    <th className="p-3">Nama</th>
                    <th className="p-3">NIK</th>
                    <th className="p-3">Program</th>
                    <th className="p-3">Tahun Lulus</th>
                    <th className="p-3">No. HP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {currentItems.map((item, idx) => (
                    <tr
                      key={item.id}
                      onClick={() => selectAlumni(item)}
                      className={`hover:bg-slate-50/50 cursor-pointer transition font-medium ${
                        selectedId === item.id ? "bg-purple-50/70 font-semibold" : ""
                      }`}
                    >
                      <td className="p-3 text-center text-slate-400">{indexOfFirstItem + idx + 1}</td>
                      <td className="p-3 font-bold text-[#280f91]">{item.nama}</td>
                      <td className="p-3 font-mono text-slate-500">{item.nik}</td>
                      <td className="p-3">{item.program}</td>
                      <td className="p-3 text-emerald-600 font-bold">{item.tahunLulus}</td>
                      <td className="p-3 font-mono text-slate-500">{item.noHp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-400 font-semibold">
                Menampilkan <strong>{indexOfFirstItem + 1}</strong> - <strong>{Math.min(indexOfLastItem, totalItems)}</strong> dari <strong>{totalItems}</strong> alumni
              </span>
              <div className="flex items-center gap-1">
                <Button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-xs"
                >
                  Prev
                </Button>
                {Array.from({ length: totalPages }).map((_, pIdx) => (
                  <Button
                    key={pIdx}
                    onClick={() => setCurrentPage(pIdx + 1)}
                    variant={currentPage === pIdx + 1 ? "default" : "outline"}
                    size="sm"
                    className={`rounded-lg text-xs h-7 w-7 p-0 ${
                      currentPage === pIdx + 1 ? "bg-purple-600 text-white" : ""
                    }`}
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

        {/* Right Side: Detail Form */}
        <div className="lg:col-span-5 bg-[#00bcd4] rounded-3xl p-6 shadow-md text-white border border-cyan-400">
          <div className="pb-4 border-b border-white/20 mb-5">
            <h3 className="text-base font-black uppercase tracking-wide">
              {isAdding ? "Tambah Alumni Baru" : "Detail Profil Alumni"}
            </h3>
            <p className="text-cyan-100 text-[11px] font-semibold mt-1">Masukkan kredensial alumni secara lengkap dan valid</p>
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-slate-800">
            {/* Row 1: Nama & NIK */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-white/95 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                  placeholder="Contoh: Ageng LS Suhendi"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-white/95 mb-1">NIK (16 Digit)</label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                  placeholder="Contoh: 320712..."
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                />
              </div>
            </div>

            {/* Row 2: Program & Tahun Lulus */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-white/95 mb-1">Program Pendidikan</label>
                <select
                  className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                >
                  <option value="PAKET A">PAKET A (Setara SD)</option>
                  <option value="PAKET B">PAKET B (Setara SMP)</option>
                  <option value="PAKET C">PAKET C (Setara SMA)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-white/95 mb-1">Tahun Lulus</label>
                <input
                  type="text"
                  required
                  className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                  placeholder="Contoh: 2020"
                  value={tahunLulus}
                  onChange={(e) => setTahunLulus(e.target.value)}
                />
              </div>
            </div>

            {/* Row 3: NISN, NIS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-white/95 mb-1">NISN</label>
                <input
                  type="text"
                  required
                  className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                  placeholder="Masukkan NISN..."
                  value={nisn}
                  onChange={(e) => setNisn(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-white/95 mb-1">NIS</label>
                <input
                  type="text"
                  required
                  className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                  placeholder="Masukkan NIS..."
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                />
              </div>
            </div>

            {/* Row 4: Tempat, Tgl. Lahir & Jenis Kelamin */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-white/95 mb-1">Tempat, Tgl. Lahir</label>
                <input
                  type="text"
                  required
                  className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                  placeholder="Contoh: Ciamis, 15-08-2002"
                  value={tempatTglLahir}
                  onChange={(e) => setTempatTglLahir(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-white/95 mb-1">Jenis Kelamin</label>
                <select
                  className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
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
                <label className="block text-[10px] font-black uppercase text-white/95 mb-1">No. HP / WA</label>
                <input
                  type="text"
                  required
                  className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                  placeholder="Contoh: 0821..."
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-white/95 mb-1">Agama</label>
                <input
                  type="text"
                  required
                  className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                  placeholder="Contoh: Islam"
                  value={agama}
                  onChange={(e) => setAgama(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-white/95 mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                  placeholder="Contoh: aceng@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Row 6: Nama Ayah & Nama Ibu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-white/95 mb-1">Nama Ayah</label>
                <input
                  type="text"
                  required
                  className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                  placeholder="Nama ayah kandung..."
                  value={namaAyah}
                  onChange={(e) => setNamaAyah(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-white/95 mb-1">Nama Ibu</label>
                <input
                  type="text"
                  required
                  className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white"
                  placeholder="Nama ibu kandung..."
                  value={namaIbu}
                  onChange={(e) => setNamaIbu(e.target.value)}
                />
              </div>
            </div>

            {/* Row 7: Alamat */}
            <div>
              <label className="block text-[10px] font-black uppercase text-white/95 mb-1">Alamat Lengkap</label>
              <textarea
                required
                rows={2}
                className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white resize-none"
                placeholder="Tulis alamat rumah lengkap alumni..."
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
              />
            </div>

            {/* Row 8: Cerita Sukses */}
            <div>
              <label className="block text-[10px] font-black uppercase text-white/95 mb-1">Cerita Sukses Alumni</label>
              <textarea
                required
                rows={3}
                className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-white resize-none"
                placeholder="Bagikan cerita sukses, kesan pesan, atau kutipan motivasi dari alumni..."
                value={cerita}
                onChange={(e) => setCerita(e.target.value)}
              />
            </div>

            {/* Row 9: Foto Upload & URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-[10px] font-black uppercase text-white/95 mb-1">URL Foto Alumni</label>
                <input
                  type="text"
                  className="w-full text-xs font-semibold border border-transparent rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-purple-600 focus:outline-none bg-slate-50 text-slate-500"
                  placeholder="URL Foto..."
                  value={foto}
                  onChange={(e) => setFoto(e.target.value)}
                  readOnly
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-white/95 mb-1">Unggah Foto Fisik</label>
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
                  <span className="text-[10px] text-cyan-100 block mt-0.5">Mendukung format JPG, PNG, WEBP</span>
                </div>
              </div>
            </div>

            {/* Buttons Footer Form */}
            <div className="flex items-center justify-between pt-4 border-t border-white/20">
              <Button
                type="button"
                disabled={isAdding || !selectedId}
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs h-9 px-4 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} />
                Hapus
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={startAddAlumni}
                  className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold rounded-xl text-xs h-9 px-4 cursor-pointer"
                >
                  Tambah Baru
                </Button>
                <Button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs h-9 px-5 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save size={14} />
                  Simpan
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
