/* eslint-disable @typescript-eslint/no-explicit-any */
import { Elysia, t } from "elysia";
import { jwt } from "@elysia/jwt";
import { db } from "../config/db";
import { tutors } from "../models";
import { eq } from "drizzle-orm";
import { verifyAdmin } from "../middleware/auth";
import { finalJwtSecret } from "../config/jwt";

export const tutorsHandlers = new Elysia()
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
  // Ambil semua tutor
  .get("/api/tutors", async ({ headers, jwt, set }) => {
    try {
      const list = await db.select().from(tutors).all();

      const authHeader = headers["authorization"];
      let isAdmin = false;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const payload = await jwt.verify(token);
        if (payload && (payload.role === "admin" || payload.role === "super_admin")) {
          isAdmin = true;
        }
      }

      const sanitized = list.map((item) => {
        const rest = { ...item };
        (rest as any).password = "";
        if (!isAdmin) {
          delete (rest as any).nik;
        }
        return rest;
      });
      return { success: true, data: sanitized };
    } catch {
      set.status = 500;
      return { success: false, message: "Gagal mengambil data tutor" };
    }
  })
  // Tambah tutor baru
  .post(
    "/api/tutors",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const {
        nama,
        tutorMapel,
        program,
        nuptk,
        tempatTglLahir,
        jenisKelamin,
        agama,
        pendidikan,
        email,
        nik,
        alamat,
        password,
        foto,
        tanggalMulaiTugas,
        nomorSkPengangkatan,
        lembagaPengangkat,
        nomorSkPenugasan,
        lembagaPenugas,
      } = body;

      try {
        const hashedPassword = await Bun.password.hash(password || "password123");
        const inserted = await db
          .insert(tutors)
          .values({
            nama,
            tutorMapel: tutorMapel || "",
            program: program || "",
            nuptk: nuptk || "",
            tempatTglLahir: tempatTglLahir || "",
            jenisKelamin: jenisKelamin || "",
            agama: agama || "",
            pendidikan: pendidikan || "",
            email: email || "",
            nik: nik || "",
            alamat: alamat || "",
            password: hashedPassword,
            foto: foto || "",
            tanggalMulaiTugas: tanggalMulaiTugas || "",
            nomorSkPengangkatan: nomorSkPengangkatan || "",
            lembagaPengangkat: lembagaPengangkat || "",
            nomorSkPenugasan: nomorSkPenugasan || "",
            lembagaPenugas: lembagaPenugas || "",
          })
          .returning()
          .get();

        const safeData = { ...inserted };
        delete (safeData as any).password;
        return { success: true, data: safeData };
      } catch {
        set.status = 500;
        return { success: false, message: "Gagal menambahkan data tutor" };
      }
    },
    {
      body: t.Object({
        nama: t.String({ minLength: 1 }),
        tutorMapel: t.Optional(t.String()),
        program: t.Optional(t.String()),
        nuptk: t.Optional(t.String()),
        tempatTglLahir: t.Optional(t.String()),
        jenisKelamin: t.Optional(t.String()),
        agama: t.Optional(t.String()),
        pendidikan: t.Optional(t.String()),
        email: t.Optional(t.String()),
        nik: t.Optional(t.String()),
        alamat: t.Optional(t.String()),
        password: t.Optional(t.String()),
        foto: t.Optional(t.String()),
        tanggalMulaiTugas: t.Optional(t.String()),
        nomorSkPengangkatan: t.Optional(t.String()),
        lembagaPengangkat: t.Optional(t.String()),
        nomorSkPenugasan: t.Optional(t.String()),
        lembagaPenugas: t.Optional(t.String()),
      }),
    }
  )
  // Update tutor
  .put(
    "/api/tutors/:id",
    async ({ params, body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const id = Number(params.id);
      if (isNaN(id)) {
        set.status = 400;
        return { success: false, message: "ID parameter tidak valid" };
      }

      const {
        nama,
        tutorMapel,
        program,
        nuptk,
        tempatTglLahir,
        jenisKelamin,
        agama,
        pendidikan,
        email,
        nik,
        alamat,
        password,
        foto,
        tanggalMulaiTugas,
        nomorSkPengangkatan,
        lembagaPengangkat,
        nomorSkPenugasan,
        lembagaPenugas,
      } = body;

      try {
        const existing = await db.select().from(tutors).where(eq(tutors.id, id)).get();
        if (!existing) {
          set.status = 404;
          return { success: false, message: "Data tutor tidak ditemukan" };
        }

        let finalPassword = existing.password;
        if (password) {
          finalPassword = await Bun.password.hash(password);
        }

        const updated = await db
          .update(tutors)
          .set({
            nama,
            tutorMapel: tutorMapel || "",
            program: program ?? existing.program,
            nuptk: nuptk ?? existing.nuptk,
            tempatTglLahir: tempatTglLahir ?? existing.tempatTglLahir,
            jenisKelamin: jenisKelamin ?? existing.jenisKelamin,
            agama: agama ?? existing.agama,
            pendidikan: pendidikan ?? existing.pendidikan,
            email: email ?? existing.email,
            nik: nik ?? existing.nik,
            alamat: alamat ?? existing.alamat,
            password: finalPassword,
            foto: foto ?? existing.foto,
            tanggalMulaiTugas: tanggalMulaiTugas ?? existing.tanggalMulaiTugas,
            nomorSkPengangkatan: nomorSkPengangkatan ?? existing.nomorSkPengangkatan,
            lembagaPengangkat: lembagaPengangkat ?? existing.lembagaPengangkat,
            nomorSkPenugasan: nomorSkPenugasan ?? existing.nomorSkPenugasan,
            lembagaPenugas: lembagaPenugas ?? existing.lembagaPenugas,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(tutors.id, id))
          .returning()
          .get();

        const safeData = { ...updated };
        delete (safeData as any).password;
        return { success: true, data: safeData };
      } catch {
        set.status = 500;
        return { success: false, message: "Gagal memperbarui data tutor" };
      }
    },
    {
      body: t.Object({
        nama: t.String({ minLength: 1 }),
        tutorMapel: t.Optional(t.String()),
        program: t.Optional(t.String()),
        nuptk: t.Optional(t.String()),
        tempatTglLahir: t.Optional(t.String()),
        jenisKelamin: t.Optional(t.String()),
        agama: t.Optional(t.String()),
        pendidikan: t.Optional(t.String()),
        email: t.Optional(t.String()),
        nik: t.Optional(t.String()),
        alamat: t.Optional(t.String()),
        password: t.Optional(t.String()),
        foto: t.Optional(t.String()),
        tanggalMulaiTugas: t.Optional(t.String()),
        nomorSkPengangkatan: t.Optional(t.String()),
        lembagaPengangkat: t.Optional(t.String()),
        nomorSkPenugasan: t.Optional(t.String()),
        lembagaPenugas: t.Optional(t.String()),
      }),
    }
  )
  // Hapus tutor
  .delete("/api/tutors/:id", async ({ params, headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    const id = Number(params.id);
    if (isNaN(id)) {
      set.status = 400;
      return { success: false, message: "ID parameter tidak valid" };
    }

    try {
      await db.delete(tutors).where(eq(tutors.id, id)).run();
      return { success: true, message: "Data tutor berhasil dihapus" };
    } catch {
      set.status = 500;
      return { success: false, message: "Gagal menghapus data tutor" };
    }
  })
  // Import data tutor via CSV (bulk)
  .post(
    "/api/tutors/import",
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
          tutorMapel: typeof item.tutorMapel === "string" ? item.tutorMapel : "",
          program: typeof item.program === "string" ? item.program : "",
          nuptk: typeof item.nuptk === "string" ? item.nuptk : "",
          tempatTglLahir: typeof item.tempatTglLahir === "string" ? item.tempatTglLahir : "",
          jenisKelamin: typeof item.jenisKelamin === "string" ? item.jenisKelamin : "",
          agama: typeof item.agama === "string" ? item.agama : "",
          pendidikan: typeof item.pendidikan === "string" ? item.pendidikan : "",
          email: typeof item.email === "string" ? item.email : "",
          nik: typeof item.nik === "string" ? item.nik : "",
          alamat: typeof item.alamat === "string" ? item.alamat : "",
          password: defaultPassword,
          foto: typeof item.foto === "string" ? item.foto : "",
          tanggalMulaiTugas:
            typeof item.tanggalMulaiTugas === "string" ? item.tanggalMulaiTugas : "",
          nomorSkPengangkatan:
            typeof item.nomorSkPengangkatan === "string" ? item.nomorSkPengangkatan : "",
          lembagaPengangkat:
            typeof item.lembagaPengangkat === "string" ? item.lembagaPengangkat : "",
          nomorSkPenugasan:
            typeof item.nomorSkPenugasan === "string" ? item.nomorSkPenugasan : "",
          lembagaPenugas: typeof item.lembagaPenugas === "string" ? item.lembagaPenugas : "",
        }));

        const chunkSize = 100;
        db.transaction((tx) => {
          for (let i = 0; i < insertValues.length; i += chunkSize) {
            const chunk = insertValues.slice(i, i + chunkSize);
            tx.insert(tutors).values(chunk).run();
          }
        });
        return { success: true, message: `Berhasil mengimpor ${insertValues.length} data tutor` };
      } catch (err) {
        console.error("Gagal mengimpor data tutor:", err);
        set.status = 500;
        return { success: false, message: "Gagal mengimpor data tutor" };
      }
    },
    {
      body: t.Array(
        t.Object({
          nama: t.String({ minLength: 1 }),
          tutorMapel: t.Optional(t.String()),
          program: t.Optional(t.String()),
          nuptk: t.Optional(t.String()),
          tempatTglLahir: t.Optional(t.String()),
          jenisKelamin: t.Optional(t.String()),
          agama: t.Optional(t.String()),
          pendidikan: t.Optional(t.String()),
          email: t.Optional(t.String()),
          nik: t.Optional(t.String()),
          alamat: t.Optional(t.String()),
          foto: t.Optional(t.String()),
          tanggalMulaiTugas: t.Optional(t.String()),
          nomorSkPengangkatan: t.Optional(t.String()),
          lembagaPengangkat: t.Optional(t.String()),
          nomorSkPenugasan: t.Optional(t.String()),
          lembagaPenugas: t.Optional(t.String()),
        })
      ),
    }
  );
