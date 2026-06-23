import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { parseCSV, downloadCSV, mapCsvRows, parseExcel } from "@/lib/utils";
import { ShieldAlert, Search, Upload, Download, Plus, Trash2, Save, X, Eye, EyeOff, GraduationCap, ArrowUpCircle, RefreshCw, List, LayoutGrid, Filter, RotateCcw, Loader2 } from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { toast } from "sonner";

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
  rombels?: { id: number; nama: string }[];
}

interface Rombel {
  id: number;
  nama: string;
  jumlahSiswa: number;
}

const KELAS_BY_PROGRAM: Record<string, string[]> = {
  "PAKET A": ["KELAS I", "KELAS II", "KELAS III", "KELAS IV", "KELAS V", "KELAS VI"],
  "PAKET B": ["KELAS VII", "KELAS VIII", "KELAS IX"],
  "PAKET C": ["KELAS X", "KELAS XI", "KELAS XII"],
};

const NEXT_PROGRAM: Record<string, string> = {
  "PAKET A": "PAKET B",
  "PAKET B": "PAKET C",
};

export default function WargaBelajarManager() {
  const confirm = useConfirm();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  // Rombel filter
  const [rombels, setRombels] = useState<Rombel[]>([]);
  const [selectedRombelId, setSelectedRombelId] = useState<number | null>(null);

  // Multi-select & bulk actions
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkContinueOpen, setBulkContinueOpen] = useState(false);

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
    const token = localStorage.getItem("token");
    fetch("/api/rombels", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => { if (data.success && data.data) setRombels(data.data); })
      .catch((err) => console.error("Failed to load rombels:", err));
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
    setSelectedRombelId(null);
    setSelectedStudentIds([]);
  };

  // Cek apakah siswa sudah di akhir program (untuk sembunyikan "Melanjutkan Program")
  const MAX_GRADE: Record<string, number> = { "PAKET A": 6, "PAKET B": 9, "PAKET C": 12 };
  const romanKeys = ["XII","XI","X","IX","VIII","VII","VI","V","IV","III","II","I"];
  const romanMap: Record<string, number> = { I:1,II:2,III:3,IV:4,V:5,VI:6,VII:7,VIII:8,IX:9,X:10,XI:11,XII:12 };

  const getGradeFromKelas = (kelas: string): number => {
    const upper = (kelas || "").toUpperCase().trim();
    for (const r of romanKeys) {
      if (upper.startsWith(r) || upper.includes(r)) return romanMap[r];
    }
    return 0;
  };

  const isAtEndOfProgram = (student: Student): boolean => {
    const program = (student.program || "").toUpperCase().trim();
    const maxGrade = MAX_GRADE[program];
    if (!maxGrade) return false;
    // Cek dari field kelas student atau dari rombel name
    const gradeFromClass = getGradeFromKelas(student.kelas || "");
    if (gradeFromClass > 0) return gradeFromClass >= maxGrade;
    // Fallback: cek dari rombel
    if (student.rombels && student.rombels.length > 0) {
      const gradeFromRombel = getGradeFromKelas(student.rombels[0].nama || "");
      return gradeFromRombel >= maxGrade;
    }
    return false;
  };

  // CSV Export
  const handleExportCSV = () => {
    if (students.length === 0) {
      toast.error("Tidak ada data untuk diekspor!");
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
    downloadCSV(headers, rows, "warga_belajar.csv");
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
        { key: "nik", aliases: ["nik", "identitas"], defaultIndex: 1 },
        { key: "program", aliases: ["program", "paket"], defaultIndex: 2 },
        { key: "kelas", aliases: ["kelas", "tingkatan", "grade"], defaultIndex: 3 },
        { key: "nisn", aliases: ["nisn"], defaultIndex: 4 },
        { key: "nis", aliases: ["nis"], defaultIndex: 5 },
        { key: "tempatTglLahir", aliases: ["tempat/tgl lahir", "tempat lahir", "tanggal lahir", "tempat tgllahir", "birth"], defaultIndex: 6 },
        { key: "titikLayanan", aliases: ["titik layanan", "titiklayanan", "tupok", "lokasi"], defaultIndex: 7 },
        { key: "jenisKelamin", aliases: ["jenis kelamin", "gender", "jk"], defaultIndex: 8 },
        { key: "noHp", aliases: ["no. hp", "no hp", "hp", "telepon", "phone"], defaultIndex: 9 },
        { key: "agama", aliases: ["agama", "religion"], defaultIndex: 10 },
        { key: "namaAyah", aliases: ["nama ayah", "ayah", "father"], defaultIndex: 11 },
        { key: "email", aliases: ["email", "e-mail"], defaultIndex: 12 },
        { key: "namaIbu", aliases: ["nama ibu", "ibu", "mother"], defaultIndex: 13 },
        { key: "alamat", aliases: ["alamat", "address"], defaultIndex: 14 },
        { key: "foto", aliases: ["foto", "photo", "image", "gambar"], defaultIndex: 15 },
        { key: "status", aliases: ["status", "keaktifan"], defaultIndex: 16 },
      ]);

      const importedData = mapped
        .filter((item) => item.nama)
        .map((item) => ({
          nama: item.nama,
          nik: item.nik || "",
          program: item.program || "",
          kelas: item.kelas || "",
          nisn: item.nisn || "",
          nis: item.nis || "",
          tempatTglLahir: item.tempatTglLahir || "",
          titikLayanan: item.titikLayanan || "",
          jenisKelamin: item.jenisKelamin || "",
          noHp: item.noHp || "",
          agama: item.agama || "",
          namaAyah: item.namaAyah || "",
          email: item.email || "",
          namaIbu: item.namaIbu || "",
          alamat: item.alamat || "",
          foto: item.foto || "",
          status: item.status || "AKTIF",
        }));

      if (importedData.length === 0) {
        toast.error("Format data kosong atau tidak valid!");
        return;
      }

      const token = localStorage.getItem("token");
      const res = await fetch("/api/students/import", {
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
        fetchStudents();
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama) {
      toast.error("Nama wajib diisi!");
      return;
    }

    setSaving(true);
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
        toast.success(isAdding ? "Warga belajar berhasil ditambahkan" : "Data warga belajar berhasil diperbarui");
        setFormOpen(false);
        fetchStudents();
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

  const handleDelete = async (id: number) => {
    if (!await confirm({
      title: "Konfirmasi Hapus",
      message: "Apakah Anda yakin ingin menghapus data warga belajar ini?",
      variant: "danger"
    })) return;

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
        toast.success("Data warga belajar berhasil dihapus");
        setFormOpen(false);
        fetchStudents();
      } else {
        toast.error("Gagal menghapus data: " + (data.message || "Error tidak diketahui"));
      }
    } catch (e) {
      console.error(e);
      toast.error("Terjadi kesalahan sistem saat menghapus");
    }
  };

  // Promote (Naikkan Kelas)
  const handlePromote = async (id: number) => {
    if (!await confirm({
      title: "Konfirmasi Kenaikan Kelas",
      message: "Apakah Anda yakin ingin menaikkan tingkat kelas warga belajar ini?",
    })) return;

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
        toast.success("Tingkat kelas berhasil dinaikkan!");
        setFormOpen(false);
        fetchStudents();
      } else {
        toast.error("Gagal memproses kenaikan kelas: " + (data.message || ""));
      }
    } catch (e) {
      console.error(e);
      toast.error("Terjadi kesalahan sistem atau koneksi saat memproses kenaikan kelas.");
    }
  };

  // Graduate (Luluskan)
  const handleGraduate = async (id: number) => {
    if (!await confirm({
      title: "Konfirmasi Kelulusan",
      message: "Apakah Anda yakin ingin meluluskan warga belajar ini?",
    })) return;

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
        toast.success("Warga belajar telah dinyatakan lulus!");
        setFormOpen(false);
        fetchStudents();
      } else {
        toast.error("Gagal meluluskan warga belajar: " + (data.message || ""));
      }
    } catch (e) {
      console.error(e);
      toast.error("Terjadi kesalahan sistem atau koneksi saat meluluskan warga belajar.");
    }
  };

  // Continue (Melanjutkan Program)
  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const currentProg = (selectedStudent.program || "").toUpperCase().trim();
    const targetProg = NEXT_PROGRAM[currentProg];
    const targetKelas = KELAS_BY_PROGRAM[targetProg]?.[0] || "";
    if (!targetProg) {
      toast.error("Program saat ini sudah maksimal (Paket C)");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/students/${selectedStudent.id}/continue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          program: targetProg,
          kelas: targetKelas,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Warga belajar berhasil dipindahkan ke program baru!");
        setContinueOpen(false);
        setFormOpen(false);
        fetchStudents();
      } else {
        toast.error("Gagal memproses kelanjutan program: " + (data.message || ""));
      }
    } catch (e) {
      console.error(e);
      toast.error("Terjadi kesalahan sistem atau koneksi saat memproses kelanjutan program.");
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
    const matchesRombel =
      !selectedRombelId || (student.rombels && student.rombels.some((r) => r.id === selectedRombelId));
    const matchesStatus = student.status !== "LULUS";
    return matchesName && matchesNik && matchesKelas && matchesProgram && matchesRombel && matchesStatus;
  });

  // Multi-select helpers
  const toggleStudentSelection = (id: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const isAllFilteredSelected = filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedStudentIds.includes(s.id));

  const toggleSelectAllFiltered = () => {
    const allIds = filteredStudents.map((s) => s.id);
    if (isAllFilteredSelected) {
      setSelectedStudentIds((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...allIds])));
    }
  };

  // Bulk action handlers
  const handleBulkPromote = async () => {
    if (!await confirm({
      title: "Konfirmasi Kenaikan Kelas",
      message: `Apakah Anda yakin ingin menaikkan kelas ${selectedStudentIds.length} warga belajar?`,
    })) return;

    setBulkActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/students/bulk/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentIds: selectedStudentIds }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Berhasil menaikkan kelas ${data.promoted} siswa${data.skipped > 0 ? ` (${data.skipped} dilewati)` : ""}`);
        setSelectedStudentIds([]);
        fetchStudents();
      } else {
        toast.error(data.message || "Gagal menaikkan kelas");
      }
    } catch {
      toast.error("Terjadi kesalahan saat memproses kenaikan kelas");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkGraduate = async () => {
    if (!await confirm({
      title: "Konfirmasi Kelulusan",
      message: `Apakah Anda yakin ingin meluluskan ${selectedStudentIds.length} warga belajar?`,
      variant: "danger",
    })) return;

    setBulkActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/students/bulk/graduate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentIds: selectedStudentIds }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Berhasil meluluskan ${data.graduated} warga belajar`);
        setSelectedStudentIds([]);
        fetchStudents();
      } else {
        toast.error(data.message || "Gagal meluluskan");
      }
    } catch {
      toast.error("Terjadi kesalahan saat meluluskan");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    // Filter hanya siswa yang di akhir program
    const eligibleIds = selectedStudentIds.filter((id) => {
      const s = students.find((st) => st.id === id);
      return s && isAtEndOfProgram(s) && s.status !== "LULUS";
    });
    if (eligibleIds.length === 0) {
      toast.error("Tidak ada siswa yang berada di akhir program");
      return;
    }
    // Auto-compute program & kelas dari eligible students
    const eligibleStudents = eligibleIds
      .map((id) => students.find((st) => st.id === id))
      .filter((s): s is Student => !!s);
    const currentPrograms = [...new Set(eligibleStudents.map((s) => (s.program || "").toUpperCase().trim()))];
    if (currentPrograms.length > 1) {
      toast.error("Tidak bisa melanjutkan program campuran. Pastikan semua siswa yang dipilih berada di program yang sama.");
      return;
    }
    const targetProgram = NEXT_PROGRAM[currentPrograms[0]];
    const targetKelas = KELAS_BY_PROGRAM[targetProgram]?.[0] || "";
    if (!targetProgram) {
      toast.error("Program saat ini sudah maksimal (Paket C)");
      return;
    }
    setBulkActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/students/bulk/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          studentIds: eligibleIds,
          program: targetProgram,
          kelas: targetKelas,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Berhasil memproses ${data.continued} warga belajar`);
        setBulkContinueOpen(false);
        setSelectedStudentIds([]);
        fetchStudents();
      } else {
        toast.error(data.message || "Gagal memproses");
      }
    } catch {
      toast.error("Terjadi kesalahan saat memproses kelanjutan program");
    } finally {
      setBulkActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 relative pb-16 animate-in fade-in duration-300">

      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-cyan-900 tracking-tight flex items-center gap-2">
            <span>🎓</span> KELOLA WARGA BELAJAR
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Kelola warga belajar (siswa), kelas, kenaikan tingkat kelas, status kelulusan, dan penugasan program.
          </p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 items-center">
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

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              value={selectedRombelId || ""}
              onChange={(e) => setSelectedRombelId(e.target.value ? Number(e.target.value) : null)}
              className="w-full h-10 pl-9 pr-4 text-xs font-bold border border-slate-200 rounded-xl bg-white text-slate-850 focus:outline-none focus:ring-2 focus:ring-purple-400 uppercase appearance-none cursor-pointer"
            >
              <option value="">SEMUA ROMBEL</option>
              {rombels.slice().sort((a, b) => {
                const roman: Record<string, number> = { I:1, II:2, III:3, IV:4, V:5, VI:6, VII:7, VIII:8, IX:9, X:10, XI:11, XII:12 };
                const romanKeys = Object.keys(roman).sort((a, b) => b.length - a.length);
                const getGrade = (n: string) => {
                  const upper = n.toUpperCase();
                  for (const r of romanKeys) {
                    if (upper.startsWith(r)) return roman[r];
                  }
                  return 0;
                };
                const getSection = (n: string) => {
                  const upper = n.toUpperCase();
                  for (const r of romanKeys) {
                    if (upper.startsWith(r)) return upper.slice(r.length);
                  }
                  return upper;
                };
                const ga = getGrade(a.nama), gb = getGrade(b.nama);
                if (ga !== gb) return ga - gb;
                const sa = getSection(a.nama), sb = getSection(b.nama);
                return sa.localeCompare(sb);
              }).map((r) => (
                <option key={r.id} value={r.id}>{r.nama} ({r.jumlahSiswa} siswa)</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 md:col-span-5 justify-end items-center flex-wrap">
            <input
              type="file"
              ref={importInputRef}
              className="hidden"
              accept=".csv, .xlsx, .xls"
              onChange={handleImportCSV}
            />
            <Button
              onClick={() => importInputRef.current?.click()}
              className="rounded-xl bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-[10px] px-4 h-10 cursor-pointer transition-all shadow-md flex items-center gap-1.5 active:scale-95"
            >
              <Upload className="h-4 w-4" /> UPLOAD CSV / EXCEL
            </Button>
            <Button
              onClick={handleExportCSV}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-4 h-10 cursor-pointer transition-all shadow-md flex items-center gap-1.5 active:scale-95"
            >
              <Download className="h-4 w-4" /> DOWNLOAD CSV
            </Button>
            <Button
              onClick={openAddForm}
              className="rounded-xl bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs px-5 h-10 cursor-pointer transition-all shadow-md shadow-purple-200 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> TAMBAH WB
            </Button>
            <Button
              onClick={handleSearch}
              className="w-32 h-10 rounded-xl bg-[#00badb] hover:bg-[#009cb9] text-white font-extrabold text-xs cursor-pointer tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all uppercase"
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
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer" title="Pilih semua">
                <input
                  type="checkbox"
                  checked={isAllFilteredSelected}
                  onChange={toggleSelectAllFiltered}
                  className="h-4 w-4 rounded border-slate-300 cursor-pointer accent-[#9c27b0]"
                />
              </label>
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
            {selectedStudentIds.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold text-cyan-700 uppercase tracking-wider bg-cyan-100 px-2.5 py-1 rounded-full">
                  {selectedStudentIds.length} dipilih
                </span>
                <Button
                  onClick={() => setSelectedStudentIds([])}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-[10px] px-3 h-8 rounded-xl cursor-pointer"
                >
                  BATAL
                </Button>
                <Button
                  onClick={handleBulkPromote}
                  disabled={bulkActionLoading}
                  className="rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-[10px] px-3 h-8 flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <ArrowUpCircle className="h-3.5 w-3.5" /> NAIKKAN KELAS
                </Button>
                {(() => {
                  const selectedEndStudents = filteredStudents.filter(
                    (s) => selectedStudentIds.includes(s.id) && isAtEndOfProgram(s) && s.status !== "LULUS"
                  );
                  return selectedEndStudents.length > 0 ? (
                    <Button
                      onClick={() => setBulkContinueOpen(true)}
                      disabled={bulkActionLoading}
                      className="rounded-xl bg-[#ffb300] hover:bg-amber-600 text-white font-extrabold text-[10px] px-3 h-8 flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> MELANJUTKAN PROGRAM
                    </Button>
                  ) : null;
                })()}
                <Button
                  onClick={handleBulkGraduate}
                  disabled={bulkActionLoading}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-3 h-8 flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <GraduationCap className="h-3.5 w-3.5" /> LULUSKAN
                </Button>
              </div>
            )}
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
                        {/* Selection Checkbox */}
                        <div
                          className="absolute top-3 right-3 z-10"
                          onClick={(e) => { e.stopPropagation(); toggleStudentSelection(student.id); }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={() => toggleStudentSelection(student.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 rounded border-slate-300 cursor-pointer accent-cyan-600"
                          />
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
                      <tr className="bg-[#00badb] text-white font-black text-sm uppercase">
                        <th className="p-4 w-12 text-center border-r border-[#009cb9]">
                          <input
                            type="checkbox"
                            checked={isAllFilteredSelected}
                            onChange={toggleSelectAllFiltered}
                            className="h-4 w-4 rounded border-slate-300 cursor-pointer accent-white"
                          />
                        </th>
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
                          <td className="p-4 text-center border-r border-slate-100">
                            <input
                              type="checkbox"
                              checked={selectedStudentIds.includes(student.id)}
                              onChange={() => toggleStudentSelection(student.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-4 w-4 rounded border-slate-300 cursor-pointer accent-cyan-600"
                            />
                          </td>
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
          <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-4xl animate-in zoom-in-95 duration-200 border-4 border-cyan-400 z-10">
            {/* Form Column (Cyan Background) */}
            <div className="bg-[#00badb] p-3 relative text-white">
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
                    {isAtEndOfProgram(selectedStudent) && (
                      <Button
                        type="button"
                        onClick={() => setContinueOpen(true)}
                        disabled={selectedStudent.status === "LULUS"}
                        className="rounded-xl bg-[#ffb300] hover:bg-amber-600 text-white font-extrabold text-[10px] px-3.5 h-9 flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> MELANJUTKAN PROGRAM
                      </Button>
                    )}
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
                <div className="flex flex-col lg:flex-row gap-4">

                  {/* LEFT COLUMN: FORM INPUT PANEL */}
                  <div className="flex-1 lg:min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1.5">

                      {/* Row 1: NAMA | NIK */}
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">NAMA</label>
                        <input
                          type="text"
                          required
                          placeholder="Nama lengkap warga belajar"
                          value={formData.nama || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                          className="w-full h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">NIK</label>
                        <input
                          type="text"
                          placeholder="Nomor Induk Kependudukan (16 digit)"
                          value={formData.nik || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, nik: e.target.value }))}
                          className="w-full h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                        />
                      </div>

                      {/* Row 2: PROGRAM | KELAS */}
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">PROGRAM</label>
                        <select
                          value={formData.program || "PAKET C"}
                          onChange={(e) => {
                            const prog = e.target.value;
                            const kelasList = KELAS_BY_PROGRAM[prog];
                            setFormData(prev => ({ ...prev, program: prog, kelas: kelasList[0] }));
                          }}
                          className="w-full h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 transition-colors"
                        >
                          <option value="PAKET A">PAKET A</option>
                          <option value="PAKET B">PAKET B</option>
                          <option value="PAKET C">PAKET C</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">KELAS</label>
                        <select
                          value={formData.kelas || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, kelas: e.target.value }))}
                          className="w-full h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 transition-colors"
                        >
                          {(KELAS_BY_PROGRAM[formData.program || "PAKET C"] || []).map((k) => (
                            <option key={k} value={k}>{k}</option>
                          ))}
                        </select>
                      </div>

                      {/* Row 3: NISN | NIS */}
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">NISN</label>
                        <input
                          type="text"
                          placeholder="Nomor Induk Siswa Nasional"
                          value={formData.nisn || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, nisn: e.target.value }))}
                          className="w-full h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">NIS</label>
                        <input
                          type="text"
                          placeholder="Nomor Induk Siswa"
                          value={formData.nis || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, nis: e.target.value }))}
                          className="w-full h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                        />
                      </div>

                      {/* Row 4: TEMPAT, TGL. LAHIR | JENIS KELAMIN */}
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">TEMPAT, TGL. LAHIR</label>
                        <input
                          type="text"
                          placeholder="Contoh: Ciamis, 05-02-2008"
                          value={formData.tempatTglLahir || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, tempatTglLahir: e.target.value }))}
                          className="w-full h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">JENIS KELAMIN</label>
                        <select
                          value={formData.jenisKelamin || "Laki-laki"}
                          onChange={(e) => setFormData(prev => ({ ...prev, jenisKelamin: e.target.value }))}
                          className="w-full h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 transition-colors"
                        >
                          <option value="Laki-laki">Laki-laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                      </div>

                      {/* Row 5: AGAMA | EMAIL */}
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">AGAMA</label>
                        <input
                          type="text"
                          placeholder="Agama"
                          value={formData.agama || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, agama: e.target.value }))}
                          className="w-full h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-850 placeholder-slate-400 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">EMAIL</label>
                        <input
                          type="email"
                          placeholder="Alamat email warga belajar"
                          value={formData.email || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full h-9 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-850 placeholder-slate-400 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                        />
                      </div>

                      {/* Row 6: ALAMAT (full width) */}
                      <div className="flex flex-col gap-0.5 sm:col-span-2">
                        <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">ALAMAT</label>
                        <textarea
                          placeholder="Alamat tempat tinggal lengkap warga belajar"
                          value={formData.alamat || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, alamat: e.target.value }))}
                          className="w-full p-2.5 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 resize-none transition-colors"
                          rows={2}
                        />
                      </div>

                      {/* Row 7: TITIK LAYANAN | NO. HP */}
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">TITIK LAYANAN</label>
                        <input
                          type="text"
                          placeholder="Titik layanan belajar"
                          value={formData.titikLayanan || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, titikLayanan: e.target.value }))}
                          className="w-full h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">NO. HP</label>
                        <input
                          type="text"
                          placeholder="Nomor Handphone aktif"
                          value={formData.noHp || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, noHp: e.target.value }))}
                          className="w-full h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                        />
                      </div>

                      {/* Row 8: NAMA AYAH | NAMA IBU */}
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">NAMA AYAH</label>
                        <input
                          type="text"
                          placeholder="Nama lengkap ayah kandung"
                          value={formData.namaAyah || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, namaAyah: e.target.value }))}
                          className="w-full h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">NAMA IBU</label>
                        <input
                          type="text"
                          placeholder="Nama lengkap ibu kandung"
                          value={formData.namaIbu || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, namaIbu: e.target.value }))}
                          className="w-full h-7 px-3 text-xs font-black border-2 border-white rounded-lg bg-white text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                        />
                      </div>

                      {/* Row 9: PASSWORD (full width) */}
                      <div className="flex flex-col gap-0.5 sm:col-span-2">
                        <label className="text-xs font-black text-cyan-50 uppercase tracking-wide">
                          PASSWORD AKUN LOGIN {!isAdding && "(KOSONGKAN JIKA TIDAK INGIN MENGUBAH)"}
                        </label>
                        <div className="relative">
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

                  {/* RIGHT COLUMN: Drag & Drop Photo + Additional Status info */}
                  <div className="lg:w-[240px] lg:shrink-0 w-full flex flex-col gap-4">

                    {/* PHOTO UPLOADER */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-cyan-50 uppercase tracking-wider block">FOTO PROFIL WB</label>
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-2.5 text-center transition-all ${
                          dragActive ? "border-yellow-300 bg-yellow-50/20" : "border-white/30 bg-white/10 hover:bg-white/20"
                        } h-44 flex flex-col justify-center items-center relative overflow-hidden`}
                      >
                        {formData.foto ? (
                          <div className="w-full h-full relative group">
                            <img
                              src={formData.foto}
                              alt="Student Preview"
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, foto: "" }))}
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
                      <p className="text-[9px] font-medium text-white/70 italic text-center">
                        * Maks 5MB
                      </p>
                      <input type="text" placeholder="atau masukkan URL foto..."
                        value={formData.foto || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, foto: e.target.value }))}
                        className="w-full text-[11px] font-semibold border border-transparent rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-purple-400 focus:outline-none bg-white text-slate-800"
                      />
                    </div>

                    {/* Additional Info / Status */}
                    <div className="bg-white/10 p-3 rounded-xl border border-white/10 space-y-2.5 text-left text-white">
                      <span className="block text-[9px] font-black text-yellow-300 tracking-wider uppercase border-b border-white/20 pb-1.5">Info Akademik & Status</span>

                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-cyan-100 uppercase">STATUS WARGA BELAJAR</label>
                        <select
                          value={formData.status || "AKTIF"}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full h-8 px-2 text-[11px] border-0 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400 font-bold bg-white text-slate-800"
                        >
                          <option value="AKTIF">AKTIF</option>
                          <option value="LULUS">LULUS (ALUMNI)</option>
                        </select>
                      </div>

                      <div className="text-[8px] text-cyan-100/85 leading-relaxed font-semibold pt-1 border-t border-white/15 space-y-1">
                        <span className="block font-black text-[8px] text-yellow-300 uppercase tracking-wide">Catatan Penting:</span>
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
                      className="bg-rose-600 hover:bg-rose-700 text-white border-0 font-extrabold text-sm px-6 h-11 rounded-xl cursor-pointer shadow-md shadow-rose-900/30 uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Trash2 className="h-4 w-4" /> HAPUS
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={saving || uploading}
                    className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-sm px-8 h-11 rounded-xl cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5"
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
                  Pindahkan warga belajar ini ke program yang lebih tinggi.
                </p>

                {selectedStudent && (() => {
                  const currentProg = (selectedStudent.program || "").toUpperCase().trim();
                  const targetProg = NEXT_PROGRAM[currentProg];
                  const targetKelas = targetProg ? KELAS_BY_PROGRAM[targetProg]?.[0] : null;
                  return (
                    <div className="bg-white/10 rounded-xl px-4 py-3 space-y-2 text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-cyan-50 uppercase">Program Saat Ini</span>
                        <span className="text-xs font-black">{currentProg}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowUpCircle className="h-4 w-4 text-emerald-400" />
                        <span className="text-[10px] font-black text-cyan-50 uppercase">Program Baru</span>
                        <span className="text-xs font-black text-emerald-300">{targetProg || "Maksimal"}</span>
                      </div>
                      {targetKelas && (
                        <div className="flex items-center gap-2 pl-6">
                          <span className="text-[10px] font-black text-cyan-50 uppercase">Kelas Awal</span>
                          <span className="text-xs font-black">{targetKelas}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="border-t border-white/20 pt-4 flex justify-end gap-2 mt-4">
                  <Button
                    type="submit"
                    className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-sm px-6 h-11 rounded-xl cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    Pindahkan Program
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* BULK CONTINUATION DIALOG */}
      {bulkContinueOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setBulkContinueOpen(false)} />
          <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 border-4 border-cyan-400 z-10">
            <div className="bg-[#00badb] p-6 relative text-white text-left">
              <button
                onClick={() => setBulkContinueOpen(false)}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-4">
                <span className="inline-block bg-[#9c27b0] text-white font-extrabold text-[11px] px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                  Melanjutkan Program
                </span>
              </div>

              <form onSubmit={handleBulkContinue} className="space-y-4 text-slate-800">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-white/80 leading-normal">
                    Pindahkan warga belajar yang eligible ke program baru.
                  </p>
                  {(() => {
                    const eligibleCount = selectedStudentIds.filter((id) => {
                      const s = students.find((st) => st.id === id);
                      return s && isAtEndOfProgram(s) && s.status !== "LULUS";
                    }).length;
                    const skipped = selectedStudentIds.length - eligibleCount;
                    return (
                      <div className="bg-white/10 rounded-xl px-3 py-2 space-y-1">
                        <p className="text-[11px] font-bold text-emerald-300">
                          ✅ {eligibleCount} siswa eligible (di akhir program)
                        </p>
                        {skipped > 0 && (
                          <p className="text-[11px] font-bold text-amber-300">
                            ⚠️ {skipped} siswa dilewati (belum di akhir program)
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {(() => {
                  const eligibleStudents = selectedStudentIds
                    .map((id) => students.find((st) => st.id === id))
                    .filter((s): s is Student => !!s && isAtEndOfProgram(s) && s.status !== "LULUS");
                  const programs = [...new Set(eligibleStudents.map((s) => (s.program || "").toUpperCase().trim()))];
                  const targetProgram = programs.length === 1 ? NEXT_PROGRAM[programs[0]] : null;
                  const targetKelas = targetProgram ? KELAS_BY_PROGRAM[targetProgram]?.[0] : null;

                  return (
                    <div className="space-y-3.5 text-white">
                      <div className="bg-white/10 rounded-xl px-4 py-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-cyan-50 uppercase">Program Saat Ini</span>
                          <span className="text-xs font-black text-white">
                            {programs.length === 1 ? programs[0] : programs.join(" / ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ArrowUpCircle className="h-4 w-4 text-emerald-400" />
                          <span className="text-[10px] font-black text-cyan-50 uppercase">Program Baru</span>
                          <span className="text-xs font-black text-emerald-300">
                            {targetProgram || "Campuran program"}
                          </span>
                        </div>
                        {targetKelas && (
                          <div className="flex items-center gap-2 pl-6">
                            <span className="text-[10px] font-black text-cyan-50 uppercase">Kelas Awal</span>
                            <span className="text-xs font-black text-white">{targetKelas}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div className="border-t border-white/20 pt-4 flex justify-end gap-2 mt-4">
                  <Button
                    type="submit"
                    disabled={bulkActionLoading}
                    className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-sm px-6 h-11 rounded-xl cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {bulkActionLoading ? "MEMPROSES..." : "PINDAHKAN PROGRAM"}
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
