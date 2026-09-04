// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Elysia, t } from "elysia";
import { db } from "../../config/db";
import { eq, and, or, inArray, isNull, like, desc, asc, sql } from "drizzle-orm";
import {
  elearningCourses,
  elearningSessions,
  elearningMaterials,
  elearningEvaluations,
  elearningSetups,
  elearningForumPosts,
  elearningAttendances,
  elearningAssignments,
  elearningSubmissions,
  elearningQuestions,
  elearningQuizSubmissions,
  elearningSectionCompletions,
  tutors,
  students,
  rombels,
  rombelStudents,
  managers,
  tutorAttendances,
  elearningSessionAngkets
} from "../../models";
import { verifyAdmin, verifyAdminOrTutor } from "../../middleware/auth";
import sanitizeHtml from "sanitize-html";
import { verifyUser, sanitizeFilename, deriveProgram, buildAttendanceGrid, calculateGrade } from "./helpers";
import { fillTemplate } from "../../utils/templateXlsx";
import { cleanupReplacedFiles } from "../../services/storage";

  // Ambil Mapel berdasarkan nama dan program (akan buat otomatis jika belum ada)
export const courseHandlers = new Elysia()
  .post(
    "/course",
    async (context: any) => {
      const { headers, jwt, body, set } = context;

      // Auth: semua role yang terautentikasi boleh lihat/buat course
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const { subjectName, program, kelas, setupId } = body;

        // Derive program from setup's kelas if setupId provided (consistency with tutor derivation)
        let resolvedProgram = program || "";
        let resolvedKelas = kelas || "";
        if (setupId) {
          const setup = await db.select().from(elearningSetups).where(eq(elearningSetups.id, setupId)).get();
          if (setup) {
            resolvedProgram = deriveProgram(setup.kelas);
            resolvedKelas = setup.kelas;
          }
        }

        let course = await db
          .select()
          .from(elearningCourses)
          .where(
            and(
              eq(elearningCourses.namaMapel, subjectName),
              eq(elearningCourses.program, resolvedProgram)
            )
          )
          .get();

        if (!course) {
          const inserted = await db
            .insert(elearningCourses)
            .values({
              namaMapel: subjectName,
              program: resolvedProgram,
              kelas: resolvedKelas,
            })
            .returning();
          course = inserted[0];
        }

        return { success: true, data: course };
      } catch (error: any) {
        set.status = 500;
        console.error("Course error:", error);
        return { success: false, message: "Terjadi kesalahan server" };
      }
    },
    {
      body: t.Object({
        subjectName: t.String(),
        program: t.Optional(t.String()),
        kelas: t.Optional(t.String()),
        setupId: t.Optional(t.Number()),
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
              tujuanPembelajaran: "",
              uraianKegiatan: "",
              isEvaluation: false,
            })
            .onConflictDoNothing()
            .returning();
            
          if (inserted.length === 0) {
            session = await db
              .select()
              .from(elearningSessions)
              .where(
                and(
                  eq(elearningSessions.courseId, courseId),
                  eq(elearningSessions.sessionNumber, sessionNumber)
                )
              )
              .get();
          } else {
            session = inserted[0];
          }
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
        console.error("Course error:", error);
        return { success: false, message: "Terjadi kesalahan server" };
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
        const sanitizeOptions = {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['font', 'u', 'span']),
          allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            'font': ['size', 'color', 'face'],
            '*': ['class', 'style', 'align']
          }
        };

        const cleanHtml = typeof body.description === 'string' ? sanitizeHtml(body.description, sanitizeOptions) : undefined;
        const cleanTujuan = typeof body.tujuanPembelajaran === 'string' ? sanitizeHtml(body.tujuanPembelajaran, sanitizeOptions) : undefined;
        const cleanUraian = typeof body.uraianKegiatan === 'string' ? sanitizeHtml(body.uraianKegiatan, sanitizeOptions) : undefined;

        const updateData: any = {};
        if (cleanHtml !== undefined) updateData.description = cleanHtml;
        if (cleanTujuan !== undefined) updateData.tujuanPembelajaran = cleanTujuan;
        if (cleanUraian !== undefined) updateData.uraianKegiatan = cleanUraian;
        if (body.startDate !== undefined) updateData.startDate = body.startDate;
        if (body.endDate !== undefined) updateData.endDate = body.endDate;

        if (Object.keys(updateData).length > 0) {
          await db
            .update(elearningSessions)
            .set(updateData)
            .where(eq(elearningSessions.id, parseInt(id)));
        }

        return { success: true, message: "Berhasil menyimpan pengaturan sesi" };
      } catch (error: any) {
        set.status = 500;
        console.error("Course error:", error);
        return { success: false, message: "Terjadi kesalahan server" };
      }
    },
    {
      body: t.Object({
        description: t.Optional(t.String()),
        tujuanPembelajaran: t.Optional(t.String()),
        uraianKegiatan: t.Optional(t.String()),
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
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
          // Unggah ulang material menggantikan berkas lama — lepas dari storage
          // supaya bucket tidak menyimpan tiap versi yang pernah diunggah.
          await cleanupReplacedFiles(existing, { fileUrl }, ["fileUrl"]);
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
        console.error("Course error:", error);
        return { success: false, message: "Terjadi kesalahan server" };
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
        console.error("Course error:", error);
        return { success: false, message: "Terjadi kesalahan server" };
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
        await db.transaction(async (tx) => {
          const existing = await tx.select().from(elearningEvaluations).orderBy(asc(elearningEvaluations.id)).all();
          const newQuestions = body.questions || [];

          for (let i = 0; i < Math.max(existing.length, newQuestions.length); i++) {
            if (i < existing.length && i < newQuestions.length) {
              // Update existing
              if (existing[i].question !== newQuestions[i].text) {
                await tx.update(elearningEvaluations)
                  .set({ question: newQuestions[i].text })
                  .where(eq(elearningEvaluations.id, existing[i].id));
              }
            } else if (i >= existing.length) {
              // Insert new
              await tx.insert(elearningEvaluations).values({
                sessionId: 0, // Global evaluation, not tied to a specific session
                question: newQuestions[i].text,
                scaleMax: 5,
              });
            } else {
              // Delete removed
              await tx.delete(elearningEvaluations).where(eq(elearningEvaluations.id, existing[i].id));
            }
          }
        });
        return { success: true, message: "Berhasil menyimpan angket evaluasi" };
      } catch (error: any) {
        set.status = 500;
        console.error("Course error:", error);
        return { success: false, message: "Terjadi kesalahan server" };
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

  // GET aggregated evaluation responses (admin only — for laporan angket)
  .get(
    "/evaluation-responses",
    async (context: any) => {
      const { headers, jwt, set } = context;
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      try {
        const evaluations = await db.select().from(elearningEvaluations).all();
        if (evaluations.length === 0) {
          return { success: true, data: { evaluations: [], responses: [], aggregated: [] } };
        }

        const responses = await db
          .select({
            id: elearningSessionAngkets.id,
            evaluationId: elearningSessionAngkets.evaluationId,
            studentId: elearningSessionAngkets.studentId,
            studentName: students.nama,
            sessionId: elearningSessionAngkets.sessionId,
            sessionName: elearningSessions.title,
            courseId: elearningCourses.id,
            courseName: elearningCourses.namaMapel,
            kelas: elearningCourses.kelas,
            score: elearningSessionAngkets.score,
            createdAt: elearningSessionAngkets.createdAt,
          })
          .from(elearningSessionAngkets)
          .innerJoin(students, eq(elearningSessionAngkets.studentId, students.id))
          .leftJoin(elearningSessions, eq(elearningSessionAngkets.sessionId, elearningSessions.id))
          .leftJoin(elearningCourses, eq(elearningSessions.courseId, elearningCourses.id))
          .all();

        // Aggregate: rata-rata skor per pertanyaan
        const aggregated = evaluations.map(ev => {
          const evResponses = responses.filter(r => r.evaluationId === ev.id);
          const totalScore = evResponses.reduce((sum, r) => sum + r.score, 0);
          const avgScore = evResponses.length > 0 ? Math.round((totalScore / evResponses.length) * 100) / 100 : 0;
          return {
            questionId: ev.id,
            question: ev.question,
            scaleMax: ev.scaleMax,
            responseCount: evResponses.length,
            avgScore,
          };
        });

        return { success: true, data: { evaluations, responses, aggregated } };
      } catch (error: any) {
        set.status = 500;
        console.error("Course error:", error);
        return { success: false, message: "Terjadi kesalahan server" };
      }
    }
  )
;
