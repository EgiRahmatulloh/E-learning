import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
import { ArrowRight } from "lucide-react";
import type { Tutor } from "../../types/landing";

const tutors: Tutor[] = [
  {
    id: 1,
    name: "ACENG LS SUHENDI",
    role: "Tutor PJOK",
    image: "/images/633df6f47c394ce2b67bd54e4808301b.jpg",
    bio: "Berkomitmen menjaga kebugaran jasmani dan mengajarkan kedisiplinan serta pola hidup sehat kepada seluruh warga belajar PKBM Menuju Makmur.",
    specialty: "Pendidikan Jasmani, Olahraga & Kesehatan"
  },
  {
    id: 2,
    name: "H. MAMAN SUPARMAN, S.Pd.",
    role: "Tutor Bahasa Indonesia",
    image: "/images/7ccf08e706410fd4d0cde0c04b95b108.png",
    bio: "Mendidik warga belajar agar memiliki keterampilan berkomunikasi, mengapresiasi sastra, dan memahami tata bahasa Indonesia dengan baik.",
    specialty: "Bahasa & Sastra Indonesia"
  },
  {
    id: 3,
    name: "DEDEK KURNIAWAN, S.Si.",
    role: "Tutor Matematika & IPA",
    image: "/images/b8600352865365e6216298c1b2bcb4ce.png",
    bio: "Membuat pembelajaran sains dan matematika menjadi menyenangkan, logis, dan mudah dipahami oleh segala rentang usia.",
    specialty: "Matematika & Ilmu Pengetahuan Alam"
  }
];

export default function Tutors() {
  return (
    <section id="tutor" className="py-24 bg-white relative border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-sm font-extrabold uppercase tracking-widest text-[#ff6105] bg-orange-100 rounded-full px-4 py-1.5 inline-block">
            Tenaga Pendidik
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#280f91]">
            Daftar Tutor PKBM
          </h2>
          <p className="text-slate-600 font-semibold leading-relaxed">
            Didukung oleh tutor dan tenaga pendidik yang profesional, sabar, kompeten, dan berdedikasi tinggi membantu warga belajar berkembang.
          </p>
        </div>

        {/* Tutors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {tutors.map((tutor) => (
            <Dialog key={tutor.id}>
              <DialogTrigger asChild>
                <Card className="overflow-hidden border-2 hover:border-[#ff6105] transition-all duration-300 flex flex-col shadow-lg bg-white group cursor-pointer">
                  <div className="h-64 w-full relative overflow-hidden bg-slate-100">
                    <img 
                      src={tutor.image} 
                      alt={tutor.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
                    <span className="absolute top-4 left-4 inline-flex items-center gap-1 rounded-full bg-[#280f91] px-3.5 py-1 text-[10px] font-black tracking-widest text-white uppercase shadow-xs z-10">
                      {tutor.role}
                    </span>
                  </div>

                  <CardContent className="p-6 flex-1 space-y-2">
                    <h3 className="text-lg font-black text-[#280f91] leading-tight">
                      {tutor.name}
                    </h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                      Spesialisasi: {tutor.specialty}
                    </p>
                    <p className="text-slate-600 text-sm font-medium leading-relaxed line-clamp-2">
                      {tutor.bio}
                    </p>
                  </CardContent>
                  
                  <CardFooter className="p-6 pt-0">
                    <Button 
                      variant="link" 
                      className="p-0 h-auto font-black text-sm text-[#ff6105] group-hover:translate-x-1.5 transition-transform inline-flex items-center gap-1.5"
                    >
                      Detail Profil Tutor
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-2xl p-6 rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black text-[#280f91]">{tutor.name}</DialogTitle>
                  <DialogDescription className="text-sm font-bold text-[#ff6105]">{tutor.role}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="h-64 w-full rounded-2xl relative overflow-hidden border border-slate-200">
                    <img 
                      src={tutor.image} 
                      alt={tutor.name}
                      loading="lazy"
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="block text-xs font-extrabold text-[#280f91] uppercase tracking-wider">Mata Pelajaran & Bidang</span>
                    <p className="text-sm font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {tutor.specialty}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <span className="block text-xs font-extrabold text-[#280f91] uppercase tracking-wider">Biografi & Dedikasi</span>
                    <p className="text-slate-600 text-sm font-medium leading-relaxed">
                      {tutor.bio}
                    </p>
                  </div>
                </div>
                <DialogFooter className="border-t border-slate-100 pt-4 mt-2">
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
      </div>
    </section>
  );
}
