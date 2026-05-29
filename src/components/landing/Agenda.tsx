import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Clock } from "lucide-react";
import type { AgendaItem } from "../../types/landing";

const agendaItems: AgendaItem[] = [
  {
    id: 1,
    title: "Ujian Pendidikan Kesetaraan Paket B",
    day: "Senin - Rabu",
    date: "25 - 27 Mei 2026",
    location: "Kampus PKBM Menuju Makmur",
    time: "07:30 - 12:00 WIB"
  },
  {
    id: 2,
    title: "Workshop Wirausaha & Kreativitas Warga Belajar",
    day: "Sabtu",
    date: "06 Juni 2026",
    location: "Aula Desa Cintanagara",
    time: "09:00 - 15:00 WIB"
  },
  {
    id: 3,
    title: "Rapat Koordinasi Tutor dan Evaluasi Semester",
    day: "Kamis",
    date: "11 Juni 2026",
    location: "Ruang Rapat Utama PKBM",
    time: "13:00 - 16:30 WIB"
  }
];

export default function Agenda() {
  return (
    <section id="agenda" className="py-24 bg-[#b5e4ed] border-y border-slate-300/40 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-[#280f91] bg-white/60 rounded-full px-4 py-1.5 inline-block">
            Kalender Kegiatan
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#280f91] tracking-tight">
            Agenda PKBM Menuju Makmur
          </h2>
          <p className="text-slate-800 font-semibold leading-relaxed">
            Jadwal pelaksanaan kegiatan akademik, ujian pendidikan kesetaraan, lokakarya wirausaha, serta pertemuan wali murid resmi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {agendaItems.map((agenda) => (
            <Card key={agenda.id} className="border-0 shadow-xl overflow-hidden hover:scale-102 transition-transform duration-300 bg-white">
              {/* Header Banner */}
              <div className="bg-[#280f91] py-4 px-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#0ff60a]" />
                  <span className="text-sm font-bold">{agenda.day}</span>
                </div>
                <span className="text-xs font-black bg-[#ff6105] rounded-full px-3 py-1 text-white uppercase">
                  Aktif
                </span>
              </div>
              
              <CardContent className="p-6 space-y-5">
                <div>
                  <span className="block text-xs font-bold text-slate-400 mb-1">Nama Agenda:</span>
                  <h3 className="text-lg font-black text-[#280f91] leading-tight">
                    {agenda.title}
                  </h3>
                </div>

                <Separator />

                <div className="space-y-3.5">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-[#ff6105] shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-xs font-bold text-slate-400">Tanggal:</span>
                      <span className="text-sm font-bold text-[#280f91]">{agenda.date}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-[#ff6105] shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-xs font-bold text-slate-400">Tempat:</span>
                      <span className="text-sm font-bold text-slate-700">{agenda.location}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-[#ff6105] shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-xs font-bold text-slate-400">Waktu:</span>
                      <span className="text-sm font-bold text-slate-700">{agenda.time}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
