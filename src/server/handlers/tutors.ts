/* eslint-disable @typescript-eslint/no-explicit-any */
import { Elysia, t } from "elysia";
import { jwt } from "@elysia/jwt";
import { db } from "../config/db";
import { tutors } from "../models";
import { eq } from "drizzle-orm";
import { verifyAdmin, verifyUser } from "../middleware/auth";
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
  // Ambil data tutor untuk publik (landing page) — tanpa auth.
  // Whitelist field profil tenaga pendidik. Field pribadi (nik, email, sub-alamat
  // rt/rw/desa/dst, password) tidak dikirim ke publik. Catatan: `alamat` (baris jalan)
  // sengaja disertakan untuk ditampilkan di profil publik.
  .get("/api/public-tutors", async ({ set }) => {
    try {
      const list = await db
        .select({
          id: tutors.id,
          nama: tutors.nama,
          tutorMapel: tutors.tutorMapel,
          program: tutors.program,
          nip: tutors.nip,
          tempatTglLahir: tutors.tempatTglLahir,
          jenisKelamin: tutors.jenisKelamin,
          agama: tutors.agama,
          pendidikan: tutors.pendidikan,
          alamat: tutors.alamat,
          tanggalMulaiTugas: tutors.tanggalMulaiTugas,
          nomorSkPengangkatan: tutors.nomorSkPengangkatan,
          lembagaPengangkat: tutors.lembagaPengangkat,
          nomorSkPenugasan: tutors.nomorSkPenugasan,
          lembagaPenugas: tutors.lembagaPenugas,
          foto: tutors.foto,
        })
        .from(tutors)
        .all();
      return { success: true, data: list };
    } catch {
      set.status = 500;
      return { success: false, message: "Gagal mengambil data tutor" };
    }
  })
  // Ambil semua tutor
  .get("/api/tutors", async ({ headers, jwt, set }) => {
    const authError = await verifyUser(headers, jwt, set);
    if (authError) return authError;

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
          delete (rest as any).nip;
          delete (rest as any).tempatTglLahir;
          delete (rest as any).agama;
          delete (rest as any).pendidikan;
          delete (rest as any).email;
          delete (rest as any).alamat;
          delete (rest as any).rt;
          delete (rest as any).rw;
          delete (rest as any).desa;
          delete (rest as any).kecamatan;
          delete (rest as any).kabupaten;
          delete (rest as any).provinsi;
          delete (rest as any).tanggalMulaiTugas;
          delete (rest as any).nomorSkPengangkatan;
          delete (rest as any).lembagaPengangkat;
          delete (rest as any).nomorSkPenugasan;
          delete (rest as any).lembagaPenugas;
          delete (rest as any).berkas;
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

      const bodyData = body as any;
      const {
        nama,
        tutorMapel,
        program,
        nip,
        tempatTglLahir,
        jenisKelamin,
        agama,
        pendidikan,
        email,
        nik,
        alamat,
        rt,
        rw,
        desa,
        kecamatan,
        kabupaten,
        provinsi,
        password,
        foto,
        tanggalMulaiTugas,
        nomorSkPengangkatan,
        lembagaPengangkat,
        nomorSkPenugasan,
        lembagaPenugas,
        berkas,
      } = bodyData;

      try {
        const hashedPassword = await Bun.password.hash(password || "password123");
        const inserted = await db
          .insert(tutors)
          .values({
            nama,
            tutorMapel: tutorMapel || "",
            program: program || "",
            nip: nip || "",
            tempatTglLahir: tempatTglLahir || "",
            jenisKelamin: jenisKelamin || "",
            agama: agama || "",
            pendidikan: pendidikan || "",
            email: email || "",
            nik: nik || "",
            alamat: alamat || "",
            rt: rt || "",
            rw: rw || "",
            desa: desa || "",
            kecamatan: kecamatan || "",
            kabupaten: kabupaten || "",
            provinsi: provinsi || "",
            password: hashedPassword,
            foto: foto || "",
            tanggalMulaiTugas: tanggalMulaiTugas || "",
            nomorSkPengangkatan: nomorSkPengangkatan || "",
            lembagaPengangkat: lembagaPengangkat || "",
            nomorSkPenugasan: nomorSkPenugasan || "",
            lembagaPenugas: lembagaPenugas || "",
            berkas: berkas || {},
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
        nip: t.Optional(t.String()),
        tempatTglLahir: t.Optional(t.String()),
        jenisKelamin: t.Optional(t.String()),
        agama: t.Optional(t.String()),
        pendidikan: t.Optional(t.String()),
        email: t.Optional(t.String()),
        nik: t.Optional(t.String()),
        alamat: t.Optional(t.String()),
        rt: t.Optional(t.String()),
        rw: t.Optional(t.String()),
        desa: t.Optional(t.String()),
        kecamatan: t.Optional(t.String()),
        kabupaten: t.Optional(t.String()),
        provinsi: t.Optional(t.String()),
        password: t.Optional(t.String()),
        foto: t.Optional(t.String()),
        tanggalMulaiTugas: t.Optional(t.String()),
        nomorSkPengangkatan: t.Optional(t.String()),
        lembagaPengangkat: t.Optional(t.String()),
        nomorSkPenugasan: t.Optional(t.String()),
        lembagaPenugas: t.Optional(t.String()),
        berkas: t.Optional(t.Record(t.String(), t.String())),
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

      const bodyData = body as any;
      const {
        nama,
        tutorMapel,
        program,
        nip,
        tempatTglLahir,
        jenisKelamin,
        agama,
        pendidikan,
        email,
        nik,
        alamat,
        rt,
        rw,
        desa,
        kecamatan,
        kabupaten,
        provinsi,
        password,
        foto,
        tanggalMulaiTugas,
        nomorSkPengangkatan,
        lembagaPengangkat,
        nomorSkPenugasan,
        lembagaPenugas,
        berkas,
      } = bodyData;

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
            tutorMapel: tutorMapel ?? existing.tutorMapel,
            program: program ?? existing.program,
            nip: nip ?? existing.nip,
            tempatTglLahir: tempatTglLahir ?? existing.tempatTglLahir,
            jenisKelamin: jenisKelamin ?? existing.jenisKelamin,
            agama: agama ?? existing.agama,
            pendidikan: pendidikan ?? existing.pendidikan,
            email: email ?? existing.email,
            nik: nik ?? existing.nik,
            alamat: alamat ?? existing.alamat,
            rt: rt ?? existing.rt,
            rw: rw ?? existing.rw,
            desa: desa ?? existing.desa,
            kecamatan: kecamatan ?? existing.kecamatan,
            kabupaten: kabupaten ?? existing.kabupaten,
            provinsi: provinsi ?? existing.provinsi,
            password: finalPassword,
            foto: foto ?? existing.foto,
            tanggalMulaiTugas: tanggalMulaiTugas ?? existing.tanggalMulaiTugas,
            nomorSkPengangkatan: nomorSkPengangkatan ?? existing.nomorSkPengangkatan,
            lembagaPengangkat: lembagaPengangkat ?? existing.lembagaPengangkat,
            nomorSkPenugasan: nomorSkPenugasan ?? existing.nomorSkPenugasan,
            lembagaPenugas: lembagaPenugas ?? existing.lembagaPenugas,
            berkas: berkas ?? existing.berkas,
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
        nip: t.Optional(t.String()),
        tempatTglLahir: t.Optional(t.String()),
        jenisKelamin: t.Optional(t.String()),
        agama: t.Optional(t.String()),
        pendidikan: t.Optional(t.String()),
        email: t.Optional(t.String()),
        nik: t.Optional(t.String()),
        alamat: t.Optional(t.String()),
        rt: t.Optional(t.String()),
        rw: t.Optional(t.String()),
        desa: t.Optional(t.String()),
        kecamatan: t.Optional(t.String()),
        kabupaten: t.Optional(t.String()),
        provinsi: t.Optional(t.String()),
        password: t.Optional(t.String()),
        foto: t.Optional(t.String()),
        tanggalMulaiTugas: t.Optional(t.String()),
        nomorSkPengangkatan: t.Optional(t.String()),
        lembagaPengangkat: t.Optional(t.String()),
        nomorSkPenugasan: t.Optional(t.String()),
        lembagaPenugas: t.Optional(t.String()),
        berkas: t.Optional(t.Record(t.String(), t.String())),
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
  // Import data tutor via Excel (bulk)
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

        // Dedup: skip baris yang NIK/email-nya sudah ada di DB atau duplikat di file
        const existingTutors = await db
          .select({ nik: tutors.nik, email: tutors.email })
          .from(tutors)
          .all();
        const existingNik = new Set(existingTutors.map((t) => t.nik).filter(Boolean));
        const existingEmail = new Set(existingTutors.map((t) => t.email).filter(Boolean));
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
        const insertValues = await Promise.all(
          dedupedItems.map(async (item: any) => {
            const rawPass =
              typeof item.password === "string" && item.password.trim()
                ? item.password.trim()
                : typeof item.Password === "string" && item.Password.trim()
                ? item.Password.trim()
                : null;
            const password = rawPass ? await Bun.password.hash(rawPass) : defaultPassword;

            return {
              nama: item.nama,
              tutorMapel: typeof item.tutorMapel === "string" ? item.tutorMapel : "",
              program: typeof item.program === "string" ? item.program : "",
              nip: typeof item.nip === "string" ? item.nip : "",
              tempatTglLahir: typeof item.tempatTglLahir === "string" ? item.tempatTglLahir : "",
              jenisKelamin: typeof item.jenisKelamin === "string" ? item.jenisKelamin : "",
              agama: typeof item.agama === "string" ? item.agama : "",
              pendidikan: typeof item.pendidikan === "string" ? item.pendidikan : "",
              email: typeof item.email === "string" ? item.email : "",
              nik: typeof item.nik === "string" ? item.nik : "",
              alamat: typeof item.alamat === "string" ? item.alamat : "",
              rt: typeof item.rt === "string" ? item.rt : "",
              rw: typeof item.rw === "string" ? item.rw : "",
              desa: typeof item.desa === "string" ? item.desa : "",
              kecamatan: typeof item.kecamatan === "string" ? item.kecamatan : "",
              kabupaten: typeof item.kabupaten === "string" ? item.kabupaten : "",
              provinsi: typeof item.provinsi === "string" ? item.provinsi : "",
              password,
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
            };
          })
        );

        const chunkSize = 100;
        db.transaction((tx) => {
          for (let i = 0; i < insertValues.length; i += chunkSize) {
            const chunk = insertValues.slice(i, i + chunkSize);
            tx.insert(tutors).values(chunk).run();
          }
        });
        return {
          success: true,
          message: skippedDuplicate > 0
            ? `Berhasil mengimpor ${insertValues.length} data tutor (${skippedDuplicate} duplikat dilewati)`
            : `Berhasil mengimpor ${insertValues.length} data tutor`,
          imported: insertValues.length,
          skipped: skippedDuplicate,
        };
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
          nip: t.Optional(t.String()),
          tempatTglLahir: t.Optional(t.String()),
          jenisKelamin: t.Optional(t.String()),
          agama: t.Optional(t.String()),
          pendidikan: t.Optional(t.String()),
          email: t.Optional(t.String()),
          nik: t.Optional(t.String()),
          alamat: t.Optional(t.String()),
          rt: t.Optional(t.String()),
          rw: t.Optional(t.String()),
          desa: t.Optional(t.String()),
          kecamatan: t.Optional(t.String()),
          kabupaten: t.Optional(t.String()),
          provinsi: t.Optional(t.String()),
          password: t.Optional(t.String()),
          Password: t.Optional(t.String()),
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
