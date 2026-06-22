import { useState } from "react";
import { Users, Activity, FileQuestion, Layers } from "lucide-react";
import KelolaElearning from "./KelolaElearning";
import TutorMonitoring from "./TutorMonitoring";
import SiswaMonitoring from "./SiswaMonitoring";
import AngketEvaluasiTutor from "./AngketEvaluasiTutor";

export default function ElearningAdminDashboard() {
  const [activeTab, setActiveTab] = useState<"kelola" | "monitoring" | "siswa" | "angket">("kelola");

  const tabs = [
    { id: "kelola", label: "Kelola Elearning", icon: <Layers className="w-4 h-4" /> },
    { id: "monitoring", label: "Tutor", icon: <Activity className="w-4 h-4" /> },
    { id: "siswa", label: "Warga Belajar", icon: <Users className="w-4 h-4" /> },
    { id: "angket", label: "Angket Evaluasi Tutor", icon: <FileQuestion className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header Elearning */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black text-cyan-900 tracking-tight">Manajemen E-Learning Nasional</h2>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Pusat kendali pengaturan jadwal, template mata pelajaran, sinkronisasi data tutor dan siswa, serta pengawasan aktivitas.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[#280f91] text-white shadow-md"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#280f91]"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "kelola" && <KelolaElearning />}
        {activeTab === "monitoring" && <TutorMonitoring />}
        {activeTab === "siswa" && <SiswaMonitoring />}
        {activeTab === "angket" && <AngketEvaluasiTutor />}
      </div>
    </div>
  );
}

