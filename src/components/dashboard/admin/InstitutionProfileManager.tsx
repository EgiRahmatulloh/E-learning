import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Edit3, Save, UploadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface InstitutionProfileData {
  namaLembaga: string;
  npsn: string;
  nomorIndukLembaga: string;
  statusAkreditasi: string;
  tahunBerdiri: string;
  nomorTelepon: string;
  email: string;
  alamatLengkap: string;
  noIzinPendirian: string;
  izinYayasan: string;
  izinOperasional: string;
  npwp: string;
  rekeningNomor: string;
  rekeningAtasNama: string;
  rekeningNamaBank: string;
  foto: string;
  gambar: string;
}

const STORAGE_KEY = "pkbm_institution_profile";

const DEFAULT_PROFILE: InstitutionProfileData = {
  namaLembaga: "",
  npsn: "",
  nomorIndukLembaga: "",
  statusAkreditasi: "",
  tahunBerdiri: "",
  nomorTelepon: "",
  email: "",
  alamatLengkap: "",
  noIzinPendirian: "",
  izinYayasan: "",
  izinOperasional: "",
  npwp: "",
  rekeningNomor: "",
  rekeningAtasNama: "",
  rekeningNamaBank: "",
  foto: "",
  gambar: "",
};

// Safe LocalStorage helpers
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

export default function InstitutionProfileManager() {
  const [profile, setProfile] = useState<InstitutionProfileData>(DEFAULT_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [uploadingGambar, setUploadingGambar] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/institution-profile");
      const data = await res.json();
      if (data.success && data.data) {
        setProfile(data.data);
        try {
          setSafeItem(STORAGE_KEY, JSON.stringify(data.data));
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
          setProfile(JSON.parse(saved));
        } catch {
          setProfile(DEFAULT_PROFILE);
        }
      } else {
        setProfile(DEFAULT_PROFILE);
      }
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleFieldChange = (field: keyof InstitutionProfileData, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const token = getSafeItem("token");
    let isNetworkError = false;

    try {
      const res = await fetch("/api/institution-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Identitas Lembaga berhasil disimpan!");
        setIsEditing(false);
        fetchProfile();
        return;
      } else {
        toast.error(data.message || "Gagal menyimpan identitas lembaga");
      }
    } catch (err) {
      if (err instanceof TypeError) {
        isNetworkError = true;
      } else {
        toast.error("Terjadi kesalahan sistem saat menyimpan.");
      }
    } finally {
      setSaving(false);
    }

    // Local storage fallback ONLY on genuine fetch/network failures
    if (isNetworkError) {
      try {
        setSafeItem(STORAGE_KEY, JSON.stringify(profile));
        toast.info("Identitas Lembaga disimpan secara lokal (Offline)!");
        setIsEditing(false);
      } catch (e: any) {
        if (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED") {
          toast.warning("Offline: Gagal menyimpan karena ukuran gambar/foto terlalu besar!");
        } else {
          toast.error("Offline: Gagal menyimpan secara lokal.");
        }
        setIsEditing(true); // Tetap buka kunci form agar pengguna bisa memperbaiki input/gambar
      }
    }
  };

  const processUpload = async (file: File, type: "foto" | "gambar") => {
    if (!file.type.startsWith("image/")) {
      toast.error("Hanya berkas gambar yang diperbolehkan!");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran gambar melebihi batas 5MB!");
      return;
    }

    if (type === "foto") setUploadingFoto(true);
    else setUploadingGambar(true);

    const token = getSafeItem("token");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        handleFieldChange(type, data.url);
        toast.success(`${type === "foto" ? "Foto" : "Gambar"} berhasil diunggah!`);
      } else {
        throw new Error(data.message || "Gagal mengunggah gambar");
      }
    } catch (err: any) {
      if (err instanceof TypeError) {
        const reader = new FileReader();
        reader.onloadend = () => {
          handleFieldChange(type, reader.result as string);
          toast.info("Gambar disimpan secara lokal (Offline)!");
        };
        reader.readAsDataURL(file);
      } else {
        toast.error(err.message || "Gagal mengunggah gambar.");
      }
    } finally {
      if (type === "foto") setUploadingFoto(false);
      else setUploadingGambar(false);
    }
  };

  return (
    <div className="space-y-6 relative pb-16 animate-in fade-in duration-300">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-cyan-900 tracking-tight flex items-center gap-2">
            <span>🏫</span> IDENTITAS LEMBAGA
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Kelola data dan informasi profil lembaga PKBM Menuju Makmur untuk landing page utama.
          </p>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* FORM PANEL (LEFT) */}
        <div className="lg:col-span-3 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
              
              {/* NAMA LEMBAGA */}
              <div className="md:col-span-3 flex flex-col md:flex-row md:items-center gap-2">
                <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-48 shrink-0">
                  NAMA LEMBAGA
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={profile.namaLembaga}
                  onChange={(e) => handleFieldChange("namaLembaga", e.target.value)}
                  className="flex-1 h-10 px-4 text-sm font-extrabold border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-cyan-500 disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed shadow-inner transition-colors"
                />
              </div>

              {/* NPSN */}
              <div className="md:col-span-3 flex flex-col md:flex-row md:items-center gap-2">
                <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-48 shrink-0">
                  NPSN
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={profile.npsn}
                  onChange={(e) => handleFieldChange("npsn", e.target.value)}
                  className="flex-1 h-10 px-4 text-sm font-extrabold border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-cyan-500 disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed shadow-inner transition-colors"
                />
              </div>

              {/* NOMOR INDUK LEMBAGA */}
              <div className="md:col-span-3 flex flex-col md:flex-row md:items-center gap-2">
                <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-48 shrink-0">
                  NOMOR INDUK LEMBAGA
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={profile.nomorIndukLembaga}
                  onChange={(e) => handleFieldChange("nomorIndukLembaga", e.target.value)}
                  className="flex-1 h-10 px-4 text-sm font-extrabold border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-cyan-500 disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed shadow-inner transition-colors"
                />
              </div>

              {/* STATUS AKREDITASI */}
              <div className="md:col-span-3 flex flex-col md:flex-row md:items-center gap-2">
                <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-48 shrink-0">
                  STATUS AKREDITASI
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={profile.statusAkreditasi}
                  onChange={(e) => handleFieldChange("statusAkreditasi", e.target.value)}
                  className="flex-1 h-10 px-4 text-sm font-extrabold border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-cyan-500 disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed shadow-inner transition-colors"
                />
              </div>

              {/* TAHUN BERDIRI */}
              <div className="md:col-span-3 flex flex-col md:flex-row md:items-center gap-2">
                <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-48 shrink-0">
                  TAHUN BERDIRI
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={profile.tahunBerdiri}
                  onChange={(e) => handleFieldChange("tahunBerdiri", e.target.value)}
                  className="flex-1 h-10 px-4 text-sm font-extrabold border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-cyan-500 disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed shadow-inner transition-colors"
                />
              </div>

              {/* NOMOR TELEPON */}
              <div className="md:col-span-3 flex flex-col md:flex-row md:items-center gap-2">
                <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-48 shrink-0">
                  NOMOR TELEPON
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={profile.nomorTelepon}
                  onChange={(e) => handleFieldChange("nomorTelepon", e.target.value)}
                  className="flex-1 h-10 px-4 text-sm font-extrabold border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-cyan-500 disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed shadow-inner transition-colors"
                />
              </div>

              {/* EMAIL */}
              <div className="md:col-span-3 flex flex-col md:flex-row md:items-center gap-2">
                <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-48 shrink-0">
                  EMAIL
                </label>
                <input
                  type="email"
                  disabled={!isEditing}
                  value={profile.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  className="flex-1 h-10 px-4 text-sm font-extrabold border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-cyan-500 disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed shadow-inner transition-colors"
                />
              </div>

              {/* ALAMAT LENGKAP */}
              <div className="md:col-span-3 flex flex-col md:flex-row md:items-start gap-2">
                <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-48 shrink-0 md:pt-2">
                  ALAMAT LENGKAP
                </label>
                <textarea
                  rows={3}
                  disabled={!isEditing}
                  value={profile.alamatLengkap}
                  onChange={(e) => handleFieldChange("alamatLengkap", e.target.value)}
                  className="flex-1 p-3 text-sm font-extrabold border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-cyan-500 disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed shadow-inner transition-colors resize-none"
                />
              </div>

              {/* LEGALITAS LEMBAGA GROUP */}
              <div className="md:col-span-3 mt-2">
                <span className="block text-xs sm:text-sm font-black text-[#280f91] uppercase tracking-wider mb-3">
                  LEGALITAS LEMBAGA
                </span>
                <div className="pl-4 border-l-2 border-slate-300 space-y-3">
                  
                  {/* NOMOR IZIN PENDIRIAN DINAS PENDIDIKAN */}
                  <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <label className="text-[11px] sm:text-xs font-black text-slate-700 uppercase tracking-wide md:w-64 shrink-0 flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-900"></span>
                      NOMOR IZIN PENDIRIAN DINAS PENDIDIKAN
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={profile.noIzinPendirian}
                      onChange={(e) => handleFieldChange("noIzinPendirian", e.target.value)}
                      className="flex-1 h-9 px-3 text-xs font-extrabold border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-cyan-500 disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed shadow-inner transition-colors"
                    />
                  </div>

                  {/* IZIN PENDIRIAN DARI YAYASAN */}
                  <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <label className="text-[11px] sm:text-xs font-black text-slate-700 uppercase tracking-wide md:w-64 shrink-0 flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-900"></span>
                      IZIN PENDIRIAN DARI YAYASAN
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={profile.izinYayasan}
                      onChange={(e) => handleFieldChange("izinYayasan", e.target.value)}
                      className="flex-1 h-9 px-3 text-xs font-extrabold border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-cyan-500 disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed shadow-inner transition-colors"
                    />
                  </div>

                  {/* IZIN OPERASIONAL DINAS PENDIDIKAN */}
                  <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <label className="text-[11px] sm:text-xs font-black text-slate-700 uppercase tracking-wide md:w-64 shrink-0 flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-900"></span>
                      IZIN OPERASIONAL DINAS PENDIDIKAN
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={profile.izinOperasional}
                      onChange={(e) => handleFieldChange("izinOperasional", e.target.value)}
                      className="flex-1 h-9 px-3 text-xs font-extrabold border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-cyan-500 disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed shadow-inner transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* NPWP */}
              <div className="md:col-span-3 flex flex-col md:flex-row md:items-center gap-2 mt-2">
                <label className="text-xs sm:text-sm font-black text-cyan-950 uppercase tracking-wide md:w-48 shrink-0">
                  NPWP
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={profile.npwp}
                  onChange={(e) => handleFieldChange("npwp", e.target.value)}
                  className="flex-1 h-10 px-4 text-sm font-extrabold border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-cyan-500 disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed shadow-inner transition-colors"
                />
              </div>

              {/* REKENING BANK GROUP */}
              <div className="md:col-span-3 mt-2">
                <span className="block text-xs sm:text-sm font-black text-[#280f91] uppercase tracking-wider mb-3">
                  REKENING BANK
                </span>
                <div className="pl-4 border-l-2 border-slate-300 space-y-3">
                  
                  {/* NOMOR REKENING */}
                  <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <label className="text-[11px] sm:text-xs font-black text-slate-700 uppercase tracking-wide md:w-64 shrink-0 flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-900"></span>
                      NOMOR
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={profile.rekeningNomor}
                      onChange={(e) => handleFieldChange("rekeningNomor", e.target.value)}
                      className="flex-1 h-9 px-3 text-xs font-extrabold border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-cyan-500 disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed shadow-inner transition-colors"
                    />
                  </div>

                  {/* ATAS NAMA REKENING */}
                  <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <label className="text-[11px] sm:text-xs font-black text-slate-700 uppercase tracking-wide md:w-64 shrink-0 flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-900"></span>
                      ATAS NAMA
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={profile.rekeningAtasNama}
                      onChange={(e) => handleFieldChange("rekeningAtasNama", e.target.value)}
                      className="flex-1 h-9 px-3 text-xs font-extrabold border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-cyan-500 disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed shadow-inner transition-colors"
                    />
                  </div>

                  {/* NAMA BANK */}
                  <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <label className="text-[11px] sm:text-xs font-black text-slate-700 uppercase tracking-wide md:w-64 shrink-0 flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-900"></span>
                      NAMA BANK
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={profile.rekeningNamaBank}
                      onChange={(e) => handleFieldChange("rekeningNamaBank", e.target.value)}
                      className="flex-1 h-9 px-3 text-xs font-extrabold border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-cyan-500 disabled:bg-slate-100/80 disabled:text-slate-500 disabled:cursor-not-allowed shadow-inner transition-colors"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* BUTTON EDIT / SIMPAN */}
            <div className="pt-6 border-t border-slate-200 flex items-center justify-end gap-3">
              {!isEditing ? (
                <Button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-black text-xs px-8 h-11 rounded-xl cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest flex items-center gap-1.5 transition-all"
                >
                  <Edit3 className="h-4 w-4" /> EDIT
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    onClick={() => {
                      fetchProfile();
                      setIsEditing(false);
                    }}
                    className="bg-slate-500 hover:bg-slate-650 text-white font-extrabold text-xs px-8 h-11 rounded-xl cursor-pointer uppercase tracking-widest transition-all"
                  >
                    BATAL
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-black text-xs px-8 h-11 rounded-xl cursor-pointer shadow-md shadow-purple-900/30 uppercase tracking-widest flex items-center gap-1.5 transition-all disabled:opacity-70"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> MENYIMPAN...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" /> SIMPAN
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </form>
        </div>

        {/* FOTO SIDEBAR PANEL (RIGHT) */}
        <div className="lg:col-span-1 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
          <h3 className="text-sm font-black text-[#280f91] uppercase tracking-wider mb-4">
            FOTO
          </h3>

          {/* Upload Area for FOTO */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (!isEditing) {
                toast.warning("Klik EDIT terlebih dahulu untuk mengubah Foto!");
                return;
              }
              const file = e.dataTransfer.files?.[0];
              if (file) processUpload(file, "foto");
            }}
            onClick={() => {
              if (!isEditing) {
                toast.warning("Klik EDIT terlebih dahulu untuk mengubah Foto!");
                return;
              }
              document.getElementById("file-upload-foto")?.click();
            }}
            className={`w-full aspect-square border-4 border-dashed rounded-2xl flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all text-center bg-cyan-50 ${
              !isEditing
                ? "border-slate-200 cursor-not-allowed opacity-80"
                : "border-cyan-300 hover:border-cyan-400 hover:bg-cyan-100 cursor-pointer"
            }`}
          >
            <input
              id="file-upload-foto"
              type="file"
              accept="image/*"
              disabled={!isEditing}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  processUpload(file, "foto");
                  e.target.value = "";
                }
              }}
              className="hidden"
            />

            {uploadingFoto ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-cyan-500 mb-2" />
                <span className="text-[10px] font-bold text-purple-950 uppercase">MENGUNGGAH...</span>
              </div>
            ) : profile.foto ? (
              <div className="w-full h-full relative group">
                <img
                  src={profile.foto}
                  alt="Foto Lembaga"
                  className="w-full h-full object-contain rounded-lg"
                />
                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                    <span className="text-white text-[10px] font-black uppercase tracking-wider">UBAH FOTO</span>
                  </div>
                )}
              </div>
            ) : (
              <>
                <UploadCloud className="h-10 w-10 text-cyan-600 mb-2" />
                <span className="text-[10px] font-black text-purple-950 uppercase block tracking-wider leading-relaxed">
                  DRAG AND DROP A FILE
                </span>
                <span className="text-[8px] font-bold text-cyan-700 block mt-0.5">
                  HERE OR CLICK
                </span>
              </>
            )}
          </div>
          <p className="text-[10px] font-bold text-slate-500 mt-1.5 italic text-center">
            * Batas maksimal ukuran foto adalah 5MB.
          </p>

          <div className="w-full mt-4 flex flex-col gap-1 text-left max-w-xs">
            <label className="text-[10px] font-black uppercase text-slate-500">URL Logo Lembaga</label>
            <input
              type="text"
              disabled={!isEditing}
              placeholder="Masukkan URL foto..."
              value={profile.foto || ""}
              onChange={(e) => handleFieldChange("foto", e.target.value)}
              className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-850 focus:outline-none focus:ring-2 focus:ring-[#280f91] disabled:bg-slate-50"
            />
          </div>
        </div>
      </div>

      {/* GAMBAR PANEL (BOTTOM) */}
      <div className="mt-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
        <h3 className="text-sm font-black text-[#280f91] uppercase tracking-wider mb-4">
          GAMBAR
        </h3>

        {/* Upload Area for GAMBAR */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (!isEditing) {
              toast.warning("Klik EDIT terlebih dahulu untuk mengubah Gambar!");
              return;
            }
            const file = e.dataTransfer.files?.[0];
            if (file) processUpload(file, "gambar");
          }}
          onClick={() => {
            if (!isEditing) {
              toast.warning("Klik EDIT terlebih dahulu untuk mengubah Gambar!");
              return;
            }
            document.getElementById("file-upload-gambar")?.click();
          }}
          className={`w-full max-w-2xl min-h-[160px] border-4 border-dashed rounded-2xl flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all text-center bg-cyan-50 ${
            !isEditing
              ? "border-slate-200 cursor-not-allowed opacity-80"
              : "border-cyan-300 hover:border-cyan-400 hover:bg-cyan-100 cursor-pointer"
          }`}
        >
          <input
            id="file-upload-gambar"
            type="file"
            accept="image/*"
            disabled={!isEditing}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                processUpload(file, "gambar");
                e.target.value = "";
              }
            }}
            className="hidden"
          />

          {uploadingGambar ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-cyan-500 mb-2" />
              <span className="text-[10px] font-bold text-purple-950 uppercase">MENGUNGGAH...</span>
            </div>
          ) : profile.gambar ? (
            <div className="w-full max-h-[300px] relative group flex items-center justify-center">
              <img
                src={profile.gambar}
                alt="Gambar Lembaga"
                className="max-h-[280px] object-contain rounded-lg shadow-sm"
              />
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                  <span className="text-white text-xs font-black uppercase tracking-wider">UBAH GAMBAR</span>
                </div>
              )}
            </div>
          ) : (
            <>
              <UploadCloud className="h-10 w-10 text-cyan-600 mb-2" />
              <span className="text-xs font-black text-purple-950 uppercase block tracking-wider">
                DRAG AND DROP A FILE
              </span>
              <span className="text-[10px] font-bold text-cyan-700 block mt-0.5">
                HERE OR CLICK
              </span>
            </>
          )}
        </div>
        <div className="w-full mt-4 flex flex-col gap-1 text-left max-w-xl">
          <label className="text-[10px] font-black uppercase text-slate-500">URL Gambar Lembaga</label>
          <input
            type="text"
            disabled={!isEditing}
            placeholder="Masukkan URL gambar..."
            value={profile.gambar || ""}
            onChange={(e) => handleFieldChange("gambar", e.target.value)}
            className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-850 focus:outline-none focus:ring-2 focus:ring-[#280f91] disabled:bg-slate-50"
          />
        </div>
      </div>
    </div>
  );
}
