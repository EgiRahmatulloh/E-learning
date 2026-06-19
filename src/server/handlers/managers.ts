/* eslint-disable @typescript-eslint/no-explicit-any */
import { Elysia, t } from "elysia";
import { jwt } from "@elysia/jwt";
import { db } from "../config/db";
import { managers } from "../models";
import { eq } from "drizzle-orm";
import { verifyAdmin } from "../middleware/auth";
import { finalJwtSecret } from "../config/jwt";

export const managersHandlers = new Elysia()
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
  // Ambil semua pengelola
  .get("/api/managers", async ({ headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    try {
      const list = await db.select().from(managers).all();
      const safeList = list.map((item) => {
        const rest = { ...item };
        delete (rest as any).password;
        return rest;
      });
      return { success: true, data: safeList };
    } catch {
      set.status = 500;
      return { success: false, message: "Gagal mengambil data pengelola" };
    }
  })
  // Ambil data pengelola untuk publik (landing page)
  .get("/api/public-managers", async ({ set }) => {
    try {
      const list = await db
        .select({
          id: managers.id,
          nama: managers.nama,
          jabatan: managers.jabatan,
          foto: managers.foto,
        })
        .from(managers)
        .all();
      return { success: true, data: list };
    } catch {
      set.status = 500;
      return { success: false, message: "Gagal mengambil data pengelola" };
    }
  })
  // Tambah pengelola baru
  .post(
    "/api/managers",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      try {
        const { password, ...otherFields } = body;
        const hashedPassword = password ? await Bun.password.hash(password) : "";
        const inserted = await db
          .insert(managers)
          .values({
            ...otherFields,
            password: hashedPassword,
          })
          .returning()
          .get();

        const safeData = { ...inserted };
        delete (safeData as any).password;
        return { success: true, data: safeData };
      } catch {
        set.status = 500;
        return { success: false, message: "Gagal menambahkan data pengelola" };
      }
    },
    {
      body: t.Object({
        nama: t.String(),
        nik: t.String(),
        jabatan: t.String(),
        nuptk: t.String(),
        tempatTglLahir: t.String(),
        jenisKelamin: t.String(),
        agama: t.String(),
        pendidikan: t.String(),
        email: t.String(),
        tanggalMulaiTugas: t.String(),
        nomorSkPengangkatan: t.String(),
        lembagaPengangkat: t.String(),
        nomorSkPenugasan: t.String(),
        lembagaPenugas: t.String(),
        alamat: t.String(),
        password: t.Optional(t.String()),
        foto: t.String(),
      }),
    }
  )
  // Update pengelola
  .put(
    "/api/managers/:id",
    async ({ params, body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const id = Number(params.id);
      if (isNaN(id)) {
        set.status = 400;
        return { success: false, message: "ID parameter tidak valid" };
      }

      try {
        const { password, ...otherFields } = body;
        const updateData: Record<string, any> = { ...otherFields };
        if (password && password.trim() !== "") {
          updateData.password = await Bun.password.hash(password);
        }

        const updated = await db
          .update(managers)
          .set({
            ...updateData,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(managers.id, id))
          .returning()
          .get();

        if (!updated) {
          set.status = 404;
          return { success: false, message: "Pengelola tidak ditemukan" };
        }

        const safeData = { ...updated };
        delete (safeData as any).password;
        return { success: true, data: safeData };
      } catch {
        set.status = 500;
        return { success: false, message: "Gagal memperbarui data pengelola" };
      }
    },
    {
      body: t.Object({
        nama: t.String(),
        nik: t.String(),
        jabatan: t.String(),
        nuptk: t.String(),
        tempatTglLahir: t.String(),
        jenisKelamin: t.String(),
        agama: t.String(),
        pendidikan: t.String(),
        email: t.String(),
        tanggalMulaiTugas: t.String(),
        nomorSkPengangkatan: t.String(),
        lembagaPengangkat: t.String(),
        nomorSkPenugasan: t.String(),
        lembagaPenugas: t.String(),
        alamat: t.String(),
        password: t.Optional(t.String()),
        foto: t.String(),
      }),
    }
  )
  // Hapus pengelola
  .delete("/api/managers/:id", async ({ params, headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    const id = Number(params.id);
    if (isNaN(id)) {
      set.status = 400;
      return { success: false, message: "ID parameter tidak valid" };
    }

    try {
      await db.delete(managers).where(eq(managers.id, id)).run();
      return { success: true, message: "Pengelola berhasil dihapus" };
    } catch {
      set.status = 500;
      return { success: false, message: "Gagal menghapus pengelola" };
    }
  })
  // Import data pengelola via CSV (bulk)
  .post(
    "/api/managers/import",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const list = body;
      if (!Array.isArray(list)) {
        set.status = 400;
        return { success: false, message: "Format data tidak valid, harus berupa array" };
      }

      try {
        const validItems = list.filter(
          (item) =>
            item &&
            typeof item === "object" &&
            typeof item.nama === "string" &&
            item.nama.trim().length > 0
        );

        if (validItems.length === 0) {
          set.status = 400;
          return { success: false, message: "Tidak ada data valid untuk diimpor" };
        }

        const defaultPassword = await Bun.password.hash("password123");
        const insertValues = validItems.map((item) => ({
          nama: item.nama,
          nik: typeof item.nik === "string" ? item.nik : "",
          jabatan: typeof item.jabatan === "string" ? item.jabatan : "",
          nuptk: typeof item.nuptk === "string" ? item.nuptk : "",
          tempatTglLahir: typeof item.tempatTglLahir === "string" ? item.tempatTglLahir : "",
          jenisKelamin: typeof item.jenisKelamin === "string" ? item.jenisKelamin : "",
          agama: typeof item.agama === "string" ? item.agama : "",
          pendidikan: typeof item.pendidikan === "string" ? item.pendidikan : "",
          email: typeof item.email === "string" ? item.email : "",
          tanggalMulaiTugas:
            typeof item.tanggalMulaiTugas === "string" ? item.tanggalMulaiTugas : "",
          nomorSkPengangkatan:
            typeof item.nomorSkPengangkatan === "string" ? item.nomorSkPengangkatan : "",
          lembagaPengangkat:
            typeof item.lembagaPengangkat === "string" ? item.lembagaPengangkat : "",
          nomorSkPenugasan:
            typeof item.nomorSkPenugasan === "string" ? item.nomorSkPenugasan : "",
          lembagaPenugas: typeof item.lembagaPenugas === "string" ? item.lembagaPenugas : "",
          alamat: typeof item.alamat === "string" ? item.alamat : "",
          password: defaultPassword,
          foto: typeof item.foto === "string" ? item.foto : "",
        }));

        const chunkSize = 100;
        db.transaction((tx) => {
          for (let i = 0; i < insertValues.length; i += chunkSize) {
            const chunk = insertValues.slice(i, i + chunkSize);
            tx.insert(managers).values(chunk).run();
          }
        });
        return {
          success: true,
          message: `Berhasil mengimpor ${insertValues.length} data pengelola`,
        };
      } catch (err) {
        console.error("Gagal mengimpor data pengelola:", err);
        set.status = 500;
        return { success: false, message: "Gagal mengimpor data pengelola" };
      }
    },
    {
      body: t.Array(
        t.Object({
          nama: t.String({ minLength: 1 }),
          nik: t.Optional(t.String()),
          jabatan: t.Optional(t.String()),
          nuptk: t.Optional(t.String()),
          tempatTglLahir: t.Optional(t.String()),
          jenisKelamin: t.Optional(t.String()),
          agama: t.Optional(t.String()),
          pendidikan: t.Optional(t.String()),
          email: t.Optional(t.String()),
          tanggalMulaiTugas: t.Optional(t.String()),
          nomorSkPengangkatan: t.Optional(t.String()),
          lembagaPengangkat: t.Optional(t.String()),
          nomorSkPenugasan: t.Optional(t.String()),
          lembagaPenugas: t.Optional(t.String()),
          alamat: t.Optional(t.String()),
          foto: t.Optional(t.String()),
        })
      ),
    }
  );
