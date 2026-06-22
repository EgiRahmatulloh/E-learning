import { LayoutDashboard } from "lucide-react";

export default function RombelManager() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 animate-in fade-in duration-300">
      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center shadow-lg shadow-cyan-200/50">
        <LayoutDashboard className="h-10 w-10 text-cyan-600" />
      </div>
      <h3 className="text-xl font-black text-slate-700 uppercase tracking-wide">
        ROMBEL
      </h3>
      <p className="text-sm text-slate-500 font-semibold max-w-sm">
        Fitur Rombel Sedang Dalam Tahap Pengembangan.
      </p>
    </div>
  );
}
