import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Search,
  Plus,
  Trash2,
  Save,
  Edit3,
  X,
  List,
  LayoutGrid,
  Loader2,
  UserPlus,
  ChevronLeft,
  Users,
  GraduationCap,
  User,
  UserCheck,
} from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { toast } from "sonner";
import { extractLevel, buildNamaKelas, PROGRAM_LEVELS } from "@/lib/kelas-helper";

// ==========================================
// Types
// ==========================================
interface WaliKelas {
  id: number;
  nama: string;
  foto: string;
  tutorMapel: string;
}

interface Rombel {
  id: number;
  nama: string;
  waliKelasId: number | null;
  createdAt: string;
  updatedAt: string;
  waliKelas: WaliKelas | null;
  jumlahSiswa: number;
}

interface Tutor {
  id: number;
  nama: string;
  foto: string;
  tutorMapel: string;
}

interface Student {
  id: number;
  nama: string;
  nisn: string;
  nis: string;
  program: string;
  kelas: string;
  jenisKelamin: string;
  foto: string;
  status: string;
  rombels?: { id: number; nama: string }[];
}

const deriveProgramFromKelas = (kelasName?: string | null): string => {
  if (!kelasName) return "";
  const upper = kelasName.trim().toUpperCase();
  if (upper.startsWith("PAKET A")) return "PAKET A";
  if (upper.startsWith("PAKET B")) return "PAKET B";
  if (upper.startsWith("PAKET C")) return "PAKET C";
  return "";
};

export default function RombelManager() {
  const confirm = useConfirm();

  // State
  const [rombels, setRombels] = useState<Rombel[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [search, setSearch] = useState("");
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>("Semua");

  // Rombel Tanpa Wali Kelas Modal State
  const [noWaliModalOpen, setNoWaliModalOpen] = useState(false);
  const [selectedWaliAssignments, setSelectedWaliAssignments] = useState<{ [rombelId: number]: number | null }>({});
  const [assigningWaliId, setAssigningWaliId] = useState<number | null>(null);

  const handleQuickAssignWali = async (rombel: Rombel, tutorId: number | null) => {
    if (!tutorId) {
      toast.warning("Pilih wali kelas terlebih dahulu");
      return;
    }

    setAssigningWaliId(rombel.id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/rombels/${rombel.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nama: rombel.nama, waliKelasId: tutorId }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Wali kelas untuk rombel ${rombel.nama} berhasil disimpan!`);
        fetchRombels();
      } else {
        toast.error(data.message || "Gagal menyimpan wali kelas");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setAssigningWaliId(null);
    }
  };

  // Detail view
  const [selectedRombel, setSelectedRombel] = useState<Rombel | null>(null);
  const [detailStudents, setDetailStudents] = useState<Student[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Add/Edit form
  const [formOpen, setFormOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ nama: "", waliKelasId: null as number | null });
  const [originalFormData, setOriginalFormData] = useState<{ nama: string; waliKelasId: number | null }>({ nama: "", waliKelasId: null });
  const [formPaket, setFormPaket] = useState("");
  const [formLevel, setFormLevel] = useState("");
  const [formSub, setFormSub] = useState("");

  // Add students modal
  const [addStudentsOpen, setAddStudentsOpen] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [addStudentsLoading, setAddStudentsLoading] = useState(false);

  // Unassigned students modal
  const [unassignedOpen, setUnassignedOpen] = useState(false);
  const [unassignedStudents, setUnassignedStudents] = useState<Student[]>([]);
  const [unassignedSearch, setUnassignedSearch] = useState("");
  const [assignTargetRombel, setAssignTargetRombel] = useState<string>("");
  const [assignSelectedIds, setAssignSelectedIds] = useState<number[]>([]);
  const [assigning, setAssigning] = useState(false);

  // ==========================================
  // Fetch Data
  // ==========================================
  const fetchRombels = () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    fetch("/api/rombels", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setRombels(data.data);
        }
      })
      .catch((err) => console.error("Failed to load rombels:", err))
      .finally(() => setLoading(false));
  };

  const fetchTutors = () => {
    const token = localStorage.getItem("token");
    fetch("/api/tutors", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setTutors(data.data);
        }
      })
      .catch((err) => console.error("Failed to load tutors:", err));
  };

  const fetchDetailStudents = (rombelId: number) => {
    setDetailLoading(true);
    const token = localStorage.getItem("token");
    fetch(`/api/rombels/${rombelId}/students`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setDetailStudents(data.data);
        }
      })
      .catch((err) => console.error("Failed to load detail students:", err))
      .finally(() => setDetailLoading(false));
  };

  const fetchAllStudents = () => {
    const token = localStorage.getItem("token");
    fetch("/api/students", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setAllStudents(data.data.filter((s: Student) => s.status === "AKTIF"));
        }
      })
      .catch((err) => console.error("Failed to load students:", err));
  };

  useEffect(() => {
    // Auto-sync rombels saat halaman dimuat
    const init = async () => {
      try {
        const token = localStorage.getItem("token");
        await fetch("/api/rombels/sync", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // silent - sync gagal tidak masalah, rombels tetap di-fetch
      }
      fetchRombels();
      fetchTutors();
      fetchAllStudents();
    };
    init();
  }, []);

  // ==========================================
  // CRUD Rombel
  // ==========================================
  const openAddForm = () => {
    setIsAdding(true);
    setIsEditing(true);
    setFormData({ nama: "", waliKelasId: null });
    setOriginalFormData({ nama: "", waliKelasId: null });
    setFormPaket("");
    setFormLevel("");
    setFormSub("");
    setFormOpen(true);
  };

  const openEditForm = (rombel: Rombel) => {
    setIsAdding(false);
    setIsEditing(true);
    setOriginalFormData({ nama: rombel.nama, waliKelasId: rombel.waliKelasId });
    setFormData({ nama: rombel.nama, waliKelasId: rombel.waliKelasId });
    // Parse existing nama to extract paket, level, sub
    const level = extractLevel(rombel.nama);
    const mPaket = rombel.nama.match(/PAKET\s+([ABC])/i);
    const mSub = rombel.nama.match(/PAKET\s+[ABC]\s+\d+\s+([A-Z])$/i);
    setFormPaket(mPaket ? mPaket[1].toUpperCase() : "");
    setFormLevel(level ? level.toString() : "");
    setFormSub(mSub ? mSub[1].toUpperCase() : "");
    setSelectedRombel(rombel);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formPaket || !formLevel) {
      toast.error("Paket dan kelas wajib diisi");
      return;
    }
    const levelNum = parseInt(formLevel);
    const progInfo = PROGRAM_LEVELS[formPaket];
    if (!progInfo || levelNum < progInfo.min || levelNum > progInfo.max) {
      toast.error(`Level ${formLevel} tidak valid untuk ${progInfo?.label || formPaket}`);
      return;
    }
    const nama = buildNamaKelas(formPaket, levelNum, formSub || undefined);

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const url = isAdding ? "/api/rombels" : `/api/rombels/${selectedRombel?.id}`;
      const method = isAdding ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nama, waliKelasId: formData.waliKelasId }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(isAdding ? "Rombel berhasil dibuat" : "Rombel berhasil diperbarui");
        setIsEditing(false);
        setFormOpen(false);
        fetchRombels();
      } else {
        toast.error(data.message || "Gagal menyimpan");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rombel: Rombel) => {
    if (
      !(await confirm({
        title: "Hapus Rombel",
        message: `Hapus rombel "${rombel.nama}"? Semua siswa akan di-assign dari rombel ini.`,
        variant: "danger",
      }))
    )
      return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/rombels/${rombel.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchRombels();
        fetchAllStudents();
        if (selectedRombel?.id === rombel.id) {
          setSelectedRombel(null);
          setDetailStudents([]);
        }
        setFormOpen(false);
        setIsEditing(false);
      } else {
        toast.error(data.message || "Gagal menghapus");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menghapus");
    }
  };

  // ==========================================
  // Detail / Student Management
  // ==========================================
  const openDetail = (rombel: Rombel) => {
    setSelectedRombel(rombel);
    fetchDetailStudents(rombel.id);
  };

  const closeDetail = () => {
    setSelectedRombel(null);
    setDetailStudents([]);
  };

// Derive level number from rombel name (PAKET A 5 → 5, PAKET C 10 A → 10)
const getLevel = (nama: string): string => extractLevel(nama).toString();

  const openAddStudents = () => {
    if (!selectedRombel) return;
    const assignedIds = new Set(detailStudents.map((s) => s.id));
    const rombelLevel = getLevel(selectedRombel.nama);
    // Filter siswa: belum di-assign ke rombel ini DAN level kelas sesuai
    // Cocokkan baik kelas level murni ("X") maupun nama rombel penuh ("XA")
    const available = allStudents.filter((s) => {
      if (assignedIds.has(s.id)) return false;
      // Cocok jika kelas = level rombel (misal "X" untuk rombel "XA")
      // ATAU kelas = nama rombel persis (misal "XA" untuk rombel "XA")
      // ATAU siswa belum punya rombel sama sekali dan levelnya cocok
      const kelasUpper = (s.kelas || "").toUpperCase().trim();
      const rombelNamaUpper = selectedRombel.nama.toUpperCase().trim();
      const rombelLevelUpper = rombelLevel.toUpperCase().trim();
      return kelasUpper === rombelLevelUpper || kelasUpper === rombelNamaUpper || kelasUpper === "";
    });
    setAvailableStudents(available);
    setSelectedStudentIds([]);
    setStudentSearch("");
    setAddStudentsOpen(true);
  };

  const toggleStudent = (id: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    const filtered = availableStudents.filter(
      (s) =>
        !studentSearch ||
        s.nama.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.nisn.includes(studentSearch) ||
        s.kelas.toLowerCase().includes(studentSearch.toLowerCase())
    );
    const allIds = filtered.map((s) => s.id);
    setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...allIds])));
  };

  const handleAddStudents = async () => {
    if (!selectedRombel || selectedStudentIds.length === 0) return;

    setAddStudentsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/rombels/${selectedRombel.id}/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studentIds: selectedStudentIds }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setAddStudentsOpen(false);
        fetchDetailStudents(selectedRombel.id);
        fetchRombels();
      } else {
        toast.error(data.message || "Gagal menambah siswa");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menambah siswa");
    } finally {
      setAddStudentsLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId: number) => {
    if (!selectedRombel) return;
    if (
      !(await confirm({
        title: "Hapus Siswa",
        message: "Hapus siswa ini dari rombel?",
        variant: "danger",
      }))
    )
      return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/rombels/${selectedRombel.id}/students/${studentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Siswa dihapus dari rombel");
        fetchDetailStudents(selectedRombel.id);
        fetchRombels();
        fetchAllStudents();
      } else {
        toast.error(data.message || "Gagal menghapus siswa");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    }
  };

  // ==========================================
  // Filter
  // ==========================================
  const filteredRombels = rombels.filter((r) => {
    const matchesSearch = !search || r.nama.toLowerCase().includes(search.toLowerCase());
    const rProg = deriveProgramFromKelas(r.nama);
    let matchesProgram = false;
    if (selectedProgramFilter === "Semua") {
      matchesProgram = true;
    } else if (selectedProgramFilter === "TanpaWali") {
      matchesProgram = !r.waliKelas && !r.waliKelasId;
    } else {
      matchesProgram = rProg === selectedProgramFilter;
    }
    return matchesSearch && matchesProgram;
  });

  // Filtered available students for modal
  const filteredAvailable = availableStudents.filter(
    (s) =>
      !studentSearch ||
      s.nama.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.nisn.includes(studentSearch) ||
      s.kelas.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // ==========================================
  // Unassigned Students (belum punya relasi di rombel manapun)
  // ==========================================
  const openUnassigned = () => {
    // Siswa "belum kelas" = siswa AKTIF yang belum ada di rombel manapun
    // Gunakan data rombels dari API (array kosong = belum di-assign)
    const unassigned = allStudents.filter((s) => {
      // Cek dari rombels array (dari API)
      if (s.rombels && s.rombels.length > 0) return false;
      return true;
    });
    setUnassignedStudents(unassigned);
    setAssignSelectedIds([]);
    setAssignTargetRombel("");
    setUnassignedSearch("");
    setUnassignedOpen(true);
  };

  // Filter siswa unassigned berdasarkan level rombel yang dipilih
  const filteredUnassigned = unassignedStudents.filter((s) => {
    // Jika rombel target dipilih, filter hanya siswa dengan level yang cocok
    if (assignTargetRombel) {
      const targetLevel = getLevel(assignTargetRombel).toUpperCase();
      const kelasUpper = (s.kelas || "").toUpperCase().trim();
      // Cocok jika kelas kosong, atau kelas = level target, atau kelas = nama rombel target
      if (kelasUpper !== "" && kelasUpper !== targetLevel && kelasUpper !== assignTargetRombel.toUpperCase()) return false;
    }
    // Filter search
    if (unassignedSearch) {
      const q = unassignedSearch.toLowerCase();
      return s.nama.toLowerCase().includes(q) || s.nisn.includes(q) || s.kelas.toLowerCase().includes(q);
    }
    return true;
  });

  const toggleAssignStudent = (id: number) => {
    setAssignSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAssignToRombel = async () => {
    if (!assignTargetRombel || assignSelectedIds.length === 0) {
      toast.warning("Pilih rombel dan siswa terlebih dahulu");
      return;
    }
    const target = rombels.find((r) => r.nama === assignTargetRombel);
    if (!target) return;

    setAssigning(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/rombels/${target.id}/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studentIds: assignSelectedIds }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${data.added || assignSelectedIds.length} siswa berhasil di-assign ke ${assignTargetRombel}`);
        // Refresh data
        const updatedUnassigned = unassignedStudents.filter((s) => !assignSelectedIds.includes(s.id));
        setUnassignedStudents(updatedUnassigned);
        setAssignSelectedIds([]);
        setAssignTargetRombel("");
        fetchRombels();
        fetchAllStudents();
      } else {
        toast.error(data.message || "Gagal assign siswa");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setAssigning(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <>
      <div className="space-y-6 relative pb-16 animate-in fade-in duration-300">
        {selectedRombel ? (
          /* ═══════════════════ DETAIL VIEW ═══════════════════ */
          <>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={closeDetail}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-slate-600" />
                </button>
                <div>
                  <h2 className="text-xl font-black text-cyan-900 tracking-tight flex items-center gap-2">
                    ROMBEL: {selectedRombel.nama}
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Wali Kelas: {selectedRombel.waliKelas?.nama || "Belum ditentukan"} ·{" "}
                    {detailStudents.length} siswa
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => openEditForm(selectedRombel)}
                  className="bg-[#00badb] hover:bg-[#009cb9] text-white font-extrabold text-[10px] px-4 py-2.5 rounded-xl cursor-pointer uppercase tracking-wider shadow-md flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Edit3 className="h-4 w-4" /> EDIT
                </Button>
                <Button
                  onClick={() => handleDelete(selectedRombel)}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] px-4 py-2.5 rounded-xl cursor-pointer uppercase tracking-wider shadow-md flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Trash2 className="h-4 w-4" /> HAPUS
                </Button>
              </div>
            </div>

            {/* Info Rombel */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center shadow-lg shadow-cyan-200/50">
                    <GraduationCap className="h-7 w-7 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Nama Rombel
                    </p>
                    <p className="text-sm font-black text-slate-700">{selectedRombel.nama}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {selectedRombel.waliKelas?.foto ? (
                    <img
                      src={selectedRombel.waliKelas.foto}
                      alt=""
                      className="h-14 w-14 rounded-2xl object-cover border-2 border-white shadow-md"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center shadow-lg shadow-purple-200/50">
                      <UserCheck className="h-7 w-7 text-purple-600" />
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Wali Kelas
                    </p>
                    <p className="text-sm font-black text-slate-700">
                      {selectedRombel.waliKelas?.nama || "Belum ditentukan"}
                    </p>
                    {selectedRombel.waliKelas && (
                      <p className="text-[10px] text-slate-400 font-semibold">
                        {selectedRombel.waliKelas.tutorMapel}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center shadow-lg shadow-emerald-200/50">
                    <Users className="h-7 w-7 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Jumlah Siswa
                    </p>
                    <p className="text-sm font-black text-slate-700">{detailStudents.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Student List */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-black text-slate-500 uppercase text-xs tracking-widest">
                  Daftar Siswa ({detailStudents.length})
                </h3>
                <Button
                  onClick={openAddStudents}
                  className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-[10px] px-4 py-2.5 rounded-xl cursor-pointer uppercase tracking-wider shadow-md shadow-purple-200/40 flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <UserPlus className="h-4 w-4" /> TAMBAH SISWA
                </Button>
              </div>

              <div className="p-6">
                {detailLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <Loader2 className="animate-spin h-8 w-8 text-[#00badb]" />
                    <span className="text-xs font-extrabold text-[#00badb] uppercase tracking-widest">
                      Memuat siswa...
                    </span>
                  </div>
                ) : detailStudents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <div className="h-16 w-16 rounded-2xl bg-orange-50 flex items-center justify-center">
                      <Users className="h-8 w-8 text-orange-400" />
                    </div>
                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest">
                      Belum Ada Siswa
                    </p>
                    <p className="text-xs text-slate-400 font-semibold text-center max-w-sm">
                      Klik "Tambah Siswa" untuk mengassign siswa ke rombel ini.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#00badb] text-white uppercase tracking-wider">
                          <th className="p-3 text-left font-extrabold rounded-tl-xl">No</th>
                          <th className="p-3 text-left font-extrabold">Nama</th>
                          <th className="p-3 text-left font-extrabold">NISN</th>
                          <th className="p-3 text-left font-extrabold">Program</th>
                          <th className="p-3 text-left font-extrabold">Kelas</th>
                          <th className="p-3 text-center font-extrabold rounded-tr-xl">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailStudents.map((siswa, idx) => (
                          <tr
                            key={siswa.id}
                            className="border-b border-slate-100 hover:bg-cyan-50/30 transition-colors"
                          >
                            <td className="p-3 font-bold text-slate-500">{idx + 1}</td>
                            <td className="p-3 font-bold text-slate-700">{siswa.nama}</td>
                            <td className="p-3 font-semibold text-slate-500">{siswa.nisn}</td>
                            <td className="p-3 font-semibold text-slate-500">{siswa.program}</td>
                            <td className="p-3 font-semibold text-slate-500">{siswa.kelas}</td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleRemoveStudent(siswa.id)}
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
                                title="Hapus dari rombel"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* ═══════════════════ MAIN LIST VIEW ═══════════════════ */
          <>
            {/* HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
              <div>
                <h2 className="text-xl font-black text-cyan-900 tracking-tight flex items-center gap-2">
                  KELOLA DATA ROMBEL
                </h2>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Kelola rombongan belajar (kelas), wali kelas, dan penugasan siswa.
                </p>
              </div>
            </div>

            {/* TOOLBAR */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Search & Program Filter */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
                  <div className="relative w-full sm:w-64">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Search className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="CARI NAMA ROMBEL"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full h-10 pl-9 pr-4 text-xs border border-slate-200 rounded-xl bg-white font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner uppercase"
                    />
                  </div>

                  <div className="w-full sm:w-56">
                    <select
                      value={selectedProgramFilter}
                      onChange={(e) => setSelectedProgramFilter(e.target.value)}
                      className="w-full h-10 px-3 text-xs font-black border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer shadow-xs uppercase"
                    >
                      <option value="Semua">SEMUA PAKET / PROGRAM</option>
                      <option value="PAKET A">PAKET A (Kelas 1 - 6)</option>
                      <option value="PAKET B">PAKET B (Kelas 7 - 9)</option>
                      <option value="PAKET C">PAKET C (Kelas 10 - 12)</option>
                      <option value="TanpaWali">ROMBEL TANPA WALI KELAS</option>
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 items-center flex-wrap w-full md:w-auto justify-end">
                  <Button
                    onClick={() => setNoWaliModalOpen(true)}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95"
                  >
                    <UserCheck className="h-4 w-4" /> ROMBEL TANPA WALI KELAS
                    {(() => {
                      const count = rombels.filter((r) => !r.waliKelas && !r.waliKelasId).length;
                      return (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          count > 0 ? "bg-white text-rose-600 shadow-xs" : "bg-rose-700/60 text-white"
                        }`}>
                          {count} ROMBEL
                        </span>
                      );
                    })()}
                  </Button>

                  <Button
                    onClick={openUnassigned}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95"
                  >
                    <UserPlus className="h-4 w-4" /> SISWA BELUM MEMILIKI KELAS
                    {(() => {
                      const count = allStudents.filter((s) => !s.rombels || s.rombels.length === 0).length;
                      return (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          count > 0 ? "bg-white text-amber-600 shadow-xs" : "bg-amber-600/60 text-white"
                        }`}>
                          {count} SISWA
                        </span>
                      );
                    })()}
                  </Button>
                  <Button
                    onClick={openAddForm}
                    className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md shadow-purple-200 uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Plus className="h-4 w-4" /> TAMBAH DATA
                  </Button>
                </div>
              </div>
            </div>

            {/* ROMBEL LIST */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <h3 className="font-black text-slate-500 uppercase text-xs tracking-widest">
                    Daftar Rombel ({filteredRombels.length})
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
                    <Loader2 className="animate-spin h-10 w-10 text-[#9c27b0]" />
                    <span className="text-xs font-extrabold text-[#9c27b0] uppercase tracking-widest">
                      Memuat data rombel...
                    </span>
                  </div>
                ) : filteredRombels.length > 0 ? (
                  viewMode === "cards" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                      {filteredRombels.map((rombel) => {
                        return (
                          <div
                            key={rombel.id}
                            onClick={() => openDetail(rombel)}
                            className="bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-cyan-300 transition-all flex flex-col group cursor-pointer hover:shadow-md"
                          >
                            {/* Header */}
                            <div className="h-20 bg-gradient-to-br from-[#00badb] to-[#009cb9] flex flex-col items-center justify-center relative">
                              <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider leading-none">
                                {(() => {
                                  const parts = rombel.nama.split(" ");
                                  return parts.slice(0, 2).join(" ");
                                })()}
                              </span>
                              <span className="text-2xl font-black text-white drop-shadow-lg leading-tight -mt-0.5">
                                {(() => {
                                  const parts = rombel.nama.split(" ");
                                  return parts.slice(2).join(" ");
                                })() || rombel.nama}
                              </span>
                            </div>
                            {/* Body */}
                            <div className="p-4 flex flex-col gap-2 flex-1">
                              <div className="flex items-center gap-2">
                                {rombel.waliKelas?.foto ? (
                                  <img
                                    src={rombel.waliKelas.foto}
                                    alt=""
                                    className="h-8 w-8 rounded-full object-cover border-2 border-white shadow"
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-sm">
                                    <User className="h-4 w-4 text-purple-600" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Wali Kelas
                                  </p>
                                  <p className="text-xs font-black text-slate-700 truncate">
                                    {rombel.waliKelas?.nama || "Belum ditentukan"}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-auto pt-2 border-t border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                  Siswa
                                </p>
                                <p className="text-lg font-black text-[#00badb]">{rombel.jumlahSiswa}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Table View */
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-[#00badb] text-white uppercase tracking-wider">
                            <th className="p-3 text-left font-extrabold rounded-tl-xl">No</th>
                            <th className="p-3 text-left font-extrabold">Nama Rombel</th>
                            <th className="p-3 text-left font-extrabold">Program</th>
                            <th className="p-3 text-left font-extrabold">Wali Kelas</th>
                            <th className="p-3 text-center font-extrabold">Jml Siswa</th>
                            <th className="p-3 text-center font-extrabold rounded-tr-xl">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRombels.map((rombel, idx) => (
                            <tr
                              key={rombel.id}
                              className="border-b border-slate-100 hover:bg-cyan-50/30 transition-colors cursor-pointer"
                              onClick={() => openDetail(rombel)}
                            >
                              <td className="p-3 font-bold text-slate-500">{idx + 1}</td>
                              <td className="p-3 font-bold text-slate-700">{rombel.nama}</td>
                              <td className="p-3 font-bold text-purple-700">{deriveProgramFromKelas(rombel.nama) || "-"}</td>
                              <td className="p-3 font-semibold text-slate-500">
                                {rombel.waliKelas?.nama || "-"}
                              </td>
                              <td className="p-3 text-center font-black text-[#00badb]">
                                {rombel.jumlahSiswa}
                              </td>
                              <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleDelete(rombel)}
                                  className="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
                                  title="Hapus"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  /* Empty State */
                  <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <div className="h-16 w-16 rounded-2xl bg-orange-50 flex items-center justify-center">
                      <LayoutDashboard className="h-8 w-8 text-orange-400" />
                    </div>
                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest">
                      Tidak Ditemukan
                    </p>
                    <p className="text-xs text-slate-400 font-semibold text-center max-w-sm">
                      {rombels.length === 0
                        ? 'Belum ada rombel. Klik "Tambah Data" untuk memulai.'
                        : "Tidak ada rombel yang sesuai dengan pencarian."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ═══════════════════ MODALS (ROOT LEVEL — outside animate-in) ═══════════════════ */}

      {/* ── Add/Edit Rombel Form Modal ── */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">
                {isAdding ? "TAMBAH DATA" : !isEditing ? "DETAIL DATA" : "EDIT DATA"}
              </h3>
              <button
                onClick={() => setFormOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Nama Rombel */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
                  Nama Rombel *
                </label>
                <div className="flex gap-2 items-start">
                  <select
                    value={formPaket}
                    onChange={(e) => { setFormPaket(e.target.value); setFormLevel(""); setFormSub(""); }}
                    disabled={!isEditing}
                    className="w-28 h-10 px-2 text-xs font-bold border-2 border-white rounded-xl bg-slate-50 focus:bg-white focus:border-[#00badb] outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Paket</option>
                    <option value="A">PAKET A (1-6)</option>
                    <option value="B">PAKET B (7-9)</option>
                    <option value="C">PAKET C (10-12)</option>
                  </select>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value)}
                    disabled={!isEditing || !formPaket}
                    className="w-20 h-10 px-2 text-xs font-bold border-2 border-white rounded-xl bg-slate-50 focus:bg-white focus:border-[#00badb] outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Kelas</option>
                    {formPaket && PROGRAM_LEVELS[formPaket] && Array.from(
                      { length: PROGRAM_LEVELS[formPaket].max - PROGRAM_LEVELS[formPaket].min + 1 },
                      (_, i) => PROGRAM_LEVELS[formPaket].min + i
                    ).map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                  <select
                    value={formSub}
                    onChange={(e) => setFormSub(e.target.value)}
                    disabled={!isEditing || !formLevel}
                    className="w-16 h-10 px-2 text-xs font-bold border-2 border-white rounded-xl bg-slate-50 focus:bg-white focus:border-[#00badb] outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Sub</option>
                    {"ABCDEFGHIJ".split("").map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                  <div className="flex-1 h-10 px-3 text-xs font-bold rounded-xl bg-slate-100 flex items-center text-slate-500">
                    {formPaket && formLevel ? buildNamaKelas(formPaket, parseInt(formLevel), formSub || undefined) : "PAKET ? ?"}
                  </div>
                </div>
              </div>

              {/* Wali Kelas */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">
                  Wali Kelas (Opsional)
                </label>
                <select
                  value={formData.waliKelasId || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      waliKelasId: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  disabled={!isEditing}
                  className="w-full h-10 px-3 text-xs font-bold border-2 border-white rounded-xl bg-slate-50 focus:bg-white focus:border-[#00badb] outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">-- Pilih Tutor --</option>
                  {tutors.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nama} ({t.tutorMapel})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-5 border-t border-white/10 flex justify-end gap-3">
              {isAdding ? (
                <>
                  <Button
                    onClick={() => { setFormOpen(false); setIsEditing(false); }}
                    className="bg-slate-500 hover:bg-slate-650 text-white font-extrabold text-xs px-8 h-11 rounded-xl cursor-pointer uppercase tracking-widest transition-all"
                  >
                    BATAL
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-black text-xs px-8 h-11 rounded-xl cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest flex items-center gap-1.5 transition-all disabled:opacity-70"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    SIMPAN
                  </Button>
                </>
              ) : !isEditing ? (
                <>
                  <Button
                    onClick={(e) => { e.preventDefault(); if (selectedRombel) handleDelete(selectedRombel); }}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-8 h-11 rounded-xl cursor-pointer uppercase tracking-widest transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="h-4 w-4" /> HAPUS
                  </Button>
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-black text-xs px-8 h-11 rounded-xl cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest flex items-center gap-1.5 transition-all"
                  >
                    <Edit3 className="h-4 w-4" /> EDIT
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => {
                      setFormData(originalFormData);
                      setIsEditing(false);
                      setFormOpen(false);
                    }}
                    className="bg-slate-500 hover:bg-slate-650 text-white font-extrabold text-xs px-8 h-11 rounded-xl cursor-pointer uppercase tracking-widest transition-all"
                  >
                    BATAL
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-black text-xs px-8 h-11 rounded-xl cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest flex items-center gap-1.5 transition-all disabled:opacity-70"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    SIMPAN
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add Students Modal ── */}
      {addStudentsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  Tambah Siswa ke {selectedRombel?.nama}
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  Pilih siswa yang akan di-assign ke rombel ini
                </p>
              </div>
              <button
                onClick={() => setAddStudentsOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            {/* Search + Select All */}
            <div className="p-4 border-b border-slate-100 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, NISN, atau kelas..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-xs border border-slate-200 rounded-xl bg-white font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <Button
                onClick={selectAllFiltered}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-[10px] px-3 rounded-xl"
              >
                Pilih Semua
              </Button>
              <Button
                onClick={() => setSelectedStudentIds([])}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-[10px] px-3 rounded-xl"
              >
                Reset
              </Button>
            </div>

            {/* Student List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {filteredAvailable.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-8 font-semibold">
                  Tidak ada siswa tersedia
                </p>
              ) : (
                filteredAvailable.map((siswa) => (
                  <label
                    key={siswa.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${selectedStudentIds.includes(siswa.id)
                        ? "bg-cyan-50 border border-cyan-200"
                        : "hover:bg-slate-50 border border-transparent"
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(siswa.id)}
                      onChange={() => toggleStudent(siswa.id)}
                      className="h-4 w-4 rounded border-slate-300 text-[#00badb] focus:ring-[#00badb]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">{siswa.nama}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        NISN: {siswa.nisn} · {siswa.kelas} · {siswa.program}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400">
                {selectedStudentIds.length} siswa dipilih
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setAddStudentsOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs px-4 py-2 rounded-xl"
                >
                  BATAL
                </Button>
                <Button
                  onClick={handleAddStudents}
                  disabled={selectedStudentIds.length === 0 || addStudentsLoading}
                  className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md shadow-purple-200/40 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addStudentsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  TAMBAH
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Unassigned Students Modal ── */}
      {unassignedOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-amber-500" />
                  Siswa Belum Dapat Kelas
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  Siswa yang kelasnya masih berupa level (X, XI, XII) dan belum di-assign ke rombel spesifik
                </p>
              </div>
              <button
                onClick={() => setUnassignedOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            {/* Assign Controls */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-black text-slate-500 uppercase">Assign Ke:</label>
                <select
                  value={assignTargetRombel}
                  onChange={(e) => {
                    setAssignTargetRombel(e.target.value);
                    setAssignSelectedIds([]);
                  }}
                  className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:border-[#280f91] shadow-xs cursor-pointer"
                >
                  <option value="">Pilih Rombel</option>
                  {rombels.slice().sort((a, b) => a.nama.localeCompare(b.nama, undefined, { numeric: true })).map((r) => (
                    <option key={r.id} value={r.nama}>{r.nama}</option>
                  ))}
                </select>
                {assignTargetRombel && (
                  <span className="text-[10px] font-bold text-amber-600">
                    Siswa kelas {getLevel(assignTargetRombel)} saja
                  </span>
                )}
              </div>
              <Button
                onClick={handleAssignToRombel}
                disabled={!assignTargetRombel || assignSelectedIds.length === 0 || assigning}
                className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                ASSIGN ({assignSelectedIds.length})
              </Button>
              <div className="flex-1" />
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari siswa..."
                  value={unassignedSearch}
                  onChange={(e) => setUnassignedSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-xs border border-slate-200 rounded-xl bg-white font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <Button
                onClick={() => setAssignSelectedIds(filteredUnassigned.map((s) => s.id))}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-[10px] px-3 rounded-xl"
              >
                Pilih Semua
              </Button>
              <Button
                onClick={() => setAssignSelectedIds([])}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-[10px] px-3 rounded-xl"
              >
                Reset
              </Button>
            </div>

            {/* Student List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {filteredUnassigned.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-emerald-400 mb-3" />
                  <p className="text-sm font-black text-slate-500 uppercase">Semua Sudah Dapat Kelas</p>
                  <p className="text-xs text-slate-400 mt-1">Tidak ada siswa yang belum di-assign ke rombel</p>
                </div>
              ) : (
                filteredUnassigned.map((siswa) => (
                  <label
                    key={siswa.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${assignSelectedIds.includes(siswa.id)
                        ? "bg-amber-50 border border-amber-200"
                        : "hover:bg-slate-50 border border-transparent"
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={assignSelectedIds.includes(siswa.id)}
                      onChange={() => toggleAssignStudent(siswa.id)}
                      className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">{siswa.nama}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        NISN: {siswa.nisn} · Kelas: <span className="text-amber-600 font-black">{siswa.kelas}</span> · {siswa.program}
                      </p>
                    </div>
                    <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                      {siswa.kelas}
                    </span>
                  </label>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <p className="text-xs font-bold text-slate-400">
                {filteredUnassigned.length} siswa belum dapat kelas · {assignSelectedIds.length} dipilih
              </p>
              <Button
                onClick={() => setUnassignedOpen(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs px-4 py-2 rounded-xl"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rombel Tanpa Wali Kelas Modal ── */}
      {noWaliModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-rose-50/50">
              <div>
                <h3 className="text-base font-black text-rose-900 uppercase tracking-tight flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-rose-600" /> ROMBEL TANPA WALI KELAS
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Daftar rombongan belajar yang belum memiliki penugasan wali kelas (tutor).
                </p>
              </div>
              <button
                onClick={() => setNoWaliModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {(() => {
                const unassignedRombels = rombels.filter((r) => !r.waliKelas && !r.waliKelasId);
                if (unassignedRombels.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                      <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <UserCheck className="h-8 w-8" />
                      </div>
                      <h4 className="font-black text-slate-800 text-sm uppercase">Semua Rombel Sudah Memiliki Wali Kelas</h4>
                      <p className="text-xs text-slate-500 max-w-sm font-semibold">
                        Seluruh rombongan belajar telah terhubung dengan tutor wali kelas masing-masing.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {unassignedRombels.map((rombel) => {
                      const progBadge = deriveProgramFromKelas(rombel.nama);
                      const currentSelectedTutor = selectedWaliAssignments[rombel.id] || null;

                      return (
                        <div
                          key={rombel.id}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-800 text-sm uppercase">{rombel.nama}</span>
                              {progBadge && (
                                <span className="bg-purple-100 text-purple-700 font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase">
                                  {progBadge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-semibold">
                              Jumlah Siswa: <span className="font-black text-slate-700">{rombel.jumlahSiswa}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <select
                              value={currentSelectedTutor || ""}
                              onChange={(e) =>
                                setSelectedWaliAssignments({
                                  ...selectedWaliAssignments,
                                  [rombel.id]: e.target.value ? Number(e.target.value) : null,
                                })
                              }
                              className="h-9 px-3 text-xs font-bold border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:border-cyan-500 flex-1 sm:w-60 cursor-pointer"
                            >
                              <option value="">PILIH WALI KELAS (TUTOR)...</option>
                              {tutors.map((tutor) => (
                                <option key={tutor.id} value={tutor.id}>
                                  {tutor.nama} ({tutor.tutorMapel || "Tutor"})
                                </option>
                              ))}
                            </select>

                            <Button
                              disabled={!currentSelectedTutor || assigningWaliId === rombel.id}
                              onClick={() => handleQuickAssignWali(rombel, currentSelectedTutor)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 h-9 rounded-xl shadow-xs cursor-pointer uppercase shrink-0 transition-all active:scale-95 disabled:opacity-50"
                            >
                              {assigningWaliId === rombel.id ? "Menyimpan..." : "SIMPAN"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <p className="text-xs font-bold text-slate-400">
                {rombels.filter((r) => !r.waliKelas && !r.waliKelasId).length} rombel belum ada wali kelas
              </p>
              <Button
                onClick={() => setNoWaliModalOpen(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs px-4 py-2 rounded-xl cursor-pointer"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
