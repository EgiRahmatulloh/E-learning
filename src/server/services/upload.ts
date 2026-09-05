import { Elysia, t } from "elysia";
import { jwt } from "@elysia/jwt";
import { finalJwtSecret } from "../config/jwt";
import { verifyUser } from "../middleware/auth";
import {
  isR2Enabled,
  r2PublicClient,
  r2PrivateClient,
  r2SubmissionsClient,
  R2_PUBLIC_BUCKET_NAME,
  R2_PRIVATE_BUCKET_NAME,
  R2_SUBMISSIONS_BUCKET_NAME,
  getR2PublicUrl,
} from "../config/r2";
import { createDeleteToken, verifyDeleteToken } from "./storage";

// Cloudflare R2 adalah satu-satunya storage berkas — tidak ada fallback ke
// filesystem lokal. Bila R2 belum dikonfigurasi atau sedang bermasalah, upload
// dan pengambilan berkas gagal terang-terangan, alih-alih menulis file ke disk
// server yang tidak ikut ter-backup dan hilang saat redeploy.
const STORAGE_UNAVAILABLE = "Layanan penyimpanan berkas tidak tersedia";

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
  isPublic: boolean,
  isSubmission: boolean
) {
  // Prioritas: submission > private > public flag > image public > default private
  if (isSubmission) {
    return { client: r2SubmissionsClient, bucket: R2_SUBMISSIONS_BUCKET_NAME, isPublic: false };
  }
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
  const isSubmission = filename.startsWith("subm-");
  const isPublicFile = filename.startsWith(PUBLIC_PREFIX);
  const isPublicImage = !isPrivate && !isSubmission && IMAGE_EXTENSIONS.includes(ext);
  const isPublicAccess = isPublicFile || isPublicImage;

  if (isSubmission) {
    return { client: r2SubmissionsClient, bucket: R2_SUBMISSIONS_BUCKET_NAME, isPublicAccess: false };
  }
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

      const bodyData = body as { file?: any; public?: string; private?: string; submission?: string };
      const { file } = bodyData;
      const isPublic = bodyData.public === "true" || bodyData.public === "1";
      const isPrivate = bodyData.private === "true" || bodyData.private === "1";
      const isSubmission = bodyData.submission === "true" || bodyData.submission === "1";
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

      // Tentukan prefix: submission, privat (wajib auth) atau publik non-gambar (tanpa auth).
      // isSubmission diprioritaskan, disusul isPrivate bila keduanya ter-set.
      const prefix = isSubmission ? "subm-" : isPrivate ? PRIVATE_PREFIX : isPublic ? PUBLIC_PREFIX : "";
      const fileName = `${prefix}${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const contentType = getContentType(fileExt, file.type);

      // ========== SIMPAN KE R2 ==========
      if (!isR2Enabled) {
        console.error("[R2] Upload ditolak: kredensial R2 belum dikonfigurasi");
        set.status = 503;
        return { success: false, message: STORAGE_UNAVAILABLE };
      }

      const { client, isPublic: isPublicBucket } = resolveBucketForUpload(
        fileExt,
        isPrivate,
        isPublic,
        isSubmission
      );

      if (!client) {
        console.error("[R2] Client tidak tersedia untuk upload:", fileName);
        set.status = 503;
        return { success: false, message: STORAGE_UNAVAILABLE };
      }

      try {
        // Bun S3File write — File/Blob dari Elysia bisa langsung ditulis, opsi
        // type menjaga Content-Type yang benar saat berkas disajikan dari R2
        const s3file = client.file(fileName);
        await s3file.write(file, { type: contentType });

        // Token hapus dikembalikan bersama URL: form yang mengunggah berkas lalu
        // dibatalkan memakainya untuk membersihkan berkasnya sendiri lewat
        // DELETE /api/files/:filename, tanpa memberi siapa pun kemampuan
        // menghapus berkas lain.
        const deleteToken = createDeleteToken(fileName);

        // Bucket public + R2_PUBLIC_URL valid → kembalikan URL CDN langsung agar
        // frontend tidak perlu lewat /api/files/ (hemat bandwidth & lebih cepat).
        // Bila R2_PUBLIC_URL tidak valid → tetap lewat proxy.
        if (isPublicBucket) {
          const publicUrl = getR2PublicUrl(fileName);
          if (publicUrl) {
            return { success: true, url: publicUrl, deleteToken };
          }
        }
        // Private atau public tanpa public URL valid → tetap lewat proxy /api/files/
        return { success: true, url: `/api/files/${fileName}`, deleteToken };
      } catch (err) {
        console.error("[R2] Upload gagal:", err);
        set.status = 502;
        return { success: false, message: "Gagal mengunggah berkas ke storage" };
      }
    },
    {
      body: t.Object({
        file: t.File(),
        public: t.Optional(t.String()),
        private: t.Optional(t.String()),
        submission: t.Optional(t.String()),
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
      const cacheControl = isPublicAccess ? "public, max-age=3600" : "private, no-cache";

      // ========== AMBIL DARI R2 ==========
      if (!isR2Enabled) {
        console.error("[R2] Permintaan berkas ditolak: kredensial R2 belum dikonfigurasi");
        set.status = 503;
        return { success: false, message: STORAGE_UNAVAILABLE };
      }

      const { client } = resolveBucketForDownload(params.filename);
      if (!client) {
        console.error("[R2] Client tidak tersedia untuk berkas:", params.filename);
        set.status = 503;
        return { success: false, message: STORAGE_UNAVAILABLE };
      }

      try {
        const s3file = client.file(params.filename);
        if (!(await s3file.exists())) {
          set.status = 404;
          return { success: false, message: "Berkas tidak ditemukan" };
        }

        // Di-proxy lewat stream, bukan redirect ke R2: header Content-Type
        // terjaga, endpoint R2 tidak terekspos, dan berkas besar (hingga 100MB)
        // tidak dimuat penuh ke memory. S3File extends Blob → stream() tersedia,
        // arrayBuffer dipakai sebagai jaring aman bila tidak.
        const stream = (s3file as any).stream
          ? (s3file as any).stream()
          : await s3file.arrayBuffer();

        if (stream instanceof ReadableStream || (stream && typeof stream.getReader === "function")) {
          return new Response(stream as ReadableStream, {
            headers: { "Content-Type": contentType, "Cache-Control": cacheControl },
          });
        }
        return new Response(stream as ArrayBuffer, {
          headers: { "Content-Type": contentType, "Cache-Control": cacheControl },
        });
      } catch (err) {
        console.error("[R2] Get file error:", params.filename, err);
        set.status = 502;
        return { success: false, message: "Gagal mengambil berkas dari storage" };
      }
    }
  )
  // Endpoint untuk membuang berkas yang sudah terunggah tapi batal dipakai —
  // mis. form edit yang mengunggah gambar baru lalu ditutup lewat tombol BATAL.
  // Berkas yang sudah tersimpan di DB TIDAK dibersihkan dari sini; itu urusan
  // handler UPDATE/DELETE masing-masing entitas (lihat services/storage.ts).
  .delete(
    "/api/files/:filename",
    async ({ params, headers, query, jwt, set }) => {
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      if (
        params.filename.includes("/") ||
        params.filename.includes("\\") ||
        params.filename.includes("..")
      ) {
        set.status = 403;
        return { success: false, message: "Akses ditolak" };
      }

      // Login saja tidak cukup: URL berkas publik bisa dilihat siapa pun, jadi
      // tanpa token ini warga belajar mana pun bisa menghapus gambar landing
      // page. Token hanya dipegang pengunggahnya, hasil dari POST /api/upload.
      if (!verifyDeleteToken(params.filename, query.deleteToken)) {
        set.status = 403;
        return { success: false, message: "Token hapus berkas tidak valid atau kedaluwarsa" };
      }

      if (!isR2Enabled) {
        set.status = 503;
        return { success: false, message: STORAGE_UNAVAILABLE };
      }

      const { client } = resolveBucketForDownload(params.filename);
      if (!client) {
        set.status = 503;
        return { success: false, message: STORAGE_UNAVAILABLE };
      }

      try {
        await client.file(params.filename).delete();
        return { success: true, message: "Berkas dibatalkan" };
      } catch (err) {
        console.error("[R2] Delete file error:", params.filename, err);
        set.status = 502;
        return { success: false, message: "Gagal menghapus berkas dari storage" };
      }
    },
    {
      query: t.Object({
        deleteToken: t.Optional(t.String()),
      }),
    }
  );
