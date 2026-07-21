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
      const list = await db.select().from(managers).all();
      // Whitelist eksplisit: hanya field yang memang ditampilkan di landing page.
      // Field sensitif (nik, email, password, role) tidak pernah dikirim ke publik.
      const safeList = list.map((item) => {
        const alamatLengkap = [
          item.alamat,
          item.rt && item.rw
            ? `RT ${item.rt}/RW ${item.rw}`
            : item.rt
              ? `RT ${item.rt}`
              : item.rw
                ? `RW ${item.rw}`
                : "",
          item.desa ? `Desa ${item.desa}` : "",
          item.kecamatan ? `Kec. ${item.kecamatan}` : "",
          item.kabupaten,
          item.provinsi,
        ]
          .filter(Boolean)
          .join(", ");

        return {
          id: item.id,
          nama: item.nama,
          jabatan: item.jabatan,
          nip: item.nip,
          tempatTglLahir: item.tempatTglLahir,
          jenisKelamin: item.jenisKelamin,
          agama: item.agama,
          pendidikan: item.pendidikan,
          tanggalMulaiTugas: item.tanggalMulaiTugas,
          nomorSkPengangkatan: item.nomorSkPengangkatan,
          lembagaPengangkat: item.lembagaPengangkat,
          nomorSkPenugasan: item.nomorSkPenugasan,
          lembagaPenugas: item.lembagaPenugas,
          alamat: alamatLengkap,
          foto: item.foto,
        };
      });
      return { success: true, data: safeList };
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
        // Wajib password: hash kosong membuat login manager error (M8)
        const hashedPassword = await Bun.password.hash(
          password && password.trim() !== "" ? password : "password123"
        );
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
        nip: t.String(),
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
        rt: t.Optional(t.String()),
        rw: t.Optional(t.String()),
        desa: t.Optional(t.String()),
        kecamatan: t.Optional(t.String()),
        kabupaten: t.Optional(t.String()),
        provinsi: t.Optional(t.String()),
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
        nip: t.String(),
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
        rt: t.Optional(t.String()),
        rw: t.Optional(t.String()),
        desa: t.Optional(t.String()),
        kecamatan: t.Optional(t.String()),
        kabupaten: t.Optional(t.String()),
        provinsi: t.Optional(t.String()),
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
  // Import data pengelola via Excel (bulk)
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

        // Dedup: skip baris yang NIK/email-nya sudah ada di DB atau duplikat di file
        const existingManagers = await db
          .select({ nik: managers.nik, email: managers.email })
          .from(managers)
          .all();
        const existingNik = new Set(existingManagers.map((m) => m.nik).filter(Boolean));
        const existingEmail = new Set(existingManagers.map((m) => m.email).filter(Boolean));
        const seenNik = new Set<string>();
        const seenEmail = new Set<string>();
        let skippedDuplicate = 0;
        const dedupedItems = validItems.filter((item) => {
          const nik = typeof item.nik === "string" ? item.nik.trim() : "";
          const email = typeof item.email === "string" ? item.email.trim() : "";
          if ((nik && (existingNik.has(nik) || seenNik.has(nik))) ||
              (email && (existingEmail.has(email) || seenEmail.has(email)))) {
            skippedDuplicate++;
            return false;
          }
          if (nik) seenNik.add(nik);
          if (email) seenEmail.add(email);
          return true;
        });

        if (dedupedItems.length === 0) {
          set.status = 400;
          return { success: false, message: `Semua data duplikat (${skippedDuplicate} baris dilewati berdasarkan NIK/email)` };
        }

        const defaultPassword = await Bun.password.hash("password123");
        const insertValues = dedupedItems.map((item) => ({
          nama: item.nama,
          nik: typeof item.nik === "string" ? item.nik : "",
          jabatan: typeof item.jabatan === "string" ? item.jabatan : "",
          nip: typeof item.nip === "string" ? item.nip : "",
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
          rt: typeof item.rt === "string" ? item.rt : "",
          rw: typeof item.rw === "string" ? item.rw : "",
          desa: typeof item.desa === "string" ? item.desa : "",
          kecamatan: typeof item.kecamatan === "string" ? item.kecamatan : "",
          kabupaten: typeof item.kabupaten === "string" ? item.kabupaten : "",
          provinsi: typeof item.provinsi === "string" ? item.provinsi : "",
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
          message: skippedDuplicate > 0
            ? `Berhasil mengimpor ${insertValues.length} data pengelola (${skippedDuplicate} duplikat dilewati)`
            : `Berhasil mengimpor ${insertValues.length} data pengelola`,
          imported: insertValues.length,
          skipped: skippedDuplicate,
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
          nip: t.Optional(t.String()),
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
          rt: t.Optional(t.String()),
          rw: t.Optional(t.String()),
          desa: t.Optional(t.String()),
          kecamatan: t.Optional(t.String()),
          kabupaten: t.Optional(t.String()),
          provinsi: t.Optional(t.String()),
          foto: t.Optional(t.String()),
        })
      ),
    }
  );
