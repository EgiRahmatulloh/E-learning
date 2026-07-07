import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Settings, Plus, Save, Trash2, Edit, BookOpen, Users, Clock, AlertTriangle, Search, GraduationCap, X } from "lucide-react";
import { toast } from "sonner";
import { MASTER_MAPEL } from "./MasterMapel";

interface Tutor {
  id: number;
  nama: string;
}

interface ElearningItem {
  id: number;
  kelas: string;
  mapel: string;
  tutorId: number;
  skk: number;
  jumlahSesi: number;
  semester: string;
}

interface RombelData {
  id: number;
  nama: string;
}

// Mapping nama Indonesia untuk angka romawi
const ROMAN_TO_INDONESIAN: Record<string, string> = {
  "I": "Satu", "II": "Dua", "III": "Tiga", "IV": "Empat",
  "V": "Lima", "VI": "Enam", "VII": "Tujuh", "VIII": "Delapan",
  "IX": "Sembilan", "X": "Sepuluh", "XI": "Sebelas", "XII": "Dua Belas",
};

// Kelas berdasarkan angka romawi (level kelas)
interface KelasLevel {
  id: string;
  nama: string;
  namaIndonesia: string;
  rombels: RombelData[];
  program: string;
  image: string;
}

// Mapping program berdasarkan level kelas
const getProgramByLevel = (levelId: string): string => {
  const id = levelId.toUpperCase();
  if (["I", "II", "III", "IV", "V", "VI", "1", "2", "3", "4", "5", "6"].includes(id)) return "Paket A (Kelas I-VI)";
  if (["VII", "VIII", "IX", "7", "8", "9"].includes(id)) return "Paket B (Kelas VII-IX)";
  if (["X", "XI", "10", "11"].includes(id)) return "Paket C (Kelas X-XI)";
  if (["XII", "12"].includes(id)) return "Paket C (Kelas XII)";
  return "Paket A (Kelas I-VI)";
};

// Mapping foto berdasarkan program
const getImageByProgram = (program: string): string => {
  if (program.startsWith("Paket A")) return "/paket/paketA.jpg.jpeg";
  if (program.startsWith("Paket B")) return "/paket/paketB.jpg.jpeg";
  if (program.startsWith("Paket C")) return "/paket/paketC.jpg.jpeg";
  return "/paket/paketA.jpg.jpeg";
};

// Ekstrak level ID dari nama rombel
// "IVA" → "IV", "VA" → "V", "XIIA" → "XII", "X" → "X"
const extractLevelFromRombel = (namaRombel: string): string => {
  const nama = namaRombel.toUpperCase();
  // Jika huruf terakhir adalah A-Z tunggal (suffix rombel), buang itu
  if (nama.length > 1 && /^[A-Z]$/.test(nama.slice(-1))) {
    return nama.slice(0, -1);
  }
  return nama;
};

export default function KelolaElearning() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [rombels, setRombels] = useState<RombelData[]>([]);
  const [items, setItems] = useState<ElearningItem[]>([]);
  // Simpan hanya id level yang dipilih; objek level-nya diturunkan dari kelasLevels
  // agar selalu memakai daftar rombel terbaru (tidak stale saat rombels async berubah).
  const [selectedKelasId, setSelectedKelasId] = useState<string | null>(null);

  // Semester State - default otomatis berdasarkan bulan saat ini
  const [selectedSemester, setSelectedSemester] = useState<"Ganjil" | "Genap">(() => {
    const bulan = new Date().getMonth() + 1;
    return bulan >= 6 ? "Ganjil" : "Genap";
  });

  // Form State
  const [formData, setFormData] = useState({
    id: "",
    mapel: "",
    tutorId: "",
    skk: "",
    sesiCount: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  // Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  // Guard agar auto-sync tidak berjalan konkuren (mencegah POST setup duplikat)
  const isSyncingRef = useRef(false);

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Search untuk Daftar Kelas
  const [kelasSearch, setKelasSearch] = useState("");

  const fetchSetups = async () => {
    try {
      const res = await fetch(`/api/elearning/setups?semester=${selectedSemester}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setItems(data.data);
      }
    } catch (err) {
      console.error("Failed to load elearning setups:", err);
    }
  };

  useEffect(() => {
    // Load tutors
    fetch("/api/tutors", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setTutors(data.data);
        }
      })
      .catch((err) => console.error("Failed to load tutors:", err));

    // Load rombels
    fetch("/api/rombels", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const rombelList = data.data.map((r: any) => ({
            id: r.id,
            nama: r.nama
          }));
          setRombels(rombelList);
        }
      })
      .catch((err) => console.log("Rombel API not available yet.", err));

    fetchSetups();
  }, [selectedSemester]);

  // Auto-sync: kalau ada rombel baru yang belum punya setup, copy dari rombel lain dalam level yang sama
  useEffect(() => {
    if (rombels.length === 0 || items.length === 0) return;
    if (isSyncingRef.current) return;

    const syncNewRombels = async () => {
      isSyncingRef.current = true;
      let synced = 0;

      try {
      // Bangun level secara dinamis dari rombel
      const levelMap = new Map<string, RombelData[]>();
      for (const rombel of rombels) {
        const levelId = extractLevelFromRombel(rombel.nama);
        if (!levelMap.has(levelId)) levelMap.set(levelId, []);
        levelMap.get(levelId)!.push(rombel);
      }

      for (const [, levelRombels] of levelMap) {
        if (levelRombels.length < 2) continue;

        // Kumpulkan semua mapel yang ada di level ini (deduplicated)
        const mapelSetups = new Map<string, ElearningItem[]>();
        for (const item of items) {
          const belongToLevel = levelRombels.some(r => r.nama.toUpperCase() === item.kelas.toUpperCase());
          if (belongToLevel) {
            if (!mapelSetups.has(item.mapel)) mapelSetups.set(item.mapel, []);
            mapelSetups.get(item.mapel)!.push(item);
          }
        }

        // Untuk setiap mapel, cek apakah semua rombel sudah punya setup
        for (const [, setups] of mapelSetups) {
          const rombelsWithSetup = new Set(setups.map(s => s.kelas.toUpperCase()));
          const missingRombels = levelRombels.filter(r => !rombelsWithSetup.has(r.nama.toUpperCase()));

          if (missingRombels.length > 0 && setups.length > 0) {
            // Copy setup dari rombel pertama yang ada
            const template = setups[0];

            for (const rombel of missingRombels) {
              try {
                const res = await fetch("/api/elearning/setups", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                  body: JSON.stringify({
                    kelas: rombel.nama,
                    mapel: template.mapel,
                    tutorId: template.tutorId,
                    skk: template.skk,
                    jumlahSesi: template.jumlahSesi,
                    semester: selectedSemester,
                  }),
                });
                const data = await res.json();
                if (data.success) synced++;
              } catch (err) {
                console.error("Auto-sync failed:", err);
              }
            }
          }
        }
      }

      if (synced > 0) {
        toast.success(`Sinkron otomatis: ${synced} setup dibuat untuk rombel baru`);
        fetchSetups();
      }
      } finally {
        isSyncingRef.current = false;
      }
    };

    syncNewRombels();
  }, [rombels, items]);

  // Group rombels by kelas level (DINAMIS dari database)
  const kelasLevels = useMemo(() => {
    // Ekstrak semua level unik dari rombel
    const levelMap = new Map<string, RombelData[]>();
    for (const rombel of rombels) {
      const levelId = extractLevelFromRombel(rombel.nama);
      if (!levelMap.has(levelId)) {
        levelMap.set(levelId, []);
      }
      levelMap.get(levelId)!.push(rombel);
    }

    // Buat array KelasLevel, urutkan berdasarkan urutan romawi dan angka
    const romanOrder = ["1", "I", "2", "II", "3", "III", "4", "IV", "5", "V", "6", "VI", "7", "VII", "8", "VIII", "9", "IX", "10", "X", "11", "XI", "12", "XII"];
    const levels: KelasLevel[] = [];

    for (const [levelId, levelRombels] of levelMap) {
      const program = getProgramByLevel(levelId);
      levels.push({
        id: levelId,
        nama: `KELAS ${levelId}`,
        namaIndonesia: `Kelas ${ROMAN_TO_INDONESIAN[levelId] || levelId}`,
        rombels: levelRombels,
        program,
        image: getImageByProgram(program),
      });
    }

    // Urutkan: yang ada di romanOrder diurutkan duluan, sisanya di belakang
    levels.sort((a, b) => {
      const idxA = romanOrder.indexOf(a.id);
      const idxB = romanOrder.indexOf(b.id);
      const orderA = idxA >= 0 ? idxA : 100 + a.id.length;
      const orderB = idxB >= 0 ? idxB : 100 + b.id.length;
      return orderA - orderB;
    });

    return levels;
  }, [rombels]);

  // Objek level yang sedang dipilih, selalu diturunkan dari kelasLevels terbaru
  const selectedKelas = useMemo(
    () => (selectedKelasId ? kelasLevels.find(l => l.id === selectedKelasId) ?? null : null),
    [kelasLevels, selectedKelasId]
  );

  // Auto-select first class on load if none selected
  useEffect(() => {
    if (!selectedKelasId && kelasLevels.length > 0) {
      setSelectedKelasId(kelasLevels[0].id);
    }
  }, [kelasLevels, selectedKelasId]);

  // Daftar kelas hasil filter search (nama, nama Indonesia, program, atau nama rombel)
  const filteredKelasLevels = useMemo(() => {
    const q = kelasSearch.trim().toLowerCase();
    if (!q) return kelasLevels;
    return kelasLevels.filter((level) =>
      level.nama.toLowerCase().includes(q) ||
      level.namaIndonesia.toLowerCase().includes(q) ||
      level.program.toLowerCase().includes(q) ||
      level.rombels.some((r) => r.nama.toLowerCase().includes(q))
    );
  }, [kelasLevels, kelasSearch]);

  // Get setups for selected kelas level (deduplicated by mapel)
  const filteredItems = useMemo(() => {
    if (!selectedKelas) return [];

    // Kumpulkan semua nama rombel dalam level ini
    const rombelNames = selectedKelas.rombels.map(r => r.nama);

    // Filter setups yang termasuk dalam level ini
    const levelSetups = items.filter(item => {
      return rombelNames.some(name =>
        item.kelas.toUpperCase() === name.toUpperCase()
      );
    });

    // Deduplicate by mapel - ambil satu representative per mapel
    const seenMapels = new Set<string>();
    const uniqueItems: ElearningItem[] = [];

    for (const item of levelSetups) {
      if (!seenMapels.has(item.mapel)) {
        seenMapels.add(item.mapel);
        uniqueItems.push(item);
      }
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return uniqueItems.filter(item => {
        const tutorName = tutors.find(t => t.id === item.tutorId)?.nama.toLowerCase() || "";
        return (
          item.mapel.toLowerCase().includes(searchLower) ||
          tutorName.includes(searchLower)
        );
      });
    }

    return uniqueItems;
  }, [items, selectedKelas, tutors, searchTerm]);

  const getAvailableMapel = (): string[] => {
    if (!selectedKelas) return [];
    const mapelList = MASTER_MAPEL[selectedKelas.program as keyof typeof MASTER_MAPEL];
    return mapelList || [];
  };

  const openAddForm = () => {
    setFormData({ id: "", mapel: "", tutorId: "", skk: "", sesiCount: "" });
    setIsEditing(false);
    setIsFormModalOpen(true);
  };

  const openEditForm = (item: ElearningItem) => {
    setFormData({
      id: item.id.toString(),
      mapel: item.mapel,
      tutorId: item.tutorId.toString(),
      skk: item.skk.toString(),
      sesiCount: item.jumlahSesi.toString(),
    });
    setIsEditing(true);
    setIsFormModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKelas || !formData.mapel || !formData.tutorId || !formData.skk || !formData.sesiCount) {
      toast.error("Mohon lengkapi semua data!");
      return;
    }

    const sesiCountInt = parseInt(formData.sesiCount, 10);
    const tutorIdInt = parseInt(formData.tutorId, 10);
    const skkInt = parseInt(formData.skk, 10);

    // Guard NaN: onSubmit React tidak menjalankan validasi native input
    if (Number.isNaN(sesiCountInt) || Number.isNaN(tutorIdInt) || Number.isNaN(skkInt)) {
      toast.error("Jumlah SKK, sesi, dan tutor harus berupa angka yang valid!");
      return;
    }

    // Untuk setiap rombel dalam level kelas ini, buat/update setup
    try {
      const rombelNames = selectedKelas.rombels.map(r => r.nama);
      const authHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      };

      if (isEditing && formData.id) {
        // EDIT: update semua rombel dalam level yang sudah punya mapel ini
        const setupsToUpdate = items.filter(i => {
          const belongsToLevel = rombelNames.some(name => i.kelas.toUpperCase() === name.toUpperCase());
          return belongsToLevel && i.mapel === formData.mapel;
        });

        if (setupsToUpdate.length === 0) {
          toast.error("Tidak ada rombel yang bisa diperbarui untuk mapel ini.");
          return;
        }

        const results = await Promise.all(
          setupsToUpdate.map(setup =>
            fetch(`/api/elearning/setups/${setup.id}`, {
              method: "PUT",
              headers: authHeaders,
              body: JSON.stringify({
                kelas: setup.kelas,
                mapel: formData.mapel,
                tutorId: tutorIdInt,
                skk: skkInt,
                jumlahSesi: sesiCountInt,
                semester: selectedSemester,
              }),
            }).then(res => res.json())
          )
        );
        const successCount = results.filter(data => data.success).length;

        if (successCount > 0) {
          toast.success(`Berhasil update ${successCount} rombel!`);
          fetchSetups();
        } else {
          toast.error("Gagal menyimpan data");
        }
      } else {
        // TAMBAH BARU: buat setup untuk semua rombel dalam level
        if (rombelNames.length === 0) {
          toast.error("Level ini belum memiliki rombel. Tambahkan rombel terlebih dahulu.");
          return;
        }

        const results = await Promise.all(
          rombelNames.map(rombelName =>
            fetch("/api/elearning/setups", {
              method: "POST",
              headers: authHeaders,
              body: JSON.stringify({
                kelas: rombelName,
                mapel: formData.mapel,
                tutorId: tutorIdInt,
                skk: skkInt,
                jumlahSesi: sesiCountInt,
                semester: selectedSemester,
              }),
            }).then(res => res.json())
          )
        );
        const successCount = results.filter(data => data.success).length;

        if (successCount > 0) {
          toast.success(`Berhasil ditambahkan ke ${successCount} rombel!`);
          fetchSetups();
        } else {
          toast.error("Gagal menambahkan data");
        }
      }
      setIsFormModalOpen(false);
    } catch (err: any) {
      toast.error("Terjadi kesalahan: " + err.message);
    }
  };

  const triggerDelete = (id: number) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (!itemToDelete || !selectedKelas) return;

      // Cari setup yang akan dihapus untuk mendapatkan nama mapel
      const setupToDelete = items.find(i => i.id === itemToDelete);
      if (!setupToDelete) {
        toast.error("Data sudah tidak tersedia, mungkin sudah dihapus atau diperbarui.");
        return;
      }

      // Hapus semua setup dengan mapel yang sama dalam level ini
      const rombelNames = selectedKelas.rombels.map(r => r.nama);
      const toDelete = items.filter(i => {
        const belongsToLevel = rombelNames.some(name => i.kelas.toUpperCase() === name.toUpperCase());
        return belongsToLevel && i.mapel === setupToDelete.mapel;
      });

      const results = await Promise.all(
        toDelete.map(setup =>
          fetch(`/api/elearning/setups/${setup.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }).then(res => res.json())
        )
      );
      const deletedCount = results.filter(data => data.success).length;

      if (deletedCount > 0) {
        toast.success(`Berhasil menghapus dari ${deletedCount} rombel!`);
        fetchSetups();
      } else {
        toast.error("Gagal menghapus data");
      }
    } catch (err: any) {
      toast.error("Terjadi kesalahan: " + err.message);
    } finally {
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-[#280f91] flex items-center gap-2">
              <Settings className="h-6 w-6" />
              FORUM SETUP LEARNING
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Konfigurasi mata pelajaran, tutor, SKK, dan sesi untuk setiap level kelas
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-black text-slate-500 uppercase">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value as "Ganjil" | "Genap");
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#280f91] outline-none cursor-pointer"
            >
              <option value="Ganjil">Ganjil (Jun - Des)</option>
              <option value="Genap">Genap (Jan - Mei)</option>
            </select>
          </div>
        </div>
      </div>

      {/* DAFTAR KELAS — Horizontal Scrollable */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[#280f91] text-white px-4 py-3 flex items-center justify-between gap-3">
          <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
            <Users className="h-4 w-4" />
            DAFTAR KELAS
          </h3>
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/50" />
            <input
              type="text"
              value={kelasSearch}
              onChange={(e) => setKelasSearch(e.target.value)}
              placeholder="Cari kelas..."
              className="w-full rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/40 pl-8 pr-8 py-1.5 text-xs font-medium outline-none focus:bg-white/20 focus:border-white/40"
            />
            {kelasSearch && (
              <button
                type="button"
                onClick={() => setKelasSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="p-4">
          {filteredKelasLevels.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-400 font-medium">
              Tidak ada kelas yang cocok.
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {filteredKelasLevels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => {
                    setSelectedKelasId(level.id);
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                  className={`flex-shrink-0 w-40 rounded-xl border-2 transition-all overflow-hidden group ${
                    selectedKelas?.id === level.id
                      ? "border-[#280f91] shadow-md ring-2 ring-purple-100"
                      : "border-slate-100 hover:border-slate-200 hover:shadow-sm"
                  }`}
                >
                  {/* Foto Paket */}
                  <div className="w-full h-40 bg-slate-100 overflow-hidden relative">
                    <img
                      src={level.image}
                      alt={level.nama}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-2 pt-10">
                      <span className="font-black text-sm text-white block text-center drop-shadow-lg">
                        {level.nama}
                      </span>
                    </div>
                  </div>
                  {/* Info Kelas */}
                  <div className="px-2 py-2">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                        level.rombels.length > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {level.rombels.length} rombel
                      </span>
                    </div>
                    {level.rombels.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-0.5">
                        {level.rombels.slice(0, 3).map(r => (
                          <span key={r.id} className="text-[8px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded">
                            {r.nama}
                          </span>
                        ))}
                        {level.rombels.length > 3 && (
                          <span className="text-[8px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded">+{level.rombels.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* KONFIGURASI MAPEL */}
      <div className="space-y-6">
          {selectedKelas ? (
            <>
              {/* INFO KELAS YANG DIPILIH */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                      <span className="text-3xl">📚</span>
                      {selectedKelas.nama}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Program: {selectedKelas.program} · {selectedKelas.rombels.length} rombel
                    </p>
                  </div>
                  <Button
                    onClick={openAddForm}
                    className="bg-[#280f91] hover:bg-[#ff6105] text-white font-bold px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    TAMBAH MAPEL
                  </Button>
                </div>
              </div>

              {/* TABEL KONFIGURASI */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    Daftar Mata Pelajaran ({filteredItems.length})
                  </span>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Search className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Cari mapel atau tutor..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full sm:w-64 h-10 pl-9 pr-4 text-xs border border-slate-200 rounded-xl bg-white font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-[#00badb] text-white font-black text-sm uppercase">
                        <th className="py-4 px-6 border-r border-[#009cb9] text-center w-16">NO</th>
                        <th className="py-4 px-6 border-r border-[#009cb9]">MATA PELAJARAN</th>
                        <th className="py-4 px-6 border-r border-[#009cb9]">TUTOR</th>
                        <th className="py-4 px-6 border-r border-[#009cb9] text-center">SKK</th>
                        <th className="py-4 px-6 border-r border-[#009cb9] text-center">SESI</th>
                        <th className="py-4 px-6 text-center">AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedItems.length > 0 ? (
                        paginatedItems.map((item, idx) => {
                          const tutor = tutors.find(t => t.id === item.tutorId);
                          return (
                            <tr key={item.id} className="border-b border-slate-100 hover:bg-cyan-50/20 font-bold text-slate-700 transition-colors">
                              <td className="py-4 px-6 border-r border-slate-100 text-center text-slate-500 font-mono">
                                {(currentPage - 1) * itemsPerPage + idx + 1}
                              </td>
                              <td className="py-4 px-6 border-r border-slate-100 font-extrabold text-slate-900">
                                {item.mapel}
                              </td>
                              <td className="py-4 px-6 border-r border-slate-100 font-semibold text-slate-650">
                                {tutor ? tutor.nama : <span className="text-slate-400 italic">Tidak Diketahui</span>}
                              </td>
                              <td className="py-4 px-6 border-r border-slate-100 text-center font-extrabold text-slate-800 font-mono">
                                {item.skk}
                              </td>
                              <td className="py-4 px-6 border-r border-slate-100 text-center font-extrabold text-slate-800 font-mono">
                                {item.jumlahSesi}
                              </td>
                              <td className="py-4 px-6 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    onClick={() => openEditForm(item)}
                                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 h-8 px-3 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-xs transition-all"
                                  >
                                    <Edit className="h-3.5 w-3.5 text-blue-600" /> Edit
                                  </Button>
                                  <Button
                                    onClick={() => triggerDelete(item.id)}
                                    className="bg-white border border-slate-200 hover:bg-rose-50 text-rose-600 h-8 px-3 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-xs transition-all"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" /> Hapus
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-10 text-center font-bold text-slate-400">
                            {searchTerm
                              ? "Tidak ada mata pelajaran yang sesuai pencarian."
                              : "Belum ada mata pelajaran yang dikonfigurasi untuk kelas ini."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-end items-center gap-2.5 p-4 border-t border-slate-100">
                    <Button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="bg-[#ffb300] hover:bg-[#ffa000] text-black font-extrabold text-xs h-9 px-4 rounded-xl cursor-pointer disabled:opacity-50 transition-all"
                    >
                      Previous
                    </Button>
                    <span className="h-9 w-9 flex items-center justify-center bg-[#ffb300] text-black font-black text-sm rounded-xl">
                      {currentPage}
                    </span>
                    <Button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="bg-[#ffb300] hover:bg-[#ffa000] text-black font-extrabold text-xs h-9 px-4 rounded-xl cursor-pointer disabled:opacity-50 transition-all"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
              <div className="h-16 w-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-black text-slate-700">Pilih Kelas Terlebih Dahulu</h3>
              <p className="text-sm text-slate-500 mt-2">
                Klik salah satu kelas di atas untuk melihat dan mengkonfigurasi mata pelajaran
              </p>
            </div>
          )}
        </div>

      {/* FORM MODAL */}
      {isFormModalOpen && selectedKelas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsFormModalOpen(false)} />
          <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200 z-10">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center border border-purple-100">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">
                    {isEditing ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold">{selectedKelas.nama}</p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* MAPEL */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-purple-600" /> Mata Pelajaran
                </label>
                <select
                  required
                  value={formData.mapel}
                  onChange={(e) => setFormData(prev => ({ ...prev, mapel: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#280f91] outline-none"
                >
                  <option value="" disabled>-- Pilih Mata Pelajaran --</option>
                  {getAvailableMapel().map((m: string) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* TUTOR */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-emerald-600" /> Tutor
                </label>
                <select
                  required
                  value={formData.tutorId}
                  onChange={(e) => setFormData(prev => ({ ...prev, tutorId: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#280f91] outline-none"
                >
                  <option value="" disabled>-- Pilih Tutor --</option>
                  {tutors.length > 0 ? (
                    tutors.map(t => (
                      <option key={t.id} value={t.id}>{t.nama}</option>
                    ))
                  ) : (
                    <option value="" disabled>Memuat data tutor...</option>
                  )}
                </select>
              </div>

              {/* SKK & SESI */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-orange-600" /> Jumlah SKK
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Contoh: 2"
                    value={formData.skk}
                    onChange={(e) => setFormData(prev => ({ ...prev, skk: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#280f91] outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-1.5">
                    <Settings className="h-4 w-4 text-blue-600" /> Jumlah Sesi
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="20"
                    placeholder="Contoh: 8"
                    value={formData.sesiCount}
                    onChange={(e) => setFormData(prev => ({ ...prev, sesiCount: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#280f91] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold px-6"
                >
                  Batal
                </Button>
                <Button type="submit" className="bg-[#280f91] hover:bg-[#ff6105] text-white rounded-xl font-bold px-8 shadow-md">
                  {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  {isEditing ? "Simpan" : "Tambahkan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setDeleteModalOpen(false)} />
          <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 z-10 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-slate-800">Hapus Mata Pelajaran</h3>
            </div>
            <p className="text-sm text-slate-500 font-semibold leading-relaxed">
              Apakah Anda yakin ingin menghapus mata pelajaran ini? Tindakan ini akan menghapus data untuk semua rombel dalam level kelas ini.
            </p>
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <Button
                onClick={() => setDeleteModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-5 rounded-xl border border-slate-200 shadow-sm"
              >
                Batal
              </Button>
              <Button
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 rounded-xl shadow-md"
              >
                Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
