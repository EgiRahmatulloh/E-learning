/* eslint-disable @typescript-eslint/no-explicit-any */
import { Elysia, t } from "elysia";
import { db } from "../config/db";
import {
  elearningCourses,
  elearningSessions,
  elearningMaterials,
  elearningEvaluations,
  elearningSetups,
} from "../models";
import { eq, and } from "drizzle-orm";
import { jwt } from "@elysia/jwt";
import { finalJwtSecret } from "../config/jwt";
import { verifyAdmin } from "../middleware/auth";
import sanitizeHtml from "sanitize-html";

// Helper: verify any authenticated user (siswa, tutor, admin, super_admin)
const verifyUser = async (headers: Record<string, string | undefined>, jwt: any, set: any) => {
  const authHeader = headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    set.status = 401;
    return { success: false, message: "Akses ditolak, token hilang" };
  }
  const token = authHeader.split(" ")[1];
  const payload = await jwt.verify(token);
  if (!payload) {
    set.status = 401;
    return { success: false, message: "Sesi Anda telah kedaluwarsa, silakan masuk kembali" };
  }
  return null; // valid
};

// Helper: verify admin or tutor only
const verifyAdminOrTutor = async (headers: Record<string, string | undefined>, jwt: any, set: any) => {
  const authHeader = headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    set.status = 401;
    return { success: false, message: "Akses ditolak, token hilang" };
  }
  const token = authHeader.split(" ")[1];
  const payload = await jwt.verify(token);
  if (!payload) {
    set.status = 401;
    return { success: false, message: "Sesi Anda telah kedaluwarsa, silakan masuk kembali" };
  }
  if (payload.role !== "admin" && payload.role !== "super_admin" && payload.role !== "tutor") {
    set.status = 403;
    return { success: false, message: "Akses ditolak, hanya tutor atau admin yang diizinkan" };
  }
  return null; // valid
};

export const elearningHandlers = new Elysia({ prefix: "/api/elearning" })
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

  // Ambil Mapel berdasarkan nama dan program (akan buat otomatis jika belum ada)
  .post(
    "/course",
    async (context: any) => {
      const { headers, jwt, body, set } = context;

      // Auth: admin atau tutor saja yang boleh buat course
      const authError = await verifyAdminOrTutor(headers, jwt, set);
      if (authError) return authError;

      try {
        const { subjectName, program, kelas } = body;

        let course = await db
          .select()
          .from(elearningCourses)
          .where(
            and(
              eq(elearningCourses.namaMapel, subjectName),
              eq(elearningCourses.program, program || "")
            )
          )
          .get();

        if (!course) {
          const inserted = await db
            .insert(elearningCourses)
            .values({
              namaMapel: subjectName,
              program: program || "",
              kelas: kelas || "",
            })
            .returning();
          course = inserted[0];
        }

        return { success: true, data: course };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    },
    {
      body: t.Object({
        subjectName: t.String(),
        program: t.Optional(t.String()),
        kelas: t.Optional(t.String()),
      }),
    }
  )

  // Ambil Sesi (atau Pendahuluan dengan sessionNumber = 0)
  .get(
    "/session",
    async (context: any) => {
      const { headers, jwt, query, set } = context;

      // Auth: semua user yang login boleh baca sesi
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const courseId = query.courseId;
        const sessionNumber = query.sessionNumber;

        let session = await db
          .select()
          .from(elearningSessions)
          .where(
            and(
              eq(elearningSessions.courseId, courseId),
              eq(elearningSessions.sessionNumber, sessionNumber)
            )
          )
          .get();

        if (!session) {
          const inserted = await db
            .insert(elearningSessions)
            .values({
              courseId,
              sessionNumber,
              title: `Sesi ${sessionNumber}`,
              description: "",
              isEvaluation: false,
            })
            .returning();
          session = inserted[0];
        }

        // Ambil Material terkait
        const materials = await db
          .select()
          .from(elearningMaterials)
          .where(eq(elearningMaterials.sessionId, session.id))
          .all();

        return { success: true, data: { session, materials } };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    },
    {
      query: t.Object({
        courseId: t.Numeric(),
        sessionNumber: t.Numeric(),
      }),
    }
  )

  // Simpan Teks Pembuka (description di tabel sessions)
  .put(
    "/session/:id",
    async (context: any) => {
      const { headers, jwt, params: { id }, body, set } = context;

      // Auth: admin atau tutor saja
      const authError = await verifyAdminOrTutor(headers, jwt, set);
      if (authError) return authError;

      try {
        await db
          .update(elearningSessions)
          .set({ description: sanitizeHtml(body.description) })
          .where(eq(elearningSessions.id, parseInt(id)));

        return { success: true, message: "Berhasil menyimpan teks pembuka" };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    },
    {
      body: t.Object({
        description: t.String(),
      }),
    }
  )

  // Simpan Material
  .post(
    "/material",
    async (context: any) => {
      const { headers, jwt, body, set } = context;

      // Auth: admin atau tutor saja
      const authError = await verifyAdminOrTutor(headers, jwt, set);
      if (authError) return authError;

      try {
        const { sessionId, title, type, fileUrl } = body;

        // Cek apakah material dengan tipe tersebut di sesi yang sama sudah ada
        const existing = await db
          .select()
          .from(elearningMaterials)
          .where(
            and(
              eq(elearningMaterials.sessionId, sessionId),
              eq(elearningMaterials.type, type)
            )
          )
          .get();

        if (existing) {
          await db
            .update(elearningMaterials)
            .set({ title, fileUrl })
            .where(eq(elearningMaterials.id, existing.id));
        } else {
          await db
            .insert(elearningMaterials)
            .values({
              sessionId,
              title,
              type,
              fileUrl,
            });
        }

        return { success: true, message: "Berhasil menyimpan material" };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    },
    {
      body: t.Object({
        sessionId: t.Number(),
        title: t.String(),
        type: t.String(), // PPT, PDF (RAT/Tata Tertib), Video (Youtube)
        fileUrl: t.String(),
      }),
    }
  )

  // Ambil daftar pertanyaan angket
  .get(
    "/evaluations",
    async (context: any) => {
      const { headers, jwt, set } = context;

      // Auth: semua user yang login boleh baca evaluasi
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const evaluations = await db.select().from(elearningEvaluations).all();
        return { success: true, data: evaluations };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  )

  // Simpan daftar pertanyaan angket (admin only — destructive delete-all)
  .post(
    "/evaluations",
    async (context: any) => {
      const { headers, jwt, set, body } = context;

      // Auth: admin atau super_admin saja (operasi destructif)
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      try {
        // Hapus semua lalu insert ulang
        await db.delete(elearningEvaluations);
        if (body.questions && body.questions.length > 0) {
          const insertData = body.questions.map((q: any) => ({
            sessionId: 7, // Default sesi 7 untuk evaluasi tutor
            question: q.text,
            scaleMax: 5,
          }));
          await db.insert(elearningEvaluations).values(insertData);
        }
        return { success: true, message: "Berhasil menyimpan angket evaluasi" };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    },
    {
      body: t.Object({
        questions: t.Array(
          t.Object({
            text: t.String(),
          })
        ),
      }),
    }
  )

  // ==========================================
  // ELEARNING SETUPS (ADMIN & TUTOR)
  // ==========================================

  // GET all setups (admin) or filtered by tutorId (tutor)
  .get(
    "/setups",
    async (context: any) => {
      const { headers, jwt, query, set } = context;
      const authError = await verifyAdminOrTutor(headers, jwt, set);
      if (authError) return authError;

      try {
        let condition = undefined;
        const authHeader = headers["authorization"];
        const token = authHeader!.split(" ")[1];
        const payload = await jwt.verify(token);

        if (payload.role === "tutor") {
          condition = eq(elearningSetups.tutorId, payload.id as number);
        } else if (query.tutorId) {
          condition = eq(elearningSetups.tutorId, parseInt(query.tutorId));
        }

        const setups = await db
          .select()
          .from(elearningSetups)
          .where(condition)
          .all();

        return { success: true, data: setups };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    },
    {
      query: t.Object({
        tutorId: t.Optional(t.String()),
      }),
    }
  )

  // POST new setup (admin only)
  .post(
    "/setups",
    async (context: any) => {
      const { headers, jwt, body, set } = context;
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      try {
        const { kelas, mapel, tutorId, skk, jumlahSesi } = body;
        const inserted = await db
          .insert(elearningSetups)
          .values({
            kelas,
            mapel,
            tutorId,
            skk,
            jumlahSesi,
          })
          .returning();

        return { success: true, data: inserted[0] };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    },
    {
      body: t.Object({
        kelas: t.String(),
        mapel: t.String(),
        tutorId: t.Number(),
        skk: t.Number(),
        jumlahSesi: t.Number(),
      }),
    }
  )

  // PUT update setup (admin only)
  .put(
    "/setups/:id",
    async (context: any) => {
      const { headers, jwt, params: { id }, body, set } = context;
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      try {
        const { kelas, mapel, tutorId, skk, jumlahSesi } = body;
        const updated = await db
          .update(elearningSetups)
          .set({
            kelas,
            mapel,
            tutorId,
            skk,
            jumlahSesi,
          })
          .where(eq(elearningSetups.id, parseInt(id)))
          .returning();

        if (updated.length === 0) {
          set.status = 404;
          return { success: false, message: "Setup tidak ditemukan" };
        }

        return { success: true, data: updated[0] };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    },
    {
      body: t.Object({
        kelas: t.String(),
        mapel: t.String(),
        tutorId: t.Number(),
        skk: t.Number(),
        jumlahSesi: t.Number(),
      }),
    }
  )

  // DELETE setup (admin only)
  .delete(
    "/setups/:id",
    async (context: any) => {
      const { headers, jwt, params: { id }, set } = context;
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      try {
        await db.delete(elearningSetups).where(eq(elearningSetups.id, parseInt(id)));
        return { success: true, message: "Berhasil menghapus setup" };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  );
