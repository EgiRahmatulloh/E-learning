import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Edit3, Save } from "lucide-react";

interface VisionMissionData {
  visi: string;
  misi: string;
}

const STORAGE_KEY = "pkbm_vision_mission";

const DEFAULT_DATA: VisionMissionData = {
  visi: "",
  misi: "",
};

const getSafeItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setSafeItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    throw e;
  }
};

export default function VisiMisiManager() {
  const [data, setData] = useState<VisionMissionData>(DEFAULT_DATA);
  const [isLocked, setIsLocked] = useState(true);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: "", show: false });
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchVisionMission = useCallback(async () => {
    try {
      const res = await fetch("/api/vision-mission");
      const resData = await res.json();
      if (resData.success && resData.data) {
        const fullData = {
          visi: resData.data.visi || "",
          misi: resData.data.misi || "",
        };
        setData(fullData);
        try {
          setSafeItem(STORAGE_KEY, JSON.stringify(fullData));
        } catch {
          // ignore seeding write failures
        }
      } else {
        throw new Error("Invalid structure");
      }
    } catch (err) {
      const saved = getSafeItem(STORAGE_KEY);
      if (saved) {
        try {
          setData(JSON.parse(saved));
        } catch {
          setData(DEFAULT_DATA);
        }
      } else {
        setData(DEFAULT_DATA);
      }
    }
  }, []);

  useEffect(() => {
    fetchVisionMission();
  }, [fetchVisionMission]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showToast = (message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, show: true });
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ message: "", show: false });
      toastTimeoutRef.current = null;
    }, 3000);
  };

  const handleFieldChange = (field: keyof VisionMissionData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const token = getSafeItem("token");
    let isNetworkError = false;

    try {
      const res = await fetch("/api/vision-mission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (resData.success) {
        showToast("Visi dan Misi berhasil disimpan!");
        setIsLocked(true);
        fetchVisionMission();
        return;
      } else {
        showToast(resData.message || "Gagal menyimpan visi dan misi");
      }
    } catch (err) {
      if (err instanceof TypeError) {
        isNetworkError = true;
      } else {
        showToast("Terjadi kesalahan sistem saat menyimpan.");
      }
    }

    if (isNetworkError) {
      try {
        setSafeItem(STORAGE_KEY, JSON.stringify(data));
        showToast("Visi dan Misi disimpan secara lokal (Offline)!");
        setIsLocked(true);
      } catch (e: any) {
        if (e?.name === "QuotaExceededError" || e?.name === "NS_ERROR_DOM_QUOTA_REACHED") {
          showToast("⚠️ Offline: Gagal menyimpan karena kuota penyimpanan lokal penuh.");
        } else {
          showToast("⚠️ Offline: Gagal menyimpan secara lokal.");
        }
        setIsLocked(false);
      }
    }
  };

  return (
    <div className="space-y-6 relative pb-16 animate-in fade-in duration-300">
      {/* MAIN CONTAINER */}
      <div className="bg-[#fff9f3] p-6 sm:p-8 rounded-3xl border border-orange-100 shadow-sm relative overflow-hidden min-h-[450px] flex flex-col justify-between">
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          
          {/* VISI INPUT */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-extrabold text-[#9c27b0] uppercase tracking-wider">
              VISI
            </label>
            <textarea
              rows={4}
              disabled={isLocked}
              value={data.visi}
              onChange={(e) => handleFieldChange("visi", e.target.value)}
              placeholder="Masukkan visi lembaga..."
              className="w-full p-4 text-sm font-semibold border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed shadow-inner transition-all resize-none"
            />
          </div>

          {/* MISI INPUT */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-extrabold text-[#9c27b0] uppercase tracking-wider">
              MISI
            </label>
            <textarea
              rows={8}
              disabled={isLocked}
              value={data.misi}
              onChange={(e) => handleFieldChange("misi", e.target.value)}
              placeholder="Masukkan misi lembaga..."
              className="w-full p-4 text-sm font-semibold border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed shadow-inner transition-all resize-none"
            />
          </div>

          {/* BUTTON EDIT / SIMPAN */}
          <div className="pt-6 flex items-center justify-end gap-4">
            {isLocked ? (
              <Button
                type="button"
                onClick={() => setIsLocked(false)}
                className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-black text-xs px-8 h-11 rounded-full cursor-pointer shadow-md shadow-purple-200 uppercase tracking-widest flex items-center gap-2 transition-all"
              >
                <Edit3 className="h-4 w-4" /> EDIT
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  onClick={() => {
                    fetchVisionMission();
                    setIsLocked(true);
                  }}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold text-xs px-8 h-11 rounded-full cursor-pointer uppercase tracking-widest transition-all"
                >
                  BATAL
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-black text-xs px-8 h-11 rounded-full cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest flex items-center gap-2 transition-all"
                >
                  <Save className="h-4 w-4" /> SIMPAN
                </Button>
              </>
            )}
          </div>
        </form>
      </div>

      {/* Floating Modern Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900/95 backdrop-blur-md text-white px-5 py-4 rounded-2xl shadow-2xl border border-slate-800 animate-in slide-in-from-bottom-6 duration-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-bold tracking-tight">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
