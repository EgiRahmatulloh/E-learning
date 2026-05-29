interface RoleStatsGridProps {
  userRole: string;
}

export default function RoleStatsGrid({ userRole }: RoleStatsGridProps) {
  // Role-specific stats
  let roleStats: { label: string; value: string; color: string; status?: string }[] = [];
  if (userRole === "admin") {
    roleStats = [
      { label: "JUMLAH TUTOR", value: "12", color: "from-cyan-400 to-cyan-500", status: "Aktif" },
      { label: "JUMLAH WARGA BELAJAR", value: "350", color: "from-cyan-400 to-cyan-500", status: "Aktif" },
      { label: "JUMLAH ROMBEL", value: "9", color: "from-cyan-400 to-cyan-500", status: "Aktif" },
      { label: "JUMLAH PRODUK WB", value: "24", color: "from-cyan-400 to-cyan-500", status: "Aktif" },
      { label: "JUMLAH WB PAKET A", value: "85", color: "from-cyan-400 to-teal-500", status: "Siswa" },
      { label: "JUMLAH WB PAKET B", value: "120", color: "from-cyan-400 to-teal-500", status: "Siswa" },
      { label: "JUMLAH WB PAKET C", value: "145", color: "from-cyan-400 to-teal-500", status: "Siswa" },
      { label: "JUMLAH ALUMNI", value: "580", color: "from-cyan-400 to-teal-500", status: "Lulus" },
      { label: "JUMLAH PENGUNJUNG", value: "1.247", color: "from-cyan-500 to-sky-500", status: "Hari Ini" },
    ];
  } else if (userRole === "tutor") {
    roleStats = [
      { label: "KELAS PENGAJARAN", value: "3 Kelas", color: "from-cyan-400 to-cyan-500", status: "Aktif" },
      { label: "TUGAS MASUK", value: "45 Tugas", color: "from-amber-400 to-amber-500", status: "Perlu Review" },
      { label: "RATA-RATA PRESENSI", value: "92%", color: "from-teal-400 to-teal-500", status: "Sangat Baik" },
    ];
  } else {
    // siswa
    roleStats = [
      { label: "MATA PELAJARAN", value: "5 Matpel", color: "from-cyan-400 to-cyan-500", status: "Aktif" },
      { label: "TUGAS AKTIF", value: "2 Tugas", color: "from-amber-400 to-amber-500", status: "Belum Selesai" },
      { label: "INDEKS PRESTASI", value: "88.5", color: "from-teal-400 to-teal-500", status: "Sangat Baik" },
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

      {/* Info / Catatan Card */}
      <div className="col-span-2 sm:col-span-2 lg:col-span-4 relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200/60 p-6 shadow-xs">
        <div className="absolute right-4 top-4 text-4xl opacity-30 select-none">📌</div>
        <div className="space-y-2">
          <h4 className="text-sm font-black text-amber-800 uppercase tracking-wider">Catatan</h4>
          <p className="text-sm text-amber-700 font-semibold leading-relaxed">
            {/* TODO: Ganti data hardcoded dengan fetch dari API */}
            Data statistik di atas masih menggunakan data placeholder. Integrasi dengan database akan segera tersedia.
          </p>
        </div>
      </div>
    </div>
  );
}
