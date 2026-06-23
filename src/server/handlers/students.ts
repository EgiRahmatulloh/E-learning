/* eslint-disable @typescript-eslint/no-explicit-any */
import { Elysia, t } from "elysia";
import { jwt } from "@elysia/jwt";
import { db } from "../config/db";
import { students, alumni, rombels, rombelStudents } from "../models";
import { eq, and, inArray, sql } from "drizzle-orm";
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
  // Ambil semua warga belajar
  .get("/api/students", async ({ headers, jwt, set }) => {
    try {
      const list = await db.select().from(students).all();

      // Fetch rombel membership for all students in one query
      const allRombelMembers = await db
        .select({
          studentId: rombelStudents.studentId,
          rombelId: rombels.id,
          rombelNama: rombels.nama,
        })
        .from(rombelStudents)
        .innerJoin(rombels, eq(rombelStudents.rombelId, rombels.id))
        .all();

      const rombelMap = new Map<number, { id: number; nama: string }[]>();
      for (const row of allRombelMembers) {
        if (!rombelMap.has(row.studentId)) rombelMap.set(row.studentId, []);
        rombelMap.get(row.studentId)!.push({ id: row.rombelId, nama: row.rombelNama });
      }

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
        (rest as any).rombels = rombelMap.get(item.id) || [];
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

      const GRADE_NUMS_S = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
      const ROMAN_TO_NUM_S: Record<string, number> = {}; GRADE_NUMS_S.forEach((r,i) => ROMAN_TO_NUM_S[r] = i+1);
      const NUM_TO_ROMAN_S: Record<string, string> = { "1":"I","2":"II","3":"III","4":"IV","5":"V","6":"VI","7":"VII","8":"VIII","9":"IX","10":"X","11":"XI","12":"XII" };
      const MAX_BY_PROGRAM_S: Record<string, number> = { "PAKET A": 6, "PAKET B": 9, "PAKET C": 12 };

      const g = existing.kelas.toUpperCase().trim();
      let gradeNum = 0;
      const numMatchS = g.match(/KELAS\s+(\d{1,2})/);
      if (numMatchS) { gradeNum = parseInt(numMatchS[1]); }
      else {
        for (const [roman, n] of Object.entries(ROMAN_TO_NUM_S).sort((a,b) => b[0].length - a[0].length)) {
          if (g.startsWith(`KELAS ${roman}`) || g.startsWith(roman) || g.includes(`(${roman})`)) {
            gradeNum = n; break;
          }
        }
      }
      if (gradeNum <= 0 || gradeNum >= 12) {
        set.status = 400;
        return { success: false, message: "Tidak dapat menentukan kelas saat ini" };
      }
      const maxGradeS = MAX_BY_PROGRAM_S[existing.program?.toUpperCase().trim()] || 12;
      if (gradeNum >= maxGradeS) {
        set.status = 400;
        return { success: false, message: `Warga belajar sudah berada di kelas tertinggi (Kelas ${NUM_TO_ROMAN_S[String(gradeNum)]})` };
      }

      const nextRoman = NUM_TO_ROMAN_S[String(gradeNum + 1)];
      const nextGrade = `KELAS ${nextRoman}`;

      const updated = await db
        .update(students)
        .set({ kelas: nextGrade, updatedAt: new Date().toISOString() })
        .where(eq(students.id, id))
        .returning()
        .get();

      // Move student to new rombel: preserve section letter (e.g. XB → XIB)
      const allRombelsList = await db.select().from(rombels).all();
      const currentRel = await db
        .select({ rombelId: rombelStudents.rombelId })
        .from(rombelStudents)
        .where(eq(rombelStudents.studentId, id))
        .get();
      const currentRombelObj = currentRel ? allRombelsList.find(r => r.id === currentRel.rombelId) : null;
      const currentRombelName = currentRombelObj?.nama.toUpperCase() || "";
      const sectionLetter = currentRombelName.length > 0 ? currentRombelName.slice(-1) : "";
      const targetRombelName = `${nextRoman}${sectionLetter}`;

      // Find or create target rombel
      let targetRombel = allRombelsList.find(r => r.nama.toUpperCase() === targetRombelName);
      if (!targetRombel) {
        targetRombel = await db.insert(rombels)
          .values({ nama: targetRombelName })
          .returning()
          .get();
      }

      if (currentRel) {
        await db.delete(rombelStudents)
          .where(and(eq(rombelStudents.studentId, id), eq(rombelStudents.rombelId, currentRel.rombelId)))
          .run();
        // Delete old rombel if empty
        const count = await db
          .select({ cnt: sql<number>`count(*)` })
          .from(rombelStudents)
          .where(eq(rombelStudents.rombelId, currentRel.rombelId))
          .get();
        if (count && count.cnt === 0) {
          await db.delete(rombels).where(eq(rombels.id, currentRel.rombelId)).run();
        }
      }
      try {
        await db.insert(rombelStudents)
          .values({ rombelId: targetRombel.id, studentId: id })
          .run();
      } catch { /* already in rombel */ }

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

        // Hapus dari rombel + hapus rombel kosong
        const relasi = await db
          .select({ rombelId: rombelStudents.rombelId })
          .from(rombelStudents)
          .where(eq(rombelStudents.studentId, id))
          .all();

        for (const rel of relasi) {
          await db.delete(rombelStudents)
            .where(and(eq(rombelStudents.studentId, id), eq(rombelStudents.rombelId, rel.rombelId)))
            .run();

          const cnt = await db
            .select({ cnt: sql<number>`count(*)` })
            .from(rombelStudents)
            .where(eq(rombelStudents.rombelId, rel.rombelId))
            .get();
          if (cnt && Number(cnt.cnt) === 0) {
            await db.delete(rombels).where(eq(rombels.id, rel.rombelId)).run();
          }
        }
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

        // Move to new rombel based on new kelas
        const kelasUpper = kelas?.toUpperCase()?.trim() || "";
        if (kelasUpper) {
          // Remove from current rombel
          const currentRel = await db
            .select({ rombelId: rombelStudents.rombelId })
            .from(rombelStudents)
            .where(eq(rombelStudents.studentId, id))
            .get();
          if (currentRel) {
            await db.delete(rombelStudents)
              .where(and(eq(rombelStudents.studentId, id), eq(rombelStudents.rombelId, currentRel.rombelId)))
              .run();
            // Delete old rombel if empty
            const count = await db
              .select({ cnt: sql<number>`count(*)` })
              .from(rombelStudents)
              .where(eq(rombelStudents.rombelId, currentRel.rombelId))
              .get();
            if (count && count.cnt === 0) {
              await db.delete(rombels).where(eq(rombels.id, currentRel.rombelId)).run();
            }
          }
          // Find or create target rombel
          let targetRombel = await db.select().from(rombels).where(eq(rombels.nama, kelasUpper)).get();
          if (!targetRombel) {
            targetRombel = await db.insert(rombels).values({ nama: kelasUpper }).returning().get();
          }
          try {
            await db.insert(rombelStudents).values({ rombelId: targetRombel.id, studentId: id }).run();
          } catch { /* already assigned */ }
        }

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
  )
  // Bulk naikkan kelas
  .post(
    "/api/students/bulk/promote",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const { studentIds } = body as any;
      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        set.status = 400;
        return { success: false, message: "studentIds harus berupa array dan tidak boleh kosong" };
      }

      try {
        const existing = await db.select().from(students).where(inArray(students.id, studentIds)).all();
        let promoted = 0;
        let skipped = 0;

        const GRADE_NUMS = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
        const NUM_TO_ROMAN: Record<string, string> = { "1":"I","2":"II","3":"III","4":"IV","5":"V","6":"VI","7":"VII","8":"VIII","9":"IX","10":"X","11":"XI","12":"XII" };
        const ROMAN_TO_NUM: Record<string, number> = {}; GRADE_NUMS.forEach((r,i) => ROMAN_TO_NUM[r] = i+1);
        const MAX_BY_PROGRAM: Record<string, number> = { "PAKET A": 6, "PAKET B": 9, "PAKET C": 12 };

        // Pre-fetch all rombels and current rombel assignments for affected students
        const targetStudentIds = existing.map(s => s.id);
        const allRombels = await db.select().from(rombels).all();
        const currentRelations = await db
          .select({ studentId: rombelStudents.studentId, rombelId: rombelStudents.rombelId })
          .from(rombelStudents)
          .where(inArray(rombelStudents.studentId, targetStudentIds))
          .all();
        const currentRombelMap = new Map<number, number>();
        currentRelations.forEach(r => currentRombelMap.set(r.studentId, r.rombelId));

        // Track old rombels that may become empty after moving students
        const emptiedRombelIds = new Set<number>();

        db.transaction((tx) => {
          for (const s of existing) {
            const g = s.kelas.toUpperCase().trim();
            let gradeNum = 0;
            const numMatch = g.match(/KELAS\s+(\d{1,2})/);
            if (numMatch) { gradeNum = parseInt(numMatch[1]); }
            else {
              for (const [roman, n] of Object.entries(ROMAN_TO_NUM).sort((a,b) => b[0].length - a[0].length)) {
                if (g.startsWith(`KELAS ${roman}`) || g.startsWith(roman) || g.includes(`(${roman})`)) {
                  gradeNum = n; break;
                }
              }
            }
            if (gradeNum <= 0 || gradeNum >= 12) { skipped++; continue; }
            const maxGrade = MAX_BY_PROGRAM[s.program?.toUpperCase().trim()] || 12;
            if (gradeNum >= maxGrade) { skipped++; continue; }
            const nextRoman = NUM_TO_ROMAN[String(gradeNum + 1)];
            const newKelas = `KELAS ${nextRoman}`;

            // Update kelas field
            tx.update(students)
              .set({ kelas: newKelas, updatedAt: new Date().toISOString() })
              .where(eq(students.id, s.id))
              .run();

            // Move student to new rombel: preserve section letter (e.g. XB → XIB)
            const currentRombelObj = allRombels.find(r => currentRombelMap.get(s.id) === r.id);
            const currentRombelName = currentRombelObj?.nama.toUpperCase() || "";
            // Section is always the last character (A, B, C, etc.)
            const sectionLetter = currentRombelName.length > 0 ? currentRombelName.slice(-1) : "";
            const targetRombelName = `${nextRoman}${sectionLetter}`;

            // Find or create target rombel
            let targetRombel = allRombels.find(r => r.nama.toUpperCase() === targetRombelName);
            if (!targetRombel) {
              // Create new rombel
              const newRombel = tx.insert(rombels)
                .values({ nama: targetRombelName })
                .returning()
                .get();
              allRombels.push(newRombel);
              targetRombel = newRombel;
            }

            const currentRombelId = currentRombelMap.get(s.id);
            // Remove from current rombel
            if (currentRombelId) {
              tx.delete(rombelStudents)
                .where(and(eq(rombelStudents.studentId, s.id), eq(rombelStudents.rombelId, currentRombelId)))
                .run();
              emptiedRombelIds.add(currentRombelId);
            }
            // Add to target rombel (ignore duplicate)
            try {
              tx.insert(rombelStudents)
                .values({ rombelId: targetRombel.id, studentId: s.id })
                .run();
            } catch { /* already in rombel, skip */ }

            promoted++;
          }
        });

        // After transaction: delete old rombels that have 0 students left
        for (const rid of emptiedRombelIds) {
          const count = await db
            .select({ cnt: sql<number>`count(*)` })
            .from(rombelStudents)
            .where(eq(rombelStudents.rombelId, rid))
            .get();
          if (count && count.cnt === 0) {
            await db.delete(rombels).where(eq(rombels.id, rid)).run();
          }
        }

        return { success: true, promoted, skipped };
      } catch {
        set.status = 500;
        return { success: false, message: "Gagal menaikkan kelas secara bulk" };
      }
    },
    {
      body: t.Object({
        studentIds: t.Array(t.Numeric()),
      }),
    }
  )
  // Bulk luluskan
  .post(
    "/api/students/bulk/graduate",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const { studentIds } = body as any;
      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        set.status = 400;
        return { success: false, message: "studentIds harus berupa array dan tidak boleh kosong" };
      }

      try {
        const existing = await db.select().from(students).where(inArray(students.id, studentIds)).all();
        let graduated = 0;
        const year = new Date().getFullYear().toString();

        // Collect rombel IDs affected by graduation
        const affectedRombelIds = new Set<number>();

        db.transaction((tx) => {
          for (const s of existing) {
            tx.update(students)
              .set({ status: "LULUS", updatedAt: new Date().toISOString() })
              .where(eq(students.id, s.id))
              .run();
            tx.insert(alumni).values({
              nama: s.nama,
              nik: s.nik,
              program: s.program,
              tahunLulus: year,
              nisn: s.nisn,
              nis: s.nis,
              tempatTglLahir: s.tempatTglLahir,
              noHp: s.noHp,
              namaAyah: s.namaAyah,
              namaIbu: s.namaIbu,
              jenisKelamin: s.jenisKelamin,
              agama: s.agama,
              email: s.email,
              alamat: s.alamat,
              cerita: `Lulusan program ${s.program}`,
              foto: s.foto,
            }).run();

            // Hapus dari rombel
            const relasi = tx
              .select({ rombelId: rombelStudents.rombelId })
              .from(rombelStudents)
              .where(eq(rombelStudents.studentId, s.id))
              .all();
            for (const rel of relasi) {
              affectedRombelIds.add(rel.rombelId);
              tx.delete(rombelStudents)
                .where(and(eq(rombelStudents.studentId, s.id), eq(rombelStudents.rombelId, rel.rombelId)))
                .run();
            }

            graduated++;
          }
        });

        // Hapus rombel yang kosong setelah luluskan
        for (const rombelId of affectedRombelIds) {
          const cnt = await db
            .select({ cnt: sql<number>`count(*)` })
            .from(rombelStudents)
            .where(eq(rombelStudents.rombelId, rombelId))
            .get();
          if (cnt && Number(cnt.cnt) === 0) {
            await db.delete(rombels).where(eq(rombels.id, rombelId)).run();
          }
        }

        return { success: true, graduated };
      } catch {
        set.status = 500;
        return { success: false, message: "Gagal meluluskan secara bulk" };
      }
    },
    {
      body: t.Object({
        studentIds: t.Array(t.Numeric()),
      }),
    }
  )
  // Bulk melanjutkan program
  .post(
    "/api/students/bulk/continue",
    async ({ body, headers, jwt, set }) => {
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      const { studentIds, program, kelas } = body as any;
      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        set.status = 400;
        return { success: false, message: "studentIds harus berupa array dan tidak boleh kosong" };
      }

      try {
        const now = new Date().toISOString();
        let continued = 0;

        // Pre-fetch rombel data
        const allRombels = await db.select().from(rombels).all();
        const currentRelations = await db
          .select({ studentId: rombelStudents.studentId, rombelId: rombelStudents.rombelId })
          .from(rombelStudents)
          .where(inArray(rombelStudents.studentId, studentIds))
          .all();
        const currentRombelMap = new Map<number, number>();
        currentRelations.forEach(r => currentRombelMap.set(r.studentId, r.rombelId));
        const emptiedRombelIds = new Set<number>();

        const kelasUpper = kelas?.toUpperCase()?.trim() || "";

        db.transaction((tx) => {
          for (const id of studentIds) {
            tx.update(students)
              .set({ program, kelas, status: "AKTIF", updatedAt: now })
              .where(eq(students.id, id))
              .run();

            // Move to new rombel based on new kelas
            if (kelasUpper) {
              let targetRombel = allRombels.find(r => r.nama.toUpperCase() === kelasUpper);
              if (!targetRombel) {
                targetRombel = tx.insert(rombels)
                  .values({ nama: kelasUpper })
                  .returning()
                  .get();
                allRombels.push(targetRombel);
              }
              const currentRombelId = currentRombelMap.get(id);
              if (currentRombelId) {
                tx.delete(rombelStudents)
                  .where(and(eq(rombelStudents.studentId, id), eq(rombelStudents.rombelId, currentRombelId)))
                  .run();
                emptiedRombelIds.add(currentRombelId);
              }
              try {
                tx.insert(rombelStudents)
                  .values({ rombelId: targetRombel.id, studentId: id })
                  .run();
              } catch { /* already assigned */ }
            }

            continued++;
          }
        });

        // Delete empty old rombels
        for (const rid of emptiedRombelIds) {
          const count = await db
            .select({ cnt: sql<number>`count(*)` })
            .from(rombelStudents)
            .where(eq(rombelStudents.rombelId, rid))
            .get();
          if (count && count.cnt === 0) {
            await db.delete(rombels).where(eq(rombels.id, rid)).run();
          }
        }

        return { success: true, continued };
      } catch {
        set.status = 500;
        return { success: false, message: "Gagal memproses kelanjutan program secara bulk" };
      }
    },
    {
      body: t.Object({
        studentIds: t.Array(t.Numeric()),
        program: t.String(),
        kelas: t.String(),
      }),
    }
  );
