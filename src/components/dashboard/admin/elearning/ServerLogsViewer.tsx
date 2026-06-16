import { Activity, Server } from "lucide-react";

export default function ServerLogsViewer() {
  const mockLogs = [
    { id: 1, time: "10:05:22", type: "INFO", message: "User budi_tutor logged in successfully." },
    { id: 2, time: "10:12:45", type: "WARN", message: "High traffic detected: 150 concurrent connections." },
    { id: 3, time: "10:15:00", type: "ERROR", message: "Failed to upload assignment file (Timeout) for student_id: 124." },
    { id: 4, time: "10:20:10", type: "INFO", message: "Sync job 'Warga Belajar' completed in 1.2s." },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-900 p-6 shadow-sm text-slate-300">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
          <Server className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-lg font-black text-white tracking-tight">Manajemen Log & Server</h3>
          <p className="text-xs text-slate-400">Pantau aktivitas sistem dan beban server secara real-time.</p>
        </div>
      </div>

      <div className="font-mono text-xs space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
        {mockLogs.map((log) => (
          <div key={log.id} className="flex gap-3 items-start hover:bg-slate-800/50 p-1.5 rounded">
            <span className="text-slate-500 shrink-0">[{log.time}]</span>
            <span className={`shrink-0 font-bold ${
              log.type === "INFO" ? "text-blue-400" :
              log.type === "WARN" ? "text-yellow-400" : "text-red-400"
            }`}>
              {log.type}
            </span>
            <span className="text-slate-300 break-words">{log.message}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-800 flex items-center text-xs text-slate-500">
        <Activity className="w-3 h-3 mr-1.5 text-emerald-500" /> Status Server: Normal
      </div>
    </div>
  );
}
