import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { ShieldAlert, Award, Search } from "lucide-react";

interface Student {
  id: number;
  nama: string;
  program: string;
  kelas: string;
  nisn: string;
  nis: string;
  tempatTglLahir: string;
  titikLayanan: string;
  jenisKelamin: string;
  agama: string;
  namaAyah: string;
  email: string;
  namaIbu: string;
  alamat: string;
  foto: string;
  status: string;
}

interface WargaBelajarProps {
  onNavigate?: (path: string) => void;
}

export default function WargaBelajar(_props: WargaBelajarProps) {
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string | null>(null); // "PAKET A", "PAKET B", "PAKET C" or null

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetch("/api/students")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setStudentsList(data.data);
        }
      })
      .catch((err) => console.error("Failed to fetch students list:", err))
      .finally(() => setLoading(false));
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedProgramFilter]);

  // Filter students
  const filteredStudents = studentsList.filter((student) => {
    // Only display active or graduated students, but hide details based on search
    const matchesSearch = student.nama.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesProgram = true;
    if (selectedProgramFilter) {
      matchesProgram = student.program.toUpperCase() === selectedProgramFilter.toUpperCase();
    }

    return matchesSearch && matchesProgram;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <section id="warga-belajar" className="pt-6 pb-12 bg-white border-y border-slate-300 relative overflow-hidden min-h-[85vh]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">



        {/* Centered Title */}
        <div className="text-center max-w-4xl mx-auto space-y-4 mb-10">
          <span className="text-xs font-black uppercase tracking-widest text-[#280f91] bg-slate-200/60 rounded-full px-5 py-2 inline-block mb-2">WARGA BELAJAR</span>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-center leading-none drop-shadow-sm">
            <span className="text-[#280f91]">WARGA BELAJAR</span> <span className="text-[#ff6105]">PKBM MENUJU MAKMUR</span>
          </h2>
          <p className="text-slate-700 font-bold text-xs sm:text-sm leading-relaxed px-4 max-w-2xl mx-auto">
            Warga Belajar PKBM Menuju Makmur merupakan peserta didik yang bersemangat dalam menempuh pendidikan non-formal guna mencapai cita-cita, meningkatkan kompetensi, dan berkontribusi bagi masyarakat.
          </p>
        </div>

        {/* SEARCH & BADGE FILTERS */}
        <div className="max-w-4xl mx-auto mb-12 bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-purple-100/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Paket A, B, C Buttons */}
          <div className="flex gap-2.5 flex-wrap justify-center w-full md:w-auto">
            <button
              onClick={() => setSelectedProgramFilter(null)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wider transition-all uppercase cursor-pointer ${selectedProgramFilter === null
                  ? "bg-[#280f91] text-white shadow-md shadow-[#280f91]/20"
                  : "bg-slate-100 text-slate-655 hover:bg-slate-200"
                }`}
            >
              Semua Paket
            </button>
            <button
              onClick={() => setSelectedProgramFilter("PAKET A")}
              className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wider transition-all uppercase cursor-pointer ${selectedProgramFilter === "PAKET A"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "bg-slate-100 text-slate-655 hover:bg-slate-200"
                }`}
            >
              Paket A
            </button>
            <button
              onClick={() => setSelectedProgramFilter("PAKET B")}
              className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wider transition-all uppercase cursor-pointer ${selectedProgramFilter === "PAKET B"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-slate-100 text-slate-655 hover:bg-slate-200"
                }`}
            >
              Paket B
            </button>
            <button
              onClick={() => setSelectedProgramFilter("PAKET C")}
              className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wider transition-all uppercase cursor-pointer ${selectedProgramFilter === "PAKET C"
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                  : "bg-slate-100 text-slate-655 hover:bg-slate-200"
                }`}
            >
              Paket C
            </button>
          </div>

          {/* Name Search Box */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Cari nama warga belajar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-4 pr-10 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 text-slate-800 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
          </div>
        </div>

        {/* WARGA BELAJAR GRID (4-Column Grid) */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#9c27b0] border-t-transparent" />
            <span className="text-sm font-bold text-[#9c27b0] uppercase tracking-widest">Memuat data warga belajar...</span>
          </div>
        ) : currentStudents.length > 0 ? (
          <div className="space-y-12">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-7xl mx-auto">
              {currentStudents.map((student) => (
                <Dialog key={student.id}>
                  <DialogTrigger asChild>
                    <div
                      className="bg-white rounded-2xl overflow-hidden shadow-sm p-3 flex flex-col justify-between border border-slate-200 group hover:-translate-y-1.5 hover:shadow-md transition-all duration-300 cursor-pointer"
                    >
                      {/* Photo Frame */}
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 mb-3 border border-slate-100">
                        {student.foto ? (
                          <img
                            src={student.foto}
                            alt={student.nama}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-300">
                            <svg className="w-16 h-16 opacity-30" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                          </div>
                        )}

                        {/* Program overlay tag (top-left) */}
                        <div className="absolute top-2 left-2 z-10">
                          <span className={`inline-block text-white font-extrabold text-[7px] px-2 py-0.5 rounded-full uppercase shadow-md tracking-wider ${student.program.includes("C") ? "bg-[#ffb300]" : student.program.includes("B") ? "bg-blue-600" : "bg-emerald-600"
                            }`}>
                            {student.program}
                          </span>
                        </div>
                      </div>

                      <div className="text-center px-1 pb-1">
                        <h3 className="text-[10px] font-black text-[#280f91] uppercase tracking-tight line-clamp-1">
                          {student.nama}
                        </h3>
                        <p className="text-[8px] font-bold text-[#ff6105] uppercase tracking-wider line-clamp-1 mt-0.5">
                          {student.kelas}
                        </p>
                      </div>

                    </div>
                  </DialogTrigger>

                  {/* PUBLIC DETAIL DIALOG POP-UP (NIK, No. HP, Password Hidden) */}
                  <DialogContent className="sm:max-w-2xl bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl text-left overflow-y-auto max-h-[85vh]">
                    <DialogHeader className="border-b border-slate-100 pb-3">
                      <DialogTitle className="text-xl font-black text-[#280f91] uppercase flex items-center gap-2">
                        <Award className="h-5 w-5 text-[#ff6105]" /> Detail Warga Belajar
                      </DialogTitle>
                    </DialogHeader>

                    <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {/* Photo Column */}
                      <div className="sm:col-span-1 space-y-4">
                        <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
                          {student.foto ? (
                            <img
                              src={student.foto}
                              alt={student.nama}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                              No Photo
                            </div>
                          )}
                        </div>
                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center space-y-1">
                          <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Status Belajar</span>
                          <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-xs font-bold text-emerald-700 uppercase tracking-widest mt-1">
                            {student.status || "AKTIF"}
                          </span>
                        </div>
                      </div>

                      {/* Detail Fields Column (Public Fields Only) */}
                      <div className="sm:col-span-2 space-y-4 text-slate-700">
                        <div className="border-b border-slate-100 pb-2">
                          <h2 className="text-xl font-black text-[#280f91] uppercase leading-tight">{student.nama}</h2>
                          <span className="inline-block bg-orange-100 text-[#ff6105] font-extrabold text-[10px] px-3.5 py-1 rounded-full uppercase tracking-wider mt-1.5 shadow-xs">
                            {student.program} - {student.kelas}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-semibold text-xs leading-relaxed">
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">NISN</span>
                            <span className="text-slate-800 font-bold">{student.nisn || "-"}</span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">NIS</span>
                            <span className="text-slate-800 font-bold">{student.nis || "-"}</span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Tempat, Tgl Lahir</span>
                            <span className="text-slate-800 font-bold uppercase">{student.tempatTglLahir || "-"}</span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Jenis Kelamin</span>
                            <span className="text-slate-800 font-bold uppercase">{student.jenisKelamin || "-"}</span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Agama</span>
                            <span className="text-slate-800 font-bold uppercase">{student.agama || "-"}</span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Titik Layanan</span>
                            <span className="text-slate-800 font-bold uppercase">{student.titikLayanan || "-"}</span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Nama Ayah</span>
                            <span className="text-slate-800 font-bold uppercase">{student.namaAyah || "-"}</span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Nama Ibu</span>
                            <span className="text-slate-800 font-bold uppercase">{student.namaIbu || "-"}</span>
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Alamat Lengkap</span>
                            <span className="text-slate-800 font-bold leading-normal block uppercase">{student.alamat || "-"}</span>
                          </div>

                          {student.email && (
                            <div className="space-y-1 sm:col-span-2">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Email</span>
                              <span className="text-[#ff6105] font-bold text-[11px] block">{student.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="border-t border-slate-100 pt-4">
                      <DialogClose asChild>
                        <Button className="rounded-xl bg-[#280f91] hover:bg-[#ff6105] text-white font-bold h-11 px-6 w-full sm:w-auto cursor-pointer">
                          Tutup
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ))}
            </div>

            {/* CUSTOM PREMIUM PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl bg-white text-[#280f91] hover:bg-[#280f91] hover:text-white border border-slate-200 font-extrabold text-xs h-10 px-4 cursor-pointer disabled:opacity-50"
                >
                  Sebelumnya
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-10 w-10 rounded-xl text-xs font-black transition-all ${currentPage === page
                        ? "bg-[#280f91] text-white shadow-md shadow-[#280f91]/20"
                        : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                      }`}
                  >
                    {page}
                  </button>
                ))}

                <Button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl bg-white text-[#280f91] hover:bg-[#280f91] hover:text-white border border-slate-200 font-extrabold text-xs h-10 px-4 cursor-pointer disabled:opacity-50"
                >
                  Selanjutnya
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-xl">
            <div className="h-16 w-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldAlert className="h-8 w-8 text-purple-650" />
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider">Belum Ada Warga Belajar</h3>
            <p className="text-slate-500 font-bold text-xs">
              Data warga belajar saat ini belum tersedia atau tidak cocok dengan filter pencarian.
            </p>
          </div>
        )}

      </div>
    </section>
  );
}
