// Pembersihan berkas di R2. Sebelumnya berkas yang diunggah tidak pernah dihapus:
// mengganti foto saat edit meninggalkan foto lama di bucket, dan berkas yang
// diunggah lalu form-nya dibatalkan tetap tersimpan selamanya. Dua jalur
// pembersihan dipusatkan di sini:
//
// 1. Sisi server (fungsi cleanup* di bawah) — dipanggil handler UPDATE/DELETE.
//    Server tahu nilai kolom sebelum & sesudah, jadi tidak perlu percaya client
//    soal berkas mana yang boleh dihapus.
// 2. Sisi client (token hapus di bawah) — untuk berkas yang belum pernah masuk
//    DB, mis. sudah diunggah lalu tombol BATAL ditekan. Server tidak punya
//    catatannya, jadi client yang memicu; token HMAC dari respons upload
//    membuktikan client memang yang mengunggah berkas itu.
import { createHmac, timingSafeEqual } from "node:crypto";
import { finalJwtSecret } from "../config/jwt";
import { resolveR2Bucket, isR2Enabled, R2_PUBLIC_URL } from "../config/r2";

/** Masa berlaku token hapus. Cukup panjang untuk satu sesi pengisian form. */
const DELETE_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

/**
 * Nama objek R2 dari nilai kolom DB, atau null bila berkas itu bukan milik kita.
 *
 * Yang sengaja dilewati (null): string kosong, URL eksternal, data URI base64
 * (fallback offline beberapa form), dan aset statis seperti /images/logo.png.
 * Salah menganggapnya milik kita berarti mengirim DELETE untuk objek yang tidak
 * ada — tidak berbahaya, tapi menutupi bug.
 */
export function storedFileName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const url = value.trim();
  if (!url) return null;

  let name: string | null = null;
  if (url.startsWith("/api/files/")) {
    name = url.slice("/api/files/".length);
  } else if (R2_PUBLIC_URL && url.startsWith(`${R2_PUBLIC_URL}/`)) {
    name = url.slice(R2_PUBLIC_URL.length + 1);
  }
  if (!name) return null;

  // Buang query/hash (mis. ?token=... yang dipakai pratinjau berkas privat)
  name = name.split(/[?#]/)[0];
  if (!name) return null;

  // Nama objek hasil upload selalu satu segmen tanpa path — tolak sisanya agar
  // nilai kolom yang aneh tidak bisa mengarahkan DELETE ke prefix lain.
  if (name.includes("/") || name.includes("\\") || name.includes("..")) return null;

  return decodeURIComponent(name);
}

/**
 * Semua nama objek R2 di dalam sebuah nilai kolom. Bentuk yang dipakai di DB:
 * - satu URL (`achievements.foto`, `sliders.image`)
 * - JSON array string hasil serializePhotos (`news.foto`, `gallery.foto`)
 * - JSON objek `{ kk: url, ktp: url, ... }` (`students.berkas` dkk)
 */
export function collectFileNames(value: unknown): string[] {
  const single = storedFileName(value);
  if (single) return [single];

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectFileNames(item));
  }

  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap((item) =>
      collectFileNames(item),
    );
  }

  // Kolom JSON kadang sampai ke sini sebagai string mentah: `berkas` ditulis
  // lewat drizzle mode "json" tapi data hasil impor bisa berupa string, dan
  // kolom foto multi memang sengaja menyimpan JSON array (lihat lib/photos.ts).
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        return collectFileNames(JSON.parse(trimmed));
      } catch {
        return [];
      }
    }
  }

  return [];
}

/**
 * Hapus objek dari R2. Best-effort: kegagalan hanya dicatat di log, tidak pernah
 * dilempar. Pemanggilnya adalah handler simpan/hapus data — gagal membersihkan
 * berkas tidak boleh membuat operasi utamanya ikut gagal.
 */
export async function deleteStoredFiles(names: string[]): Promise<void> {
  if (names.length === 0) return;
  if (!isR2Enabled) return;

  const unique = [...new Set(names)];
  await Promise.all(
    unique.map(async (name) => {
      try {
        const { client } = resolveR2Bucket(name);
        if (!client) return;
        await client.file(name).delete();
      } catch (err) {
        // Objek yang sudah tidak ada juga masuk sini — tidak perlu ditangani
        // khusus, hasil akhirnya sama-sama "berkas tidak ada di storage".
        console.error("[R2] Gagal menghapus berkas:", name, err);
      }
    }),
  );
}

export interface CleanupOptions {
  /**
   * Nilai kolom yang berkasnya harus dipertahankan walau baris ini melepasnya.
   * Diperlukan karena beberapa baris berbagi URL berkas yang sama: proses
   * kelulusan menyalin `students.foto` ke `alumni.foto` — URL-nya, bukan
   * berkasnya — jadi salah satu baris melepas foto tidak berarti berkasnya
   * boleh hilang.
   */
  keep?: unknown[];
}

/**
 * Hapus berkas yang dipakai `before` tapi sudah tidak dipakai `after`.
 * Dipanggil setelah UPDATE berhasil, sehingga mengganti foto lewat form edit
 * sekaligus melepas foto lamanya dari storage.
 *
 * Membandingkan per-nama, bukan per-kolom: memindahkan berkas yang sama antar
 * kolom (atau antar key di kolom JSON berkas) tidak menghapusnya.
 */
export async function cleanupReplacedFiles(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
  fields: string[],
  options: CleanupOptions = {},
): Promise<void> {
  if (!before) return;

  const oldNames = fields.flatMap((field) => collectFileNames(before[field]));
  if (oldNames.length === 0) return;

  const keptNames = new Set([
    ...(after ? fields.flatMap((field) => collectFileNames(after[field])) : []),
    ...(options.keep ?? []).flatMap((value) => collectFileNames(value)),
  ]);

  await deleteStoredFiles(oldNames.filter((name) => !keptNames.has(name)));
}

/** Hapus seluruh berkas milik baris yang dihapus dari DB. */
export async function cleanupRowFiles(
  row: Record<string, unknown> | null | undefined,
  fields: string[],
  options: CleanupOptions = {},
): Promise<void> {
  if (!row) return;
  await cleanupReplacedFiles(row, null, fields, options);
}

/** Sama seperti cleanupRowFiles tapi untuk beberapa baris sekaligus. */
export async function cleanupRowsFiles(
  rows: Record<string, unknown>[] | null | undefined,
  fields: string[],
  options: CleanupOptions = {},
): Promise<void> {
  if (!rows || rows.length === 0) return;
  const keptNames = new Set(
    (options.keep ?? []).flatMap((value) => collectFileNames(value)),
  );
  await deleteStoredFiles(
    rows
      .flatMap((row) => fields.flatMap((field) => collectFileNames(row[field])))
      .filter((name) => !keptNames.has(name)),
  );
}

function sign(payload: string): string {
  return createHmac("sha256", finalJwtSecret).update(payload).digest("base64url");
}

/**
 * Token yang membuktikan pemegangnya baru saja mengunggah `fileName`, dipakai
 * untuk DELETE /api/files/:filename. Tanpa ini, siapa pun yang login bisa
 * menghapus berkas mana pun cukup dengan menebak/melihat URL-nya — termasuk
 * gambar landing page yang URL-nya publik.
 */
export function createDeleteToken(fileName: string, now = Date.now()): string {
  const expiresAt = now + DELETE_TOKEN_TTL_MS;
  return `${expiresAt}.${sign(`${fileName}:${expiresAt}`)}`;
}

/** True bila `token` memang diterbitkan untuk `fileName` dan belum kedaluwarsa. */
export function verifyDeleteToken(
  fileName: string,
  token: string | undefined,
  now = Date.now(),
): boolean {
  if (!token) return false;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return false;

  const expiresAt = Number(token.slice(0, separator));
  if (!Number.isFinite(expiresAt) || expiresAt < now) return false;

  const provided = Buffer.from(token.slice(separator + 1));
  const expected = Buffer.from(sign(`${fileName}:${expiresAt}`));
  if (provided.length !== expected.length) return false;

  return timingSafeEqual(provided, expected);
}
