import { Button } from "@/components/ui/button";
import { Users, Award, BookOpen, Layers, CheckCircle2 } from "lucide-react";

export default function Profile() {
  return (
    <section id="profil" className="py-24 bg-white relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Visual Stats Grid */}
          <div className="grid grid-cols-2 gap-6 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#cafc05]/20 blur-3xl rounded-full -z-10"></div>
            
            <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-xl hover:-translate-y-1.5 transition-transform flex flex-col items-center text-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#280f91] to-purple-600 text-white shadow-md">
                <Users className="h-6 w-6" />
              </div>
              <span className="text-3xl font-black text-[#280f91]">350+</span>
              <span className="text-xs font-black text-slate-400 tracking-wider uppercase">Warga Belajar</span>
            </div>

            <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-xl hover:-translate-y-1.5 transition-transform flex flex-col items-center text-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6105] to-orange-400 text-white shadow-md">
                <Award className="h-6 w-6" />
              </div>
              <span className="text-3xl font-black text-[#280f91]">500+</span>
              <span className="text-xs font-black text-slate-400 tracking-wider uppercase">Lulusan Alumni</span>
            </div>

            <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-xl hover:-translate-y-1.5 transition-transform flex flex-col items-center text-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-400 text-white shadow-md">
                <BookOpen className="h-6 w-6" />
              </div>
              <span className="text-3xl font-black text-[#280f91]">18</span>
              <span className="text-xs font-black text-slate-400 tracking-wider uppercase">Tutor Kompeten</span>
            </div>

            <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-xl hover:-translate-y-1.5 transition-transform flex flex-col items-center text-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-400 text-white shadow-md">
                <Layers className="h-6 w-6" />
              </div>
              <span className="text-3xl font-black text-[#280f91]">12</span>
              <span className="text-xs font-black text-slate-400 tracking-wider uppercase">Rombel Kelas</span>
            </div>
          </div>

          {/* Profile Info */}
          <div className="space-y-6">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#280f91] bg-slate-100 rounded-full px-4 py-1.5 inline-block">
              Mengenal Sekolah Kami
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#280f91] tracking-tight leading-tight">
              Membina Potensi, Menciptakan <span className="text-[#ff6105]">Masa Depan</span>
            </h2>
            <p className="text-slate-600 leading-relaxed font-medium">
              Pusat Kegiatan Belajar Masyarakat (PKBM) Menuju Makmur hadir di Kabupaten Ciamis sebagai wadah pendidikan nonformal terakreditasi resmi. Kami menyelenggarakan pendidikan kesetaraan Paket A (Setara SD), Paket B (Setara SMP), dan Paket C (Setara SMA) untuk membina SDM berkualitas yang mandiri dan berdaya saing.
            </p>
            <div className="space-y-3.5">
              <div className="flex items-center gap-3 text-slate-700 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                Materi ajar fleksibel, mudah diikuti oleh pekerja/wirausaha.
              </div>
              <div className="flex items-center gap-3 text-slate-700 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                Didukung sarana komputer modern untuk Ujian Berbasis Komputer (UNBK).
              </div>
              <div className="flex items-center gap-3 text-slate-700 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                Dibimbing oleh tenaga pengajar dan tutor tersertifikasi resmi.
              </div>
            </div>
            <div className="pt-2">
              <a href="#kontak">
                <Button className="rounded-full bg-[#280f91] hover:bg-[#ff6105] text-white font-bold px-8 h-12 shadow-md shadow-[#280f91]/10 cursor-pointer">
                  Pelajari Lebih Lanjut
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
