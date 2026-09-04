import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { downloadExcel, mapCsvRows, parseExcel } from "@/lib/utils";
import { ShieldAlert, Search, Upload, Download, Plus, Trash2, Save, X, Eye, EyeOff, GraduationCap, ArrowUpCircle, RefreshCw, List, LayoutGrid, Filter, Loader2, Edit3 } from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { uploadFile } from "@/lib/upload";
import { toast } from "sonner";
import BerkasUpload from "@/components/ui/BerkasUpload";

import { extractLevel } from "@/lib/kelas-helper";

interface Student {
  id: number;
  nama: string;
  nik: string;
  nisn: string;
  nis: string;
  program: string;
  kelas: string;
  tempatTglLahir: string;
  titikLayanan: string;
  jenisKelamin: string;
  noHp?: string;
  agama: string;
  namaAyah?: string;
  email?: string;
  namaIbu?: string;
  alamat: string;
  rt: string;
  rw: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  sekolahAsal?: string;
  status: string;
  foto: string;
  berkas: Record<string, string>;
  password: string;
  rombels?: { id: number; nama: string }[];
}

interface Rombel {
  id: number;
  nama: string;
  jumlahSiswa: number;
}

const NEXT_PROGRAM: Record<string, string> = {
  "PAKET A": "PAKET B",
  "PAKET B": "PAKET C",
};

const MAX_GRADE: Record<string, number> = { "PAKET A": 6, "PAKET B": 9, "PAKET C": 12 };

const FIRST_KELAS: Record<string, string> = {
  "PAKET A": "PAKET A 1",
  "PAKET B": "PAKET B 7",
  "PAKET C": "PAKET C 10",
};

const deriveProgramFromKelas = (kelasName?: string | null): string => {
  if (!kelasName) return "";
  const upper = kelasName.trim().toUpperCase();
  if (upper.startsWith("PAKET A")) return "PAKET A";
  if (upper.startsWith("PAKET B")) return "PAKET B";
  if (upper.startsWith("PAKET C")) return "PAKET C";
  return "";
};

export default function WargaBelajarManager() {
  const confirm = useConfirm();

  const WB_BERKAS_TYPES: { label: string; key: string }[] = [
    { label: "Formulir Pendaftaran", key: "formulir" },
    { label: "Surat Pernyataan", key: "pernyataan" },
    { label: "KK (Kartu Keluarga)", key: "kk" },
    { label: "KTP", key: "ktp" },
    { label: "Akta Lahir", key: "akta" },
    { label: "Ijazah Sebelumnya", key: "ijazah" },
  ];
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Search & Filters
  const [searchName, setSearchName] = useState("");
  const [searchNik, setSearchNik] = useState("");
  const [searchProgram, setSearchProgram] = useState("");

  // Form dialog states
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Continuation program dialog states
  const [continueOpen, setContinueOpen] = useState(false);

  // Upload dialog state
  const [showUploadDialog, setShowUploadDialog] = useState(false);

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
    kelas: "",
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
    rt: "",
    rw: "",
    desa: "",
    kecamatan: "",
    kabupaten: "",
    provinsi: "",
    sekolahAsal: "",
    password: "",
    foto: "",
    berkas: {},
    status: "AKTIF",
  });

  const [, setOriginalFormData] = useState<Partial<Student>>({});

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
    const token = localStorage.getItem("token");
    fetch("/api/students", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setStudents(data.data);
        }
      })
      .catch((err) => console.error("Failed to load students:", err))
      .finally(() => setLoading(false));
  };

  // Cek apakah siswa sudah di akhir program (untuk sembunyikan "Melanjutkan Program")
  const getGradeFromKelas = (kelas: string): number => extractLevel(kelas);

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

  // Excel Export
  const handleExportExcel = () => {
    const exportData = students.filter(s => s.status !== "LULUS");
    if (exportData.length === 0) {
      toast.error("Tidak ada data untuk diekspor!");
      return;
    }
    const headers = ["No","Nama","NIPD","JK","NISN","Tempat Lahir","Tanggal Lahir","NIK","Agama","Alamat","RT","RW","Desa","Kecamatan","Kabupaten","Provinsi","HP","E-Mail","Ayah","Ibu","Program","Rombel","Titik Layanan","Sekolah Asal"];
    const rows = exportData.map((s, i) => {
      const tempatTgl = (s.tempatTglLahir || "").split(",").map(p => p.trim());
      const tempat = tempatTgl[0] || "";
      const tglLahir = tempatTgl.length > 1 ? tempatTgl.slice(1).join(", ") : "";
      return [
        i + 1,
        s.nama || "",
        s.nis || "",
        s.jenisKelamin || "",
        s.nisn || "",
        tempat,
        tglLahir,
        s.nik || "",
        s.agama || "",
        s.alamat || "",
        s.rt || "",
        s.rw || "",
        s.desa || "",
        s.kecamatan || "",
        s.kabupaten || "",
        s.provinsi || "",
        s.noHp || "",
        s.email || "",
        s.namaAyah || "",
        s.namaIbu || "",
        s.program || "",
        s.kelas || "",
        s.titikLayanan || "",
        s.sekolahAsal || ""
      ];
    });
    downloadExcel(headers, rows, "warga_belajar.xlsx");
    toast.success("Berhasil mengekspor Excel");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    try {
      const rows = await parseExcel(file);

      const mapped = mapCsvRows(rows, [
        { key: "nama", aliases: ["nama", "name"], defaultIndex: 1 },
        { key: "nis", aliases: ["nis", "nipd"], defaultIndex: 2 },
        { key: "jenisKelamin", aliases: ["jenis kelamin", "gender", "jk"], defaultIndex: 3 },
        { key: "nisn", aliases: ["nisn"], defaultIndex: 4 },
        { key: "tempatLahir", aliases: ["tempat lahir", "tempat"], defaultIndex: 5 },
        { key: "tanggalLahir", aliases: ["tanggal lahir", "tgl lahir", "tanggal"], defaultIndex: 6 },
        { key: "nik", aliases: ["nik", "identitas"], defaultIndex: 7 },
        { key: "agama", aliases: ["agama", "religion"], defaultIndex: 8 },
        { key: "alamat", aliases: ["alamat", "address"], defaultIndex: 9 },
        { key: "rt", aliases: ["rt"], defaultIndex: 10 },
        { key: "rw", aliases: ["rw"], defaultIndex: 11 },
        { key: "desa", aliases: ["desa", "kelurahan"], defaultIndex: 12 },
        { key: "kecamatan", aliases: ["kecamatan"], defaultIndex: 13 },
        { key: "kabupaten", aliases: ["kabupaten", "kota"], defaultIndex: 14 },
        { key: "provinsi", aliases: ["provinsi"], defaultIndex: 15 },
        { key: "noHp", aliases: ["no. hp", "no hp", "hp", "telepon", "phone"], defaultIndex: 16 },
        { key: "email", aliases: ["email", "e-mail"], defaultIndex: 17 },
        { key: "namaAyah", aliases: ["nama ayah", "ayah", " ayah", "father"], defaultIndex: 18 },
        { key: "namaIbu", aliases: ["nama ibu", "ibu", "mother"], defaultIndex: 19 },
        { key: "program", aliases: ["program", "paket"], defaultIndex: 20 },
        { key: "kelas", aliases: ["rombel", "kelas", "tingkatan", "grade"], defaultIndex: 21 },
        { key: "titikLayanan", aliases: ["titik layanan", "titiklayanan", "tupok", "lokasi"], defaultIndex: 22 },
        { key: "sekolahAsal", aliases: ["sekolah asal", "sekolahasal", "asal sekolah"], defaultIndex: 23 },
        { key: "password", aliases: ["password", "kata sandi", "pass"], defaultIndex: 24 },
        { key: "foto", aliases: ["foto", "photo", "image", "gambar"], defaultIndex: -1 },
        { key: "status", aliases: ["status", "keaktifan"], defaultIndex: -1 },
      ]);

      const importedData = mapped
        .filter((item) => item.nama)
        .map((item) => {
          const tempat = item.tempatLahir || "";
          const tglLahir = item.tanggalLahir || "";
          const tempatTglLahir = [tempat, tglLahir].filter(Boolean).join(", ");
          return {
            nama: item.nama,
            nik: item.nik || "",
            program: item.program || "",
            kelas: item.kelas || "",
            nisn: item.nisn || "",
            nis: item.nis || "",
            tempatTglLahir,
            titikLayanan: item.titikLayanan || "",
            jenisKelamin: item.jenisKelamin || "",
            noHp: item.noHp || "",
            agama: item.agama || "",
            namaAyah: item.namaAyah || "",
            email: item.email || "",
            namaIbu: item.namaIbu || "",
            alamat: item.alamat || "",
            rt: item.rt || "",
            rw: item.rw || "",
            desa: item.desa || "",
            kecamatan: item.kecamatan || "",
            kabupaten: item.kabupaten || "",
            provinsi: item.provinsi || "",
            sekolahAsal: item.sekolahAsal || "",
            password: item.password || "",
            foto: item.foto || "",
            berkas: {},
            status: item.status || "AKTIF",
          };
        });

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
        setShowUploadDialog(false);
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
    setOriginalFormData({});
    setFormData({
      nama: "",
      nik: "",
      program: "PAKET C",
      kelas: "",
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
      rt: "",
      rw: "",
      desa: "",
      kecamatan: "",
      kabupaten: "",
      provinsi: "",
      sekolahAsal: "",
      password: "",
      foto: "",
      status: "AKTIF",
    });
    setIsEditing(true);
    setFormOpen(true);
  };

  const openEditForm = (student: Student) => {
    setIsAdding(false);
    setSelectedStudent(student);
    setOriginalFormData({ ...student, password: "" });
    const rawProg = (student.program || "").toUpperCase().trim();
    const derivedProg = deriveProgramFromKelas(student.kelas);
    const currentProgram = rawProg || derivedProg || "PAKET C";

    setFormData({
      ...student,
      program: currentProgram,
      password: "", // Keep empty to indicate unchanged unless typed
    });
    setIsEditing(false);
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
    try {
      const url = await uploadFile(file);
      setFormData((prev) => ({ ...prev, foto: url }));
      toast.success("Foto berhasil diunggah");
    } catch (err) {
      toast.error("Upload gagal: " + (err instanceof Error ? err.message : "Error tidak diketahui"));
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
    if (!formData.nik || formData.nik.length !== 16) {
      toast.error("NIK wajib diisi dan harus 16 digit!");
      return;
    }
    if (!formData.nisn) {
      toast.error("NISN wajib diisi!");
      return;
    }
    if (!formData.nis) {
      toast.error("NIS wajib diisi!");
      return;
    }
    if (!formData.email) {
      toast.error("Email wajib diisi!");
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
    const targetKelas = FIRST_KELAS[targetProg] || "";
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
      !searchName || student.nama.toLowerCase().includes(searchName.toLowerCase());
    const matchesNik =
      !searchNik || student.nik.includes(searchNik);
    const matchesProgram =
      !searchProgram || student.program.toLowerCase().includes(searchProgram.toLowerCase());
    const matchesRombel =
      !selectedRombelId || (student.rombels && student.rombels.some((r) => r.id === selectedRombelId));
    const matchesStatus = student.status !== "LULUS";
    return matchesName && matchesNik && matchesProgram && matchesRombel && matchesStatus;
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
    const targetKelas = FIRST_KELAS[targetProgram] || "";
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="CARI BERDASARKAN NAMA"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full h-10 pl-9 pr-4 text-xs border border-slate-200 rounded-xl bg-white font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner uppercase"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="CARI BERDASARKAN NIK"
                value={searchNik}
                onChange={(e) => setSearchNik(e.target.value)}
                className="w-full h-10 pl-9 pr-4 text-xs border border-slate-200 rounded-xl bg-white font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="CARI BERDASARKAN PROGRAM"
                value={searchProgram}
                onChange={(e) => setSearchProgram(e.target.value)}
                className="w-full h-10 pl-9 pr-4 text-xs border border-slate-200 rounded-xl bg-white font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <select
                value={selectedRombelId || ""}
                onChange={(e) => setSelectedRombelId(e.target.value ? Number(e.target.value) : null)}
                className="w-full h-10 pl-9 pr-4 text-xs font-bold border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner uppercase appearance-none cursor-pointer"
              >
                <option value="">SEMUA ROMBEL</option>
                {rombels.slice().sort((a, b) => a.nama.localeCompare(b.nama, undefined, { numeric: true })).map((r) => (
                  <option key={r.id} value={r.id}>{r.nama} ({r.jumlahSiswa} siswa)</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 md:col-span-3">
            <input
              type="file"
              ref={importInputRef}
              className="hidden"
              accept=".xlsx, .xls"
              onChange={handleImportExcel}
            />
            <Button
              onClick={() => setShowUploadDialog(true)}
              className="h-10 bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs px-4 rounded-xl cursor-pointer uppercase tracking-wider shadow-md shadow-purple-200/40 flex items-center justify-center gap-1.5 transition-all select-none active:scale-95"
            >
              <Upload className="h-4 w-4" /> UPLOAD EXCEL
            </Button>
            <Button
              onClick={handleExportExcel}
              className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 rounded-xl cursor-pointer uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Download className="h-4 w-4" /> DOWNLOAD EXCEL
            </Button>
            <Button
              onClick={openAddForm}
              className="h-10 bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs px-4 rounded-xl cursor-pointer shadow-md shadow-purple-200 uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" /> TAMBAH DATA
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
                  <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-[#00badb] text-white font-black text-sm uppercase">
                        <th className="py-4 px-6 w-14 text-center border-r border-[#009cb9]">
                          <input
                            type="checkbox"
                            checked={isAllFilteredSelected}
                            onChange={toggleSelectAllFiltered}
                            className="h-4 w-4 rounded border-slate-300 cursor-pointer accent-white"
                          />
                        </th>
                        <th className="py-4 px-6 w-16 text-center border-r border-[#009cb9]">NO</th>
                        <th className="py-4 px-6 border-r border-[#009cb9]">NAMA</th>
                        <th className="py-4 px-6 border-r border-[#009cb9] w-48 text-center">NIK</th>
                        <th className="py-4 px-6 border-r border-[#009cb9] w-36 text-center">PROGRAM</th>
                        <th className="py-4 px-6 border-r border-[#009cb9] w-24 text-center">KELAS</th>
                        <th className="py-4 px-6 border-r border-[#009cb9] w-36 text-center">NISN</th>
                        <th className="py-4 px-6 border-r border-[#009cb9] w-36 text-center">NIS</th>
                        <th className="py-4 px-6 text-center">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {filteredStudents.map((student, idx) => (
                        <tr
                          key={student.id}
                          onClick={() => openEditForm(student)}
                          className="hover:bg-cyan-50/20 cursor-pointer transition"
                        >
                          <td className="py-4 px-6 text-center border-r border-slate-100">
                            <input
                              type="checkbox"
                              checked={selectedStudentIds.includes(student.id)}
                              onChange={() => toggleStudentSelection(student.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-4 w-4 rounded border-slate-300 cursor-pointer accent-cyan-600"
                            />
                          </td>
                          <td className="py-4 px-6 text-center text-slate-500 font-mono border-r border-slate-100">{idx + 1}</td>
                          <td className="py-4 px-6 font-bold text-slate-800 border-r border-slate-100">{student.nama}</td>
                          <td className="py-4 px-6 text-center text-slate-600 font-mono border-r border-slate-100">{student.nik || "-"}</td>
                          <td className="py-4 px-6 text-center border-r border-slate-100 font-bold text-purple-700">{student.program}</td>
                          <td className="py-4 px-6 text-center border-r border-slate-100">{student.kelas}</td>
                          <td className="py-4 px-6 text-center border-r border-slate-100 font-mono">{student.nisn || "-"}</td>
                          <td className="py-4 px-6 text-center border-r border-slate-100 font-mono">{student.nis || "-"}</td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-block text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase text-white ${student.status === "LULUS" ? "bg-purple-600" : "bg-emerald-600"
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
          <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 border-4 border-cyan-400 z-10">
            {/* Form Column (Cyan Background) */}
            <div className="p-3 relative flex flex-col flex-1 min-h-0">
              {/* Close Button */}
              <button
                onClick={() => setFormOpen(false)}
                className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-3 pr-10 shrink-0">
                <span className="inline-block bg-[#9c27b0] text-white font-extrabold text-[11px] px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                  {isAdding ? "TAMBAH DATA" : (!isEditing ? `DETAIL DATA: ${selectedStudent?.nama}` : `EDIT DATA: ${selectedStudent?.nama}`)}
                </span>
              </div>

              {/* Special Actions Menu for Promoting / Graduating / Continuing */}
              {!isAdding && selectedStudent && !isEditing && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap gap-2.5 items-center justify-between mb-4 text-xs font-bold text-slate-700">
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

              <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 text-slate-800">
                <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0 overflow-y-auto pr-1 py-4 space-y-6">

                  {/* LEFT COLUMN: FORM INPUT PANEL */}
                  <div className="flex-1 lg:min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1.5">

                    {/* Row 1: NAMA | NIK */}
                    <div className="flex flex-col gap-0.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wide">NAMA <span className="text-rose-400">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="Nama lengkap warga belajar"
                        value={formData.nama || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                        className="w-full h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wide">NIK <span className="text-rose-400">*</span></label>
                      <input
                        type="text"
                        required
                        inputMode="numeric"
                        maxLength={16}
                        placeholder="Nomor Induk Kependudukan (16 digit)"
                        value={formData.nik || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, nik: e.target.value.replace(/\D/g, "").slice(0, 16) }))}
                        className="w-full h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                        disabled={!isEditing}
                      />
                    </div>

                    {/* Row 2: PROGRAM | KELAS */}
                    <div className="flex flex-col gap-0.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wide">PROGRAM <span className="text-rose-400">*</span></label>
                      <select
                        value={(formData.program || "PAKET C").toUpperCase()}
                        onChange={(e) => {
                          const newProg = e.target.value;
                          setFormData(prev => {
                            const currentRombelProg = deriveProgramFromKelas(prev.kelas);
                            let targetKelas = prev.kelas;
                            if (currentRombelProg !== newProg) {
                              // Cari rombel pertama di program baru
                              const matchingRombel = rombels.find(r => deriveProgramFromKelas(r.nama) === newProg);
                              targetKelas = matchingRombel ? matchingRombel.nama : "";
                            }
                            return {
                              ...prev,
                              program: newProg,
                              kelas: targetKelas
                            };
                          });
                        }}
                        className="w-full h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                        disabled={!isEditing}
                      >
                        <option value="PAKET A">PAKET A</option>
                        <option value="PAKET B">PAKET B</option>
                        <option value="PAKET C">PAKET C</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wide">ROMBEL</label>
                      <select
                        value={formData.kelas || ""}
                        onChange={(e) => {
                          const selectedRombel = e.target.value;
                          const derived = deriveProgramFromKelas(selectedRombel);
                          setFormData(prev => ({
                            ...prev,
                            kelas: selectedRombel,
                            program: derived || prev.program
                          }));
                        }}
                        className="w-full h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                        disabled={!isEditing}
                      >
                        <option value="">Pilih Rombel</option>
                        {["PAKET A", "PAKET B", "PAKET C"].map((progGroup) => {
                          const groupRombels = rombels
                            .filter((r) => deriveProgramFromKelas(r.nama) === progGroup)
                            .sort((a, b) => a.nama.localeCompare(b.nama));

                          if (groupRombels.length === 0) return null;

                          return (
                            <optgroup key={progGroup} label={`--- ${progGroup} ---`}>
                              {groupRombels.map((r) => (
                                <option key={r.id} value={r.nama}>
                                  {r.nama}
                                </option>
                              ))}
                            </optgroup>
                          );
                        })}
                        {/* Custom / Uncategorized Rombels */}
                        {rombels
                          .filter((r) => !deriveProgramFromKelas(r.nama))
                          .map((r) => (
                            <option key={r.id} value={r.nama}>
                              {r.nama}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Row 3: NISN | NIS */}
                    <div className="flex flex-col gap-0.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wide">NISN <span className="text-rose-400">*</span></label>
                      <input
                        type="text"
                        required
                        inputMode="numeric"
                        placeholder="Nomor Induk Siswa Nasional"
                        value={formData.nisn || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, nisn: e.target.value.replace(/\D/g, "") }))}
                        className="w-full h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wide">NIS <span className="text-rose-400">*</span></label>
                      <input
                        type="text"
                        required
                        inputMode="numeric"
                        placeholder="Nomor Induk Siswa"
                        value={formData.nis || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, nis: e.target.value.replace(/\D/g, "") }))}
                        className="w-full h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                        disabled={!isEditing}
                      />
                    </div>

                    {/* Row 4: TEMPAT, TGL. LAHIR | JENIS KELAMIN */}
                    <div className="flex flex-col gap-0.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wide">TEMPAT, TGL. LAHIR</label>
                      <input
                        type="text"
                        placeholder="Contoh: Ciamis, 05-02-2008"
                        value={formData.tempatTglLahir || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, tempatTglLahir: e.target.value }))}
                        className="w-full h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wide">JENIS KELAMIN</label>
                      <select
                        value={formData.jenisKelamin || "Laki-laki"}
                        onChange={(e) => setFormData(prev => ({ ...prev, jenisKelamin: e.target.value }))}
                        className="w-full h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                        disabled={!isEditing}
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>

                    {/* Row 5: AGAMA | EMAIL */}
                    <div className="flex flex-col gap-0.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wide">AGAMA</label>
                      <input
                        type="text"
                        placeholder="Agama"
                        value={formData.agama || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, agama: e.target.value }))}
                        className="w-full h-9 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-850 placeholder-slate-400 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wide">EMAIL <span className="text-rose-400">*</span></label>
                      <input
                        type="email"
                        required
                        placeholder="Alamat email warga belajar"
                        value={formData.email || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full h-9 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-850 placeholder-slate-400 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                        disabled={!isEditing}
                      />
                    </div>

                    {/* Row 6: ALAMAT JALAN (full width) */}
                    <div className="flex flex-col gap-0.5 sm:col-span-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wide">ALAMAT JALAN</label>
                      <textarea
                        placeholder="Alamat tempat tinggal warga belajar (nama jalan/dusun)"
                        value={formData.alamat || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, alamat: e.target.value }))}
                        className="w-full p-2.5 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 resize-none transition-colors"
                        rows={2}
                        disabled={!isEditing}
                      />
                    </div>

                    {/* Row 6b: RT, RW, Desa, Kecamatan, Kabupaten, Provinsi */}
                    <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-1.5">
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wide">RT</label>
                        <input type="text" maxLength={3} disabled={!isEditing} placeholder="001" value={formData.rt || ""} onChange={(e) => setFormData(prev => ({ ...prev, rt: e.target.value }))}
                          className="h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wide">RW</label>
                        <input type="text" maxLength={3} disabled={!isEditing} placeholder="002" value={formData.rw || ""} onChange={(e) => setFormData(prev => ({ ...prev, rw: e.target.value }))}
                          className="h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wide">DESA/KELURAHAN</label>
                        <input type="text" disabled={!isEditing} placeholder="Nama desa/kelurahan" value={formData.desa || ""} onChange={(e) => setFormData(prev => ({ ...prev, desa: e.target.value }))}
                          className="h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wide">KECAMATAN</label>
                        <input type="text" disabled={!isEditing} placeholder="Nama kecamatan" value={formData.kecamatan || ""} onChange={(e) => setFormData(prev => ({ ...prev, kecamatan: e.target.value }))}
                          className="h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wide">KABUPATEN/KOTA</label>
                        <input type="text" disabled={!isEditing} placeholder="Nama kabupaten/kota" value={formData.kabupaten || ""} onChange={(e) => setFormData(prev => ({ ...prev, kabupaten: e.target.value }))}
                          className="h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wide">PROVINSI</label>
                        <input type="text" disabled={!isEditing} placeholder="Nama provinsi" value={formData.provinsi || ""} onChange={(e) => setFormData(prev => ({ ...prev, provinsi: e.target.value }))}
                          className="h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors" />
                      </div>
                    </div>

                    {/* Row 7: TITIK LAYANAN | NO. HP */}
                    <div className="flex flex-col gap-0.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wide">TITIK LAYANAN</label>
                      <input
                        type="text"
                        placeholder="Titik layanan belajar"
                        value={formData.titikLayanan || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, titikLayanan: e.target.value }))}
                        className="w-full h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wide">NO. HP</label>
                      <input
                        type="text"
                        placeholder="Nomor Handphone aktif"
                        value={formData.noHp || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, noHp: e.target.value }))}
                        className="w-full h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                        disabled={!isEditing}
                      />
                    </div>

                    {/* Row 8: NAMA AYAH | NAMA IBU */}
                    <div className="flex flex-col gap-0.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wide">NAMA AYAH</label>
                      <input
                        type="text"
                        placeholder="Nama lengkap ayah kandung"
                        value={formData.namaAyah || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, namaAyah: e.target.value }))}
                        className="w-full h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wide">NAMA IBU</label>
                      <input
                        type="text"
                        placeholder="Nama lengkap ibu kandung"
                        value={formData.namaIbu || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, namaIbu: e.target.value }))}
                        className="w-full h-7 px-3 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                        disabled={!isEditing}
                      />
                    </div>

                    {/* Row 9: PASSWORD (full width) */}
                    <div className="flex flex-col gap-0.5 sm:col-span-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wide">
                        PASSWORD AKUN LOGIN {!isAdding && "(KOSONGKAN JIKA TIDAK INGIN MENGUBAH)"}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder={isAdding ? "Buat password login warga belajar" : "Masukkan password baru jika ingin diubah"}
                          value={formData.password || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full h-9 pl-3 pr-10 text-xs font-black border-2 border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-purple-600 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                          disabled={!isEditing}
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
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">FOTO PROFIL WB</label>
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-2.5 text-center transition-all ${dragActive ? "border-yellow-300 bg-yellow-50/20" : "border-cyan-300 bg-cyan-50 hover:bg-cyan-100"
                          } h-44 flex flex-col justify-center items-center relative overflow-hidden ${!isEditing && "pointer-events-none opacity-60"}`}
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
                            <Upload className="h-6 w-6 text-cyan-600 mb-1" />
                            <p className="text-[9px] font-black text-purple-950 uppercase tracking-wider">DRAG AND DROP</p>
                            <p className="text-[8px] text-cyan-700 font-semibold uppercase mt-0.5">CLICK TO BROWSE</p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileInput}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              disabled={uploading || !isEditing}
                            />
                          </>
                        )}
                        {uploading && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#9c27b0] border-t-transparent" />
                          </div>
                        )}
                      </div>
                      <p className="text-[9px] font-medium text-slate-400 italic text-center">
                        * Maks 5MB
                      </p>
                      <input type="text" placeholder="atau masukkan URL foto..."
                        value={formData.foto || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, foto: e.target.value }))}
                        className="w-full text-[11px] font-semibold border border-slate-200 rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-purple-400 focus:outline-none bg-slate-50 text-slate-800"
                        disabled={!isEditing}
                      />
                    </div>

                    {/* BERKAS DOKUMEN */}
                    <BerkasUpload
                      berkasTypes={WB_BERKAS_TYPES}
                      value={formData.berkas || {}}
                      onChange={(data) => setFormData((prev) => ({ ...prev, berkas: data }))}
                      isEditing={isEditing}
                    />

                    {/* Additional Info / Status */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5 text-left text-slate-700">
                      <span className="block text-[9px] font-black text-amber-600 tracking-wider uppercase border-b border-slate-200 pb-1.5">Info Akademik & Status</span>

                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-500 uppercase">STATUS WARGA BELAJAR</label>
                        <select
                          value={formData.status || "AKTIF"}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full h-8 px-2 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400 font-bold bg-slate-50 text-slate-800"
                          disabled={!isEditing}
                        >
                          <option value="AKTIF">AKTIF</option>
                          <option value="LULUS">LULUS (ALUMNI)</option>
                        </select>
                      </div>

                      <div className="text-[8px] text-slate-500 leading-relaxed font-semibold pt-1 border-t border-slate-200 space-y-1">
                        <span className="block font-black text-[8px] text-amber-600 uppercase tracking-wide">Catatan Penting:</span>
                        <p>NIK, No. HP, dan Password hanya dapat dilihat di Admin Panel ini.</p>
                        <p>Status LULUS otomatis menyembunyikan warga belajar dari halaman publik sekolah.</p>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Footer buttons */}
                <div className="border-t border-slate-200 pt-4 mt-3 flex items-center justify-end gap-3 shrink-0">
                  {isAdding ? (
                    <>
                      <Button
                        type="button"
                        onClick={() => setFormOpen(false)}
                        className="bg-slate-500 hover:bg-slate-650 text-white font-extrabold text-xs px-8 h-11 rounded-xl cursor-pointer uppercase tracking-widest transition-all"
                      >
                        BATAL
                      </Button>
                      <Button
                        type="submit"
                        disabled={saving || uploading}
                        className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-black text-xs px-8 h-11 rounded-xl cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest flex items-center gap-1.5 transition-all disabled:opacity-70"
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
                    </>
                  ) : isEditing ? (
                    <>
                      <Button
                        type="button"
                        onClick={() => setFormOpen(false)}
                        className="bg-slate-500 hover:bg-slate-650 text-white font-extrabold text-xs px-8 h-11 rounded-xl cursor-pointer uppercase tracking-widest transition-all"
                      >
                        BATAL
                      </Button>
                      <Button
                        type="submit"
                        disabled={saving || uploading}
                        className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-black text-xs px-8 h-11 rounded-xl cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest flex items-center gap-1.5 transition-all disabled:opacity-70"
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
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        onClick={(e) => { e.preventDefault(); if (selectedStudent) handleDelete(selectedStudent.id); }}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-8 h-11 rounded-xl cursor-pointer uppercase tracking-widest transition-all flex items-center gap-1.5"
                      >
                        <Trash2 className="h-4 w-4" /> HAPUS
                      </Button>
                      <Button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setIsEditing(true); }}
                        className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-black text-xs px-8 h-11 rounded-xl cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest flex items-center gap-1.5 transition-all"
                      >
                        <Edit3 className="h-4 w-4" /> EDIT
                      </Button>
                    </>
                  )}
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
            <div className="bg-white p-6 relative text-left">
              {/* Close Button */}
              <button
                onClick={() => setContinueOpen(false)}
                className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-4">
                <span className="inline-block bg-[#9c27b0] text-white font-extrabold text-[11px] px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                  Melanjutkan Program Belajar
                </span>
              </div>

              <form onSubmit={handleContinue} className="space-y-4 text-slate-800">
                <p className="text-xs font-semibold text-slate-500 leading-normal">
                  Pindahkan warga belajar ini ke program yang lebih tinggi.
                </p>

                {selectedStudent && (() => {
                  const currentProg = (selectedStudent.program || "").toUpperCase().trim();
                  const targetProg = NEXT_PROGRAM[currentProg];
                  const targetKelas = targetProg ? FIRST_KELAS[targetProg] : null;
                  return (
                    <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-2 text-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase">Program Saat Ini</span>
                        <span className="text-xs font-black">{currentProg}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowUpCircle className="h-4 w-4 text-emerald-600" />
                        <span className="text-[10px] font-black text-slate-500 uppercase">Program Baru</span>
                        <span className="text-xs font-black text-emerald-700">{targetProg || "Maksimal"}</span>
                      </div>
                      {targetKelas && (
                        <div className="flex items-center gap-2 pl-6">
                          <span className="text-[10px] font-black text-slate-500 uppercase">Kelas Awal</span>
                          <span className="text-xs font-black">{targetKelas}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="border-t border-slate-200 pt-4 flex justify-end gap-2 mt-4">
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
            <div className="bg-white p-6 relative text-left">
              <button
                onClick={() => setBulkContinueOpen(false)}
                className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full p-1.5 transition-colors cursor-pointer"
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
                  <p className="text-xs font-semibold text-slate-500 leading-normal">
                    Pindahkan warga belajar yang eligible ke program baru.
                  </p>
                  {(() => {
                    const eligibleCount = selectedStudentIds.filter((id) => {
                      const s = students.find((st) => st.id === id);
                      return s && isAtEndOfProgram(s) && s.status !== "LULUS";
                    }).length;
                    const skipped = selectedStudentIds.length - eligibleCount;
                    return (
                      <div className="bg-slate-50 rounded-xl px-3 py-2 space-y-1">
                        <p className="text-[11px] font-bold text-emerald-700">
                          ✅ {eligibleCount} siswa eligible (di akhir program)
                        </p>
                        {skipped > 0 && (
                          <p className="text-[11px] font-bold text-amber-700">
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
                  const targetKelas = targetProgram ? FIRST_KELAS[targetProgram] : null;

                  return (
                    <div className="space-y-3.5 text-slate-700">
                      <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase">Program Saat Ini</span>
                          <span className="text-xs font-black text-slate-800">
                            {programs.length === 1 ? programs[0] : programs.join(" / ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ArrowUpCircle className="h-4 w-4 text-emerald-600" />
                          <span className="text-[10px] font-black text-slate-500 uppercase">Program Baru</span>
                          <span className="text-xs font-black text-emerald-700">
                            {targetProgram || "Campuran program"}
                          </span>
                        </div>
                        {targetKelas && (
                          <div className="flex items-center gap-2 pl-6">
                            <span className="text-[10px] font-black text-slate-500 uppercase">Kelas Awal</span>
                            <span className="text-xs font-black text-slate-800">{targetKelas}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div className="border-t border-slate-200 pt-4 flex justify-end gap-2 mt-4">
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

      {/* UPLOAD EXCEL DIALOG */}
      {showUploadDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowUploadDialog(false)} />
          <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 border-4 border-cyan-400 z-10">
            <div className="bg-white p-6 relative text-left">
              <button
                onClick={() => setShowUploadDialog(false)}
                className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-4">
                <span className="inline-block bg-[#9c27b0] text-white font-extrabold text-[11px] px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                  Upload Excel
                </span>
              </div>

              <div className="space-y-4 text-slate-800">
                <p className="text-xs font-semibold text-slate-500 leading-normal">
                  Upload data warga belajar dari file Excel. Silakan download format terlebih dahulu.
                </p>

                <div className="space-y-3">
                  <a
                    href="/templates/format-upload-wb.xlsx"
                    download
                    className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-widest transition-all shadow-md cursor-pointer"
                  >
                    <Download className="h-4 w-4" /> DOWNLOAD FORMAT
                  </a>

                  <Button
                    type="button"
                    onClick={() => {
                      setShowUploadDialog(false);
                      importInputRef.current?.click();
                    }}
                    className="w-full h-11 rounded-xl bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs uppercase tracking-widest transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Upload className="h-4 w-4" /> PILIH FILE EXCEL
                  </Button>

                  <Button
                    type="button"
                    onClick={() => setShowUploadDialog(false)}
                    className="w-full h-11 rounded-xl bg-slate-500 hover:bg-slate-600 text-white font-extrabold text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    BATAL
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
