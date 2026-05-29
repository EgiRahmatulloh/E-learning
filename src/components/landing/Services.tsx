import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  BookMarked,
  CheckCircle2,
  MessageCircle,
  Users,
  Layers,
  Award
} from "lucide-react";

interface ServicesProps {
  backendData: { message: string; status: string } | null;
  onLoginClick: () => void;
}

export default function Services({ backendData, onLoginClick }: ServicesProps) {
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);

  return (
    <section id="layanan" className="py-24 bg-gradient-to-b from-white to-slate-50 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-sm font-extrabold uppercase tracking-widest text-[#ff6105] bg-orange-100 rounded-full px-4 py-1.5 inline-block">
            Layanan Pintar
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#280f91]">
            Portal Layanan Digital
          </h2>
          <p className="text-slate-600 font-medium">
            Kemudahan akses administrasi, pembelajaran mandiri, dan ujian bagi seluruh warga belajar di mana saja dan kapan saja.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Card 1: E-SPMB */}
          <Card className="overflow-hidden border-2 hover:border-[#ff6105] transition-all duration-300 flex flex-col group shadow-lg bg-white">
            <CardHeader className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-b border-purple-100 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/20 mb-4 group-hover:scale-110 transition-transform">
                <BookMarked className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl font-bold text-[#280f91]">E-SPMB</CardTitle>
              <CardDescription className="font-semibold text-purple-700">Pendaftaran Siswa Baru</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 px-6 flex-1">
              <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
                Portal Pendaftaran Siswa Baru PKBM secara digital. Mengisi data pribadi, melampirkan berkas secara online tanpa antre.
              </p>
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-100 flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                <span className="text-xs font-semibold text-purple-900 leading-relaxed">
                  Sistem otomatis mengirim notifikasi instan untuk konfirmasi berkas pendaftaran Anda.
                </span>
              </div>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full rounded-xl bg-purple-600 hover:bg-[#ff6105] text-white font-bold h-11 transition-colors shadow-xs cursor-pointer">
                    Hubungi Admin SPMB
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black text-[#280f91]">Pendaftaran Siswa Baru (SPMB)</DialogTitle>
                    <DialogDescription className="text-sm font-semibold text-purple-700">PKBM Menuju Makmur 2026/2027</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <p className="text-slate-600 text-sm leading-relaxed font-semibold">
                      Pendaftaran siswa baru untuk Paket A, Paket B, dan Paket C dapat dilakukan dengan mudah secara online. 
                    </p>
                    <div className="space-y-2.5 text-xs text-slate-500 font-bold bg-purple-50 p-4 rounded-xl border border-purple-100">
                      <span className="block text-purple-950 uppercase tracking-wider text-[10px] font-black">Persyaratan Berkas:</span>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />
                        <span>Fotokopi Ijazah Terakhir (dilegalisir 3 lembar)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />
                        <span>Fotokopi Kartu Keluarga & KTP (3 lembar)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />
                        <span>Pas Foto ukuran 3x4 & 4x6 (masing-masing 5 lembar)</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      Silakan hubungi sekretariat panitia SPMB via WhatsApp untuk mendapatkan link formulir pendaftaran digital dan panduan pengisian berkas.
                    </p>
                  </div>
                  <DialogFooter className="flex sm:justify-between gap-2 border-t border-slate-100 pt-4">
                    <DialogClose asChild>
                      <Button variant="outline" className="rounded-xl font-bold cursor-pointer">Tutup</Button>
                    </DialogClose>
                    <a href="https://wa.me/6282128594025?text=Halo%20Admin%20PKBM%20Menuju%20Makmur,%20saya%20tertarik%20mendaftar%20sebagai%20siswa%20baru.%20Mohon%20panduan%20E-SPMB%20online." target="_blank" rel="noopener noreferrer">
                      <Button className="rounded-xl bg-purple-600 hover:bg-[#ff6105] text-white font-bold h-11 px-5 flex items-center gap-2 cursor-pointer">
                        <MessageCircle className="h-5 w-5" />
                        Daftar via WhatsApp
                      </Button>
                    </a>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>

          {/* Card 2: E-LEARNING (Integrated with server connection status) */}
          <Card className="overflow-hidden border-2 border-[#280f91] hover:border-[#ff6105] transition-all duration-300 flex flex-col group shadow-xl relative scale-105 md:scale-105 z-10 bg-white">
            <div className="absolute top-2 right-6">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#ff6105] px-3.5 py-1 text-[10px] font-black tracking-widest text-white uppercase shadow-sm">
                Aktif
              </span>
            </div>
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-b border-[#280f91]/10 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#280f91] text-white shadow-md shadow-[#280f91]/20 mb-4 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl font-bold text-[#280f91]">E-LEARNING</CardTitle>
              <CardDescription className="font-semibold text-[#280f91]/80">Portal Belajar Mandiri</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 px-6 flex-1">
              <p className="text-slate-600 text-sm leading-relaxed mb-4 font-medium">
                Akses materi modul pelajaran, kuis harian, interaksi tutor-siswa, dan download bank soal secara mandiri kapan saja.
              </p>

              {/* Connection Status Hook from Elysia Backend */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Status Server E-Learning:</span>
                  {backendData ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 uppercase animate-pulse">
                      Online ✅
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black text-amber-800 uppercase">
                      Menghubungkan 🔄
                    </span>
                  )}
                </div>
                {backendData && (
                  <p className="text-[11px] font-mono text-[#280f91] italic bg-white p-2 rounded border border-slate-100">
                    "{backendData.message}"
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => setInfoDialogOpen(true)}
                    className="w-full rounded-xl bg-[#280f91] hover:bg-[#ff6105] text-white font-bold h-11 transition-colors shadow-md shadow-[#280f91]/20 cursor-pointer"
                  >
                    Masuk E-Learning
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black text-[#280f91]">Akses Portal E-Learning</DialogTitle>
                    <DialogDescription className="text-sm font-semibold text-slate-500">PKBM Menuju Makmur Portal Siswa & Tutor</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <p className="text-slate-600 text-sm leading-relaxed font-semibold">
                      Gunakan akun NISN (Nomor Induk Siswa Nasional) sebagai username dan kata sandi default yang diberikan oleh wali kelas Anda untuk masuk.
                    </p>
                    <div className="space-y-3 bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-500">Status Server:</span>
                        <span className="font-black text-emerald-600 uppercase">Aktif (Bun/Elysia)</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-500">Kecepatan Respon:</span>
                        <span className="font-black text-[#280f91]">~ 12ms</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-500">Jumlah Warga Belajar Aktif:</span>
                        <span className="font-black text-[#ff6150]">350+ Siswa</span>
                      </div>
                    </div>
                    <p className="text-xs text-[#280f91] font-bold leading-relaxed bg-[#e5fbff] p-3 rounded-lg border border-blue-200/60">
                      💡 Jika Anda lupa kata sandi atau mengalami kendala login, silakan hubungi bagian IT/tutor pendamping Anda untuk reset credential.
                    </p>
                  </div>
                  <DialogFooter className="flex sm:justify-between gap-2 border-t border-slate-100 pt-4">
                    <DialogClose asChild>
                      <Button variant="outline" className="rounded-xl font-bold cursor-pointer">Batal</Button>
                    </DialogClose>
                    <Button 
                      onClick={() => {
                        setInfoDialogOpen(false);
                        onLoginClick();
                      }}
                      className="rounded-xl bg-[#280f91] hover:bg-[#ff6105] text-white font-bold h-11 px-6 shadow-md shadow-[#280f91]/20 cursor-pointer"
                    >
                      Lanjutkan Ke Login
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>

          {/* Card 3: E-UJIAN */}
          <Card className="overflow-hidden border-2 hover:border-[#ff6105] transition-all duration-300 flex flex-col group shadow-lg bg-white">
            <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b border-emerald-100 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 mb-4 group-hover:scale-110 transition-transform">
                <Layers className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl font-bold text-[#280f91]">E-UJIAN</CardTitle>
              <CardDescription className="font-semibold text-emerald-700">Portal Evaluasi & Ujian</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 px-6 flex-1">
              <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
                Portal resmi pelaksanaan kuis evaluasi semester, penilaian tengah semester (PTS), serta ujian pendidikan kesetaraan akhir secara terpusat.
              </p>
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100 flex items-start gap-2.5">
                <Award className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-xs font-semibold text-emerald-900 leading-relaxed">
                  Sistem ujian terintegrasi dengan deteksi kecurangan dan perankingan nilai instan.
                </span>
              </div>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full rounded-xl bg-emerald-600 hover:bg-[#ff6105] text-white font-bold h-11 transition-colors shadow-xs cursor-pointer">
                    Akses Portal Ujian
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black text-[#280f91]">Portal E-Ujian Nasional</DialogTitle>
                    <DialogDescription className="text-sm font-semibold text-emerald-700">Ujian Pendidikan Kesetaraan (UPK)</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <p className="text-slate-600 text-sm leading-relaxed font-semibold">
                      Sistem ujian berbasis komputer kesetaraan Paket B dan Paket C terakreditasi nasional. 
                    </p>
                    <div className="space-y-2.5 text-xs text-slate-500 font-bold bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                      <span className="block text-emerald-950 uppercase tracking-wider text-[10px] font-black">Informasi Teknis:</span>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Wajib menggunakan browser standar modern (Chrome/Edge/Firefox)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Ujian dilengkapi dengan detektor perpindahan tab browser</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Hasil kuis langsung diunggah ke server Dapodik pusat</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      Ujian sedang dinonaktifkan di luar jadwal kalender UPK. Untuk latihan soal mandiri, gunakan bank soal di portal E-Learning.
                    </p>
                  </div>
                  <DialogFooter className="flex sm:justify-between gap-2 border-t border-slate-100 pt-4">
                    <DialogClose asChild>
                      <Button variant="outline" className="rounded-xl font-bold cursor-pointer">Tutup</Button>
                    </DialogClose>
                    <Button 
                      onClick={() => {
                        // TODO: Implementasi redirect ke portal ujian ketika sudah tersedia
                        const toast = document.createElement("div");
                        toast.className = "fixed bottom-6 right-6 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-bold z-[9999] animate-in slide-in-from-bottom-4 duration-300";
                        toast.textContent = "Portal Ujian belum tersedia di luar jadwal UPK.";
                        document.body.appendChild(toast);
                        setTimeout(() => toast.remove(), 3000);
                      }}
                      className="rounded-xl bg-emerald-600 hover:bg-[#ff6105] text-white font-bold h-11 px-5 shadow-xs cursor-pointer"
                    >
                      Buka Ruang Ujian
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}
