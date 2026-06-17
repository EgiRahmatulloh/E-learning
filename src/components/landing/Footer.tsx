import { Separator } from "@/components/ui/separator";
import { GraduationCap, MapPin, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">

        {/* MAIN: 5 COLUMNS - PKBM | Kontak | Program | Layanan | Maps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">

          {/* Col 1: PKBM MENUJU MAKMUR */}
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

          {/* Col 2: Informasi Kontak */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Informasi Kontak</h4>
            <ul className="space-y-3 text-xs font-semibold text-slate-500">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-[#ff6105] shrink-0 mt-0.5" />
                <span className="leading-relaxed">Dusun Pangrumasan Rt. 004 Rw. 001 Desa Cintanagara, Kec. Jatinagara Kab. Ciamis</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-[#ff6105] shrink-0 mt-0.5" />
                <a href="https://wa.me/6282128594025" className="hover:text-white transition-colors">0821 2859 4025</a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-[#ff6105] shrink-0 mt-0.5" />
                <a href="mailto:admin@pkbmmenujumakmur.sch.id" className="hover:text-white transition-colors break-all">
                  admin@pkbmmenujumakmur.sch.id
                </a>
              </li>
            </ul>
            <div className="flex items-center gap-2 pt-1">
              <a
                href="#"
                aria-label="Facebook"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-400 hover:bg-[#1877F2] hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.408.593 24 1.325 24H12.82v-9.294H9.692V11.08h3.128V8.408c0-3.1 1.894-4.788 4.659-4.788 1.325 0 2.464.099 2.795.143v3.24h-1.918c-1.504 0-1.796.715-1.796 1.763v2.313h3.587l-.467 3.626h-3.12V24h6.116C23.407 24 24 23.408 24 22.676V1.325C24 .593 23.407 0 22.675 0z"/>
                </svg>
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-400 hover:bg-[#ff6105] hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
              <a
                href="#"
                aria-label="YouTube"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-400 hover:bg-red-600 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a
                href="https://wa.me/6282128594025"
                aria-label="WhatsApp"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-400 hover:bg-[#25D366] hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M27.286 4.65A15.84 15.84 0 0 0 16.029.001C7.214.001.038 7.176.034 15.993a15.95 15.95 0 0 0 2.133 7.994L0 32l8.198-2.151a16 16 0 0 0 7.825 1.994h.007c8.814 0 15.99-7.176 15.994-15.993a15.9 15.9 0 0 0-4.738-11.2M16.03 29.143h-.005a13.3 13.3 0 0 1-6.767-1.853l-.485-.288-5.064 1.328 1.351-4.937-.316-.504a13.27 13.27 0 0 1-2.034-7.096C2.713 8.644 8.679 2.68 16.034 2.68a13.3 13.3 0 0 1 9.412 3.903 13.23 13.23 0 0 1 3.897 9.416c-.003 7.371-5.969 13.144-13.314 13.144m7.298-9.954c-.4-.2-2.366-1.168-2.733-1.301-.367-.133-.633-.2-.9.2s-1.033 1.301-1.267 1.568-.467.3-.866.1c-.4-.2-1.689-.623-3.216-1.985-1.189-1.061-1.992-2.371-2.225-2.772s-.025-.616.175-.815c.18-.179.4-.467.6-.7s.267-.4.4-.667.067-.5-.033-.7-.9-2.169-1.233-2.97c-.325-.78-.655-.674-.9-.687-.233-.011-.5-.014-.766-.014a1.47 1.47 0 0 0-1.067.5c-.367.4-1.399 1.368-1.399 3.336s1.433 3.87 1.633 4.137 2.819 4.305 6.829 6.038c.954.412 1.699.659 2.28.844.957.305 1.829.262 2.518.158.768-.114 2.366-.967 2.7-1.901s.333-1.734.233-1.901-.367-.267-.766-.467" />
                </svg>
              </a>
            </div>
          </div>

          {/* Col 3: Program Pendidikan */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Program Pendidikan</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-500">
              <li><span className="hover:text-white transition-colors cursor-default">Paket A (Setara SD)</span></li>
              <li><span className="hover:text-white transition-colors cursor-default">Paket B (Setara SMP)</span></li>
              <li><span className="hover:text-white transition-colors cursor-default">Paket C (Setara SMA)</span></li>
              <li><span className="hover:text-white transition-colors cursor-default">Kursus & Pelatihan</span></li>
            </ul>
          </div>

          {/* Col 4: Layanan Pintar */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Layanan Pintar</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-500">
              <li><a href="#beranda" className="hover:text-white transition-colors">E-SPMB</a></li>
              <li><a href="#beranda" className="hover:text-white transition-colors">E-LEARNING</a></li>
              <li><a href="#beranda" className="hover:text-white transition-colors">E-UJIAN</a></li>
            </ul>
          </div>

          {/* Col 5: Maps */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">Maps</h4>
            <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950 relative">
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
            <a
              href="https://maps.app.goo.gl/Hp5bXgiobn5McmL39"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0ff60a] hover:text-white transition-colors"
            >
              <MapPin className="h-3.5 w-3.5" /> Buka di Google Maps
            </a>
          </div>

        </div>

        <Separator className="bg-slate-900" />

        {/* BOTTOM: COPYRIGHT SECTION */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left pt-8">
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
