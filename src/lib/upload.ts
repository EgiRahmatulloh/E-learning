// Satu-satunya jalur upload berkas dari client ke POST /api/upload.
// Sebelumnya logika ini disalin di ~20 komponen dengan validasi, penanganan
// error, dan pesan yang sedikit beda-beda. Dipusatkan di sini supaya perubahan
// berikutnya (mis. kompresi gambar sebelum kirim, upload paralel, progress bar)
// cukup dikerjakan sekali.

// Mengikuti batas server di src/server/services/upload.ts. Divalidasi juga di
// client agar berkas besar tidak dikirim penuh dulu baru ditolak.
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// Menentukan bucket & aturan akses di server:
// - "private" → selalu butuh auth walau berupa gambar (scan KK/KTP/ijazah)
// - "public"  → non-gambar yang boleh diunduh tanpa login (Pusat Unduhan)
// - "auto"    → server yang memutuskan: gambar publik, dokumen privat
export type UploadVisibility = "auto" | "public" | "private";

export type UploadErrorKind = "network" | "auth" | "server";

export interface UploadOptions {
  visibility?: UploadVisibility;
  signal?: AbortSignal;
}

/**
 * Error upload dengan sebab yang bisa dibedakan. `kind: "network"` dipakai
 * beberapa form untuk jatuh ke penyimpanan base64 offline — sebelumnya dideteksi
 * lewat `err instanceof TypeError`, yang ikut menangkap bug lain di blok try.
 */
export class UploadError extends Error {
  readonly kind: UploadErrorKind;
  readonly status: number | undefined;

  constructor(message: string, kind: UploadErrorKind, status?: number) {
    super(message);
    this.name = "UploadError";
    this.kind = kind;
    this.status = status;
  }
}

/** Gagal karena jaringan/offline, bukan karena berkas ditolak server. */
export function isNetworkError(err: unknown): boolean {
  if (err instanceof UploadError) return err.kind === "network";
  // fetch() melempar TypeError saat koneksi gagal
  return err instanceof TypeError;
}

/** Pesan error bila berkas bukan gambar atau terlalu besar; null bila lolos. */
export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) return "Hanya berkas gambar yang diperbolehkan!";
  if (file.size > MAX_IMAGE_SIZE) return "Ukuran gambar melebihi batas 5MB!";
  return null;
}

/**
 * Saring berkas gambar dari input multi-file. Mengembalikan pesan error bila
 * tidak ada gambar sama sekali, atau bila ada satu saja yang melebihi batas —
 * seluruh batch ditolak, sesuai perilaku form sebelumnya.
 */
export function pickImageFiles(files: File[]): { images: File[]; error: string | null } {
  const images = files.filter((f) => f.type.startsWith("image/"));
  if (images.length === 0) {
    return { images: [], error: "Hanya berkas gambar yang diperbolehkan!" };
  }
  if (images.some((f) => f.size > MAX_IMAGE_SIZE)) {
    return { images: [], error: "Ukuran gambar melebihi batas 5MB!" };
  }
  return { images, error: null };
}

function readToken(): string | null {
  // localStorage bisa melempar saat mode privat / penyimpanan situs diblokir
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

interface UploadResponse {
  success?: boolean;
  url?: string;
  message?: string;
}

async function readBody(res: Response): Promise<UploadResponse | null> {
  try {
    return (await res.json()) as UploadResponse;
  } catch {
    // Respons bukan JSON — mis. halaman error reverse proxy saat body melebihi
    // batas, atau 502 saat proses server mati. Jangan sampai SyntaxError-nya
    // bocor sebagai "error tidak diketahui".
    return null;
  }
}

/**
 * Unggah satu berkas, kembalikan URL-nya. Melempar UploadError bila gagal —
 * pemanggil yang menentukan cara menampilkannya (toast, pesan inline, fallback
 * offline), karena tiap form punya UX berbeda.
 */
export async function uploadFile(file: File, options: UploadOptions = {}): Promise<string> {
  const token = readToken();
  if (!token) {
    // Tanpa token server pasti balas 401 — tolak di sini agar tidak membuang
    // bandwidth mengirim berkas yang sudah pasti ditolak.
    throw new UploadError("Sesi Anda telah berakhir. Silakan login ulang.", "auth");
  }

  const body = new FormData();
  body.append("file", file);
  if (options.visibility === "private") body.append("private", "true");
  else if (options.visibility === "public") body.append("public", "true");

  let res: Response;
  try {
    res = await fetch("/api/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
      signal: options.signal,
    });
  } catch (err) {
    // Pembatalan sengaja jangan disamarkan sebagai gangguan jaringan
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new UploadError("Gagal terhubung ke server", "network");
  }

  const data = await readBody(res);
  if (!res.ok || !data?.success || !data.url) {
    const kind: UploadErrorKind =
      res.status === 401 || res.status === 403 ? "auth" : "server";
    const message = data?.message || `Gagal mengunggah berkas (${res.status})`;
    throw new UploadError(message, kind, res.status);
  }

  return data.url;
}

export interface UploadManyOptions extends UploadOptions {
  /** Dipanggil tiap berkas selesai, agar preview muncul bertahap. */
  onUploaded?: (url: string, file: File) => void;
  /** Dipanggil bila satu berkas ditolak server; sisa batch tetap lanjut. */
  onFailed?: (message: string, file: File) => void;
}

/**
 * Unggah beberapa berkas satu per satu. Berkas yang ditolak server dilewati
 * (dilaporkan via onFailed), tetapi jaringan mati / sesi habis menghentikan
 * sisa batch — tidak ada gunanya melanjutkan.
 *
 * Masih berurutan, sama seperti loop yang digantikannya. Pengubahan ke paralel
 * berbatas nanti cukup dilakukan di fungsi ini.
 */
export async function uploadFiles(
  files: File[],
  options: UploadManyOptions = {},
): Promise<string[]> {
  const urls: string[] = [];

  for (const file of files) {
    try {
      const url = await uploadFile(file, options);
      urls.push(url);
      options.onUploaded?.(url, file);
    } catch (err) {
      if (isNetworkError(err) || err instanceof DOMException) throw err;
      if (err instanceof UploadError && err.kind === "auth") throw err;
      options.onFailed?.(
        err instanceof Error ? err.message : "Gagal mengunggah berkas",
        file,
      );
    }
  }

  return urls;
}
