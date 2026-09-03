import { Elysia, t } from "elysia";
import { jwt } from "@elysia/jwt";
import { finalJwtSecret } from "../config/jwt";
import { verifyUser } from "../middleware/auth";
import fs from "fs";
import path from "path";
import {
  isR2Enabled,
  r2PublicClient,
  r2PrivateClient,
  R2_PUBLIC_BUCKET_NAME,
  R2_PRIVATE_BUCKET_NAME,
  getR2PublicUrl,
} from "../config/r2";

const SECURE_UPLOAD_DIR = path.join(process.cwd(), "uploads");

// Ekstensi gambar — dipakai bersama oleh validasi upload DAN aturan akses publik
// di /api/files/ agar keduanya tidak bisa lepas sinkron. SVG sengaja TIDAK di sini:
// SVG bisa memuat <script> sehingga jadi vektor stored-XSS bila disajikan inline.
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];

// Prefix untuk berkas privat (mis. scan KK/KTP/Ijazah). File ber-prefix ini SELALU
// butuh auth di /api/files/, walau ekstensinya gambar — mencegah kebocoran dokumen
// identitas lewat aturan "gambar boleh publik".
const PRIVATE_PREFIX = "priv-";

// Prefix untuk berkas publik non-gambar (mis. dokumen Pusat Unduhan). File ini
// dilayani /api/files/ TANPA auth — apa pun ekstensinya — supaya pengunjung bisa
// mengunduh tanpa login. Disajikan lewat endpoint dinamis (bukan staticPlugin)
// agar file yang diupload saat runtime langsung bisa diakses di produksi.
const PUBLIC_PREFIX = "pub-";

// Content-Type eksplisit per ekstensi. Diperlukan karena new Response(Bun.file())
// tidak selalu mewariskan header type, sementara X-Content-Type-Options: nosniff
// melarang browser menebak — akibatnya PDF tampil sebagai byte mentah di iframe.
const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  zip: "application/zip",
  rar: "application/x-rar-compressed",
  txt: "text/plain; charset=utf-8",
};

function getContentType(ext: string | undefined, fallback: string): string {
  if (ext && MIME_BY_EXT[ext]) return MIME_BY_EXT[ext];
  return fallback || "application/octet-stream";
}

function resolveBucketForUpload(
  ext: string,
  isPrivate: boolean,
  isPublic: boolean
) {
  // Prioritas: private > public flag > image public > default private
  if (isPrivate) {
    return { client: r2PrivateClient, bucket: R2_PRIVATE_BUCKET_NAME, isPublic: false };
  }
  if (isPublic) {
    return { client: r2PublicClient, bucket: R2_PUBLIC_BUCKET_NAME, isPublic: true };
  }
  const isImage = IMAGE_EXTENSIONS.includes(ext);
  if (isImage) {
    return { client: r2PublicClient, bucket: R2_PUBLIC_BUCKET_NAME, isPublic: true };
  }
  return { client: r2PrivateClient, bucket: R2_PRIVATE_BUCKET_NAME, isPublic: false };
}

function resolveBucketForDownload(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const isPrivate = filename.startsWith(PRIVATE_PREFIX);
  const isPublicFile = filename.startsWith(PUBLIC_PREFIX);
  const isPublicImage = !isPrivate && IMAGE_EXTENSIONS.includes(ext);
  const isPublicAccess = isPublicFile || isPublicImage;

  if (isPrivate) {
    return { client: r2PrivateClient, bucket: R2_PRIVATE_BUCKET_NAME, isPublicAccess };
  }
  if (isPublicAccess) {
    return { client: r2PublicClient, bucket: R2_PUBLIC_BUCKET_NAME, isPublicAccess };
  }
  return { client: r2PrivateClient, bucket: R2_PRIVATE_BUCKET_NAME, isPublicAccess };
}

export const uploadServices = new Elysia()
  .use(
    jwt({
      name: "jwt",
      secret: finalJwtSecret,
      schema: t.Object({
        id: t.Numeric(),
        username: t.String(),
        role: t.String(),
        name: t.String(),
        email: t.String(),
      }),
    })
  )
  // Endpoint untuk Unggah Berkas
  .post(
    "/api/upload",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      const bodyData = body as { file?: any; public?: string; private?: string };
      const { file } = bodyData;
      const isPublic = bodyData.public === "true" || bodyData.public === "1";
      const isPrivate = bodyData.private === "true" || bodyData.private === "1";
      if (!file || !(file instanceof File)) {
        set.status = 400;
        return { success: false, message: "Berkas tidak valid" };
      }

      // Validasi Ekstensi Berkas (Gambar & Dokumen yang Aman)
      const allowedExtensions = [
        ...IMAGE_EXTENSIONS,
        "pdf",
        "doc",
        "docx",
        "xls",
        "xlsx",
        "ppt",
        "pptx",
        "zip",
        "rar",
        "txt",
      ];
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      if (!fileExt || !allowedExtensions.includes(fileExt)) {
        set.status = 400;
        return { success: false, message: "Ekstensi berkas tidak diperbolehkan" };
      }

      // Validasi Mime-Type. Gambar dibatasi ke raster (image/*) TANPA SVG —
      // image/svg+xml bisa memuat <script> dan jadi vektor stored-XSS.
      const allowedMimeTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/zip",
        "application/x-zip-compressed",
        "application/x-rar-compressed",
        "text/plain",
      ];
      const isRasterImage = file.type.startsWith("image/") && file.type !== "image/svg+xml";
      if (!isRasterImage && !allowedMimeTypes.includes(file.type)) {
        set.status = 400;
        return { success: false, message: "Hanya berkas gambar atau dokumen yang diperbolehkan" };
      }

      // Validasi Ukuran Berkas (Maksimal 100MB untuk dokumen/arsip, 5MB untuk gambar)
      const isImage = isRasterImage;
      const maxLimit = isImage ? 5 * 1024 * 1024 : 100 * 1024 * 1024;
      if (file.size > maxLimit) {
        set.status = 400;
        return {
          success: false,
          message: `Ukuran berkas melebihi batas maksimal (Gambar: 5MB, Dokumen/Arsip: 100MB)`,
        };
      }

      // Tentukan prefix: privat (wajib auth) atau publik non-gambar (tanpa auth).
      // isPrivate diprioritaskan bila keduanya ter-set.
      const prefix = isPrivate ? PRIVATE_PREFIX : isPublic ? PUBLIC_PREFIX : "";
      const fileName = `${prefix}${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const contentType = getContentType(fileExt, file.type);

      // ========== R2 MODE ==========
      if (isR2Enabled) {
        const { client, isPublic: isPublicBucket } = resolveBucketForUpload(
          fileExt,
          isPrivate,
          isPublic
        );

        if (!client) {
          console.error("[R2] Client tidak tersedia untuk upload:", fileName);
          set.status = 500;
          return { success: false, message: "Konfigurasi R2 tidak lengkap" };
        }

        try {
          // Bun S3File write — pakai arrayBuffer agar tipe terjaga
          const s3file = client.file(fileName);
          // File dari Elysia adalah instance File/Blob — bisa langsung ditulis
          // dengan opsi type untuk Content-Type yang benar di R2
          await s3file.write(file, { type: contentType });

          // Untuk bucket public + R2_PUBLIC_URL valid → kembalikan URL CDN langsung
          // agar frontend tidak perlu lewat /api/files/ (hemat bandwidth & lebih cepat)
          // Jika R2_PUBLIC_URL tidak valid / sama dengan endpoint → fallback ke proxy
          if (isPublicBucket) {
            const publicUrl = getR2PublicUrl(fileName);
            if (publicUrl) {
              return { success: true, url: publicUrl };
            }
          }
          // Private atau public tanpa public URL valid → tetap lewat proxy /api/files/
          return { success: true, url: `/api/files/${fileName}` };
        } catch (err) {
          console.error("[R2] Upload gagal:", err);
          set.status = 500;
          return { success: false, message: "Gagal mengunggah ke storage" };
        }
      }

      // ========== FALLBACK FILESYSTEM LOKAL (dev tanpa R2 atau R2 disabled) ==========
      if (!fs.existsSync(SECURE_UPLOAD_DIR)) {
        fs.mkdirSync(SECURE_UPLOAD_DIR, { recursive: true });
      }

      const filePath = path.join(SECURE_UPLOAD_DIR, fileName);
      await Bun.write(filePath, file);

      return { success: true, url: `/api/files/${fileName}` };
    },
    {
      body: t.Object({
        file: t.File(),
        public: t.Optional(t.String()),
        private: t.Optional(t.String()),
      }),
    }
  )
  // Endpoint untuk mengakses berkas
  .get(
    "/api/files/:filename",
    async ({ params, headers, query, jwt, set }) => {
      // Validasi path traversal dasar — cegah ../../
      if (params.filename.includes("/") || params.filename.includes("\\") || params.filename.includes("..")) {
        set.status = 403;
        return { success: false, message: "Akses ditolak" };
      }

      // Gambar boleh diakses publik (dipakai <img src> di landing page & kartu dashboard
      // yang tidak bisa mengirim header Authorization). Dokumen tetap butuh auth.
      // KECUALI file ber-prefix privat (scan KK/KTP/Ijazah) — selalu butuh auth walau
      // ekstensinya gambar, agar dokumen identitas tidak bocor ke publik.
      // Dan file ber-prefix publik (Pusat Unduhan) — selalu boleh tanpa auth.
      const ext = params.filename.split(".").pop()?.toLowerCase();
      const isPrivate = params.filename.startsWith(PRIVATE_PREFIX);
      const isPublicFile = params.filename.startsWith(PUBLIC_PREFIX);
      const isPublicImage = !isPrivate && ext ? IMAGE_EXTENSIONS.includes(ext) : false;
      const isPublicAccess = isPublicFile || isPublicImage;

      if (!isPublicAccess) {
        // Auth via header atau query param (untuk preview/download di iframe & <a>
        // yang tidak bisa mengirim header Authorization). Jangan pakai verifyUser
        // di sini: ia men-set set.status=401 duluan dan status itu tetap menempel
        // walau token query valid.
        let authorized = false;

        const authHeader = headers["authorization"];
        if (authHeader && authHeader.startsWith("Bearer ")) {
          try {
            const payload = await jwt.verify(authHeader.split(" ")[1]);
            if (payload) authorized = true;
          } catch {
            // header token invalid, coba query token
          }
        }

        if (!authorized && query.token) {
          try {
            const payload = await jwt.verify(query.token);
            if (payload) authorized = true;
          } catch {
            // token invalid
          }
        }

        if (!authorized) {
          set.status = 401;
          return { success: false, message: "Akses ditolak, token hilang atau tidak valid" };
        }
      }

      const contentType = ext && MIME_BY_EXT[ext] ? MIME_BY_EXT[ext] : "application/octet-stream";

      // ========== R2 MODE ==========
      if (isR2Enabled) {
        const { client } = resolveBucketForDownload(params.filename);

        if (client) {
          try {
            const s3file = client.file(params.filename);
            const exists = await s3file.exists();
            if (exists) {
              // Untuk file publik, kita bisa redirect ke R2_PUBLIC_URL jika ada
              // tapi tetap proxy via stream agar header Content-Type terjaga
              // dan tidak expose R2 endpoint ke publik.
              // Gunakan stream agar tidak load seluruh file ke memory (penting untuk 100MB)
              // S3File extends Blob → stream() tersedia
              // Alternatif presign redirect: return new Response(s3file) → 302, tapi kita proxy
              const stream = (s3file as any).stream
                ? (s3file as any).stream()
                : await s3file.arrayBuffer();

              // Jika stream adalah ReadableStream
              if (stream instanceof ReadableStream || (stream && typeof stream.getReader === "function")) {
                return new Response(stream as ReadableStream, {
                  headers: {
                    "Content-Type": contentType,
                    // Cache public images 1 jam, private no-cache
                    "Cache-Control": isPublicAccess ? "public, max-age=3600" : "private, no-cache",
                  },
                });
              }
              // Fallback arrayBuffer
              return new Response(stream as ArrayBuffer, {
                headers: {
                  "Content-Type": contentType,
                  "Cache-Control": isPublicAccess ? "public, max-age=3600" : "private, no-cache",
                },
              });
            }
            // File tidak ada di R2 → fallback cek filesystem lokal (untuk migrasi bertahap)
          } catch (err) {
            console.error("[R2] Get file error:", params.filename, err);
            // Fallback ke local jika R2 error
          }
        }
      }

      // ========== FALLBACK FILESYSTEM LOKAL ==========
      const filePath = path.join(SECURE_UPLOAD_DIR, params.filename);

      const resolved = path.resolve(filePath);
      const relative = path.relative(SECURE_UPLOAD_DIR, resolved);
      if (relative.startsWith("..")) {
        set.status = 403;
        return { success: false, message: "Akses ditolak" };
      }

      if (!fs.existsSync(filePath)) {
        set.status = 404;
        return { success: false, message: "Berkas tidak ditemukan" };
      }

      const file = Bun.file(filePath);
      return new Response(file, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": isPublicAccess ? "public, max-age=3600" : "private, no-cache",
        },
      });
    }
  );
