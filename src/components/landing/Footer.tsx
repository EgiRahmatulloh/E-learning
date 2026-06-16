import { Separator } from "@/components/ui/separator";
import { MapPin, Phone, Mail, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-20 border-t border-slate-900 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">

        {/* TOP: CONTACT & MAP SECTION WITH CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20 items-stretch">

          {/* Contact Details Card */}
          <div className="lg:col-span-5">
            <Card className="h-full bg-slate-900/50 border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col justify-between">
              <div className="space-y-6">
                <div className="space-y-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0ff60a] bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 inline-block">
                    Informasi Kontak
                  </span>
                  <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                    Hubungi Kami
                  </h2>
                  <p className="text-slate-500 font-semibold leading-relaxed text-sm">
                    Kami siap memberikan pelayanan kepada warga belajar, orang tua, dan masyarakat.
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-[#ff6105] border border-slate-700">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-white uppercase tracking-wider mb-1">Alamat Lembaga</h4>
                      <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                        Dusun Pangrumasan Rt. 004 Rw. 001 Desa Cintanagara, Kecamatan Jatinagara Kab. Ciamis Prov. Jawa Barat
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-[#ff6105] border border-slate-700">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-white uppercase tracking-wider mb-1">E-mail Resmi</h4>
                      <a href="mailto:admin@pkbmmenujumakmur.sch.id" className="text-slate-400 text-xs font-semibold hover:text-[#0ff60a] transition-colors">
                        admin@pkbmmenujumakmur.sch.id
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-[#ff6105] border border-slate-700">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-white uppercase tracking-wider mb-1">Telepon / WA</h4>
                      <a href="https://wa.me/6282128594025" className="text-slate-400 text-xs font-bold hover:text-[#0ff60a] transition-colors">
                        0821 2859 4025
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Map Section Card */}
          <div className="lg:col-span-7">
            <Card className="h-full bg-slate-900/50 border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col">
              <div className="space-y-2 mb-6">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Lokasi Google Maps</h3>
                <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                  Temukan rute perjalanan terbaik menuju PKBM Menuju Makmur melalui peta interaktif.
                </p>
              </div>

              <div className="flex-1 w-full rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950 relative min-h-[300px]">
                <iframe
                  src="https://maps.google.com/maps?q=PKBM%20Menuju%20Makmur%2C%20Jatinagara%2C%20Ciamis&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Peta Lokasi PKBM Menuju Makmur"
                  className="absolute inset-0 w-full h-full grayscale-[0.3] invert-[0.05]"
                ></iframe>
              </div>

              <div className="mt-6">
                <Button asChild className="w-full rounded-xl bg-[#280f91] hover:bg-[#ff6105] text-white font-bold h-11 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/20 group cursor-pointer">
                  <a href="https://maps.app.goo.gl/Hp5bXgiobn5McmL39" target="_blank" rel="noopener noreferrer">
                    <MapPin className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    Buka Rute di Google Maps
                  </a>
                </Button>
              </div>
            </Card>
          </div>
        </div>

        <Separator className="bg-slate-900 mb-12" />

        {/* MIDDLE: LINKS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Col 1: About */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white">
                <GraduationCap className="h-6 w-6 text-[#0ff60a]" />
              </div>
              <span className="text-base font-black tracking-tight text-white">PKBM MENUJU MAKMUR</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 font-medium">
              Penyelenggara resmi program pendidikan kesetaraan terakreditasi di Kabupaten Ciamis, Jawa Barat.
            </p>
          </div>

          {/* Col 2: Program */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Program Pendidikan</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-500">
              <li><span className="hover:text-white transition-colors cursor-default">Paket A (Setara SD)</span></li>
              <li><span className="hover:text-white transition-colors cursor-default">Paket B (Setara SMP)</span></li>
              <li><span className="hover:text-white transition-colors cursor-default">Paket C (Setara SMA)</span></li>
              <li><span className="hover:text-white transition-colors cursor-default">Kursus & Pelatihan</span></li>
            </ul>
          </div>

          {/* Col 3: Layanan */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Layanan Pintar</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-500">
              <li><a href="#beranda" className="hover:text-white transition-colors">E-SPMB</a></li>
              <li><a href="#beranda" className="hover:text-white transition-colors">E-LEARNING</a></li>
              <li><a href="#beranda" className="hover:text-white transition-colors">E-UJIAN</a></li>
            </ul>
          </div>

          {/* Col 4: Jam Kerja */}
          {/* <div className="space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Jam Pelayanan</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-500">
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#ff6105] shrink-0" />
                <span>Senin - Sabtu: 08:00 - 14:00</span>
              </li>
              <li className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#ff6105] shrink-0" />
                <span>Minggu & Merah: Libur</span>
              </li>
            </ul>
          </div> */}
        </div>

        <Separator className="bg-slate-900" />

        {/* BOTTOM: COPYRIGHT SECTION */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left pt-10">
          <p className="text-xs font-semibold text-slate-600">
            © 2026 Tim IT PKBM Menuju Makmur | Membangun Pendidikan, Menciptakan Masa Depan
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
