import { useState, useEffect } from "react";

interface RoleStatsGridProps {
  userRole: string;
}

export default function RoleStatsGrid({ userRole }: RoleStatsGridProps) {
  const [stats, setStats] = useState<{
    tutors: number;
    students: number;
    rombel: number;
    products: number;
    paketA: number;
    paketB: number;
    paketC: number;
    alumni: number;
    mapelAktif?: number;
    tugas?: number;
    tugasMasuk?: number;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem("token");
    if (!token) return;

    let endpoint = "";
    if (userRole === "admin" || userRole === "super_admin") {
      endpoint = "/api/dashboard-stats";
    } else if (userRole === "tutor") {
      endpoint = "/api/elearning/tutor-stats";
    } else if (userRole === "siswa") {
      endpoint = "/api/elearning/siswa-stats";
    }

    if (endpoint) {
      fetch(endpoint, {
        signal: controller.signal,
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setStats(data.data);
          }
        })
        .catch((err) => {
          if (err.name !== "AbortError") console.error("Error fetching stats:", err);
        });
    }

    return () => controller.abort();
  }, [userRole]);

  // Role-specific stats
  let roleStats: { label: string; value: string; color: string; status?: string }[] = [];
  if (userRole === "admin" || userRole === "super_admin") {
    roleStats = [
      { label: "JUMLAH TUTOR", value: stats ? String(stats.tutors) : "–", color: "from-cyan-400 to-cyan-500", status: "Aktif" },
      { label: "JUMLAH WARGA BELAJAR", value: stats ? String(stats.students) : "–", color: "from-cyan-400 to-cyan-500", status: "Aktif" },
      { label: "JUMLAH ROMBEL", value: stats ? String(stats.rombel) : "–", color: "from-cyan-400 to-cyan-500", status: "Aktif" },
      { label: "MAPEL AKTIF", value: stats ? String(stats.mapelAktif || 0) : "0", color: "from-cyan-400 to-cyan-500", status: "E-Learning" },
      { label: "TUGAS DIBERIKAN", value: stats ? String(stats.tugas || 0) : "0", color: "from-amber-400 to-amber-500", status: "E-Learning" },
      { label: "JUMLAH PRODUK WB", value: stats ? String(stats.products) : "–", color: "from-cyan-400 to-cyan-500", status: "Aktif" },
      { label: "JUMLAH WB PAKET A", value: stats ? String(stats.paketA) : "–", color: "from-cyan-400 to-teal-500", status: "Siswa" },
      { label: "JUMLAH WB PAKET B", value: stats ? String(stats.paketB) : "–", color: "from-cyan-400 to-teal-500", status: "Siswa" },
      { label: "JUMLAH WB PAKET C", value: stats ? String(stats.paketC) : "–", color: "from-cyan-400 to-teal-500", status: "Siswa" },
      { label: "JUMLAH ALUMNI", value: stats ? String(stats.alumni) : "–", color: "from-cyan-400 to-teal-500", status: "Lulus" },
      { label: "E-LEARNING", value: stats ? String(stats.mapelAktif || 0) : "0", color: "from-indigo-400 to-indigo-500", status: "Aktif" },
      { label: "E-UJIAN", value: "0", color: "from-orange-400 to-orange-500", status: "Segera hadir" },
      { label: "E-SPMB", value: "0", color: "from-rose-400 to-rose-500", status: "Segera hadir" },
    ];
  } else if (userRole === "tutor") {
    roleStats = [
      { label: "KELAS PENGAJARAN", value: stats ? `${stats.mapelAktif} Kelas` : "0 Kelas", color: "from-cyan-400 to-cyan-500", status: "Aktif" },
      { label: "TUGAS MASUK", value: stats ? `${stats.tugasMasuk} Tugas` : "0 Tugas", color: "from-amber-400 to-amber-500", status: "Perlu Review" },
    ];
  } else {
    // siswa
    roleStats = [
      { label: "MATA PELAJARAN", value: stats ? `${stats.mapelAktif} MAPEL` : "0 MAPEL", color: "from-cyan-400 to-cyan-500", status: "Aktif" },
      { label: "TUGAS AKTIF", value: stats ? `${stats.tugasMasuk} TUGAS` : "0 TUGAS", color: "from-amber-400 to-amber-500", status: "Belum Selesai" },
    ];
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {roleStats.map((stat) => (
        <div
          key={stat.label}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.color} p-5 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-default group`}
        >
          <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10 group-hover:scale-125 transition-transform duration-500" />
          <div className="absolute -right-2 -bottom-2 h-12 w-12 rounded-full bg-white/5" />

          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <span className="block text-2xl sm:text-3xl font-black text-white drop-shadow-sm leading-none mb-1">
                {stat.value}
              </span>
              <span className="block text-[10px] font-bold text-white/90 uppercase tracking-wider leading-tight mb-2">
                {stat.label}
              </span>
            </div>
            {stat.status && (
              <span className="inline-block self-start text-[9px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full text-white/95 mt-auto">
                {stat.status}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
