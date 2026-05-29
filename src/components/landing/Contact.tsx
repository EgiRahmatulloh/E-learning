import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Mail, Phone } from "lucide-react";

export default function Contact() {
  return (
    <section id="kontak" className="py-24 bg-slate-50 relative border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 max-w-5xl mx-auto items-start">
          
          {/* Contact Details */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#ff6105] bg-orange-100 rounded-full px-4 py-1.5 inline-block">
                Informasi Kontak
              </span>
              <h2 className="text-3xl font-black text-[#280f91] tracking-tight">
                Kontak Resmi Kami
              </h2>
              <p className="text-slate-600 font-semibold leading-relaxed">
                Kami siap memberikan informasi dan pelayanan kepada siswa, orang tua, serta masyarakat pada jam kerja. Silakan hubungi kami melalui kontak di bawah ini.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-[#ff6105]">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#280f91] uppercase tracking-wider mb-1">Alamat Lengkap</h4>
                  <p className="text-slate-600 text-sm font-semibold leading-relaxed">
                    Dusun Pangrumasan Rt. 004 Rw. 001 Desa Cintanagara, Kecamatan Jatinagara Kab. Ciamis Prov. Jawa Barat
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-[#ff6105]">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#280f91] uppercase tracking-wider mb-1">E-mail Resmi</h4>
                  <a href="mailto:admin@pkbmmenujumakmur.sch.id" className="text-blue-600 text-sm font-semibold hover:underline">
                    admin@pkbmmenujumakmur.sch.id
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-[#ff6105]">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#280f91] uppercase tracking-wider mb-1">Nomor Telepon / WA</h4>
                  <a href="https://wa.me/6282128594025" className="text-slate-600 text-sm font-bold hover:text-[#280f91] transition-colors">
                    0821 2859 4025
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Google Maps Location Card */}
          <div className="lg:col-span-7">
            <Card className="shadow-2xl border-0 p-8 sm:p-10 rounded-3xl bg-white relative overflow-hidden flex flex-col justify-between h-full min-h-[480px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#b5e4ed]/30 rounded-bl-full -z-10"></div>
              
              <div className="space-y-3 mb-6">
                <h3 className="text-xl font-black text-[#280f91]">Lokasi Lembaga & Google Maps</h3>
                <p className="text-slate-600 text-sm font-semibold leading-relaxed">
                  Temukan rute perjalanan terbaik atau kunjungi langsung PKBM Menuju Makmur melalui peta interaktif di bawah ini.
                </p>
              </div>
              
              <div className="flex-1 w-full rounded-2xl overflow-hidden border border-slate-200/80 shadow-inner bg-slate-50 relative aspect-[16/10] sm:aspect-[16/9]">
                <iframe 
                  src="https://maps.google.com/maps?q=PKBM%20Menuju%20Makmur%2C%20Jatinagara%2C%20Ciamis&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={true} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Peta Lokasi PKBM Menuju Makmur"
                  className="absolute inset-0 w-full h-full"
                ></iframe>
              </div>
              
              <div className="mt-6 shrink-0">
                <a 
                  href="https://maps.app.goo.gl/Hp5bXgiobn5McmL39" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block"
                >
                  <Button className="w-full rounded-xl bg-[#280f91] hover:bg-[#ff6105] text-white font-bold h-12 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#280f91]/15 group cursor-pointer">
                    <MapPin className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    Buka Rute di Google Maps
                  </Button>
                </a>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
