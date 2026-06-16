import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Minus, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { MASTER_MAPEL } from "./MasterMapel";

export default function BlueprintManager() {
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPaket, setSelectedPaket] = useState("");
  const [selectedMapel, setSelectedMapel] = useState("");
  const [sessionCount, setSessionCount] = useState(8);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleSave = () => {
    if (!selectedPaket || !selectedMapel) {
      toast.error("Paket dan Mata Pelajaran harus dipilih");
      return;
    }
    setIsSaving(true);
    timerRef.current = setTimeout(() => {
      setIsSaving(false);
      toast.success(`Berhasil mengatur jumlah sesi untuk ${selectedMapel} menjadi ${sessionCount} sesi!`);
      // Reset form
      setSelectedPaket("");
      setSelectedMapel("");
      setSessionCount(8);
    }, 1500);
  };

  const handleDecrease = () => setSessionCount(prev => Math.max(1, prev - 1));
  const handleIncrease = () => setSessionCount(prev => prev + 1);

  // When paket changes, reset mapel
  const onPaketChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPaket(e.target.value);
    setSelectedMapel("");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-1 space-y-4">
          <h3 className="text-lg font-black text-cyan-900 tracking-tight">Kelola Sesi Kelas</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Gunakan fitur ini untuk <strong>menambah atau menghapus sesi kelas</strong> pada suatu mata pelajaran secara manual. 
            Secara default, setiap mata pelajaran berjalan dengan <strong>8 sesi</strong>. Jika Anda ingin menambah jumlah sesi untuk pengayaan atau menguranginya, Anda dapat menyesuaikannya di sini.
          </p>
        </div>
        <div className="w-full md:w-80 bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-5 shrink-0">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Pilih Paket</label>
            <select
              value={selectedPaket}
              onChange={onPaketChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold focus:border-[#280f91] outline-none transition-colors"
            >
              <option value="">-- Pilih Paket --</option>
              {Object.keys(MASTER_MAPEL).map(paket => (
                <option key={paket} value={paket}>{paket}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Pilih Mata Pelajaran</label>
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold focus:border-[#280f91] outline-none transition-colors disabled:opacity-50"
              disabled={!selectedPaket}
            >
              <option value="">-- Pilih Mata Pelajaran --</option>
              {selectedPaket && (MASTER_MAPEL as any)[selectedPaket]?.map((mapel: string) => (
                <option key={mapel} value={mapel}>{mapel}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Atur Jumlah Sesi</label>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleDecrease}
                disabled={sessionCount <= 1}
                className="h-10 w-10 shrink-0 border-slate-300 rounded-xl"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <div className="flex-1 h-10 border border-slate-200 bg-white rounded-xl flex items-center justify-center font-black text-[#280f91] text-lg">
                {sessionCount} <span className="text-sm font-semibold text-slate-500 ml-1">Sesi</span>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleIncrease}
                className="h-10 w-10 shrink-0 border-slate-300 rounded-xl"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving || !selectedPaket || !selectedMapel}
            className="w-full bg-gradient-to-r from-[#280f91] to-[#401bbd] hover:opacity-90 text-white font-bold py-2.5 h-auto rounded-xl mt-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Simpan Perubahan
          </Button>
        </div>
      </div>
    </div>
  );
}
