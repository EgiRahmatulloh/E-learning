import { S3Client } from "bun";

// Bun.env dibaca langsung — jangan pakai process.env agar kompatibel dengan Bun
const R2_ACCOUNT_ID = Bun.env.R2_ACCOUNT_ID ?? "";
const R2_ACCESS_KEY_ID = Bun.env.R2_ACCESS_KEY_ID ?? "";
const R2_SECRET_ACCESS_KEY = Bun.env.R2_SECRET_ACCESS_KEY ?? "";
const R2_PUBLIC_BUCKET = Bun.env.R2_PUBLIC_BUCKET ?? "public";
const R2_PRIVATE_BUCKET = Bun.env.R2_PRIVATE_BUCKET ?? "private";
// R2_PUBLIC_URL: domain publik untuk bucket public (mis. https://pub-xxxxx.r2.dev atau custom domain)
// Hapus trailing slash agar konsisten saat join dengan filename
const rawPublicUrl = Bun.env.R2_PUBLIC_URL ?? "";
export const R2_PUBLIC_URL = rawPublicUrl.replace(/\/$/, "");

export const isR2Enabled =
  !!R2_ACCOUNT_ID && !!R2_ACCESS_KEY_ID && !!R2_SECRET_ACCESS_KEY;

export const r2Endpoint = R2_ACCOUNT_ID
  ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  : undefined;

// Validasi R2_PUBLIC_URL: jangan pakai endpoint S3 sebagai public URL
// Public URL harus berupa r2.dev subdomain (https://pub-xxx.r2.dev) atau custom domain.
// Jika R2_PUBLIC_URL sama persis dengan endpoint → anggap tidak valid & fallback ke /api/files/
export const isR2PublicUrlValid =
  !!R2_PUBLIC_URL && R2_PUBLIC_URL !== r2Endpoint && R2_PUBLIC_URL.length > 0;

// Client untuk bucket public — dipakai untuk gambar publik & dokumen Pusat Unduhan
export const r2PublicClient: S3Client | null = isR2Enabled
  ? new S3Client({
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      bucket: R2_PUBLIC_BUCKET,
      endpoint: r2Endpoint!,
    })
  : null;

// Client untuk bucket private — dipakai untuk dokumen sensitif & file non-publik
export const r2PrivateClient: S3Client | null = isR2Enabled
  ? new S3Client({
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      bucket: R2_PRIVATE_BUCKET,
      endpoint: r2Endpoint!,
    })
  : null;

export const R2_PUBLIC_BUCKET_NAME = R2_PUBLIC_BUCKET;
export const R2_PRIVATE_BUCKET_NAME = R2_PRIVATE_BUCKET;

/**
 * Tentukan bucket & client yang tepat berdasarkan nama file + flag.
 * Dipakai bersama oleh handler upload & download agar tidak lepas sinkron.
 */
export function resolveR2Bucket(filename: string): {
  bucket: string;
  client: S3Client | null;
  isPublic: boolean;
} {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const isPrivate = filename.startsWith("priv-");
  const isPublicFile = filename.startsWith("pub-");
  const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];
  const isPublicImage = !isPrivate && IMAGE_EXTENSIONS.includes(ext);
  const isPublicAccess = isPublicFile || isPublicImage;

  if (isPrivate) {
    return { bucket: R2_PRIVATE_BUCKET_NAME, client: r2PrivateClient, isPublic: false };
  }
  if (isPublicAccess) {
    return { bucket: R2_PUBLIC_BUCKET_NAME, client: r2PublicClient, isPublic: true };
  }
  // Default: dokumen yang butuh auth → private bucket
  return { bucket: R2_PRIVATE_BUCKET_NAME, client: r2PrivateClient, isPublic: false };
}

/**
 * URL publik langsung ke R2 (tanpa lewat /api/files).
 * Hanya untuk file di bucket public dan bila R2_PUBLIC_URL valid.
 */
export function getR2PublicUrl(filename: string): string | null {
  if (!isR2PublicUrlValid) return null;
  return `${R2_PUBLIC_URL}/${filename}`;
}

if (isR2Enabled) {
  console.log(`[R2] Enabled — public bucket: ${R2_PUBLIC_BUCKET_NAME}, private bucket: ${R2_PRIVATE_BUCKET_NAME}, endpoint: ${r2Endpoint}`);
  if (R2_PUBLIC_URL) {
    if (isR2PublicUrlValid) {
      console.log(`[R2] Public URL: ${R2_PUBLIC_URL}`);
    } else {
      console.warn(`[R2] R2_PUBLIC_URL terdeteksi sama dengan endpoint S3 — tidak valid sebagai public URL. Gunakan r2.dev subdomain (https://pub-xxx.r2.dev) atau custom domain. Fallback ke /api/files/ untuk file publik.`);
      console.warn(`[R2] Contoh valid: R2_PUBLIC_URL=https://pub-xxxxxxxx.r2.dev  atau  https://cdn.yourdomain.com`);
    }
  } else {
    console.log(`[R2] R2_PUBLIC_URL kosong — file publik akan dilayani via /api/files/ proxy`);
  }
} else {
  console.warn("[R2] Disabled — R2 env vars belum lengkap, fallback ke filesystem lokal (uploads/)");
}
