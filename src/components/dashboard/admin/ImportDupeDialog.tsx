import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, RefreshCw, Search } from "lucide-react";

export interface DupeRow {
  nik: string;
  namaExisting: string;
  namaNew: string;
}

interface Props {
  open: boolean;
  title: string;
  description: string;
  duplicates: DupeRow[];
  loading?: boolean;
  onClose: () => void;
  onConfirm: (selectedNiks: string[]) => void;
}

export default function ImportDupeDialog({
  open,
  title,
  description,
  duplicates,
  loading,
  onClose,
  onConfirm,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) {
      setSelected(new Set(duplicates.map((d) => d.nik)));
      setQuery("");
    }
  }, [open, duplicates]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return duplicates;
    return duplicates.filter(
      (d) =>
        d.nik.toLowerCase().includes(q) ||
        d.namaExisting.toLowerCase().includes(q) ||
        d.namaNew.toLowerCase().includes(q)
    );
  }, [duplicates, query]);

  if (!open) return null;

  const allFilteredChecked =
    filtered.length > 0 && filtered.every((d) => selected.has(d.nik));

  const toggleAllFiltered = () => {
    const next = new Set(selected);
    if (allFilteredChecked) {
      filtered.forEach((d) => next.delete(d.nik));
    } else {
      filtered.forEach((d) => next.add(d.nik));
    }
    setSelected(next);
  };

  const toggleOne = (nik: string) => {
    const next = new Set(selected);
    if (next.has(nik)) next.delete(nik);
    else next.add(nik);
    setSelected(next);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-2xl border-4 border-cyan-400 z-10 max-h-[90vh] flex flex-col">
        <div className="bg-white p-6 pb-4 relative text-left shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full p-1.5 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mb-3">
            <span className="inline-block bg-[#9c27b0] text-white font-extrabold text-[11px] px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
              NIK Duplikat — {duplicates.length}
            </span>
          </div>
          <h3 className="font-extrabold text-slate-800 text-base">{title}</h3>
          <p className="text-xs font-semibold text-slate-500 leading-normal mt-1">{description}</p>

          <div className="relative mt-3">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari NIK / nama..."
              className="w-full h-10 rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-[#9c27b0]"
            />
          </div>

          <label className="flex items-center gap-2 mt-3 text-xs font-bold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allFilteredChecked}
              onChange={toggleAllFiltered}
              className="h-4 w-4 accent-[#9c27b0] cursor-pointer"
            />
            Pilih semua {filtered.length > 0 ? `(${filtered.length})` : ""} — {selected.size} dipilih
          </label>
        </div>

        <div className="overflow-auto px-6 py-2 grow">
          {filtered.length === 0 ? (
            <p className="text-xs text-slate-500 font-semibold py-6 text-center">
              Tidak ada data yang cocok.
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-white">
                <tr className="text-left text-slate-500 uppercase text-[10px] tracking-widest">
                  <th className="py-2 pr-2 w-8"></th>
                  <th className="py-2 pr-2">NIK</th>
                  <th className="py-2 pr-2">Nama di Sistem</th>
                  <th className="py-2">Nama di Excel</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.nik} className="border-t border-slate-100 hover:bg-purple-50/60">
                    <td className="py-2 pr-2">
                      <input
                        type="checkbox"
                        checked={selected.has(d.nik)}
                        onChange={() => toggleOne(d.nik)}
                        className="h-4 w-4 accent-[#9c27b0] cursor-pointer"
                      />
                    </td>
                    <td className="py-2 pr-2 font-mono font-bold text-slate-800">{d.nik}</td>
                    <td className="py-2 pr-2 font-semibold text-slate-600">{d.namaExisting || "-"}</td>
                    <td className="py-2 font-semibold text-slate-800">{d.namaNew || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-6 pt-4 flex gap-3 shrink-0">
          <Button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-11 rounded-xl bg-slate-500 hover:bg-slate-600 text-white font-extrabold text-xs uppercase tracking-widest cursor-pointer"
          >
            Nanti Saja
          </Button>
          <Button
            type="button"
            disabled={loading || selected.size === 0}
            onClick={() => onConfirm(Array.from(selected))}
            className="flex-1 h-11 rounded-xl bg-[#9c27b0] hover:bg-[#7b1fa2] text-white font-extrabold text-xs uppercase tracking-widest cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
            Update {selected.size > 0 ? `(${selected.size})` : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}
