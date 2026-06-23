/* eslint-disable @typescript-eslint/no-any */
import { Elysia, t } from "elysia";
import { jwt } from "@elysia/jwt";
import { db } from "../config/db";
import { rombels, rombelStudents, students, tutors } from "../models";
import { eq, and, sql, inArray } from "drizzle-orm";
import { verifyAdmin } from "../middleware/auth";
import { finalJwtSecret } from "../config/jwt";

export const rombelHandlers = new Elysia()
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

  // ==========================================
  // GET /api/rombels — List semua rombel
  // ==========================================
  .get("/api/rombels", async ({ headers, jwt, set }) => {
    try {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const list = await db
        .select({
          id: rombels.id,
          nama: rombels.nama,
          waliKelasId: rombels.waliKelasId,
          createdAt: rombels.createdAt,
          updatedAt: rombels.updatedAt,
          tutorId: tutors.id,
          tutorNama: tutors.nama,
          tutorFoto: tutors.foto,
          tutorMapel: tutors.tutorMapel,
          jumlahSiswa: sql<number>`count(${rombelStudents.id})`,
        })
        .from(rombels)
        .leftJoin(tutors, eq(rombels.waliKelasId, tutors.id))
        .leftJoin(rombelStudents, eq(rombels.id, rombelStudents.rombelId))
        .groupBy(rombels.id)
        .all();

      const result = list.map((r) => ({
        id: r.id,
        nama: r.nama,
        waliKelasId: r.waliKelasId,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        waliKelas: r.tutorId
          ? {
              id: r.tutorId,
              nama: r.tutorNama,
              foto: r.tutorFoto,
              tutorMapel: r.tutorMapel,
            }
          : null,
        jumlahSiswa: Number(r.jumlahSiswa),
      }));

      return { success: true, data: result };
    } catch (err) {
      console.error("GET /api/rombels error:", err);
      set.status = 500;
      return { success: false, message: "Gagal mengambil data rombel" };
    }
  })

  // ==========================================
  // POST /api/rombels — Buat rombel baru
  // ==========================================
  .post(
    "/api/rombels",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const { nama, waliKelasId } = body;

      if (!nama || !nama.trim()) {
        set.status = 400;
        return { success: false, message: "Nama rombel wajib diisi" };
      }

      // Cek duplikat
      const existing = await db
        .select()
        .from(rombels)
        .where(eq(rombels.nama, nama.trim()))
        .get();
      if (existing) {
        set.status = 400;
        return { success: false, message: `Rombel "${nama.trim()}" sudah ada` };
      }

      try {
        const inserted = await db
          .insert(rombels)
          .values({
            nama: nama.trim(),
            waliKelasId: waliKelasId || null,
          })
          .returning()
          .get();

        return { success: true, data: inserted };
      } catch (err) {
        console.error("POST /api/rombels error:", err);
        set.status = 500;
        return { success: false, message: "Gagal membuat rombel" };
      }
    },
    {
      body: t.Object({
        nama: t.String({ minLength: 1 }),
        waliKelasId: t.Optional(t.Nullable(t.Number())),
      }),
    }
  )

  // ==========================================
  // PUT /api/rombels/:id — Update rombel
  // ==========================================
  .put(
    "/api/rombels/:id",
    async ({ params, body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const id = Number(params.id);
      if (isNaN(id)) {
        set.status = 400;
        return { success: false, message: "ID tidak valid" };
      }

      const { nama, waliKelasId } = body;

      try {
        const existing = await db.select().from(rombels).where(eq(rombels.id, id)).get();
        if (!existing) {
          set.status = 404;
          return { success: false, message: "Rombel tidak ditemukan" };
        }

        // Cek duplikat nama jika ganti nama
        if (nama && nama.trim() !== existing.nama) {
          const duplikat = await db
            .select()
            .from(rombels)
            .where(and(eq(rombels.nama, nama.trim()), sql`${rombels.id} != ${id}`))
            .get();
          if (duplikat) {
            set.status = 400;
            return { success: false, message: `Rombel "${nama.trim()}" sudah ada` };
          }
        }

        const updated = await db
          .update(rombels)
          .set({
            nama: nama?.trim() || existing.nama,
            waliKelasId: waliKelasId !== undefined ? waliKelasId : existing.waliKelasId,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(rombels.id, id))
          .returning()
          .get();

        return { success: true, data: updated };
      } catch (err) {
        console.error("PUT /api/rombels/:id error:", err);
        set.status = 500;
        return { success: false, message: "Gagal update rombel" };
      }
    },
    {
      body: t.Object({
        nama: t.Optional(t.String()),
        waliKelasId: t.Optional(t.Nullable(t.Number())),
      }),
    }
  )

  // ==========================================
  // DELETE /api/rombels/:id — Hapus rombel
  // ==========================================
  .delete("/api/rombels/:id", async ({ params, headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    const id = Number(params.id);
    if (isNaN(id)) {
      set.status = 400;
      return { success: false, message: "ID tidak valid" };
    }

    try {
      const existing = await db.select().from(rombels).where(eq(rombels.id, id)).get();
      if (!existing) {
        set.status = 404;
        return { success: false, message: "Rombel tidak ditemukan" };
      }

      // Cascade delete: hapus relasi siswa dulu
      await db.delete(rombelStudents).where(eq(rombelStudents.rombelId, id)).run();
      await db.delete(rombels).where(eq(rombels.id, id)).run();

      return { success: true, message: `Rombel "${existing.nama}" berhasil dihapus` };
    } catch (err) {
      console.error("DELETE /api/rombels/:id error:", err);
      set.status = 500;
      return { success: false, message: "Gagal menghapus rombel" };
    }
  })

  // ==========================================
  // GET /api/rombels/:id/students — List siswa di rombel
  // ==========================================
  .get("/api/rombels/:id/students", async ({ params, headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    const id = Number(params.id);
    if (isNaN(id)) {
      set.status = 400;
      return { success: false, message: "ID tidak valid" };
    }

    try {
      const existing = await db.select().from(rombels).where(eq(rombels.id, id)).get();
      if (!existing) {
        set.status = 404;
        return { success: false, message: "Rombel tidak ditemukan" };
      }

      const siswaList = await db
        .select({
          id: students.id,
          nama: students.nama,
          nik: students.nik,
          program: students.program,
          kelas: students.kelas,
          nisn: students.nisn,
          nis: students.nis,
          tempatTglLahir: students.tempatTglLahir,
          titikLayanan: students.titikLayanan,
          jenisKelamin: students.jenisKelamin,
          noHp: students.noHp,
          agama: students.agama,
          namaAyah: students.namaAyah,
          email: students.email,
          namaIbu: students.namaIbu,
          alamat: students.alamat,
          foto: students.foto,
          status: students.status,
          createdAt: students.createdAt,
          updatedAt: students.updatedAt,
        })
        .from(students)
        .innerJoin(rombelStudents, eq(students.id, rombelStudents.studentId))
        .where(eq(rombelStudents.rombelId, id))
        .all();

      return { success: true, data: siswaList };
    } catch (err) {
      console.error("GET /api/rombels/:id/students error:", err);
      set.status = 500;
      return { success: false, message: "Gagal mengambil data siswa rombel" };
    }
  })

  // ==========================================
  // POST /api/rombels/:id/students — Tambah siswa ke rombel
  // ==========================================
  .post(
    "/api/rombels/:id/students",
    async ({ params, body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const rombelId = Number(params.id);
      if (isNaN(rombelId)) {
        set.status = 400;
        return { success: false, message: "ID rombel tidak valid" };
      }

      const { studentId, studentIds } = body as any;

      try {
        const existing = await db.select().from(rombels).where(eq(rombels.id, rombelId)).get();
        if (!existing) {
          set.status = 404;
          return { success: false, message: "Rombel tidak ditemukan" };
        }

        const rawIds: number[] = [];
        if (studentIds && Array.isArray(studentIds)) {
          rawIds.push(...studentIds.map(Number));
        } else if (studentId) {
          rawIds.push(Number(studentId));
        }
        const ids = Array.from(new Set(rawIds));

        if (ids.length === 0) {
          set.status = 400;
          return { success: false, message: "Tidak ada siswa yang dipilih" };
        }

        // Filter yang belum ada di rombel
        const existingRelasi = await db
          .select({ studentId: rombelStudents.studentId })
          .from(rombelStudents)
          .where(and(eq(rombelStudents.rombelId, rombelId), inArray(rombelStudents.studentId, ids)))
          .all();

        const existingIds = new Set(existingRelasi.map((r) => r.studentId));
        const newIds = ids.filter((id) => !existingIds.has(id));

        if (newIds.length === 0) {
          return { success: true, message: "Semua siswa sudah ada di rombel ini", added: 0 };
        }

        // Insert semua sekaligus
        await db
          .insert(rombelStudents)
          .values(newIds.map((sid) => ({ rombelId, studentId: sid })))
          .run();

        // Update kelas siswa sesuai nama rombel
        await db
          .update(students)
          .set({ kelas: existing.nama, updatedAt: new Date().toISOString() })
          .where(inArray(students.id, newIds))
          .run();

        return {
          success: true,
          message: `${newIds.length} siswa berhasil ditambahkan ke rombel "${existing.nama}"`,
          added: newIds.length,
        };
      } catch (err) {
        console.error("POST /api/rombels/:id/students error:", err);
        set.status = 500;
        return { success: false, message: "Gagal menambahkan siswa ke rombel" };
      }
    },
    {
      body: t.Object({
        studentId: t.Optional(t.Number()),
        studentIds: t.Optional(t.Array(t.Number())),
      }),
    }
  )

  // ==========================================
  // DELETE /api/rombels/:id/students/:studentId — Hapus siswa dari rombel
  // ==========================================
  .delete("/api/rombels/:id/students/:studentId", async ({ params, headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    const rombelId = Number(params.id);
    const studentId = Number(params.studentId);
    if (isNaN(rombelId) || isNaN(studentId)) {
      set.status = 400;
      return { success: false, message: "ID tidak valid" };
    }

    try {
      await db
        .delete(rombelStudents)
        .where(and(eq(rombelStudents.rombelId, rombelId), eq(rombelStudents.studentId, studentId)))
        .run();

      return { success: true, message: "Siswa berhasil dihapus dari rombel" };
    } catch (err) {
      console.error("DELETE /api/rombels/:id/students/:studentId error:", err);
      set.status = 500;
      return { success: false, message: "Gagal menghapus siswa dari rombel" };
    }
  })

  // ==========================================
  // POST /api/rombels/sync — Auto-generate rombel dari data siswa
  // ==========================================
  .post("/api/rombels/sync", async ({ headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    try {
      // Ambil semua siswa AKTIF yang punya field kelas
      const allStudents = await db
        .select({ id: students.id, kelas: students.kelas })
        .from(students)
        .where(sql`${students.kelas} != ''`)
        .all();

      if (allStudents.length === 0) {
        return { success: true, message: "Tidak ada data siswa dengan kelas", created: 0, assigned: 0 };
      }

      // Group by kelas
      const kelasGroups = new Map<string, number[]>();
      for (const s of allStudents) {
        const kelas = s.kelas.trim();
        if (!kelas) continue;
        if (!kelasGroups.has(kelas)) {
          kelasGroups.set(kelas, []);
        }
        kelasGroups.get(kelas)!.push(s.id);
      }

      // Ambil rombel yang sudah ada
      const existingRombels = await db.select().from(rombels).all();
      const existingNames = new Set(existingRombels.map((r) => r.nama));

      let created = 0;
      let assigned = 0;

      // Bulk insert rombel baru
      const newRombelNames = Array.from(kelasGroups.keys()).filter((nama) => !existingNames.has(nama));
      if (newRombelNames.length > 0) {
        await db.insert(rombels).values(newRombelNames.map((nama) => ({ nama }))).run();
        created = newRombelNames.length;
      }

      // Ambil semua rombel untuk mendapatkan ID terbaru
      const allRombels = await db.select().from(rombels).all();
      const rombelMap = new Map<string, number>(allRombels.map((r) => [r.nama, r.id]));

      // Ambil semua relasi yang sudah ada untuk menghindari duplikat
      const allExistingRelasi = await db.select().from(rombelStudents).all();
      const existingRelasiSet = new Set(allExistingRelasi.map((r) => `${r.rombelId}-${r.studentId}`));

      const relasiToInsert: { rombelId: number; studentId: number }[] = [];

      for (const [nama, studentIds] of kelasGroups) {
        const rombelId = rombelMap.get(nama);
        if (!rombelId) continue;

        for (const studentId of studentIds) {
          if (!existingRelasiSet.has(`${rombelId}-${studentId}`)) {
            relasiToInsert.push({ rombelId, studentId });
          }
        }
      }

      if (relasiToInsert.length > 0) {
        await db.insert(rombelStudents).values(relasiToInsert).run();
        assigned = relasiToInsert.length;
      }

      return {
        success: true,
        message: `Sinkron selesai: ${created} rombel baru dibuat, ${assigned} siswa di-assign`,
        created,
        assigned,
      };
    } catch (err) {
      console.error("POST /api/rombels/sync error:", err);
      set.status = 500;
      return { success: false, message: "Gagal sinkron rombel" };
    }
  });
