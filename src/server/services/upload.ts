import { Elysia, t } from "elysia";
import { jwt } from "@elysia/jwt";
import { finalJwtSecret } from "../config/jwt";
import { verifyAdmin } from "../middleware/auth";
import fs from "fs";

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
  // Endpoint untuk Unggah Berkas Gambar Fisik (Aman & Efisien)
  .post(
    "/api/upload",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const { file } = body;
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

      const uploadDir = "public/uploads";
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `${uploadDir}/${fileName}`;

      await Bun.write(filePath, file);

      return { success: true, url: `/uploads/${fileName}` };
    },
    {
      body: t.Object({
        file: t.File(),
      }),
    }
  );
