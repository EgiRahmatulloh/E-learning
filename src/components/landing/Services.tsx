import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  MessageCircle,
} from "lucide-react";

interface ServicesProps {
  backendData: { message: string; status: string } | null;
  onLoginClick: () => void;
  activeDialog: "e-spmb" | "e-learning" | "e-ujian" | null;
  onDialogClose: () => void;
}

export default function Services({ backendData: _backendData, onLoginClick, activeDialog, onDialogClose }: ServicesProps) {
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: "", show: false });

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ message: "", show: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  return (
    <>
      {/* ===== E-SPMB Dialog ===== */}
      <Dialog open={activeDialog === "e-spmb"} onOpenChange={(open) => !open && onDialogClose()}>
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
            <Button asChild className="rounded-xl bg-purple-600 hover:bg-[#ff6105] text-white font-bold h-11 px-5 flex items-center gap-2 cursor-pointer">
              <a href="https://wa.me/6282128594025?text=Halo%20Admin%20PKBM%20Menuju%20Makmur,%20saya%20tertarik%20mendaftar%20sebagai%20siswa%20baru.%20Mohon%20panduan%20E-SPMB%20online." target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-5 w-5" />
                Daftar via WhatsApp
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== E-LEARNING Dialog ===== */}
      <Dialog open={activeDialog === "e-learning"} onOpenChange={(open) => !open && onDialogClose()}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#280f91]">Portal E-Learning Mandiri</DialogTitle>
            <DialogDescription className="text-sm font-semibold text-indigo-700">Akses Pembelajaran Digital & Modul</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-slate-600 text-sm leading-relaxed font-semibold">
              Gunakan akun resmi yang diberikan oleh administrator untuk masuk ke portal E-Learning dan mengakses modul pembelajaran.
            </p>
            <div className="space-y-2.5 text-xs text-slate-500 font-bold bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <span className="block text-indigo-950 uppercase tracking-wider text-[10px] font-black">Layanan Mandiri:</span>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>Unduh Modul Kurikulum Merdeka & K-13 Lengkap</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>Mengerjakan Tugas Interaktif & Diskusi Kelas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>Melihat Hasil Rekapitulasi Kehadiran & Nilai Tugas</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Hubungi wali kelas atau admin E-Learning jika Anda lupa password atau memerlukan bantuan teknis akun belajar Anda.
            </p>
          </div>
          <DialogFooter className="flex sm:justify-between gap-2 border-t border-slate-100 pt-4">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-xl font-bold cursor-pointer">Tutup</Button>
            </DialogClose>
            <Button 
              onClick={() => {
                onDialogClose();
                onLoginClick();
              }}
              className="rounded-xl bg-[#280f91] hover:bg-[#ff6105] text-white font-bold h-11 px-5 shadow-xs cursor-pointer"
            >
              Masuk Kelas Belajar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== E-UJIAN Dialog ===== */}
      <Dialog open={activeDialog === "e-ujian"} onOpenChange={(open) => !open && onDialogClose()}>
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
                setToast({ message: "Portal Ujian belum tersedia di luar jadwal UPK.", show: true });
              }}
              className="rounded-xl bg-emerald-600 hover:bg-[#ff6105] text-white font-bold h-11 px-5 shadow-xs cursor-pointer"
            >
              Buka Ruang Ujian
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {toast.show && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-bold z-[9999] animate-in slide-in-from-bottom-4 duration-300">
          {toast.message}
        </div>
      )}
    </>
  );
}
