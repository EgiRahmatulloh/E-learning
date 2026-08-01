// Foto multi (berita/galeri) disimpan sebagai JSON array string di kolom `foto`.
// Kolom lama hanya berisi satu URL string — helper ini tetap kompatibel ke belakang.
export function parsePhotos(foto?: string | null): string[] {
  if (!foto) return [];
  const value = foto.trim();
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((p) => typeof p === "string" && p.trim() !== "");
    }
  } catch {
    // bukan JSON → anggap URL tunggal
  }
  return [value];
}

export function serializePhotos(photos: string[]): string {
  const list = (photos || []).filter((p) => typeof p === "string" && p.trim() !== "");
  return JSON.stringify(list);
}
