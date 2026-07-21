import { Elysia, t } from "elysia";
import { jwt } from "@elysia/jwt";
import { finalJwtSecret } from "../config/jwt";
import { verifyUser } from "../middleware/auth";
import fs from "fs";
import path from "path";

const SECURE_UPLOAD_DIR = path.join(process.cwd(), "uploads");

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

      const bodyData = body as { file?: any };
      const { file } = bodyData;
      if (!file || !(file instanceof File)) {
        set.status = 400;
        return { success: false, message: "Berkas tidak valid" };
      }

      // Validasi Ekstensi Berkas (Gambar & Dokumen yang Aman)
      const allowedExtensions = [
        "jpg",
        "jpeg",
        "png",
        "webp",
        "gif",
        "svg",
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

      // Validasi Mime-Type (Gambar & Dokumen)
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
      if (!file.type.startsWith("image/") && !allowedMimeTypes.includes(file.type)) {
        set.status = 400;
        return { success: false, message: "Hanya berkas gambar atau dokumen yang diperbolehkan" };
      }

      // Validasi Ukuran Berkas (Maksimal 100MB untuk dokumen/arsip, 5MB untuk gambar)
      const isImage = file.type.startsWith("image/");
      const maxLimit = isImage ? 5 * 1024 * 1024 : 100 * 1024 * 1024;
      if (file.size > maxLimit) {
        set.status = 400;
        return {
          success: false,
          message: `Ukuran berkas melebihi batas maksimal (Gambar: 5MB, Dokumen/Arsip: 100MB)`,
        };
      }

      // Simpan di folder aman (bukan public/)
      if (!fs.existsSync(SECURE_UPLOAD_DIR)) {
        fs.mkdirSync(SECURE_UPLOAD_DIR, { recursive: true });
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = path.join(SECURE_UPLOAD_DIR, fileName);

      await Bun.write(filePath, file);

      return { success: true, url: `/api/files/${fileName}` };
    },
    {
      body: t.Object({
        file: t.File(),
      }),
    }
  )
  // Endpoint untuk mengakses berkas
  .get(
    "/api/files/:filename",
    async ({ params, headers, query, jwt, set }) => {
      // Gambar boleh diakses publik (dipakai <img src> di landing page & kartu dashboard
      // yang tidak bisa mengirim header Authorization). Dokumen tetap butuh auth.
      const imageExtensions = ["jpg", "jpeg", "png", "webp", "gif", "svg"];
      const ext = params.filename.split(".").pop()?.toLowerCase();
      const isImage = ext ? imageExtensions.includes(ext) : false;

      if (!isImage) {
        // Auth via header atau query param (untuk preview di img/iframe)
        let authError = await verifyUser(headers, jwt, set);
        if (authError && query.token) {
          try {
            const payload = await jwt.verify(query.token);
            if (payload) authError = null;
          } catch {
            // token invalid, tetap error
          }
        }
        if (authError) return authError;
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
      return new Response(file);
    }
  );
