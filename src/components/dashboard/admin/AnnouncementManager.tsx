import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Trash2, Edit3, Plus, Search, Calendar, X } from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmProvider";

interface AnnouncementData {
  id: string;
  creator: string;
  text: string;
  date: string; // Format YYYY-MM-DD
  status: "AKTIF" | "TIDAK AKTIF";
}

const formatDateDisplay = (dateStr: string | null | undefined) => {
  if (!dateStr || typeof dateStr !== "string") return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const [yyyy, mm, dd] = parts;
    if (yyyy && yyyy.length === 4 && mm && mm.length === 2 && dd && dd.length === 2) {
      return `${dd}-${mm}-${yyyy}`;
    }
  }
  return dateStr;
};

export default function AnnouncementManager() {
  const confirm = useConfirm();
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: "", show: false });

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formText, setFormText] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formStatus, setFormStatus] = useState<"AKTIF" | "TIDAK AKTIF">("AKTIF");

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/announcements");
      if (!res.ok) throw new Error("Gagal mengambil data dari server");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const serverMapped: AnnouncementData[] = data.data.map((item: any) => ({
          id: String(item.id),
          creator: item.creator || "-",
          text: item.text || "",
          date: item.date || "",
          status: item.status || "AKTIF",
        }));
        setAnnouncements(serverMapped);
      } else {
        throw new Error("Struktur data tidak valid");
      }
    } catch (err: any) {
      showToast(err.message || "Gagal menghubungkan ke server");
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const showToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => {
      setToast({ message: "", show: false });
    }, 3050);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formText.trim()) {
      showToast("Teks pengumuman tidak boleh kosong!");
      return;
    }
    if (!formDate) {
      showToast("Tanggal harus dipilih!");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      if (editId) {
        // Edit mode
        const res = await fetch(`/api/announcements/${editId}`, {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            text: formText,
            date: formDate,
            status: formStatus,
          }),
        });
        
        const data = await res.json();
        if (res.ok && data.success) {
          showToast("Pengumuman berhasil diperbarui!");
          fetchAnnouncements();
          closeForm();
        } else {
          showToast(data.message || "Gagal memperbarui data pengumuman");
        }
      } else {
        // Add mode
        const res = await fetch("/api/announcements", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            text: formText,
            date: formDate,
            status: formStatus,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          showToast("Pengumuman baru berhasil ditambahkan!");
          fetchAnnouncements();
          closeForm();
        } else {
          showToast(data.message || "Gagal menambahkan data pengumuman");
        }
      }
    } catch {
      showToast("Gagal menyimpan: periksa koneksi internet Anda.");
    }
  };

  const handleDelete = async (id: string) => {
    if (await confirm("Apakah Anda yakin ingin menghapus pengumuman ini?")) {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`/api/announcements/${id}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast("Pengumuman berhasil dihapus!");
          fetchAnnouncements();
        } else {
          showToast(data.message || "Gagal menghapus data dari server");
        }
      } catch {
        showToast("Gagal menghapus: periksa koneksi internet Anda.");
      }
    }
  };

  const openAddForm = () => {
    setEditId(null);
    setFormText("");
    // Default today date YYYY-MM-DD in local timezone
    const localDate = new Date();
    const yyyy = localDate.getFullYear();
    const mm = String(localDate.getMonth() + 1).padStart(2, '0');
    const dd = String(localDate.getDate()).padStart(2, '0');
    const today = `${yyyy}-${mm}-${dd}`;
    setFormDate(today);
    setFormStatus("AKTIF");
    setIsFormOpen(true);
  };

  const openEditForm = (item: AnnouncementData) => {
    setEditId(item.id);
    setFormText(item.text);
    
    // Convert DD-MM-YYYY to YYYY-MM-DD for native input date
    let formattedInputDate = item.date;
    if (item.date.includes("-") && item.date.split("-")[2].length === 4) {
      const [dd, mm, yyyy] = item.date.split("-");
      formattedInputDate = `${yyyy}-${mm}-${dd}`;
    }
    setFormDate(formattedInputDate);
    setFormStatus(item.status);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditId(null);
  };

  // Filter announcements based on search input
  const filteredAnnouncements = announcements.filter((item) =>
    item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.creator.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 relative pb-10">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-cyan-900 tracking-tight flex items-center gap-2">
            <span>📢</span> KELOLA WEBSITE PENGUMUMAN
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Atur dan publikasikan pengumuman penting yang tampil di platform E-learning dan halaman utama.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={openAddForm}
            className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md shadow-purple-200 uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" /> TAMBAH BARU
          </Button>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {/* Table Search Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
            Daftar Pengumuman Aktif ({filteredAnnouncements.length})
          </span>
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="cari"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs border border-slate-200 rounded-xl bg-white font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
            />
          </div>
        </div>

        {/* Beautiful Mockup-aligned Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#00badb] text-white font-black text-sm uppercase">
                <th className="py-4 px-6 border-r border-[#009cb9] text-center w-16">NO</th>
                <th className="py-4 px-6 border-r border-[#009cb9] text-center w-32">PEMBUAT</th>
                <th className="py-4 px-6 border-r border-[#009cb9]">TEKS</th>
                <th className="py-4 px-6 border-r border-[#009cb9] text-center w-40">TANGGAL</th>
                <th className="py-4 px-6 border-r border-[#009cb9] text-center w-36">STATUS</th>
                <th className="py-4 px-6 text-center w-48">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnnouncements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center font-bold text-slate-400">
                    Tidak ada data pengumuman ditemukan. Silakan tambahkan baru!
                  </td>
                </tr>
              ) : (
                filteredAnnouncements.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 hover:bg-cyan-50/20 font-bold text-slate-700 transition-colors"
                  >
                    <td className="py-4 px-6 border-r border-slate-100 text-center text-slate-500 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 uppercase text-slate-800 text-center">
                      {item.creator}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 text-slate-800 text-base leading-relaxed font-semibold">
                      {item.text}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 text-center font-mono text-slate-600">
                      {formatDateDisplay(item.date)}
                    </td>
                    <td className="py-4 px-6 border-r border-slate-100 text-center">
                      <span
                        className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-black uppercase tracking-wider ${
                          item.status === "AKTIF"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-rose-100 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Button
                          onClick={() => openEditForm(item)}
                          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 h-9 px-3.5 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-xs transition-all"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-blue-600" /> Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(item.id)}
                          className="bg-white border border-slate-200 hover:bg-rose-50 text-rose-600 h-9 px-3.5 rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-xs transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP / MODAL FORM DIALOG (MATCHING MOCKUP DESIGN AESTHETICS) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={closeForm} />

          {/* Form Container */}
          <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200 border-4 border-cyan-400">
            
            {/* Form Column (Cyan Background) */}
            <div className="bg-[#00badb] p-6 relative text-white">
              {/* Close Button */}
              <button
                onClick={closeForm}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-6">
                <span className="inline-block bg-[#9c27b0] text-white font-extrabold text-[11px] px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                  {editId ? "TAMPILAN EDIT DATA" : "TAMPILAN TAMBAH BARU"}
                </span>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-left">
                {/* TEKS (Textarea) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black tracking-wider uppercase text-cyan-50 block">
                    TEKS
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Masukkan teks pengumuman penting..."
                    value={formText}
                    onChange={(e) => setFormText(e.target.value)}
                    className="w-full p-4 text-sm border-0 rounded-lg bg-white font-bold text-slate-800 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all shadow-inner resize-none leading-relaxed placeholder-slate-400"
                  />
                </div>

                {/* TANGGAL (Calendar Picker) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black tracking-wider uppercase text-cyan-50 block flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> TANGGAL
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full h-11 px-4 text-sm border-0 rounded-lg bg-white font-extrabold text-slate-800 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all shadow-inner uppercase tracking-wider"
                  />
                </div>

                {/* PUBLIKASIKAN / STATUS (Select Dropdown) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black tracking-wider uppercase text-cyan-50 block">
                    PUBLIKASIKAN
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as "AKTIF" | "TIDAK AKTIF")}
                    className="w-full h-11 px-4 text-sm border-0 rounded-lg bg-white font-extrabold text-slate-800 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all cursor-pointer shadow-inner uppercase tracking-wider"
                  >
                    <option value="AKTIF">YA (AKTIFKAN SEKARANG)</option>
                    <option value="TIDAK AKTIF">TIDAK (SIMPAN SEBAGAI DRAFT)</option>
                  </select>
                </div>

                {/* BUTTON SUBMIT */}
                <div className="pt-2 text-right">
                  <Button
                    type="submit"
                    className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-sm px-8 h-11 rounded-full cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 inline-flex"
                  >
                    SIMPAN
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900/95 backdrop-blur-md text-white px-5 py-4 rounded-2xl shadow-2xl border border-slate-800 animate-in slide-in-from-bottom-6 duration-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-bold tracking-tight">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
