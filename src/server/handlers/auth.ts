/* eslint-disable @typescript-eslint/no-explicit-any */
import { Elysia, t } from "elysia";
import { jwt } from "@elysia/jwt";
import { db } from "../config/db";
import { managers, tutors, students } from "../models";
import { eq } from "drizzle-orm";
import { DUMMY_HASH } from "../utils/password";
import { finalJwtSecret } from "../config/jwt";

export const authHandlers = new Elysia()
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
  // Rute Login API
  .post(
    "/api/auth/login",
    async ({ body, jwt, set }) => {
      const { username, password } = body as any;
      try {
        // 1. Cari di tabel managers (role: admin)
        const manager = await db.select().from(managers).where(eq(managers.email, username)).get();
        if (manager) {
          const isValid = await Bun.password.verify(password, manager.password);
          if (isValid) {
            const token = await jwt.sign({
              id: manager.id,
              username: manager.email,
              role: manager.role,
              name: manager.nama,
              email: manager.email,
            });
            return {
              success: true,
              token,
              user: {
                id: manager.id,
                name: manager.nama,
                username: manager.email,
                role: manager.role,
                email: manager.email,
              },
            };
          }
        }

        // 2. Cari di tabel tutors (role: tutor)
        const tutor = await db.select().from(tutors).where(eq(tutors.email, username)).get();
        if (tutor) {
          const isValid = await Bun.password.verify(password, tutor.password);
          if (isValid) {
            const token = await jwt.sign({
              id: tutor.id,
              username: tutor.email,
              role: "tutor",
              name: tutor.nama,
              email: tutor.email,
            });
            return {
              success: true,
              token,
              user: {
                id: tutor.id,
                name: tutor.nama,
                username: tutor.email,
                role: "tutor",
                email: tutor.email,
              },
            };
          }
        }

        // 3. Cari di tabel students (role: siswa)
        const student = await db.select().from(students).where(eq(students.email, username)).get();
        if (student) {
          const isValid = await Bun.password.verify(password, student.password);
          if (isValid) {
            if (student.status !== "AKTIF") {
              set.status = 403;
              return { message: "Akun Warga Belajar tidak aktif. Silakan hubungi administrator." };
            }
            const token = await jwt.sign({
              id: student.id,
              username: student.email,
              role: "siswa",
              name: student.nama,
              email: student.email,
            });
            return {
              success: true,
              token,
              user: {
                id: student.id,
                name: student.nama,
                username: student.email,
                role: "siswa",
                email: student.email,
              },
            };
          }
        }

        // Timing attack mitigation
        await Bun.password.verify(password, DUMMY_HASH);
        set.status = 401;
        return { message: "Email atau Password salah" };
      } catch {
        set.status = 500;
        return { message: "Gagal memproses masuk ke akun" };
      }
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    }
  )
  // Ambil info profile aktif
  .get("/api/auth/me", async ({ headers, jwt, set }) => {
    const authHeader = headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      set.status = 401;
      return { message: "Akses ditolak, token hilang" };
    }

    const token = authHeader.split(" ")[1];
    const payload = await jwt.verify(token);
    if (!payload) {
      set.status = 401;
      return { message: "Sesi Anda telah kedaluwarsa" };
    }

    const role = payload.role as string;
    const id = Number(payload.id);

    try {
      if (role === "admin" || role === "super_admin") {
        const manager = await db.select().from(managers).where(eq(managers.id, id)).get();
        if (!manager) {
          set.status = 404;
          return { message: "Akun tidak ditemukan" };
        }
        return {
          success: true,
          user: {
            id: manager.id,
            name: manager.nama,
            email: manager.email,
            username: manager.email,
            role: manager.role,
            alamat: manager.alamat,
            nik: manager.nik,
            tempatTglLahir: manager.tempatTglLahir,
            jenisKelamin: manager.jenisKelamin,
            agama: manager.agama,
            foto: manager.foto,
          },
        };
      }

      if (role === "tutor") {
        const tutor = await db.select().from(tutors).where(eq(tutors.id, id)).get();
        if (!tutor) {
          set.status = 404;
          return { message: "Akun tidak ditemukan" };
        }
        return {
          success: true,
          user: {
            id: tutor.id,
            name: tutor.nama,
            email: tutor.email,
            username: tutor.email,
            role: "tutor",
            alamat: tutor.alamat,
            nik: tutor.nik,
            tempatTglLahir: tutor.tempatTglLahir,
            jenisKelamin: tutor.jenisKelamin,
            agama: tutor.agama,
            foto: tutor.foto,
            tutorMapel: tutor.tutorMapel,
            program: tutor.program,
            nip: tutor.nip,
            pendidikan: tutor.pendidikan,
            tanggalMulaiTugas: tutor.tanggalMulaiTugas,
            nomorSkPengangkatan: tutor.nomorSkPengangkatan,
            lembagaPengangkat: tutor.lembagaPengangkat,
            nomorSkPenugasan: tutor.nomorSkPenugasan,
            lembagaPenugas: tutor.lembagaPenugas,
          },
        };
      }

      if (role === "siswa") {
        const student = await db.select().from(students).where(eq(students.id, id)).get();
        if (!student) {
          set.status = 404;
          return { message: "Akun tidak ditemukan" };
        }
        if (student.status !== "AKTIF") {
          set.status = 403;
          return { message: "Akun Warga Belajar tidak aktif" };
        }
        return {
          success: true,
          user: {
            id: student.id,
            name: student.nama,
            email: student.email,
            username: student.email,
            role: "siswa",
            alamat: student.alamat,
            nik: student.nik,
            tempatTglLahir: student.tempatTglLahir,
            jenisKelamin: student.jenisKelamin,
            agama: student.agama,
            foto: student.foto,
            noHp: student.noHp,
            program: student.program,
            kelas: student.kelas,
            nisn: student.nisn,
            nis: student.nis,
            namaAyah: student.namaAyah,
            namaIbu: student.namaIbu,
            titikLayanan: student.titikLayanan,
          },
        };
      }

      set.status = 403;
      return { message: "Role tidak dikenal" };
    } catch {
      set.status = 500;
      return { message: "Gagal memuat data profil" };
    }
  })
  // Update info profile aktif & password
  .put(
    "/api/auth/update-profile",
    async ({ headers, jwt, body, set }) => {
      const authHeader = headers["authorization"];
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        set.status = 401;
        return { success: false, message: "Akses ditolak, token hilang" };
      }

      const token = authHeader.split(" ")[1];
      const payload = await jwt.verify(token);
      if (!payload) {
        set.status = 401;
        return { success: false, message: "Sesi Anda telah kedaluwarsa" };
      }

      const role = payload.role as string;
      const id = Number(payload.id);
      const { 
        name, email, password, noHp, alamat,
        nik, nip, tempatTglLahir, jenisKelamin, agama, pendidikan,
        tanggalMulaiTugas, nomorSkPengangkatan, lembagaPengangkat, nomorSkPenugasan, lembagaPenugas,
        nisn, nis, titikLayanan, namaAyah, namaIbu
      } = body as any;

      try {
        const updateData: any = {};
        if (name !== undefined) updateData.nama = name;
        if (email !== undefined) updateData.email = email;
        if (alamat !== undefined) updateData.alamat = alamat;
        if (password) {
          updateData.password = await Bun.password.hash(password, { algorithm: "bcrypt" });
        }
        updateData.updatedAt = new Date().toISOString();

        if (role === "admin" || role === "super_admin") {
          const updated = await db
            .update(managers)
            .set(updateData)
            .where(eq(managers.id, id))
            .returning()
            .get();
          if (!updated) {
            set.status = 404;
            return { success: false, message: "Akun tidak ditemukan" };
          }
          return {
            success: true,
            user: {
              id: updated.id,
              name: updated.nama,
              email: updated.email,
              username: updated.email,
              role: updated.role,
              alamat: updated.alamat,
              nik: updated.nik,
              tempatTglLahir: updated.tempatTglLahir,
              jenisKelamin: updated.jenisKelamin,
              agama: updated.agama,
              foto: updated.foto,
            },
          };
        }

        if (role === "tutor") {
          // Fields specific to Tutor
          if (nik !== undefined) updateData.nik = nik;
          if (nip !== undefined) updateData.nip = nip;
          if (tempatTglLahir !== undefined) updateData.tempatTglLahir = tempatTglLahir;
          if (jenisKelamin !== undefined) updateData.jenisKelamin = jenisKelamin;
          if (agama !== undefined) updateData.agama = agama;
          if (pendidikan !== undefined) updateData.pendidikan = pendidikan;
          if (tanggalMulaiTugas !== undefined) updateData.tanggalMulaiTugas = tanggalMulaiTugas;
          if (nomorSkPengangkatan !== undefined) updateData.nomorSkPengangkatan = nomorSkPengangkatan;
          if (lembagaPengangkat !== undefined) updateData.lembagaPengangkat = lembagaPengangkat;
          if (nomorSkPenugasan !== undefined) updateData.nomorSkPenugasan = nomorSkPenugasan;
          if (lembagaPenugas !== undefined) updateData.lembagaPenugas = lembagaPenugas;
          
          const updated = await db
            .update(tutors)
            .set(updateData)
            .where(eq(tutors.id, id))
            .returning()
            .get();
          if (!updated) {
            set.status = 404;
            return { success: false, message: "Akun tidak ditemukan" };
          }
          return {
            success: true,
            user: {
              id: updated.id,
              name: updated.nama,
              email: updated.email,
              username: updated.email,
              role: "tutor",
              alamat: updated.alamat,
              nik: updated.nik,
              tempatTglLahir: updated.tempatTglLahir,
              jenisKelamin: updated.jenisKelamin,
              agama: updated.agama,
              foto: updated.foto,
              tutorMapel: updated.tutorMapel,
              program: updated.program,
              nip: updated.nip,
              pendidikan: updated.pendidikan,
              tanggalMulaiTugas: updated.tanggalMulaiTugas,
              nomorSkPengangkatan: updated.nomorSkPengangkatan,
              lembagaPengangkat: updated.lembagaPengangkat,
              nomorSkPenugasan: updated.nomorSkPenugasan,
              lembagaPenugas: updated.lembagaPenugas,
            },
          };
        }

        if (role === "siswa") {
          if (noHp !== undefined) updateData.noHp = noHp;
          if (nik !== undefined) updateData.nik = nik;
          if (nisn !== undefined) updateData.nisn = nisn;
          if (nis !== undefined) updateData.nis = nis;
          if (tempatTglLahir !== undefined) updateData.tempatTglLahir = tempatTglLahir;
          if (titikLayanan !== undefined) updateData.titikLayanan = titikLayanan;
          if (jenisKelamin !== undefined) updateData.jenisKelamin = jenisKelamin;
          if (agama !== undefined) updateData.agama = agama;
          if (namaAyah !== undefined) updateData.namaAyah = namaAyah;
          if (namaIbu !== undefined) updateData.namaIbu = namaIbu;
          
          const updated = await db
            .update(students)
            .set(updateData)
            .where(eq(students.id, id))
            .returning()
            .get();
          if (!updated) {
            set.status = 404;
            return { success: false, message: "Akun tidak ditemukan" };
          }
          return {
            success: true,
            user: {
              id: updated.id,
              name: updated.nama,
              email: updated.email,
              username: updated.email,
              role: "siswa",
              alamat: updated.alamat,
              nik: updated.nik,
              tempatTglLahir: updated.tempatTglLahir,
              jenisKelamin: updated.jenisKelamin,
              agama: updated.agama,
              foto: updated.foto,
              noHp: updated.noHp,
              program: updated.program,
              kelas: updated.kelas,
              nisn: updated.nisn,
              nis: updated.nis,
              namaAyah: updated.namaAyah,
              namaIbu: updated.namaIbu,
              titikLayanan: updated.titikLayanan,
            },
          };
        }

        set.status = 400;
        return { success: false, message: "Role tidak dikenal" };
      } catch {
        set.status = 500;
        return { success: false, message: "Gagal memperbarui profil" };
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        email: t.Optional(t.String()),
        password: t.Optional(t.String()),
        noHp: t.Optional(t.String()),
        alamat: t.Optional(t.String()),
        nik: t.Optional(t.String()),
        nip: t.Optional(t.String()),
        tempatTglLahir: t.Optional(t.String()),
        jenisKelamin: t.Optional(t.String()),
        agama: t.Optional(t.String()),
        pendidikan: t.Optional(t.String()),
        tanggalMulaiTugas: t.Optional(t.String()),
        nomorSkPengangkatan: t.Optional(t.String()),
        lembagaPengangkat: t.Optional(t.String()),
        nomorSkPenugasan: t.Optional(t.String()),
        lembagaPenugas: t.Optional(t.String()),
        nisn: t.Optional(t.String()),
        nis: t.Optional(t.String()),
        titikLayanan: t.Optional(t.String()),
        namaAyah: t.Optional(t.String()),
        namaIbu: t.Optional(t.String()),
      }),
    }
  )

  // Endpoint untuk Reset Password Pengguna oleh Super Admin
  .post(
    "/api/admin/reset-password",
    async ({ body, headers, jwt, set }) => {
      const authHeader = headers["authorization"];
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        set.status = 401;
        return { success: false, message: "Akses ditolak, token hilang" };
      }
      const token = authHeader.split(" ")[1];
      const payload = await jwt.verify(token);
      if (!payload || payload.role !== "super_admin") {
        set.status = 403;
        return { success: false, message: "Akses ditolak. Anda tidak memiliki otoritas." };
      }

      const { targetRole, targetId, newPassword } = body as any;
      try {
        const hashedPassword = await Bun.password.hash(newPassword, { algorithm: "bcrypt" });
        if (targetRole === "admin" || targetRole === "super_admin" || targetRole === "manager") {
          const result = await db
            .update(managers)
            .set({ password: hashedPassword })
            .where(eq(managers.id, Number(targetId)))
            .returning()
            .get();
          if (!result) {
            set.status = 404;
            return { success: false, message: "User tidak ditemukan" };
          }
        } else if (targetRole === "tutor") {
          const result = await db
            .update(tutors)
            .set({ password: hashedPassword })
            .where(eq(tutors.id, Number(targetId)))
            .returning()
            .get();
          if (!result) {
            set.status = 404;
            return { success: false, message: "User tidak ditemukan" };
          }
        } else if (targetRole === "siswa") {
          const result = await db
            .update(students)
            .set({ password: hashedPassword })
            .where(eq(students.id, Number(targetId)))
            .returning()
            .get();
          if (!result) {
            set.status = 404;
            return { success: false, message: "User tidak ditemukan" };
          }
        } else {
          set.status = 400;
          return { success: false, message: "Role target tidak dikenal" };
        }
        return { success: true, message: "Password berhasil di-reset" };
      } catch {
        set.status = 500;
        return { success: false, message: "Gagal me-reset password" };
      }
    },
    {
      body: t.Object({
        targetRole: t.String(),
        targetId: t.Union([t.String(), t.Number()]),
        newPassword: t.String({ minLength: 6 }),
      }),
    }
  );
