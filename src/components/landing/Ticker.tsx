import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

interface Announcement {
  id: string;
  creator: string;
  text: string;
  date: string;
  status: string;
}

const formatDateDisplay = (dateStr: string | null | undefined) => {
  if (!dateStr || typeof dateStr !== "string") return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const [yyyy, mm, dd] = parts;
    if (yyyy && yyyy.length === 4 && mm && mm.length === 2 && dd && dd.length === 2) {
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

  // Don't render if no active announcements
  if (announcements.length === 0) return null;

  // Build the marquee content with all announcements
  const renderAnnouncements = () =>
    announcements.map((item, index) => (
      <span key={item.id} className="inline-flex items-center">
        <span className="text-sm md:text-base font-bold text-white px-4">
          📢 {item.text}{" "}
          <span className="text-[#cafc05] font-extrabold tracking-wide ml-2">
            [{formatDateDisplay(item.date)}]
          </span>
        </span>
        {/* Separator between announcements */}
        {index < announcements.length - 1 && (
          <span className="text-white/40 mx-4 text-lg">•</span>
        )}
      </span>
    ));

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 bg-[#280f91] border-t border-white/10 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.4)] backdrop-blur-md">
      <div className="flex items-center">
        {/* Label - Fixed on the left */}
        <div className="bg-[#ff6105] text-white px-4 py-1 flex items-center gap-2 z-10 relative shadow-[5px_0_15px_rgba(0,0,0,0.3)]">
          <AlertCircle className="h-4 w-4 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap">Pengumuman</span>
        </div>
        
        {/* Marquee Container - seamless infinite loop */}
        <div className="flex-1 overflow-hidden whitespace-nowrap relative">
          <div className="animate-marquee">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="inline-flex items-center">
                {renderAnnouncements()}
                <span className="text-white/40 mx-4 text-lg">•</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
