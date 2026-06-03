import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { ArrowLeft, ArrowRight, ShieldAlert, Award, Mail } from "lucide-react";

interface Tutor {
  id: number;
  nama: string;
  tutorMapel: string;
  program: string;
  nuptk: string;
  tempatTglLahir: string;
  jenisKelamin: string;
  agama: string;
  pendidikan: string;
  email: string;
  alamat: string;
  foto: string;
  tanggalMulaiTugas: string;
  nomorSkPengangkatan: string;
  lembagaPengangkat: string;
  nomorSkPenugasan: string;
  lembagaPenugas: string;
}

interface TutorsProps {
  isDetailed?: boolean;
  onNavigate?: (path: string) => void;
}

export default function Tutors({ isDetailed = false, onNavigate }: TutorsProps) {
  const [tutorsList, setTutorsList] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tutors")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setTutorsList(data.data);
        }
      })
      .catch((err) => console.error("Failed to fetch tutors list:", err))
      .finally(() => setLoading(false));
  }, []);

  // Limit homepage tutors grid to 3 items
  const displayTutors = isDetailed ? tutorsList : tutorsList.slice(0, 3);

  // DETAILED VIEW (Menu Tutor - Mockup 1)
  if (isDetailed) {
    return (
      <section id="tutor" className="py-20 bg-[#cdeff6] border-y border-slate-300 relative overflow-hidden min-h-[85vh]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Back Button */}
          <div className="mb-8 text-left max-w-5xl mx-auto">
            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate("/");
                } else {
                  window.history.pushState({}, "", "/");
                  window.dispatchEvent(new PopStateEvent("popstate"));
                }
              }}
              className="inline-flex items-center gap-2 text-xs font-black text-purple-700 hover:text-orange-600 transition-colors uppercase tracking-widest cursor-pointer bg-white/80 hover:bg-white px-5 py-2.5 rounded-full shadow-xs border border-purple-100"
            >
              <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
            </button>
          </div>

          {/* Centered Title */}
          <div className="text-center max-w-4xl mx-auto space-y-4 mb-14">
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center leading-none">
              <span className="text-[#9c27b0] font-black drop-shadow-sm">
                TUTOR
              </span>{" "}
              <span className="text-[#0ff60a] font-black drop-shadow-xs">
                PKBM MENUJU MAKMUR
              </span>
            </h2>
            <p className="text-slate-700 font-bold text-xs sm:text-sm leading-relaxed px-4 max-w-2xl mx-auto">
              Tutor PKBM Menuju Makmur merupakan tenaga pendidik yang berdedikasi dalam membimbing, mendampingi, dan memberikan ilmu pengetahuan kepada warga belajar guna meningkatkan kualitas pendidikan dan keterampilan
            </p>
          </div>

          {/* TUTORS GRID (Mockup 1 layout with deep purple/blue bg and green text) */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#9c27b0] border-t-transparent" />
              <span className="text-sm font-bold text-[#9c27b0] uppercase tracking-widest">Memuat data tutor...</span>
            </div>
          ) : displayTutors.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
              {displayTutors.map((tutor) => (
                <Dialog key={tutor.id}>
                  <DialogTrigger asChild>
                    <div 
                      className="bg-[#20108a] rounded-3xl overflow-hidden shadow-2xl p-4 flex flex-col justify-between border border-blue-900/30 group hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
                    >
                      {/* Photo Frame */}
                      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-blue-950 mb-3 border border-blue-900/20">
                        {tutor.foto ? (
                          <img 
                            src={tutor.foto} 
                            alt={tutor.nama} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-indigo-900 to-purple-800 flex flex-col items-center justify-center text-white/20">
                            <svg className="w-20 h-20 opacity-30" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                          </div>
                        )}

                        {/* Text Overlay inside photo at the bottom */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-left">
                          <h3 className="text-xs font-black text-[#0ff60a] uppercase tracking-wide line-clamp-1">
                            {tutor.nama}
                          </h3>
                          <p className="text-[10px] font-bold text-[#0ff60a] uppercase tracking-wider line-clamp-1 mt-0.5">
                            {tutor.tutorMapel}
                          </p>
                        </div>
                      </div>

                    </div>
                  </DialogTrigger>

                  {/* DETAIL DIALOG POP-UP */}
                  <DialogContent className="sm:max-w-2xl bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl text-left overflow-y-auto max-h-[85vh]">
                    <DialogHeader className="border-b border-slate-100 pb-3">
                      <DialogTitle className="text-xl font-black text-[#280f91] uppercase flex items-center gap-2">
                        <Award className="h-5 w-5 text-[#ff6105]" /> Detail Profil Pendidik
                      </DialogTitle>
                    </DialogHeader>

                    <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {/* Photo Column */}
                      <div className="sm:col-span-1 space-y-4">
                        <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
                          {tutor.foto ? (
                            <img 
                              src={tutor.foto} 
                              alt={tutor.nama}
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                              No Photo
                            </div>
                          )}
                        </div>
                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center space-y-1">
                          <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Mulai Tugas</span>
                          <span className="text-xs font-black text-slate-700">{tutor.tanggalMulaiTugas || "-"}</span>
                        </div>
                      </div>

                      {/* Detail Fields Column */}
                      <div className="sm:col-span-2 space-y-4 text-slate-700">
                        <div className="border-b border-slate-100 pb-2">
                          <h2 className="text-xl font-black text-[#280f91] uppercase leading-tight">{tutor.nama}</h2>
                          <span className="inline-block bg-orange-100 text-[#ff6105] font-extrabold text-[10px] px-3.5 py-1 rounded-full uppercase tracking-wider mt-1.5 shadow-xs">
                            {tutor.tutorMapel}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-semibold text-xs leading-relaxed">
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Program Tugas</span>
                            <span className="text-slate-800 font-bold uppercase">{tutor.program || "-"}</span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">NUPTK</span>
                            <span className="text-slate-800 font-bold">{tutor.nuptk || "-"}</span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Tempat, Tgl Lahir</span>
                            <span className="text-slate-800 font-bold">{tutor.tempatTglLahir || "-"}</span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Jenis Kelamin</span>
                            <span className="text-slate-800 font-bold">{tutor.jenisKelamin || "-"}</span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Agama</span>
                            <span className="text-slate-800 font-bold">{tutor.agama || "-"}</span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Pendidikan</span>
                            <span className="text-slate-800 font-bold">{tutor.pendidikan || "-"}</span>
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Alamat Lengkap</span>
                            <span className="text-slate-800 font-bold leading-normal block">{tutor.alamat || "-"}</span>
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-1">
                              <Mail className="h-3 w-3" /> Email
                            </span>
                            <a href={`mailto:${tutor.email}`} className="text-[#ff6105] hover:underline font-bold text-[11px] block">
                              {tutor.email || "-"}
                            </a>
                          </div>
                        </div>

                        {/* SK Details */}
                        <div className="bg-[#cdeff6]/40 border border-[#a6e5f3] p-3.5 rounded-2xl space-y-2.5 text-xs text-slate-800">
                          <span className="block text-[9px] font-black text-[#280f91] uppercase tracking-wider border-b border-[#a6e5f3] pb-1">Keterangan SK SK Pengangkatan / Penugasan</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-bold">
                            <div>
                              <p className="text-[9px] text-slate-400 font-black uppercase">SK PENGANGKATAN</p>
                              <p>{tutor.nomorSkPengangkatan || "-"}</p>
                              <p className="text-[9px] text-slate-400 font-normal italic mt-0.5">{tutor.lembagaPengangkat}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-400 font-black uppercase">SK PENUGASAN</p>
                              <p>{tutor.nomorSkPenugasan || "-"}</p>
                              <p className="text-[9px] text-slate-400 font-normal italic mt-0.5">{tutor.lembagaPenugas}</p>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                    <DialogFooter className="border-t border-slate-100 pt-4">
                      <DialogClose asChild>
                        <Button className="rounded-xl bg-[#280f91] hover:bg-[#ff6105] text-white font-bold h-11 px-6 w-full sm:w-auto cursor-pointer">
                          Tutup Profil
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          ) : (
            <div className="max-w-md mx-auto bg-[#20108a] rounded-3xl p-8 text-center space-y-4 shadow-xl border border-blue-900/30">
              <div className="h-16 w-16 bg-[#00ff00]/10 rounded-2xl flex items-center justify-center mx-auto">
                <ShieldAlert className="h-8 w-8 text-[#00ff00]" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Belum Ada Tutor</h3>
              <p className="text-white/70 font-bold text-xs">
                Data tenaga pendidik saat ini belum tersedia.
              </p>
            </div>
          )}

        </div>
      </section>
    );
  }

  // DEFAULT HOMEPAGE VIEW (Tenaga Pendidik Section)
  return (
    <section id="tutor" className="py-24 bg-white relative border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-16">
          <div className="space-y-4 max-w-2xl text-left">
            <span className="text-sm font-extrabold uppercase tracking-widest text-[#ff6105] bg-orange-100 rounded-full px-4 py-1.5 inline-block">
              Tenaga Pendidik
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#280f91] uppercase">
              Daftar Tutor PKBM
            </h2>
            <p className="text-slate-650 font-semibold leading-relaxed">
              Didukung oleh tutor dan tenaga pendidik yang profesional, sabar, kompeten, dan berdedikasi tinggi membantu warga belajar berkembang.
            </p>
          </div>

          <Button
            onClick={() => {
              if (onNavigate) {
                onNavigate("/tutor");
              } else {
                window.history.pushState({}, "", "/tutor");
                window.dispatchEvent(new PopStateEvent("popstate"));
              }
            }}
            className="rounded-full bg-[#280f91] hover:bg-[#ff6105] text-white font-extrabold text-xs px-6 h-11 cursor-pointer transition-all shadow-md flex items-center gap-1.5"
          >
            Lihat Semua Pendidik <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Dynamic Tutor Grid on Homepage */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#280f91] border-t-transparent" />
          </div>
        ) : displayTutors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {displayTutors.map((tutor) => (
              <Dialog key={tutor.id}>
                <DialogTrigger asChild>
                  <div className="overflow-hidden border-2 border-slate-100 hover:border-[#ff6105] rounded-3xl transition-all duration-300 flex flex-col shadow-lg bg-white group cursor-pointer text-left">
                    <div className="aspect-[4/3] w-full relative overflow-hidden bg-slate-50">
                      {tutor.foto ? (
                        <img 
                          src={tutor.foto} 
                          alt={tutor.nama}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                          No Photo
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
                      <span className="absolute top-4 left-4 inline-flex items-center gap-1 rounded-full bg-[#280f91] px-3.5 py-1 text-[10px] font-black tracking-widest text-white uppercase shadow-xs z-10">
                        {tutor.tutorMapel}
                      </span>
                    </div>

                    <div className="p-6 flex-1 space-y-2.5">
                      <h3 className="text-base font-black text-[#280f91] leading-tight uppercase">
                        {tutor.nama}
                      </h3>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-wider">
                        Program: {tutor.program || "Paket C"}
                      </p>
                      <p className="text-slate-600 text-xs font-semibold leading-relaxed line-clamp-2">
                        Pendidikan: {tutor.pendidikan || "-"} ({tutor.tempatTglLahir})
                      </p>
                    </div>
                    
                    <div className="p-6 pt-0 border-t border-slate-50/50 mt-2">
                      <Button 
                        variant="link" 
                        className="p-0 h-auto font-black text-xs text-[#ff6105] group-hover:translate-x-1.5 transition-transform inline-flex items-center gap-1.5 uppercase"
                      >
                        Detail Profil Tutor
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </DialogTrigger>

                {/* DETAIL DIALOG POP-UP */}
                <DialogContent className="sm:max-w-2xl bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl text-left overflow-y-auto max-h-[85vh]">
                  <DialogHeader className="border-b border-slate-100 pb-3">
                    <DialogTitle className="text-xl font-black text-[#280f91] uppercase flex items-center gap-2">
                      <Award className="h-5 w-5 text-[#ff6105]" /> Detail Profil Pendidik
                    </DialogTitle>
                  </DialogHeader>

                  <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* Photo Column */}
                    <div className="sm:col-span-1 space-y-4">
                      <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
                        {tutor.foto ? (
                          <img 
                            src={tutor.foto} 
                            alt={tutor.nama}
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                            No Photo
                          </div>
                        )}
                      </div>
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center space-y-1">
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Mulai Tugas</span>
                        <span className="text-xs font-black text-slate-700">{tutor.tanggalMulaiTugas || "-"}</span>
                      </div>
                    </div>

                    {/* Detail Fields Column */}
                    <div className="sm:col-span-2 space-y-4 text-slate-700">
                      <div className="border-b border-slate-100 pb-2">
                        <h2 className="text-xl font-black text-[#280f91] uppercase leading-tight">{tutor.nama}</h2>
                        <span className="inline-block bg-orange-100 text-[#ff6105] font-extrabold text-[10px] px-3.5 py-1 rounded-full uppercase tracking-wider mt-1.5 shadow-xs">
                          {tutor.tutorMapel}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-semibold text-xs leading-relaxed">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Program Tugas</span>
                          <span className="text-slate-800 font-bold uppercase">{tutor.program || "-"}</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">NUPTK</span>
                          <span className="text-slate-800 font-bold">{tutor.nuptk || "-"}</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Tempat, Tgl Lahir</span>
                          <span className="text-slate-800 font-bold">{tutor.tempatTglLahir || "-"}</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Jenis Kelamin</span>
                          <span className="text-slate-800 font-bold">{tutor.jenisKelamin || "-"}</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Agama</span>
                          <span className="text-slate-800 font-bold">{tutor.agama || "-"}</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Pendidikan</span>
                          <span className="text-slate-800 font-bold">{tutor.pendidikan || "-"}</span>
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Alamat Lengkap</span>
                          <span className="text-slate-800 font-bold leading-normal block">{tutor.alamat || "-"}</span>
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-1">
                            <Mail className="h-3 w-3" /> Email
                          </span>
                          <a href={`mailto:${tutor.email}`} className="text-[#ff6105] hover:underline font-bold text-[11px] block">
                            {tutor.email || "-"}
                          </a>
                        </div>
                      </div>

                      {/* SK Details */}
                      <div className="bg-[#cdeff6]/40 border border-[#a6e5f3] p-3.5 rounded-2xl space-y-2.5 text-xs text-slate-800">
                        <span className="block text-[9px] font-black text-[#280f91] uppercase tracking-wider border-b border-[#a6e5f3] pb-1">Keterangan SK Pengangkatan / Penugasan</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-bold">
                          <div>
                            <p className="text-[9px] text-slate-400 font-black uppercase">SK PENGANGKATAN</p>
                            <p>{tutor.nomorSkPengangkatan || "-"}</p>
                            <p className="text-[9px] text-slate-400 font-normal italic mt-0.5">{tutor.lembagaPengangkat}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-400 font-black uppercase">SK PENUGASAN</p>
                            <p>{tutor.nomorSkPenugasan || "-"}</p>
                            <p className="text-[9px] text-slate-400 font-normal italic mt-0.5">{tutor.lembagaPenugas}</p>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  <DialogFooter className="border-t border-slate-100 pt-4">
                    <DialogClose asChild>
                      <Button className="rounded-xl bg-[#280f91] hover:bg-[#ff6105] text-white font-bold h-11 px-6 w-full sm:w-auto cursor-pointer">
                        Tutup Profil
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-xl">
            <div className="h-16 w-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldAlert className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider">Belum Ada Tutor</h3>
            <p className="text-slate-500 font-bold text-xs">
              Data tutor saat ini belum tersedia.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
