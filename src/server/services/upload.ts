import { Elysia, t } from "elysia";
import { jwt } from "@elysia/jwt";
import { finalJwtSecret } from "../config/jwt";
import { verifyUser } from "../middleware/auth";
import fs from "fs";
import path from "path";

const SECURE_UPLOAD_DIR = path.join(process.cwd(), "uploads");

// Ekstensi gambar — dipakai bersama oleh validasi upload DAN aturan akses publik
// di /api/files/ agar keduanya tidak bisa lepas sinkron. SVG sengaja TIDAK di sini:
// SVG bisa memuat <script> sehingga jadi vektor stored-XSS bila disajikan inline.
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];

// Prefix untuk berkas privat (mis. scan KK/KTP/Ijazah). File ber-prefix ini SELALU
// butuh auth di /api/files/, walau ekstensinya gambar — mencegah kebocoran dokumen
// identitas lewat aturan "gambar boleh publik".
const PRIVATE_PREFIX = "priv-";

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
  // Endpoint untuk Unggah Berkas (Aman — simpan di luar public/)
  .post(
    "/api/upload",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      const bodyData = body as { file?: any; public?: string; private?: string };
      const { file } = bodyData;
      // Flag "public": file yang dimaksudkan diakses pengunjung tanpa login
      // (mis. Pusat Unduhan) disimpan ke public/uploads yang di-serve statis tanpa auth.
      const isPublic = bodyData.public === "true" || bodyData.public === "1";
      // Flag "private": dokumen sensitif (scan KK/KTP/Ijazah). Diberi prefix agar
      // /api/files/ selalu meminta auth walau ekstensinya gambar.
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

      const prefix = isPrivate ? PRIVATE_PREFIX : "";
      const fileName = `${prefix}${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      if (isPublic) {
        // Simpan ke public/uploads → dilayani statis di /uploads tanpa auth
        const publicDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        await Bun.write(path.join(publicDir, fileName), file);
        return { success: true, url: `/uploads/${fileName}` };
      }

      // Simpan di folder aman (bukan public/)
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
      // Gambar boleh diakses publik (dipakai <img src> di landing page & kartu dashboard
      // yang tidak bisa mengirim header Authorization). Dokumen tetap butuh auth.
      // KECUALI file ber-prefix privat (scan KK/KTP/Ijazah) — selalu butuh auth walau
      // ekstensinya gambar, agar dokumen identitas tidak bocor ke publik.
      const ext = params.filename.split(".").pop()?.toLowerCase();
      const isPrivate = params.filename.startsWith(PRIVATE_PREFIX);
      const isPublicImage = !isPrivate && ext ? IMAGE_EXTENSIONS.includes(ext) : false;

      if (!isPublicImage) {
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
      const contentType = ext && MIME_BY_EXT[ext] ? MIME_BY_EXT[ext] : "application/octet-stream";
      return new Response(file, {
        headers: { "Content-Type": contentType },
      });
    }
  );
