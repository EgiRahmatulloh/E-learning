import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
const getJakartaYearMonthDay = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date);
  const year = Number(parts.find(p => p.type === "year")!.value);
  const month = Number(parts.find(p => p.type === "month")!.value);
  const day = Number(parts.find(p => p.type === "day")!.value);
  return { year, month, day };
};

export default function KehadiranTab() {
  const [attendedToday, setAttendedToday] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchAttendanceStatus = async () => {
    try {
      const res = await fetch("/api/elearning/tutor-attendance", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (data.success) {
        setAttendedToday(data.attended);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {
      const { year, month } = getJakartaYearMonthDay(currentDate);
      const res = await fetch(`/api/elearning/tutor-attendance/history?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (data.success) {
        setHistory(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAttendanceStatus();
    fetchHistory();
  }, [currentDate]);

  const handleMarkAttendance = async () => {
    if (attendedToday) return;
    try {
      const res = await fetch("/api/elearning/tutor-attendance", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (data.success) {
        setAttendedToday(true);
        toast.success(data.message);
        fetchHistory(); // refresh calendar
      } else {
        toast.error(data.message);
      }
    } catch (err: any) {
      toast.error("Gagal menandai kehadiran");
    }
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  // Calendar rendering logic — use Jakarta timezone for date construction
  const { year, month: jakartaMonth } = getJakartaYearMonthDay(currentDate);
  const month = jakartaMonth - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
  
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-[#280f91] text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-xl font-black mb-1">Kehadiran Tutor</h3>
          <p className="text-sm text-indigo-200 font-medium">Tandai kehadiran Anda hari ini dan lihat riwayat kehadiran bulan ini.</p>
        </div>
        <Button
          onClick={handleMarkAttendance}
          disabled={attendedToday}
          className={`h-12 px-6 font-bold rounded-xl shadow-lg cursor-pointer ${
            attendedToday ? "bg-slate-200 text-slate-500 hover:bg-slate-200" : "bg-[#ff6105] hover:bg-white hover:text-[#ff6105]"
          }`}
        >
          <CalendarCheck className="w-5 h-5 mr-2" />
          {attendedToday ? "Sudah Absen Hari Ini" : "Tandai Hadir Hari Ini"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 p-6 border-slate-200/60 shadow-sm rounded-2xl bg-white">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-black text-lg text-[#280f91]">
              Riwayat Kehadiran - {currentDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
            </h4>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => changeMonth(-1)}>{"<"}</Button>
              <Button variant="outline" size="sm" onClick={() => changeMonth(1)}>{">"}</Button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-2 text-center text-sm font-semibold text-slate-500 mb-2">
            <div>Min</div><div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => {
              if (day === null) {
                return <div key={idx} className="h-10"></div>;
              }
              const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
              const isAttended = history.some(h => h.date === dateStr);
              return (
                <div key={idx} className={`h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                  isAttended ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-slate-50 text-slate-600 border border-slate-100"
                }`}>
                  {isAttended ? <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" /> : null}
                  {day}
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6 border-slate-200/60 shadow-sm rounded-2xl bg-white flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
            <CalendarCheck className="w-10 h-10 text-[#280f91]" />
          </div>
          <h4 className="font-black text-xl text-slate-800 mb-1">Total Hadir</h4>
          <p className="text-sm text-slate-500 mb-4 font-medium">Bulan {currentDate.toLocaleDateString("id-ID", { month: "long" })}</p>
          <div className="text-5xl font-black text-[#ff6105] drop-shadow-sm">
            {history.length} <span className="text-xl text-slate-400 font-bold">Hari</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
