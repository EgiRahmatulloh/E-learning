import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

interface Announcement {
  id: string;
  creator: string;
  text: string;
  date: string;
  status: string;
}

const formatDateDisplay = (dateStr: string) => {
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts[0].length === 4) {
      const [yyyy, mm, dd] = parts;
      return `${dd}-${mm}-${yyyy}`;
    }
  }
  return dateStr;
};

export default function Ticker() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    fetch("/api/announcements")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil data pengumuman");
        return res.json();
      })
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          // Filter only active announcements
          const activeList = data.data.filter((item: any) => item.status === "AKTIF");
          setAnnouncements(activeList);
        }
      })
      .catch((err) => console.error("Gagal memuat pengumuman:", err));
  }, []);

  // Use latest active announcement, otherwise don't display ticker at all
  const activeAnnouncement = announcements[announcements.length - 1];

  if (!activeAnnouncement) return null;

  return (
    <div className="bg-[#e5fbff] border-b border-blue-200/60 py-3.5 px-4 overflow-hidden relative">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 text-white px-3 py-1 text-xs font-black uppercase tracking-wider shadow-sm animate-pulse shrink-0">
          <AlertCircle className="h-3.5 w-3.5" />
          Pengumuman
        </span>
        <div className="text-sm md:text-base font-bold text-[#280f91] text-center md:text-left leading-relaxed">
          <span className="animate-in fade-in duration-300">
            📢 {activeAnnouncement.text} <span className="text-[#ff6105] font-extrabold tracking-wide">{formatDateDisplay(activeAnnouncement.date)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
