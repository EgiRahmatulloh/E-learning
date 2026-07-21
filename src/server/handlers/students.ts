/* eslint-disable @typescript-eslint/no-explicit-any */
import { Elysia, t } from "elysia";
import { jwt } from "@elysia/jwt";
import { db } from "../config/db";
import { students, alumni, rombels, rombelStudents } from "../models";
import { eq, and, inArray, sql } from "drizzle-orm";
import { verifyAdmin, verifyUser } from "../middleware/auth";
import { finalJwtSecret } from "../config/jwt";

// Ekstrak huruf section dari nama rombel (mis. "XB" → "B", "XIB" → "B", "10A" → "A").
// Hanya cocok untuk pola roman/angka + 1 huruf section; nama lain ("KELAS X") tidak punya section.
const extractSectionLetter = (rombelName: string): string => {
  const m = rombelName.match(/^(?:[IVX]+([A-HJ-UWYZ])|\d{1,2}([A-Z]))$/);
  return m ? (m[1] || m[2]) : "";
};

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
  // Ambil data warga belajar untuk publik (landing page) — tanpa auth.
  // Whitelist eksplisit: hanya field non-sensitif. NISN, NIS, nama ortu,
  // email, nik, noHp TIDAK pernah dikirim ke publik.
  .get("/api/public-students", async ({ set }) => {
    try {
      const list = await db
        .select({
          id: students.id,
          nama: students.nama,
          program: students.program,
          kelas: students.kelas,
          tempatTglLahir: students.tempatTglLahir,
          jenisKelamin: students.jenisKelamin,
          agama: students.agama,
          titikLayanan: students.titikLayanan,
          alamat: students.alamat,
          status: students.status,
          foto: students.foto,
        })
        .from(students)
        .all();

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

      const data = list.map((item) => ({
        ...item,
        rombels: rombelMap.get(item.id) || [],
      }));
      return { success: true, data };
    } catch {
      set.status = 500;
      return { success: false, message: "Gagal mengambil data warga belajar" };
    }
  })
  // Ambil semua warga belajar
  .get("/api/students", async ({ headers, jwt, set }) => {
    const authError = await verifyUser(headers, jwt, set);
    if (authError) return authError;

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
          delete (rest as any).nisn;
          delete (rest as any).tempatTglLahir;
          delete (rest as any).agama;
          delete (rest as any).namaAyah;
          delete (rest as any).namaIbu;
          delete (rest as any).alamat;
          delete (rest as any).rt;
          delete (rest as any).rw;
          delete (rest as any).desa;
          delete (rest as any).kecamatan;
          delete (rest as any).kabupaten;
          delete (rest as any).provinsi;
          delete (rest as any).sekolahAsal;
          delete (rest as any).email;
          delete (rest as any).berkas;
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
        rt,
        rw,
        desa,
        kecamatan,
        kabupaten,
        provinsi,
        sekolahAsal,
        password,
        foto,
        status,
        berkas,
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
            rt: (rt as string) || "",
            rw: (rw as string) || "",
            desa: (desa as string) || "",
            kecamatan: (kecamatan as string) || "",
            kabupaten: (kabupaten as string) || "",
            provinsi: (provinsi as string) || "",
            sekolahAsal: (sekolahAsal as string) || "",
            password: hashedPassword,
            foto: foto || "",
            status: status || "AKTIF",
            berkas: berkas || {},
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
        rt: t.Optional(t.String()),
        rw: t.Optional(t.String()),
        desa: t.Optional(t.String()),
        kecamatan: t.Optional(t.String()),
        kabupaten: t.Optional(t.String()),
        provinsi: t.Optional(t.String()),
        sekolahAsal: t.Optional(t.String()),
        password: t.Optional(t.String()),
        foto: t.Optional(t.String()),
        status: t.Optional(t.String()),
        berkas: t.Optional(t.Record(t.String(), t.String())),
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
        rt,
        rw,
        desa,
        kecamatan,
        kabupaten,
        provinsi,
        sekolahAsal,
        password,
        foto,
        status,
        berkas,
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
            rt: (rt as string) ?? existing.rt,
            rw: (rw as string) ?? existing.rw,
            desa: (desa as string) ?? existing.desa,
            kecamatan: (kecamatan as string) ?? existing.kecamatan,
            kabupaten: (kabupaten as string) ?? existing.kabupaten,
            provinsi: (provinsi as string) ?? existing.provinsi,
            sekolahAsal: (sekolahAsal as string) ?? existing.sekolahAsal,
            password: finalPassword,
            foto: foto ?? existing.foto,
            status: status ?? existing.status,
            berkas: berkas ?? existing.berkas,
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
        rt: t.Optional(t.String()),
        rw: t.Optional(t.String()),
        desa: t.Optional(t.String()),
        kecamatan: t.Optional(t.String()),
        kabupaten: t.Optional(t.String()),
        provinsi: t.Optional(t.String()),
        sekolahAsal: t.Optional(t.String()),
        password: t.Optional(t.String()),
        foto: t.Optional(t.String()),
        status: t.Optional(t.String()),
        berkas: t.Optional(t.Record(t.String(), t.String())),
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
      if (gradeNum <= 0 || gradeNum > 12) {
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

      // Pre-fetch data rombel untuk dipakai di dalam transaksi
      const allRombelsList = await db.select().from(rombels).all();
      const currentRels = await db
        .select({ rombelId: rombelStudents.rombelId })
        .from(rombelStudents)
        .where(eq(rombelStudents.studentId, id))
        .all();
      const currentRombelObj = currentRels.length > 0 ? allRombelsList.find(r => r.id === currentRels[0].rombelId) : null;
      const currentRombelName = currentRombelObj?.nama.toUpperCase() || "";
      const sectionLetter = extractSectionLetter(currentRombelName);
      const targetRombelName = `${nextRoman}${sectionLetter}`;

      let updated: typeof existing | undefined;

      // Update kelas + pindah rombel dalam satu transaksi
      db.transaction((tx) => {
        updated = tx
          .update(students)
          .set({ kelas: nextGrade, updatedAt: new Date().toISOString() })
          .where(eq(students.id, id))
          .returning()
          .get();

        // Find or create target rombel
        let targetRombel = allRombelsList.find(r => r.nama.toUpperCase() === targetRombelName);
        if (!targetRombel) {
          targetRombel = tx.insert(rombels)
            .values({ nama: targetRombelName })
            .returning()
            .get();
        }

        if (currentRels.length > 0) {
          const currentRombelIds = currentRels.map(r => r.rombelId);
          tx.delete(rombelStudents)
            .where(and(eq(rombelStudents.studentId, id), inArray(rombelStudents.rombelId, currentRombelIds)))
            .run();
        }
        try {
          tx.insert(rombelStudents)
            .values({ rombelId: targetRombel.id, studentId: id })
            .run();
        } catch { /* already in rombel */ }
      });

      // Hapus rombel lama jika kosong (di luar transaksi, best-effort)
      if (currentRels.length > 0) {
        for (const rel of currentRels) {
          const count = await db
            .select({ cnt: sql<number>`count(*)` })
            .from(rombelStudents)
            .where(eq(rombelStudents.rombelId, rel.rombelId))
            .get();
          if (count && Number(count.cnt) === 0) {
            await db.delete(rombels).where(eq(rombels.id, rel.rombelId)).run();
          }
        }
      }

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
      const existing = await db.select().from(students).where(eq(students.id, id)).get();
      if (!existing) {
        set.status = 404;
        return { success: false, message: "Data warga belajar tidak ditemukan" };
      }
      if (existing.status === "LULUS") {
        set.status = 400;
        return { success: false, message: "Warga belajar sudah berstatus LULUS" };
      }

      const relasi = await db
        .select({ rombelId: rombelStudents.rombelId })
        .from(rombelStudents)
        .where(eq(rombelStudents.studentId, id))
        .all();

      let updated: typeof existing | undefined;
      const affectedRombelIds = relasi.map((rel) => rel.rombelId);

      // Update status, insert alumni, dan lepas rombel dalam satu transaksi
      db.transaction((tx) => {
        updated = tx
          .update(students)
          .set({ status: "LULUS", kelas: "", updatedAt: new Date().toISOString() })
          .where(eq(students.id, id))
          .returning()
          .get();

        if (!updated) return;

        // Masukkan ke tabel alumni
        tx.insert(alumni).values({
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
          rt: updated.rt,
          rw: updated.rw,
          desa: updated.desa,
          kecamatan: updated.kecamatan,
          kabupaten: updated.kabupaten,
          provinsi: updated.provinsi,
          cerita: `Lulusan program ${updated.program}`,
          foto: updated.foto,
        }).run();

        // Hapus dari rombel
        for (const rombelId of affectedRombelIds) {
          tx.delete(rombelStudents)
            .where(and(eq(rombelStudents.studentId, id), eq(rombelStudents.rombelId, rombelId)))
            .run();
        }
      });

      // Hapus rombel yang jadi kosong (di luar transaksi, best-effort)
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
        const kelasUpper = kelas?.toUpperCase()?.trim() || "";

        // Pre-fetch relasi rombel saat ini
        const currentRel = await db
          .select({ rombelId: rombelStudents.rombelId })
          .from(rombelStudents)
          .where(eq(rombelStudents.studentId, id))
          .get();
        const existingTarget = kelasUpper
          ? await db.select().from(rombels).where(eq(rombels.nama, kelasUpper)).get()
          : undefined;

        let updated: any;

        // Update siswa + pindah rombel dalam satu transaksi
        db.transaction((tx) => {
          updated = tx
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

          if (kelasUpper) {
            // Remove from current rombel
            if (currentRel) {
              tx.delete(rombelStudents)
                .where(and(eq(rombelStudents.studentId, id), eq(rombelStudents.rombelId, currentRel.rombelId)))
                .run();
            }
            // Find or create target rombel
            let targetRombel = existingTarget;
            if (!targetRombel) {
              targetRombel = tx.insert(rombels).values({ nama: kelasUpper }).returning().get();
            }
            try {
              tx.insert(rombelStudents).values({ rombelId: targetRombel.id, studentId: id }).run();
            } catch { /* already assigned */ }
          }
        });

        // Hapus rombel lama jika kosong (di luar transaksi, best-effort)
        if (kelasUpper && currentRel) {
          const count = await db
            .select({ cnt: sql<number>`count(*)` })
            .from(rombelStudents)
            .where(eq(rombelStudents.rombelId, currentRel.rombelId))
            .get();
          if (count && Number(count.cnt) === 0) {
            await db.delete(rombels).where(eq(rombels.id, currentRel.rombelId)).run();
          }
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
  // Import data warga belajar via Excel (bulk)
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

        // Dedup: skip baris yang NISN/NIK-nya sudah ada di DB atau duplikat di file
        const existingStudents = await db
          .select({ nisn: students.nisn, nik: students.nik })
          .from(students)
          .all();
        const existingNisn = new Set(existingStudents.map((s) => s.nisn).filter(Boolean));
        const existingNik = new Set(existingStudents.map((s) => s.nik).filter(Boolean));
        const seenNisn = new Set<string>();
        const seenNik = new Set<string>();
        let skippedDuplicate = 0;
        const dedupedItems = validItems.filter((item) => {
          const nisn = typeof item.nisn === "string" ? item.nisn.trim() : "";
          const nik = typeof item.nik === "string" ? item.nik.trim() : "";
          if ((nisn && (existingNisn.has(nisn) || seenNisn.has(nisn))) ||
              (nik && (existingNik.has(nik) || seenNik.has(nik)))) {
            skippedDuplicate++;
            return false;
          }
          if (nisn) seenNisn.add(nisn);
          if (nik) seenNik.add(nik);
          return true;
        });

        if (dedupedItems.length === 0) {
          set.status = 400;
          return { success: false, message: `Semua data duplikat (${skippedDuplicate} baris dilewati berdasarkan NISN/NIK)` };
        }

        const defaultPassword = await Bun.password.hash("password123");
        const insertValues = dedupedItems.map((item) => ({
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
          rt: typeof item.rt === "string" ? item.rt : "",
          rw: typeof item.rw === "string" ? item.rw : "",
          desa: typeof item.desa === "string" ? item.desa : "",
          kecamatan: typeof item.kecamatan === "string" ? item.kecamatan : "",
          kabupaten: typeof item.kabupaten === "string" ? item.kabupaten : "",
          provinsi: typeof item.provinsi === "string" ? item.provinsi : "",
          sekolahAsal: typeof item.sekolahAsal === "string" ? item.sekolahAsal : "",
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
          message: skippedDuplicate > 0
            ? `Berhasil mengimpor ${insertValues.length} data warga belajar (${skippedDuplicate} duplikat dilewati)`
            : `Berhasil mengimpor ${insertValues.length} data warga belajar`,
          imported: insertValues.length,
          skipped: skippedDuplicate,
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
          rt: t.Optional(t.String()),
          rw: t.Optional(t.String()),
          desa: t.Optional(t.String()),
          kecamatan: t.Optional(t.String()),
          kabupaten: t.Optional(t.String()),
          provinsi: t.Optional(t.String()),
          sekolahAsal: t.Optional(t.String()),
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
        const currentRombelMap = new Map<number, number[]>();
        currentRelations.forEach(r => {
          if (!currentRombelMap.has(r.studentId)) currentRombelMap.set(r.studentId, []);
          currentRombelMap.get(r.studentId)!.push(r.rombelId);
        });

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
            if (gradeNum <= 0 || gradeNum > 12) { skipped++; continue; }
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
            const currentRombelIds = currentRombelMap.get(s.id) || [];
            const currentRombelObj = currentRombelIds.length > 0 ? allRombels.find(r => r.id === currentRombelIds[0]) : null;
            const currentRombelName = currentRombelObj?.nama.toUpperCase() || "";
            const sectionLetter = extractSectionLetter(currentRombelName);
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

            // Remove from all current rombels
            if (currentRombelIds.length > 0) {
              tx.delete(rombelStudents)
                .where(and(eq(rombelStudents.studentId, s.id), inArray(rombelStudents.rombelId, currentRombelIds)))
                .run();
              currentRombelIds.forEach(rid => emptiedRombelIds.add(rid));
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
        const allTargets = await db.select().from(students).where(inArray(students.id, studentIds)).all();
        // Skip yang sudah LULUS agar tidak menduplikasi alumni
        const existing = allTargets.filter((s) => s.status !== "LULUS");
        let graduated = 0;
        const skipped = allTargets.length - existing.length;
        const year = new Date().getFullYear().toString();

        // Collect rombel IDs affected by graduation
        const affectedRombelIds = new Set<number>();

        db.transaction((tx) => {
          for (const s of existing) {
            tx.update(students)
              .set({ status: "LULUS", kelas: "", updatedAt: new Date().toISOString() })
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
              rt: s.rt,
              rw: s.rw,
              desa: s.desa,
              kecamatan: s.kecamatan,
              kabupaten: s.kabupaten,
              provinsi: s.provinsi,
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

        return { success: true, graduated, skipped };
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

        // Hanya proses siswa yang benar-benar ada
        const existingStudents = await db
          .select({ id: students.id })
          .from(students)
          .where(inArray(students.id, studentIds))
          .all();
        const validIds = existingStudents.map((s) => s.id);

        // Pre-fetch rombel data
        const allRombels = await db.select().from(rombels).all();
        const currentRelations = await db
          .select({ studentId: rombelStudents.studentId, rombelId: rombelStudents.rombelId })
          .from(rombelStudents)
          .where(inArray(rombelStudents.studentId, validIds.length > 0 ? validIds : [-1]))
          .all();
        const currentRombelMap = new Map<number, number>();
        currentRelations.forEach(r => currentRombelMap.set(r.studentId, r.rombelId));
        const emptiedRombelIds = new Set<number>();

        const kelasUpper = kelas?.toUpperCase()?.trim() || "";

        db.transaction((tx) => {
          for (const id of validIds) {
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
