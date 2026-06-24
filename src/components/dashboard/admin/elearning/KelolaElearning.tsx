import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Settings, Plus, Save, Trash2, Edit, BookOpen, Users, GraduationCap, Clock, Layers, AlertTriangle, Search } from "lucide-react";
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
}

const DUMMY_ROMBEL: string[] = []; // Removed, loaded from backend

export default function KelolaElearning() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [rombels, setRombels] = useState<string[]>(DUMMY_ROMBEL);
  const [items, setItems] = useState<ElearningItem[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    id: "",
    kelas: "",
    mapel: "",
    tutorId: "", // Single select tutor
    skk: "",
    sesiCount: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  // Pagination & Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Delete Confirm Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  // Sesi Modal State
  const [sesiModalOpen, setSesiModalOpen] = useState(false);
  const [setupToManage, setSetupToManage] = useState<ElearningItem | null>(null);
  const [sessionsData, setSessionsData] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const fetchSetups = async () => {
    try {
      const res = await fetch("/api/elearning/setups", {
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
    if (sesiModalOpen && setupToManage) {
      loadSessions(setupToManage);
    }
  }, [sesiModalOpen, setupToManage]);

  const loadSessions = async (setup: ElearningItem) => {
    setSessionsLoading(true);
    try {
      // Get course ID first
      const programStr = setup.kelas.includes("Paket A") ? "Paket A" : setup.kelas.includes("Paket B") ? "Paket B" : "Paket C";
      const courseRes = await fetch("/api/elearning/course", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ subjectName: setup.mapel, program: programStr, kelas: setup.kelas })
      });
      const courseData = await courseRes.json();
      if (!courseData.success) throw new Error(courseData.message);
      
      const courseId = courseData.data.id;
      const loadedSessions = [];
      
      // Load each session from 1 to setup.jumlahSesi
      for (let i = 1; i <= setup.jumlahSesi; i++) {
        const sessionRes = await fetch(`/api/elearning/session?courseId=${courseId}&sessionNumber=${i}`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        const sessionData = await sessionRes.json();
        if (sessionData.success && sessionData.data.session) {
          loadedSessions.push(sessionData.data.session);
        } else {
          // Push dummy if not created yet
          loadedSessions.push({ sessionNumber: i, isOpen: true, isDummy: true });
        }
      }
      setSessionsData(loadedSessions);
    } catch (err: any) {
      toast.error("Gagal memuat sesi", { description: err.message });
    } finally {
      setSessionsLoading(false);
    }
  };

  const toggleSessionStatus = async (session: any) => {
    if (session.isDummy || !session.id) {
      toast.info("Sesi ini belum pernah diakses. Status default terbuka.");
      return;
    }
    const newStatus = !session.isOpen;
    try {
      const res = await fetch(`/api/elearning/session/${session.id}/toggle`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ isOpen: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setSessionsData(prev => prev.map(s => s.id === session.id ? { ...s, isOpen: newStatus } : s));
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Gagal mengubah status sesi");
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

    // Load rombels from backend if exist
    fetch("/api/rombels", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          // New format: array of objects with nama field; old format: array of strings
          const names = data.data.map((r: any) => typeof r === "string" ? r : r.nama);
          setRombels(names);
        }
      })
      .catch((err) => console.log("Rombel API not available yet, using dummy data.", err));

    fetchSetups();
  }, []);

  const getAvailableMapel = () => {
    if (!formData.kelas) return [];
    
    // Default fallback return all mapel if pattern doesn't match
    let allMapel: string[] = [];
    Object.values(MASTER_MAPEL).forEach(arr => allMapel = [...allMapel, ...arr]);
    
    const kelasStr = formData.kelas.toLowerCase();
    if (kelasStr.includes("paket a")) return MASTER_MAPEL["Paket A"];
    if (kelasStr.includes("paket b")) return MASTER_MAPEL["Paket B"];
    if (kelasStr.includes("kelas 10") || kelasStr.includes("x")) return MASTER_MAPEL["Paket C (Kelas X)"];
    if (kelasStr.includes("kelas 11") || kelasStr.includes("kelas 12") || kelasStr.includes("xi") || kelasStr.includes("xii")) return MASTER_MAPEL["Paket C (Kelas XI dan XII)"];
    
    return allMapel;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kelas || !formData.mapel || !formData.tutorId || !formData.skk || !formData.sesiCount) {
      toast.error("Mohon lengkapi semua data!");
      return;
    }

    const sesiCountInt = parseInt(formData.sesiCount, 10);
    const tutorIdInt = parseInt(formData.tutorId, 10);
    
    try {
      if (isEditing) {
        const res = await fetch(`/api/elearning/setups/${formData.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            kelas: formData.kelas,
            mapel: formData.mapel,
            tutorId: tutorIdInt,
            skk: parseInt(formData.skk, 10),
            jumlahSesi: sesiCountInt,
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Data berhasil diperbarui!");
          fetchSetups();
        } else {
          toast.error(data.message || "Gagal memperbarui data");
        }
      } else {
        const res = await fetch("/api/elearning/setups", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            kelas: formData.kelas,
            mapel: formData.mapel,
            tutorId: tutorIdInt,
            skk: parseInt(formData.skk, 10),
            jumlahSesi: sesiCountInt,
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Data berhasil ditambahkan!");
          fetchSetups();
        } else {
          toast.error(data.message || "Gagal menambahkan data");
        }
      }
      handleReset();
    } catch (err: any) {
      toast.error("Terjadi kesalahan: " + err.message);
    }
  };

  const handleEdit = (item: ElearningItem) => {
    setFormData({
      id: item.id.toString(),
      kelas: item.kelas,
      mapel: item.mapel,
      tutorId: item.tutorId.toString(),
      skk: item.skk.toString(),
      sesiCount: item.jumlahSesi.toString(),
    });
    setIsEditing(true);
  };

  const triggerDelete = (id: number) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        const res = await fetch(`/api/elearning/setups/${itemToDelete}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Data berhasil dihapus!");
          fetchSetups();
        } else {
          toast.error(data.message || "Gagal menghapus data");
        }
      } catch (err: any) {
        toast.error("Terjadi kesalahan: " + err.message);
      }
    }
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const handleReset = () => {
    setFormData({ id: "", kelas: "", mapel: "", tutorId: "", skk: "", sesiCount: "" });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* FORM SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-black text-[#280f91] border-b border-slate-100 pb-4 mb-5 flex items-center gap-2">
          <Layers className="h-5 w-5" />
          {isEditing ? "Edit Data E-Learning" : "Form Setup E-Learning"}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* KELAS */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-1.5">
                <Users className="h-4 w-4 text-cyan-600" /> Pilih Kelas (Rombel)
              </label>
              <select
                required
                value={formData.kelas}
                onChange={(e) => setFormData(prev => ({ ...prev, kelas: e.target.value, mapel: "" }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#280f91] outline-none"
              >
                <option value="" disabled>-- Pilih Rombel --</option>
                {rombels.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* MAPEL */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-purple-600" /> Pilih Mata Pelajaran
              </label>
              <select
                required
                disabled={!formData.kelas}
                value={formData.mapel}
                onChange={(e) => setFormData(prev => ({ ...prev, mapel: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#280f91] outline-none disabled:opacity-50"
              >
                <option value="" disabled>-- Pilih Mapel --</option>
                {getAvailableMapel().map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            
            {/* TUTOR */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-emerald-600" /> Pilih Tutor
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

            {/* SKK */}
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

            {/* SESI */}
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
            {isEditing && (
              <Button type="button" onClick={handleReset} className="bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold px-6">
                Batal
              </Button>
            )}
            <Button type="submit" className="bg-[#280f91] hover:bg-[#ff6105] text-white rounded-xl font-bold px-8 shadow-md">
              {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {isEditing ? "Simpan Perubahan" : "Tambahkan"}
            </Button>
          </div>
        </form>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="font-black text-slate-600 uppercase text-xs tracking-widest">
            Daftar Setup E-Learning
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kelas, mapel, atau tutor..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset page on search
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#280f91] shadow-xs"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-cyan-50 text-cyan-900 font-black text-xs uppercase tracking-wide">
                <th className="p-4 border-b border-cyan-100 w-12 text-center">No</th>
                <th className="p-4 border-b border-cyan-100">Kelas (Rombel)</th>
                <th className="p-4 border-b border-cyan-100">Mata Pelajaran</th>
                <th className="p-4 border-b border-cyan-100">Tutor</th>
                <th className="p-4 border-b border-cyan-100 text-center">SKK</th>
                <th className="p-4 border-b border-cyan-100 text-center">Sesi</th>
                <th className="p-4 border-b border-cyan-100 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
              {(() => {
                const filteredItems = items.filter(item => {
                  const t = tutors.find(x => x.id === item.tutorId);
                  const tutorName = t ? t.nama.toLowerCase() : "";
                  const searchLower = searchTerm.toLowerCase();
                  return item.kelas.toLowerCase().includes(searchLower) || 
                         item.mapel.toLowerCase().includes(searchLower) ||
                         tutorName.includes(searchLower);
                });

                return filteredItems.length > 0 ? (
                  filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item, idx) => {
                    const t = tutors.find(x => x.id === item.tutorId);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 text-center text-slate-400 font-mono">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                      <td className="p-4 font-bold text-cyan-900">{item.kelas}</td>
                      <td className="p-4 font-bold text-slate-800">{item.mapel}</td>
                      <td className="p-4 text-xs font-bold text-purple-800 uppercase">
                        {t ? t.nama : <span className="text-slate-400 italic">Tidak Diketahui</span>}
                      </td>
                      <td className="p-4 text-center font-bold text-orange-600">{item.skk}</td>
                      <td className="p-4 text-center">
                        <Button
                          onClick={() => {
                            setSetupToManage(item);
                            setSesiModalOpen(true);
                          }}
                          className="h-8 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold px-3 rounded-lg flex items-center gap-1.5 mx-auto"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          Kelola ({item.jumlahSesi})
                        </Button>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleEdit(item)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => triggerDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-sm font-semibold">
                    Tidak ada data setup E-Learning yang sesuai kriteria.
                  </td>
                </tr>
              );
              })()}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {(() => {
          const filteredItems = items.filter(item => {
            const t = tutors.find(x => x.id === item.tutorId);
            const tutorName = t ? t.nama.toLowerCase() : "";
            const searchLower = searchTerm.toLowerCase();
            return item.kelas.toLowerCase().includes(searchLower) || 
                   item.mapel.toLowerCase().includes(searchLower) ||
                   tutorName.includes(searchLower);
          });
          
          return filteredItems.length > itemsPerPage && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
              <p className="text-xs font-semibold text-slate-500">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredItems.length)} dari {filteredItems.length} setup
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 text-xs font-bold text-slate-600"
                >
                  Sebelumnya
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.ceil(filteredItems.length / itemsPerPage) }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        currentPage === i + 1 
                          ? 'bg-cyan-600 text-white shadow-md' 
                          : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredItems.length / itemsPerPage), p + 1))}
                  disabled={currentPage === Math.ceil(filteredItems.length / itemsPerPage)}
                  className="h-8 text-xs font-bold text-slate-600"
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* CUSTOM CONFIRM DELETE MODAL */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setDeleteModalOpen(false)} />
          
          <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 z-10 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-slate-800">
                Hapus Setup E-Learning
              </h3>
            </div>
            <p className="text-sm text-slate-500 font-semibold leading-relaxed">
              Apakah Anda yakin ingin menghapus data setup ini? Tindakan ini akan menghapus alokasi kelas, mata pelajaran, dan sesi terkait secara permanen.
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

      {/* KELOLA SESI MODAL */}
      {sesiModalOpen && setupToManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSesiModalOpen(false)} />
          
          <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200 z-10 p-6 space-y-4">
            <div className="flex items-center gap-3 text-blue-600 border-b border-slate-100 pb-4">
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  Kelola Sesi: {setupToManage.mapel}
                </h3>
                <p className="text-xs text-slate-500 font-bold">{setupToManage.kelas}</p>
              </div>
            </div>
            
              {!sessionsLoading && (
                <div className="space-y-2">
                  {sessionsData.map((session: any, idx: number) => (
                    <div key={session.id || idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </div>
                        <span className="font-bold text-sm text-slate-700">Sesi {idx + 1}</span>
                      </div>
                      <Button 
                        variant="outline"
                        className={`h-8 text-xs font-bold rounded-lg ${session.isOpen ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
                        onClick={() => toggleSessionStatus(session)}
                        disabled={!session.id}
                      >
                        {session.isOpen ? "Terbuka" : "Tertutup"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button 
                onClick={() => setSesiModalOpen(false)} 
                className="bg-[#280f91] hover:bg-[#ff6105] text-white font-bold px-6 rounded-xl shadow-md"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
