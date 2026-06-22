/* eslint-disable @typescript-eslint/no-explicit-any */
import { Elysia, t } from "elysia";
import { jwt } from "@elysia/jwt";
import { db } from "../config/db";
import { students, alumni } from "../models";
import { eq } from "drizzle-orm";
import { verifyAdmin } from "../middleware/auth";
import { finalJwtSecret } from "../config/jwt";

export const studentsHandlers = new Elysia()
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
  // Ambil semua rombel unik berdasarkan program dan kelas warga belajar
  .get("/api/rombels", async ({ set }) => {
    try {
      const list = await db.select().from(students).all();
      const uniqueRombels = Array.from(
        new Set(
          list
            .filter((s) => s.program && s.kelas)
            .map((s) => {
              let prog = s.program.trim();
              let kls = s.kelas.trim();
              
              // Standardize kelas formatting to match dummy (e.g. Paket C - Kelas 10)
              const klsUpper = kls.toUpperCase();
              if (klsUpper.includes("KELAS X ") || klsUpper === "KELAS X" || klsUpper.includes("(SEPULUH)")) kls = "Kelas 10";
              else if (klsUpper.includes("KELAS XI ") || klsUpper === "KELAS XI" || klsUpper.includes("(SEBELAS)")) kls = "Kelas 11";
              else if (klsUpper.includes("KELAS XII ") || klsUpper === "KELAS XII" || klsUpper.includes("(DUABELAS)")) kls = "Kelas 12";
              else if (klsUpper.includes("KELAS VII ") || klsUpper === "KELAS VII" || klsUpper.includes("(TUJUH)")) kls = "Kelas 7";
              else if (klsUpper.includes("KELAS VIII ") || klsUpper === "KELAS VIII" || klsUpper.includes("(DELAPAN)")) kls = "Kelas 8";
              else if (klsUpper.includes("KELAS IX ") || klsUpper === "KELAS IX" || klsUpper.includes("(SEMBILAN)")) kls = "Kelas 9";
              else if (klsUpper.includes("KELAS IV ") || klsUpper === "KELAS IV" || klsUpper.includes("(EMPAT)")) kls = "Kelas 4";
              else if (klsUpper.includes("KELAS V ") || klsUpper === "KELAS V" || klsUpper.includes("(LIMA)")) kls = "Kelas 5";
              else if (klsUpper.includes("KELAS VI ") || klsUpper === "KELAS VI" || klsUpper.includes("(ENAM)")) kls = "Kelas 6";
              else if (klsUpper.includes("KELAS I ") || klsUpper === "KELAS I" || klsUpper.includes("(SATU)")) kls = "Kelas 1";
              else if (klsUpper.includes("KELAS II ") || klsUpper === "KELAS II" || klsUpper.includes("(DUA)")) kls = "Kelas 2";
              else if (klsUpper.includes("KELAS III ") || klsUpper === "KELAS III" || klsUpper.includes("(TIGA)")) kls = "Kelas 3";
              
              // Standardize program formatting (e.g. PAKET C -> Paket C)
              if (prog.toUpperCase().startsWith("PAKET ")) {
                prog = "Paket " + prog.substring(6).toUpperCase();
              }
              
              return `${prog} - ${kls}`;
            })
            .filter(Boolean)
        )
      ).sort();
      return { success: true, data: uniqueRombels };
    } catch {
      set.status = 500;
      return { success: false, message: "Gagal mengambil data rombel" };
    }
  })
  // Ambil semua warga belajar
  .get("/api/students", async ({ headers, jwt, set }) => {
    try {
      const list = await db.select().from(students).all();

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
          delete (rest as any).noHp;
        }
        return rest;
      });
      return { success: true, data: sanitized };
    } catch {
      set.status = 500;
      return { success: false, message: "Gagal mengambil data warga belajar" };
    }
  })
  // Tambah warga belajar baru
  .post(
    "/api/students",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const {
        nama,
        nik,
        program,
        kelas,
        nisn,
        nis,
        tempatTglLahir,
        titikLayanan,
        jenisKelamin,
        noHp,
        agama,
        namaAyah,
        email,
        namaIbu,
        alamat,
        password,
        foto,
        status,
      } = body as any;

      try {
        const hashedPassword = await Bun.password.hash(password || "password123");
        const inserted = await db
          .insert(students)
          .values({
            nama,
            nik: nik || "",
            program: program || "",
            kelas: kelas || "",
            nisn: nisn || "",
            nis: nis || "",
            tempatTglLahir: tempatTglLahir || "",
            titikLayanan: titikLayanan || "",
            jenisKelamin: jenisKelamin || "",
            noHp: noHp || "",
            agama: agama || "",
            namaAyah: namaAyah || "",
            email: email || "",
            namaIbu: namaIbu || "",
            alamat: alamat || "",
            password: hashedPassword,
            foto: foto || "",
            status: status || "AKTIF",
          })
          .returning()
          .get();

        const safeData = { ...inserted };
        delete (safeData as any).password;
        return { success: true, data: safeData };
      } catch {
        set.status = 500;
        return { success: false, message: "Gagal menambahkan data warga belajar" };
      }
    },
    {
      body: t.Object({
        nama: t.String({ minLength: 1 }),
        nik: t.Optional(t.String()),
        program: t.Optional(t.String()),
        kelas: t.Optional(t.String()),
        nisn: t.Optional(t.String()),
        nis: t.Optional(t.String()),
        tempatTglLahir: t.Optional(t.String()),
        titikLayanan: t.Optional(t.String()),
        jenisKelamin: t.Optional(t.String()),
        noHp: t.Optional(t.String()),
        agama: t.Optional(t.String()),
        namaAyah: t.Optional(t.String()),
        email: t.Optional(t.String()),
        namaIbu: t.Optional(t.String()),
        alamat: t.Optional(t.String()),
        password: t.Optional(t.String()),
        foto: t.Optional(t.String()),
        status: t.Optional(t.String()),
      }),
    }
  )
  // Update warga belajar
  .put(
    "/api/students/:id",
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
        nik,
        program,
        kelas,
        nisn,
        nis,
        tempatTglLahir,
        titikLayanan,
        jenisKelamin,
        noHp,
        agama,
        namaAyah,
        email,
        namaIbu,
        alamat,
        password,
        foto,
        status,
      } = body as any;

      try {
        const existing = await db.select().from(students).where(eq(students.id, id)).get();
        if (!existing) {
          set.status = 404;
          return { success: false, message: "Data warga belajar tidak ditemukan" };
        }

        let finalPassword = existing.password;
        if (password) {
          finalPassword = await Bun.password.hash(password);
        }

        const updated = await db
          .update(students)
          .set({
            nama,
            nik: nik ?? existing.nik,
            program: program ?? existing.program,
            kelas: kelas ?? existing.kelas,
            nisn: nisn ?? existing.nisn,
            nis: nis ?? existing.nis,
            tempatTglLahir: tempatTglLahir ?? existing.tempatTglLahir,
            titikLayanan: titikLayanan ?? existing.titikLayanan,
            jenisKelamin: jenisKelamin ?? existing.jenisKelamin,
            noHp: noHp ?? existing.noHp,
            agama: agama ?? existing.agama,
            namaAyah: namaAyah ?? existing.namaAyah,
            email: email ?? existing.email,
            namaIbu: namaIbu ?? existing.namaIbu,
            alamat: alamat ?? existing.alamat,
            password: finalPassword,
            foto: foto ?? existing.foto,
            status: status ?? existing.status,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(students.id, id))
          .returning()
          .get();

        const safeData = { ...updated };
        delete (safeData as any).password;
        return { success: true, data: safeData };
      } catch {
        set.status = 500;
        return { success: false, message: "Gagal memperbarui data warga belajar" };
      }
    },
    {
      body: t.Object({
        nama: t.String({ minLength: 1 }),
        nik: t.Optional(t.String()),
        program: t.Optional(t.String()),
        kelas: t.Optional(t.String()),
        nisn: t.Optional(t.String()),
        nis: t.Optional(t.String()),
        tempatTglLahir: t.Optional(t.String()),
        titikLayanan: t.Optional(t.String()),
        jenisKelamin: t.Optional(t.String()),
        noHp: t.Optional(t.String()),
        agama: t.Optional(t.String()),
        namaAyah: t.Optional(t.String()),
        email: t.Optional(t.String()),
        namaIbu: t.Optional(t.String()),
        alamat: t.Optional(t.String()),
        password: t.Optional(t.String()),
        foto: t.Optional(t.String()),
        status: t.Optional(t.String()),
      }),
    }
  )
  // Naikkan kelas warga belajar
  .post("/api/students/:id/promote", async ({ params, headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    const id = Number(params.id);
    if (isNaN(id)) {
      set.status = 400;
      return { success: false, message: "ID parameter tidak valid" };
    }

    try {
      const existing = await db.select().from(students).where(eq(students.id, id)).get();
      if (!existing) {
        set.status = 404;
        return { success: false, message: "Data warga belajar tidak ditemukan" };
      }

      const currentGrade = existing.kelas.toUpperCase();
      let nextGrade = currentGrade;
      if (currentGrade.includes("DUABELAS")) {
        set.status = 400;
        return {
          success: false,
          message: "Warga belajar sudah berada di kelas tertinggi (Kelas XII)",
        };
      } else if (currentGrade.includes("SEBELAS")) {
        nextGrade = "KELAS XII (DUABELAS)";
      } else if (currentGrade.includes("SEPULUH")) {
        nextGrade = "KELAS XI (SEBELAS)";
      } else if (currentGrade.includes("SEMBILAN")) {
        set.status = 400;
        return {
          success: false,
          message: "Warga belajar sudah berada di kelas tertinggi untuk Paket B (Kelas IX)",
        };
      } else if (currentGrade.includes("DELAPAN")) {
        nextGrade = "KELAS IX (SEMBILAN)";
      } else if (currentGrade.includes("TUJUH")) {
        nextGrade = "KELAS VIII (DELAPAN)";
      } else if (currentGrade.includes("ENAM")) {
        set.status = 400;
        return {
          success: false,
          message: "Warga belajar sudah berada di kelas tertinggi untuk Paket A (Kelas VI)",
        };
      } else if (currentGrade.includes("LIMA")) {
        nextGrade = "KELAS VI (ENAM)";
      } else if (currentGrade.includes("EMPAT")) {
        nextGrade = "KELAS V (LIMA)";
      } else if (currentGrade.includes("TIGA")) {
        nextGrade = "KELAS IV (EMPAT)";
      } else if (currentGrade.includes("DUA")) {
        nextGrade = "KELAS III (TIGA)";
      } else if (currentGrade.includes("SATU")) {
        nextGrade = "KELAS II (DUA)";
      }

      const updated = await db
        .update(students)
        .set({ kelas: nextGrade, updatedAt: new Date().toISOString() })
        .where(eq(students.id, id))
        .returning()
        .get();

      return { success: true, data: updated };
    } catch {
      set.status = 500;
      return { success: false, message: "Gagal menaikkan kelas" };
    }
  })
  // Luluskan warga belajar (Otomatis status LULUS & Masuk Alumni)
  .post("/api/students/:id/graduate", async ({ params, headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    const id = Number(params.id);
    if (isNaN(id)) {
      set.status = 400;
      return { success: false, message: "ID parameter tidak valid" };
    }

    try {
      const updated = await db
        .update(students)
        .set({ status: "LULUS", updatedAt: new Date().toISOString() })
        .where(eq(students.id, id))
        .returning()
        .get();

      if (updated) {
        // Masukkan ke tabel alumni
        await db.insert(alumni).values({
          nama: updated.nama,
          nik: updated.nik,
          program: updated.program,
          tahunLulus: new Date().getFullYear().toString(),
          nisn: updated.nisn,
          nis: updated.nis,
          tempatTglLahir: updated.tempatTglLahir,
          noHp: updated.noHp,
          namaAyah: updated.namaAyah,
          namaIbu: updated.namaIbu,
          jenisKelamin: updated.jenisKelamin,
          agama: updated.agama,
          email: updated.email,
          alamat: updated.alamat,
          cerita: `Lulusan program ${updated.program}`,
          foto: updated.foto,
        });
      }

      return { success: true, data: updated };
    } catch {
      set.status = 500;
      return { success: false, message: "Gagal meluluskan warga belajar" };
    }
  })
  // Melanjutkan program (Ubah program Paket A/B/C dan reset kelas)
  .post(
    "/api/students/:id/continue",
    async ({ params, body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const id = Number(params.id);
      if (isNaN(id)) {
        set.status = 400;
        return { success: false, message: "ID parameter tidak valid" };
      }

      const { program, kelas } = body as any;
      try {
        const updated = await db
          .update(students)
          .set({
            program,
            kelas,
            status: "AKTIF",
            updatedAt: new Date().toISOString(),
          })
          .where(eq(students.id, id))
          .returning()
          .get();
        return { success: true, data: updated };
      } catch {
        set.status = 500;
        return { success: false, message: "Gagal memproses kelanjutan program" };
      }
    },
    {
      body: t.Object({
        program: t.String(),
        kelas: t.String(),
      }),
    }
  )
  // Hapus warga belajar
  .delete("/api/students/:id", async ({ params, headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    const id = Number(params.id);
    if (isNaN(id)) {
      set.status = 400;
      return { success: false, message: "ID parameter tidak valid" };
    }

    try {
      await db.delete(students).where(eq(students.id, id)).run();
      return { success: true, message: "Warga belajar berhasil dihapus" };
    } catch {
      set.status = 500;
      return { success: false, message: "Gagal menghapus warga belajar" };
    }
  })
  // Import data warga belajar via CSV (bulk)
  .post(
    "/api/students/import",
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
          program: typeof item.program === "string" ? item.program : "",
          kelas: typeof item.kelas === "string" ? item.kelas : "",
          nisn: typeof item.nisn === "string" ? item.nisn : "",
          nis: typeof item.nis === "string" ? item.nis : "",
          tempatTglLahir: typeof item.tempatTglLahir === "string" ? item.tempatTglLahir : "",
          titikLayanan: typeof item.titikLayanan === "string" ? item.titikLayanan : "",
          jenisKelamin: typeof item.jenisKelamin === "string" ? item.jenisKelamin : "",
          noHp: typeof item.noHp === "string" ? item.noHp : "",
          agama: typeof item.agama === "string" ? item.agama : "",
          namaAyah: typeof item.namaAyah === "string" ? item.namaAyah : "",
          email: typeof item.email === "string" ? item.email : "",
          namaIbu: typeof item.namaIbu === "string" ? item.namaIbu : "",
          alamat: typeof item.alamat === "string" ? item.alamat : "",
          password: defaultPassword,
          foto: typeof item.foto === "string" ? item.foto : "",
          status: typeof item.status === "string" ? item.status : "AKTIF",
        }));

        const chunkSize = 100;
        db.transaction((tx) => {
          for (let i = 0; i < insertValues.length; i += chunkSize) {
            const chunk = insertValues.slice(i, i + chunkSize);
            tx.insert(students).values(chunk).run();
          }
        });
        return {
          success: true,
          message: `Berhasil mengimpor ${insertValues.length} data warga belajar`,
        };
      } catch (err) {
        console.error("Gagal mengimpor data warga belajar:", err);
        set.status = 500;
        return { success: false, message: "Gagal mengimpor data warga belajar" };
      }
    },
    {
      body: t.Array(
        t.Object({
          nama: t.String({ minLength: 1 }),
          nik: t.Optional(t.String()),
          program: t.Optional(t.String()),
          kelas: t.Optional(t.String()),
          nisn: t.Optional(t.String()),
          nis: t.Optional(t.String()),
          tempatTglLahir: t.Optional(t.String()),
          titikLayanan: t.Optional(t.String()),
          jenisKelamin: t.Optional(t.String()),
          noHp: t.Optional(t.String()),
          agama: t.Optional(t.String()),
          namaAyah: t.Optional(t.String()),
          email: t.Optional(t.String()),
          namaIbu: t.Optional(t.String()),
          alamat: t.Optional(t.String()),
          foto: t.Optional(t.String()),
          status: t.Optional(t.String()),
        })
      ),
    }
  );
