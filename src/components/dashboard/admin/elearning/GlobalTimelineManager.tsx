import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, CalendarClock } from "lucide-react";
import { toast } from "sonner";

export default function GlobalTimelineManager() {
  const [sessions, setSessions] = useState([
    { id: 1, start: "2024-03-01", end: "2024-03-07" },
    { id: 2, start: "2024-03-08", end: "2024-03-14" },
    { id: 3, start: "2024-03-15", end: "2024-03-21" },
    { id: 4, start: "2024-03-22", end: "2024-03-28" },
    { id: 5, start: "2024-03-29", end: "2024-04-04" },
    { id: 6, start: "2024-04-05", end: "2024-04-11" },
    { id: 7, start: "2024-04-12", end: "2024-04-18" },
    { id: 8, start: "2024-04-19", end: "2024-04-25" },
  ]);

  const handleSave = () => {
    toast.success("Timeline global berhasil disimpan! Semua kelas akan mengikuti jadwal ini.");
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div>
        <h3 className="text-lg font-black text-cyan-900 tracking-tight flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-cyan-600" /> Pengaturan Batas Waktu Global
        </h3>
        <p className="text-sm text-slate-500 mt-1">Atur jadwal buka/tutup sesi secara otomatis sesuai kalender akademik.</p>
      </div>

      <div className="space-y-3">
        {sessions.map((sesi, idx) => (
          <div key={sesi.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <div className="w-24 font-bold text-slate-700">Sesi {sesi.id}</div>
            <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:w-1/2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tanggal Buka</label>
                <input
                  type="date"
                  value={sesi.start}
                  onChange={(e) => {
                    const newSessions = [...sessions];
                    newSessions[idx].start = e.target.value;
                    setSessions(newSessions);
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold outline-none focus:border-cyan-500"
                />
              </div>
              <div className="w-full sm:w-1/2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tanggal Tutup</label>
                <input
                  type="date"
                  value={sesi.end}
                  onChange={(e) => {
                    const newSessions = [...sessions];
                    newSessions[idx].end = e.target.value;
                    setSessions(newSessions);
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <Button onClick={handleSave} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl px-6">
          <Save className="w-4 h-4 mr-2" />
          Simpan Timeline
        </Button>
      </div>
    </div>
  );
}
