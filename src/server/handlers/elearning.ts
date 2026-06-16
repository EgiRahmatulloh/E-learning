import { Elysia, t } from "elysia";
import { db } from "../db";
import {
  elearningCourses,
  elearningSessions,
  elearningMaterials,
} from "../db/schema";
import { eq, and } from "drizzle-orm";
import { jwt } from "@elysia/jwt";
import { finalJwtSecret } from "../config/jwt";
import sanitizeHtml from "sanitize-html";

export const elearningHandlers = new Elysia({ prefix: "/api/elearning" })
  .use(
    jwt({
      name: "jwt",
      secret: finalJwtSecret,
    })
  )

  // Ambil Mapel berdasarkan nama dan program (akan buat otomatis jika belum ada)
  .post(
    "/course",
    async (context: any) => {
      const { body, set } = context;
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
      const { query, set } = context;
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
              title: sessionNumber === 0 ? "Pendahuluan" : `Sesi ${sessionNumber}`,
              description: "", // Teks Pembuka
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
      const { params: { id }, body, set } = context;
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
      const { body, set } = context;
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
      const { set } = context;
      try {
        // Ambil data evaluasi dari schema, pastikan import elearningEvaluations sudah ada di schema yang di-import
        const { elearningEvaluations } = require("../db/schema");
        const evaluations = await db.select().from(elearningEvaluations).all();
        return { success: true, data: evaluations };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  )

  // Simpan daftar pertanyaan angket
  .post(
    "/evaluations",
    async (context: any) => {
      const { body, set } = context;
      try {
        const { elearningEvaluations } = require("../db/schema");
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
  );
