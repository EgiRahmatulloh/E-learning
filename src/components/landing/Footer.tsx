import { Separator } from "@/components/ui/separator";
import { GraduationCap, Clock, Calendar } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Col 1: About */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white">
                <GraduationCap className="h-6 w-6 text-[#0ff60a]" />
              </div>
              <span className="text-base font-black tracking-tight text-white">PKBM MENUJU MAKMUR</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 font-medium">
              Pusat Kegiatan Belajar Masyarakat (PKBM) penyelenggara resmi program pendidikan kesetaraan terakreditasi di Kabupaten Ciamis, Jawa Barat.
            </p>
          </div>

          {/* Col 2: Program */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Program Pendidikan</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-500">
              <li><span className="hover:text-white transition-colors">Pendidikan Paket A (Setara SD)</span></li>
              <li><span className="hover:text-white transition-colors">Pendidikan Paket B (Setara SMP)</span></li>
              <li><span className="hover:text-white transition-colors">Pendidikan Paket C (Setara SMA)</span></li>
              <li><span className="hover:text-white transition-colors">Keterampilan & Kreativitas Wirausaha</span></li>
            </ul>
          </div>

          {/* Col 3: Layanan */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Layanan Pintar</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-500">
              <li><a href="#layanan" className="hover:text-white transition-colors">Pendaftaran Siswa (E-SPMB)</a></li>
              <li><a href="#layanan" className="hover:text-white transition-colors">Portal E-Learning Mandiri</a></li>
              <li><a href="#layanan" className="hover:text-white transition-colors">Ujian & Evaluasi (E-Ujian)</a></li>
            </ul>
          </div>

          {/* Col 4: Jam Kerja */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Jam Pelayanan</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-500">
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#ff6105] shrink-0" />
                <span>Senin - Sabtu: 08:00 - 14:00 WIB</span>
              </li>
              <li className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#ff6105] shrink-0" />
                <span>Hari Minggu & Tanggal Merah: Libur</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="bg-slate-900" />

        {/* Bottom Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-xs font-semibold text-slate-600">
            Copyright © 2026 - Tim IT PKBM Menuju Makmur | Membangun Pendidikan, Menciptakan Masa Depan
          </p>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
            <a href="#beranda" className="hover:text-white transition-colors">Ke Atas</a>
            <span className="h-3 w-[1px] bg-slate-900"></span>
            <a href="#profil" className="hover:text-white transition-colors">Tentang Kami</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
