/* eslint-disable @typescript-eslint/no-explicit-any */
import { Elysia, t } from "elysia";
import { db } from "../config/db";
import { fillTemplate } from "../utils/templateXlsx";
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
  elearningEvaluationResponses,
  elearningSectionCompletions,
  tutors,
  students,
  rombels,
  rombelStudents,
  managers,
  tutorAttendances,
  elearningSessionAngkets
} from "../models";
import { eq, and, or, inArray, isNull, like } from "drizzle-orm";
import { jwt } from "@elysia/jwt";
import { finalJwtSecret } from "../config/jwt";
import { verifyAdmin, verifyAdminOrTutor } from "../middleware/auth";
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

// Helper: sanitize a string for use in Content-Disposition filename
const sanitizeFilename = (s: string): string =>
  s.replace(/[^a-zA-Z0-9._\-\s]/g, "_").replace(/\s+/g, "_");

// Helper: derive program from class name
const deriveProgram = (kelas: string): string => {
  const upper = kelas.toUpperCase();
  if (upper.includes("PAKET A")) return "Paket A";
  if (upper.includes("PAKET B")) return "Paket B";
  return "Paket C";
};

// Helper: build monthly attendance grid (d1..d31)
const buildAttendanceGrid = (
  items: any[],
  dateAccessor: (item: any) => string | null | undefined,
  currentMonth: number,
  currentYear: number,
  daysInMonth: number,
  sessionDates: Set<number> | null = null // Set of days in the month where a session occurred. If null, uses Tutor format (✓)
): { dayData: Record<string, string>; rekap: number } => {
  const dayData: Record<string, string> = {};
  let rekap = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const hasActivity = items.some(item => {
      const raw = dateAccessor(item);
      if (!raw) return false;
      const dt = new Date(raw);
      return dt.getMonth() === currentMonth && dt.getFullYear() === currentYear && dt.getDate() === d;
    });

    if (sessionDates === null) {
      // Tutor mode: output ✓ or empty
      dayData["d" + d] = hasActivity ? "✓" : "";
      if (hasActivity) rekap++;
    } else {
      // Student mode: output H, A, or -
      if (hasActivity) {
        dayData["d" + d] = "H";
        rekap++;
      } else if (sessionDates.has(d)) {
        dayData["d" + d] = "A";
      } else {
        dayData["d" + d] = "-";
      }
    }
  }
  return { dayData, rekap };
};

// Helper: calculate final grade from components
const calculateGrade = (kehadiran: number, partisipasi: number, tugas: number) => {
  const final = (kehadiran * 0.2) + (partisipasi * 0.3) + (tugas * 0.5);
  const predikat = final >= 85 ? "A" : final >= 70 ? "B" : final >= 55 ? "C" : final >= 40 ? "D" : "E";
  return { final: Math.round(final * 10) / 10, predikat };
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
        return { success: false, message: error.message };
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
        const cleanHtml = body.description ? sanitizeHtml(body.description, {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['font', 'u', 'span']),
          allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            'font': ['size', 'color', 'face'],
            '*': ['style', 'class']
          }
        }) : undefined;

        const updateData: any = {};
        if (cleanHtml !== undefined) updateData.description = cleanHtml;
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
        return { success: false, message: error.message };
      }
    },
    {
      body: t.Object({
        description: t.Optional(t.String()),
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
            id: elearningEvaluationResponses.id,
            evaluationId: elearningEvaluationResponses.evaluationId,
            studentId: elearningEvaluationResponses.studentId,
            studentName: students.nama,
            courseId: elearningEvaluationResponses.courseId,
            courseName: elearningCourses.namaMapel,
            score: elearningEvaluationResponses.score,
            createdAt: elearningEvaluationResponses.createdAt,
          })
          .from(elearningEvaluationResponses)
          .innerJoin(students, eq(elearningEvaluationResponses.studentId, students.id))
          .leftJoin(elearningCourses, eq(elearningEvaluationResponses.courseId, elearningCourses.id))
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
        return { success: false, message: error.message };
      }
    }
  )

  // ==========================================
  // ELEARNING SETUPS
  // ==========================================

  // GET all setups (admin) or filtered by tutorId (tutor) or kelas (siswa)
  .get(
    "/setups",
    async (context: any) => {
      const { headers, jwt, query, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        let conditions: any[] = [];
        const authHeader = headers["authorization"];
        const token = authHeader!.split(" ")[1];
        const payload = await jwt.verify(token);

        if (payload.role === "tutor") {
          conditions.push(eq(elearningSetups.tutorId, payload.id as number));
        } else if (payload.role === "siswa" && query.kelas) {
          conditions.push(eq(elearningSetups.kelas, query.kelas));
        } else if (query.tutorId) {
          conditions.push(eq(elearningSetups.tutorId, parseInt(query.tutorId)));
        } else if (query.kelas) {
          conditions.push(eq(elearningSetups.kelas, query.kelas));
        }

        // Filter by semester if provided
        if (query.semester) {
          conditions.push(eq(elearningSetups.semester, query.semester));
        }

        const condition = conditions.length > 0 ? and(...conditions) : undefined;

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
        kelas: t.Optional(t.String()),
        semester: t.Optional(t.String()),
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
        const { kelas, mapel, tutorId, skk, jumlahSesi, semester } = body;
        const inserted = await db
          .insert(elearningSetups)
          .values({
            kelas,
            mapel,
            tutorId,
            skk,
            jumlahSesi,
            semester: semester || "Ganjil",
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
        semester: t.Optional(t.String()),
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
        const { kelas, mapel, tutorId, skk, jumlahSesi, semester } = body;
        const updated = await db
          .update(elearningSetups)
          .set({
            kelas,
            mapel,
            tutorId,
            skk,
            jumlahSesi,
            semester: semester || "Ganjil",
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
        semester: t.Optional(t.String()),
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
  )

  // ==========================================
  // NEW ENDPOINTS FOR REFACTORING
  // ==========================================

  // Toggle session isOpen (admin only)
  .put(
    "/session/:id/toggle",
    async (context: any) => {
      const { headers, jwt, params: { id }, body, set } = context;
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      try {
        await db
          .update(elearningSessions)
          .set({ isOpen: body.isOpen })
          .where(eq(elearningSessions.id, parseInt(id)));
        return { success: true, message: "Status sesi berhasil diubah" };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    },
    {
      body: t.Object({
        isOpen: t.Boolean(),
      }),
    }
  )

  // GET setups by student (dinamis berdasarkan rombel siswa)
  .get(
    "/setups/by-student/:studentId",
    async (context: any) => {
      const { headers, jwt, params: { studentId }, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const authHeader = headers["authorization"];
        const token = authHeader!.split(" ")[1];
        const payload = await jwt.verify(token);

        let finalStudentId = parseInt(studentId);
        if (payload && payload.role === "siswa") {
          finalStudentId = payload.id as number;
        }

        // Cari siswa
        const student = await db.select().from(students).where(eq(students.id, finalStudentId)).get();
        if (!student) return { success: false, message: "Siswa tidak ditemukan" };

        // Cari rombel siswa
        const rombelRel = await db.select().from(rombelStudents).where(eq(rombelStudents.studentId, student.id)).get();
        if (!rombelRel) return { success: true, data: [] }; // belum masuk rombel

        const rombel = await db.select().from(rombels).where(eq(rombels.id, rombelRel.rombelId)).get();
        if (!rombel) return { success: true, data: [] };

        // Ambil setup berdasarkan kelas rombel
        const setups = await db
          .select({
            setup: elearningSetups,
            tutorName: tutors.nama,
          })
          .from(elearningSetups)
          .leftJoin(tutors, eq(elearningSetups.tutorId, tutors.id))
          .where(eq(elearningSetups.kelas, rombel.nama))
          .all();

        return { success: true, data: setups };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  )

  // GET students by setup (untuk tutor melihat murid di kelasnya)
  .get(
    "/students-by-setup/:setupId",
    async (context: any) => {
      const { headers, jwt, params: { setupId }, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const setup = await db.select().from(elearningSetups).where(eq(elearningSetups.id, parseInt(setupId))).get();
        if (!setup) return { success: false, message: "Setup tidak ditemukan" };

        const rombelList = await db.select().from(rombels).where(eq(rombels.nama, setup.kelas)).all();
        if (rombelList.length === 0) return { success: true, data: [] };
        const rombelIds = rombelList.map((r) => r.id);

        const studentsInRombel = await db
          .select({
            id: students.id,
            nama: students.nama,
            nis: students.nis,
          })
          .from(students)
          .innerJoin(rombelStudents, eq(students.id, rombelStudents.studentId))
          .where(inArray(rombelStudents.rombelId, rombelIds))
          .all();

        return { success: true, data: studentsInRombel };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  )

  // GET forum posts
  .get(
    "/forum",
    async (context: any) => {
      const { headers, jwt, query, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        let condition;
        if (query.sessionId) {
          condition = eq(elearningForumPosts.sessionId, parseInt(query.sessionId));
        } else if (query.courseId) {
          condition = eq(elearningForumPosts.courseId, parseInt(query.courseId));
        } else {
          return { success: false, message: "sessionId atau courseId diperlukan" };
        }

        const posts = await db
          .select()
          .from(elearningForumPosts)
          .where(condition)
          .orderBy(elearningForumPosts.createdAt)
          .all();

        // Ambil data nama dari tutors dan students untuk enrich authorName
        const allTutors = await db.select().from(tutors).all();
        const allStudents = await db.select().from(students).all();

        const enrichedPosts = posts.map(post => {
          let authorName = "Unknown";
          if (post.authorRole === "tutor") {
            const tutor = allTutors.find(t => t.id === post.authorId);
            if (tutor) authorName = tutor.nama;
          } else {
            const student = allStudents.find(s => s.id === post.authorId);
            if (student) authorName = student.nama;
          }
          return {
            ...post,
            authorName
          };
        });

        return { success: true, data: enrichedPosts };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  )

  // POST forum post
  .post(
    "/forum",
    async (context: any) => {
      const { headers, jwt, body, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const { sessionId, courseId, content, parentId } = body;

        const authHeader = headers["authorization"];
        const token = authHeader!.split(" ")[1];
        const payload = await jwt.verify(token);

        const cleanHtml = sanitizeHtml(content, {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['font', 'u', 'span']),
          allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            'font': ['size', 'color', 'face'],
            '*': ['style', 'class']
          }
        });

        const inserted = await db
          .insert(elearningForumPosts)
          .values({
            sessionId,
            courseId,
            authorId: payload.id as number,
            authorRole: payload.role as string,
            content: cleanHtml,
            parentId: parentId || null,
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
        sessionId: t.Number(),
        courseId: t.Number(),
        content: t.String(),
        parentId: t.Optional(t.Nullable(t.Number())),
      }),
    }
  )

  // PUT update forum post
  .put(
    "/forum/:id",
    async (context: any) => {
      const { headers, jwt, params: { id }, body, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const authHeader = headers["authorization"];
        const token = authHeader!.split(" ")[1];
        const payload = await jwt.verify(token);

        const postId = parseInt(id);
        const existingPost = await db.select().from(elearningForumPosts).where(eq(elearningForumPosts.id, postId)).get();

        if (!existingPost) {
          set.status = 404;
          return { success: false, message: "Pesan tidak ditemukan" };
        }

        if (existingPost.authorId !== payload.id || existingPost.authorRole !== payload.role) {
          set.status = 403;
          return { success: false, message: "Tidak memiliki akses untuk mengubah pesan ini" };
        }

        const cleanHtml = sanitizeHtml(body.content, {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['font', 'u', 'span']),
          allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            'font': ['size', 'color', 'face'],
            '*': ['style', 'class']
          }
        });

        const updated = await db
          .update(elearningForumPosts)
          .set({ content: cleanHtml })
          .where(eq(elearningForumPosts.id, postId))
          .returning();

        return { success: true, data: updated[0] };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    },
    {
      body: t.Object({
        content: t.String(),
      }),
    }
  )

  // DELETE forum post
  .delete(
    "/forum/:id",
    async (context: any) => {
      const { headers, jwt, params: { id }, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const authHeader = headers["authorization"];
        const token = authHeader!.split(" ")[1];
        const payload = await jwt.verify(token);

        const postId = parseInt(id);
        const existingPost = await db.select().from(elearningForumPosts).where(eq(elearningForumPosts.id, postId)).get();

        if (!existingPost) {
          set.status = 404;
          return { success: false, message: "Pesan tidak ditemukan" };
        }

        if (existingPost.authorId !== payload.id || existingPost.authorRole !== payload.role) {
          set.status = 403;
          return { success: false, message: "Tidak memiliki akses untuk menghapus pesan ini" };
        }

        // Delete children (replies) if any, then the post itself
        await db.delete(elearningForumPosts).where(eq(elearningForumPosts.parentId, postId));
        await db.delete(elearningForumPosts).where(eq(elearningForumPosts.id, postId));

        return { success: true, message: "Pesan berhasil dihapus" };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  )

  // GET & POST attendance
  .get(
    "/attendance",
    async (context: any) => {
      const { headers, jwt, query, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const { sessionId, studentId } = query;
        if (studentId) {
          const record = await db
            .select()
            .from(elearningAttendances)
            .where(and(
              eq(elearningAttendances.sessionId, parseInt(sessionId)),
              eq(elearningAttendances.studentId, parseInt(studentId))
            ))
            .get();
          return { success: true, data: record || null };
        } else {
          // Jika studentId tidak ada (mis. dipanggil Tutor), ambil semua data absensi di sesi ini + nama siswa
          const records = await db
            .select({
              id: elearningAttendances.id,
              sessionId: elearningAttendances.sessionId,
              studentId: elearningAttendances.studentId,
              createdAt: elearningAttendances.createdAt,
              studentName: students.nama
            })
            .from(elearningAttendances)
            .innerJoin(students, eq(elearningAttendances.studentId, students.id))
            .where(eq(elearningAttendances.sessionId, parseInt(sessionId)))
            .all();
          return { success: true, data: records || [] };
        }
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  )
  .post(
    "/attendance",
    async (context: any) => {
      const { headers, jwt, body, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const { sessionId } = body;

        const authHeader = headers["authorization"];
        const token = authHeader!.split(" ")[1];
        const payload = await jwt.verify(token);

        let studentId = body.studentId;
        if (payload && payload.role === "siswa") {
          studentId = payload.id as number;
        } else if (!studentId) {
          return { success: false, message: "studentId diperlukan" };
        }
        const existing = await db
          .select()
          .from(elearningAttendances)
          .where(and(
            eq(elearningAttendances.sessionId, sessionId),
            eq(elearningAttendances.studentId, studentId)
          ))
          .get();

        if (existing) return { success: true, data: existing };

        const inserted = await db
          .insert(elearningAttendances)
          .values({ sessionId, studentId })
          .returning();

        return { success: true, data: inserted[0] };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    },
    {
      body: t.Object({
        sessionId: t.Number(),
        studentId: t.Number(),
      }),
    }
  )

  // GET Monitoring Tutors
  .get(
    "/monitoring/tutors",
    async (context: any) => {
      const { headers, jwt, set } = context;
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      try {
        const tutorsList = await db.select().from(tutors).all();

        // Enrich tutors with stats
        const allPosts = await db.select().from(elearningForumPosts).where(eq(elearningForumPosts.authorRole, "tutor")).all();
        const allSetups = await db.select().from(elearningSetups).all();
        const allCourses = await db.select().from(elearningCourses).all();
        const allSessions = await db.select().from(elearningSessions).all();
        const allAssignments = await db.select().from(elearningAssignments).all();
        const allSubmissions = await db.select().from(elearningSubmissions).where(isNull(elearningSubmissions.grade)).all();

        const enrichedTutors = tutorsList.map(tutor => {
          // 1. diskusiCount (posts made by this tutor)
          const diskusiCount = allPosts.filter(p => p.authorId == tutor.id && p.authorRole === "tutor").length;

          // 2. tugasBelumDinilai
          const tutorSetups = allSetups.filter(s => s.tutorId === tutor.id);

          const tutorCourseIds = allCourses.filter(c =>
            tutorSetups.some(s => s.mapel === c.namaMapel && s.kelas === c.kelas)
          ).map(c => c.id);

          const tutorSessionIds = allSessions.filter(s => tutorCourseIds.includes(s.courseId)).map(s => s.id);
          const tutorAssignmentIds = allAssignments.filter(a => tutorSessionIds.includes(a.sessionId)).map(a => a.id);

          const tugasBelumDinilai = allSubmissions.filter(s =>
            tutorAssignmentIds.includes(s.assignmentId) && (s.grade === null || s.grade === undefined)
          ).length;

          return {
            ...tutor,
            jumlahKelas: tutorSetups.length,
            diskusiCount,
            tugasBelumDinilai
          };
        });

        return { success: true, data: enrichedTutors };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  )

  // GET Monitoring Students
  .get(
    "/monitoring/students",
    async (context: any) => {
      const { headers, jwt, set } = context;
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      try {
        const studentsList = await db
          .select({
            id: students.id,
            nama: students.nama,
            nis: students.nis,
            kelas: rombels.nama,
          })
          .from(students)
          .innerJoin(rombelStudents, eq(students.id, rombelStudents.studentId))
          .innerJoin(rombels, eq(rombelStudents.rombelId, rombels.id))
          .all();

        // Calculate stats — fetch only what's needed via targeted queries
        const allPosts = await db.select().from(elearningForumPosts).where(eq(elearningForumPosts.authorRole, "siswa")).all();
        const allAttendances = await db.select().from(elearningAttendances).all();

        // Fetch graded submissions for tugas count and avg score
        const allGradedSubs = await db.select({
          studentId: elearningSubmissions.studentId,
          grade: elearningSubmissions.grade,
        }).from(elearningSubmissions).all();

        const enhancedStudents = studentsList.map(s => {
          const studentPosts = allPosts.filter(p => p.authorId === s.id && p.authorRole === "siswa");
          const kehadiranCount = allAttendances.filter(a => a.studentId === s.id).length;
          const studentGrades = allGradedSubs
            .filter(sub => sub.studentId === s.id && sub.grade != null)
            .map(sub => sub.grade as number);

          return {
            ...s,
            forumCount: studentPosts.length,
            kehadiranCount,
            tugasCount: studentGrades.length,
            avgScore: studentGrades.length > 0
              ? Math.round(studentGrades.reduce((a, b) => a + b, 0) / studentGrades.length * 10) / 10
              : 0,
          };
        });

        return { success: true, data: enhancedStudents };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  )

  // GET Grades for a Setup
  .get(
    "/grades",
    async (context: any) => {
      const { headers, jwt, query, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const setupId = parseInt(query.setupId, 10);
        if (!setupId) return { success: false, message: "setupId diperlukan" };

        const setup = await db.select().from(elearningSetups).where(eq(elearningSetups.id, setupId)).get();
        if (!setup) return { success: false, message: "Setup tidak ditemukan" };

        const actualSubject = setup.mapel;
        const actualProgram = deriveProgram(setup.kelas);

        const course = await db.select().from(elearningCourses)
          .where(and(eq(elearningCourses.namaMapel, actualSubject), eq(elearningCourses.program, actualProgram)))
          .get();

        const studentsList = await db
          .select({
            id: students.id,
            nama: students.nama,
            nis: students.nis,
            kelas: rombels.nama,
          })
          .from(students)
          .innerJoin(rombelStudents, eq(students.id, rombelStudents.studentId))
          .innerJoin(rombels, eq(rombelStudents.rombelId, rombels.id))
          .where(eq(rombels.nama, setup.kelas))
          .all();

        const courseId = course ? course.id : null;
        const defaultSessions = setup.jumlahSesi && setup.jumlahSesi > 0 ? setup.jumlahSesi : 8;

        let allSessionIds: number[] = [];
        let sessionsMap: Record<number, number> = {};
        let allAttendances: any[] = [];
        let allForumPosts: any[] = [];
        let allSubmissions: any[] = [];
        let allAssignments: any[] = [];

        if (courseId) {
          const sessions = await db.select().from(elearningSessions).where(eq(elearningSessions.courseId, courseId)).all();
          allSessionIds = sessions.map(s => s.id);
          sessions.forEach(s => {
            sessionsMap[s.id] = s.sessionNumber;
          });

          if (allSessionIds.length > 0) {
            allAttendances = await db.select().from(elearningAttendances)
              .where(inArray(elearningAttendances.sessionId, allSessionIds))
              .all();

            allForumPosts = await db.select().from(elearningForumPosts)
              .where(and(
                eq(elearningForumPosts.courseId, courseId),
                eq(elearningForumPosts.authorRole, "siswa"),
                inArray(elearningForumPosts.sessionId, allSessionIds)
              ))
              .all();

            // Graded assignment submissions for this course's sessions
            allAssignments = await db.select().from(elearningAssignments)
              .where(inArray(elearningAssignments.sessionId, allSessionIds))
              .all();
            const assignmentIds = allAssignments.map(a => a.id);
            if (assignmentIds.length > 0) {
              allSubmissions = await db.select().from(elearningSubmissions)
                .where(inArray(elearningSubmissions.assignmentId, assignmentIds))
                .all();
            }
          }
        }

        const results = studentsList.map((student) => {
          let kehadiran = 0;
          let partisipasi = 0;
          let tugas = 0;

          const detailKehadiran: any[] = [];
          const detailDiskusi: any[] = [];
          const detailTugas: any[] = [];
          const sessionsCount = allSessionIds.length > 0 ? allSessionIds.length : defaultSessions;

          if (courseId && allSessionIds.length > 0) {
            const attendedSessions = new Set(
              allAttendances.filter(a => a.studentId === student.id).map(a => a.sessionId)
            );
            kehadiran = Math.min(100, Math.round((attendedSessions.size / sessionsCount) * 100));

            const participatedSessions = new Set(
              allForumPosts.filter(p => p.authorId === student.id).map(p => p.sessionId)
            );
            partisipasi = Math.min(100, Math.round((participatedSessions.size / sessionsCount) * 100));

            const studentSubmissions = allSubmissions.filter(s => s.studentId === student.id);
            const studentGrades = studentSubmissions
              .filter(s => s.grade != null)
              .map(s => s.grade as number);
            if (studentGrades.length > 0) {
              tugas = Math.min(100, Math.round(studentGrades.reduce((a, b) => a + b, 0) / studentGrades.length));
            }

            // Build per-session details (1 to sessionsCount)
            for (let i = 1; i <= sessionsCount; i++) {
              // Find session id for this session number
              const sessIdStr = Object.keys(sessionsMap).find(key => sessionsMap[parseInt(key)] === i);
              const sessId = sessIdStr ? parseInt(sessIdStr) : null;

              if (sessId) {
                detailKehadiran.push({
                  sessionNumber: i,
                  hadir: attendedSessions.has(sessId)
                });

                detailDiskusi.push({
                  sessionNumber: i,
                  ikutDiskusi: participatedSessions.has(sessId)
                });

                const assignForSess = allAssignments.find(a => a.sessionId === sessId);
                if (assignForSess) {
                  const subForAssign = studentSubmissions.find(s => s.assignmentId === assignForSess.id);
                  detailTugas.push({
                    sessionNumber: i,
                    grade: subForAssign?.grade ?? null,
                    feedback: subForAssign?.feedback ?? null
                  });
                } else {
                  detailTugas.push({
                    sessionNumber: i,
                    grade: null,
                    feedback: null
                  });
                }
              } else {
                detailKehadiran.push({ sessionNumber: i, hadir: false });
                detailDiskusi.push({ sessionNumber: i, ikutDiskusi: false });
                detailTugas.push({ sessionNumber: i, grade: null, feedback: null });
              }
            }
          } else {
            for (let i = 1; i <= sessionsCount; i++) {
              detailKehadiran.push({ sessionNumber: i, hadir: false });
              detailDiskusi.push({ sessionNumber: i, ikutDiskusi: false });
              detailTugas.push({ sessionNumber: i, grade: null, feedback: null });
            }
          }

          const { final, predikat } = calculateGrade(kehadiran, partisipasi, tugas);

          return {
            id: student.id,
            nama: student.nama,
            kelas: student.kelas,
            kehadiran,
            partisipasi,
            tugas,
            final,
            predikat,
            detailKehadiran,
            detailDiskusi,
            detailTugas,
            sessionsCount
          };
        });

        return { success: true, data: results };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  )

  // GET Tutor Stats
  .get(
    "/tutor-stats",
    async (context: any) => {
      const { headers, jwt, set } = context;
      const authError = await verifyAdminOrTutor(headers, jwt, set);
      if (authError) return authError;

      try {
        const authHeader = headers["authorization"];
        const token = authHeader.split(" ")[1];
        const payload = await jwt.verify(token);
        const tutorId = payload.id;

        const setups = await db.select().from(elearningSetups).where(eq(elearningSetups.tutorId, tutorId)).all();
        const mapelAktif = setups.length;

        // Tugas Masuk from elearningEvaluations (Phase 4 mock, return 0)
        const tugasMasuk = 0;
        const ip = "0.0"; // Placeholder

        return { success: true, data: { mapelAktif, tugasMasuk, ip } };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  )

  // GET Siswa Stats
  .get(
    "/siswa-stats",
    async (context: any) => {
      const { headers, jwt, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const authHeader = headers["authorization"];
        const token = authHeader.split(" ")[1];
        const payload = await jwt.verify(token);

        // Get student's class (rombel)
        const studentInfo = await db.select({ kelas: rombels.nama })
          .from(students)
          .innerJoin(rombelStudents, eq(students.id, rombelStudents.studentId))
          .innerJoin(rombels, eq(rombelStudents.rombelId, rombels.id))
          .where(eq(students.id, payload.id))
          .get();

        let mapelAktif = 0;
        if (studentInfo) {
          const setups = await db.select().from(elearningSetups).where(eq(elearningSetups.kelas, studentInfo.kelas)).all();
          mapelAktif = setups.length;
        }

        const tugasMasuk = 0;
        const ip = "0.0"; // Placeholder

        return { success: true, data: { mapelAktif, tugasMasuk, ip } };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  )

  // GET Submissions
  .get(
    "/submissions/:sessionId",
    async (context: any) => {
      const { headers, jwt, params: { sessionId }, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const sId = parseInt(sessionId);
        // Find if there is an assignment for this session
        let assignment = await db.select().from(elearningAssignments).where(eq(elearningAssignments.sessionId, sId)).get();

        if (!assignment) {
          return { success: true, data: [] };
        }

        const submissions = await db.select({
          id: elearningSubmissions.id,
          studentId: elearningSubmissions.studentId,
          studentName: students.nama,
          fileUrl: elearningSubmissions.fileUrl,
          grade: elearningSubmissions.grade,
          feedback: elearningSubmissions.feedback,
          submittedAt: elearningSubmissions.submittedAt,
        })
          .from(elearningSubmissions)
          .leftJoin(students, eq(elearningSubmissions.studentId, students.id))
          .where(eq(elearningSubmissions.assignmentId, assignment.id))
          .all();

        return { success: true, data: submissions };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  )

  // POST Submission
  .post(
    "/submissions/:sessionId",
    async (context: any) => {
      const { headers, jwt, params: { sessionId }, body, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const authHeader = headers["authorization"];
        const token = authHeader!.split(" ")[1];
        const payload = await jwt.verify(token);

        if (!payload || payload.role !== "siswa") {
          return { success: false, message: "Hanya siswa yang dapat mengumpulkan tugas" };
        }
        const studentId = payload.id;
        const sId = parseInt(sessionId);
        const { fileUrl } = body as { fileUrl: string };

        // Ensure there is an assignment for this session
        let assignment = await db.select().from(elearningAssignments).where(eq(elearningAssignments.sessionId, sId)).get();
        if (!assignment) {
          const insertResult = await db.insert(elearningAssignments).values({
            sessionId: sId,
            title: `Tugas Sesi ${sId}`,
            description: "",
            fileUrl: ""
          }).returning();
          assignment = insertResult[0];
        }

        const existing = await db.select().from(elearningSubmissions)
          .where(and(
            eq(elearningSubmissions.assignmentId, assignment.id),
            eq(elearningSubmissions.studentId, studentId)
          )).get();

        if (existing) {
          await db.update(elearningSubmissions).set({ fileUrl, submittedAt: new Date().toISOString() })
            .where(eq(elearningSubmissions.id, existing.id));
        } else {
          await db.insert(elearningSubmissions).values({
            assignmentId: assignment.id,
            studentId,
            fileUrl
          });
        }

        return { success: true, message: "Berhasil mengumpulkan tugas" };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  )

  // PUT Grade Submission
  .put(
    "/submissions/:submissionId/grade",
    async (context: any) => {
      const { headers, jwt, params: { submissionId }, body, set } = context;
      const authError = await verifyAdminOrTutor(headers, jwt, set);
      if (authError) return authError;

      try {
        const subId = parseInt(submissionId);
        const { grade, feedback } = body as { grade: number; feedback?: string };
        await db.update(elearningSubmissions).set({ grade, feedback, gradedAt: new Date().toISOString() }).where(eq(elearningSubmissions.id, subId));
        return { success: true, message: "Berhasil memberikan nilai" };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    },
    {
      body: t.Object({
        grade: t.Number(),
        feedback: t.Optional(t.String()),
      })
    }
  )

  // === LATIHAN MANDIRI (QUIZ) ===
  .get(
    "/quiz/:sessionId",
    async (context: any) => {
      const { headers, jwt, params: { sessionId }, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const sId = parseInt(sessionId);

        const authHeader = headers["authorization"];
        const token = authHeader!.split(" ")[1];
        const payload = await jwt.verify(token);
        const studentId = payload?.role === "siswa" ? payload.id as number : null;

        const questions = await db.select().from(elearningQuestions).where(eq(elearningQuestions.sessionId, sId)).all();

        let submission = null;
        if (studentId) {
          submission = await db.select().from(elearningQuizSubmissions).where(and(eq(elearningQuizSubmissions.sessionId, sId), eq(elearningQuizSubmissions.studentId, studentId))).get();
        }

        return { success: true, data: { questions, submission } };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  )
  .post(
    "/quiz/:sessionId",
    async (context: any) => {
      const { headers, jwt, params: { sessionId }, body, set } = context;
      const authError = await verifyAdminOrTutor(headers, jwt, set);
      if (authError) return authError;

      try {
        const sId = parseInt(sessionId);
        const { questions } = body as { questions: any[] };

        // Delete existing questions and their corresponding submissions
        await db.delete(elearningQuestions).where(eq(elearningQuestions.sessionId, sId));
        await db.delete(elearningQuizSubmissions).where(eq(elearningQuizSubmissions.sessionId, sId));

        // Insert new ones
        if (questions && questions.length > 0) {
          const inserts = questions.map((q: any) => ({
            sessionId: sId,
            question: q.question,
            options: JSON.stringify(q.options),
            correctAnswer: q.correctAnswer
          }));
          await db.insert(elearningQuestions).values(inserts);
        }
        return { success: true, message: "Soal latihan berhasil disimpan" };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  )
  .post(
    "/quiz/:sessionId/submit",
    async (context: any) => {
      const { headers, jwt, params: { sessionId }, body, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const authHeader = headers["authorization"];
        const token = authHeader!.split(" ")[1];
        const payload = await jwt.verify(token);

        if (!payload || payload.role !== "siswa") {
          return { success: false, message: "Hanya siswa yang dapat mensubmit kuis" };
        }
        const studentId = payload.id as number;
        const sId = parseInt(sessionId);
        const { answers } = body as { answers: number[] };

        const questions = await db.select().from(elearningQuestions).where(eq(elearningQuestions.sessionId, sId)).all();

        if (questions.length === 0) {
          return { success: false, message: "Soal kuis tidak ditemukan" };
        }

        let correct = 0;
        for (let i = 0; i < questions.length; i++) {
          if (answers[i] === questions[i].correctAnswer) correct++;
        }

        const grade = Math.round((correct / questions.length) * 100);

        const existing = await db.select().from(elearningQuizSubmissions).where(and(eq(elearningQuizSubmissions.sessionId, sId), eq(elearningQuizSubmissions.studentId, studentId))).get();

        if (existing) {
          await db.update(elearningQuizSubmissions).set({ grade }).where(eq(elearningQuizSubmissions.id, existing.id));
        } else {
          await db.insert(elearningQuizSubmissions).values({ sessionId: sId, studentId, grade });
        }

        return { success: true, message: "Jawaban berhasil disubmit", grade };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  )

  // === COMPLETIONS ===
  .get(
    "/completions/:setupId",
    async (context: any) => {
      const { headers, jwt, params: { setupId }, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const authHeader = headers["authorization"];
        const token = authHeader!.split(" ")[1];
        const payload = await jwt.verify(token);

        if (!payload || payload.role !== "siswa") {
          return { success: false, message: "Hanya siswa yang dapat mengakses progress completion" };
        }

        const completions = await db.select().from(elearningSectionCompletions)
          .where(and(
            eq(elearningSectionCompletions.setupId, parseInt(setupId)),
            eq(elearningSectionCompletions.studentId, payload.id as number)
          )).all();

        return { success: true, data: completions };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  )
  .post(
    "/completions",
    async (context: any) => {
      const { headers, jwt, body, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const { setupId, sectionKey } = body;

        const authHeader = headers["authorization"];
        const token = authHeader!.split(" ")[1];
        const payload = await jwt.verify(token);

        if (!payload || payload.role !== "siswa") {
          return { success: false, message: "Hanya siswa yang dapat mensubmit completion" };
        }
        const studentId = payload.id as number;

        const existing = await db.select().from(elearningSectionCompletions)
          .where(and(
            eq(elearningSectionCompletions.setupId, setupId),
            eq(elearningSectionCompletions.studentId, studentId),
            eq(elearningSectionCompletions.sectionKey, sectionKey)
          )).get();

        if (!existing) {
          await db.insert(elearningSectionCompletions).values({
            studentId,
            setupId,
            sectionKey
          });
        }

        return { success: true, message: "Berhasil menyimpan progress" };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    },
    {
      body: t.Object({
        setupId: t.Number(),
        sectionKey: t.String()
      })
    }
  )
  .get(
    "/completions/progress/:setupId",
    async (context: any) => {
      const { headers, jwt, params: { setupId }, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const authHeader = headers["authorization"];
        const token = authHeader!.split(" ")[1];
        const payload = await jwt.verify(token);

        if (!payload || payload.role !== "siswa") {
          return { success: false, message: "Hanya siswa yang dapat mengakses progress" };
        }

        const studentId = payload.id as number;
        const setupIdNum = parseInt(setupId);

        const setup = await db.select().from(elearningSetups).where(eq(elearningSetups.id, setupIdNum)).get();
        if (!setup) return { success: false, message: "Setup tidak ditemukan" };

        // Asumsi section pendahuluan ada 4 (RAT, Tata Tertib, Perkenalan, Inisiasi)
        // Dan tiap sesi ada (Kehadiran, Pengantar, Materi Inisiasi, Pengayaan, Diskusi, Latihan, Tugas) = 7
        const totalSections = 4 + (setup.jumlahSesi * 7);

        const completions = await db.select().from(elearningSectionCompletions)
          .where(and(
            eq(elearningSectionCompletions.setupId, setupIdNum),
            eq(elearningSectionCompletions.studentId, studentId)
          )).all();

        const completedSections = completions.length;
        const progress = Math.min(100, Math.round((completedSections / totalSections) * 100));

        return { success: true, progress, completedSections, totalSections };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  )

  // ==========================================
  // LAPORAN TEMPLATE DOWNLOADS
  // ==========================================

  // GET Laporan Kehadiran Tutor (xlsx template)
  .get(
    "/laporan/tutor-attendance",
    async (context: any) => {
      const { headers, jwt, query, set } = context;
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      try {
        const filterKelas = query.kelas && query.kelas !== "Semua" ? query.kelas : null;
        const filterLevel = query.level && query.level !== "Semua" ? query.level : null;

        const allSetups = await db.select().from(elearningSetups).all();
        let filteredSetups = allSetups;
        if (filterKelas) {
          filteredSetups = allSetups.filter(s => s.kelas === filterKelas);
        } else if (filterLevel) {
          filteredSetups = allSetups.filter(s => s.kelas.replace(/[A-Z]$/, "") === filterLevel);
        }

        // Ambil tutor yang punya setup di kelas tersebut
        const tutorIds = [...new Set(filteredSetups.map(s => s.tutorId))];
        const tutorsList = (filterKelas || filterLevel)
          ? (await db.select().from(tutors).all()).filter(t => tutorIds.includes(t.id))
          : await db.select().from(tutors).all();

        const allPosts = await db.select().from(elearningForumPosts).where(eq(elearningForumPosts.authorRole, "tutor")).all();
        const allTutorAttendances = await db.select().from(tutorAttendances).all();

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        const tutorsData = tutorsList.map((tutor, idx) => {
          const tutorSetups = filteredSetups.filter(s => s.tutorId === tutor.id);
          const mapel = tutorSetups.length > 0 ? tutorSetups.map(s => s.mapel).join(", ") : "-";
          const kelas = tutorSetups.length > 0 ? tutorSetups.map(s => s.kelas).join(", ") : "-";
          const tutorPosts = allPosts.filter(p => p.authorId === tutor.id && p.authorRole === "tutor");
          const tutorAtt = allTutorAttendances.filter(a => a.tutorId === tutor.id);

          // Gabungkan aktivitas dari forum posts dan tutor_attendances
          const allActivities = [...tutorPosts, ...tutorAtt];

          const { dayData, rekap } = buildAttendanceGrid(
            allActivities, item => item.createdAt || item.date, currentMonth, currentYear, daysInMonth
          );
          return { no: idx + 1, namaTutor: tutor.nama, mapel, kelas, ...dayData, rekap };
        });

        // Derive program, semester from filtered setups
        const programCounts = new Map<string, number>();
        const semesterCounts = new Map<string, number>();
        for (const s of filteredSetups) {
          const prog = deriveProgram(s.kelas);
          programCounts.set(prog, (programCounts.get(prog) || 0) + 1);
          const sem = s.semester || "Ganjil";
          semesterCounts.set(sem, (semesterCounts.get(sem) || 0) + 1);
        }
        const program = [...programCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Paket C";
        const semester = [...semesterCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Ganjil";

        const kepalaPkbm = await db.select().from(managers).where(
          or(
            like(managers.jabatan, "%Kepala%"),
            like(managers.jabatan, "%Ketua%")
          )
        ).get();
        const namaKepalaPkbm = kepalaPkbm?.nama || "-";

        // Ambil wali kelas dari rombel
        let namaWaliKelas = "-";
        let waliKelasLabel = "-";
        if (filterKelas) {
          // Filter spesifik kelas (misal XA)
          waliKelasLabel = filterKelas;
          const rombel = await db.select().from(rombels).where(eq(rombels.nama, filterKelas)).get();
          if (rombel?.waliKelasId) {
            const wali = await db.select().from(tutors).where(eq(tutors.id, rombel.waliKelasId)).get();
            namaWaliKelas = wali?.nama || "-";
          }
        } else if (filterLevel) {
          // Filter level (misal X) → ambil wali kelas dari rombel pertama di level tsb
          waliKelasLabel = filterLevel;
          const allRombels = await db.select().from(rombels).all();
          const levelRombels = allRombels.filter(r => r.nama.replace(/[A-Z]$/, "") === filterLevel).sort((a, b) => a.nama.localeCompare(b.nama));
          if (levelRombels.length > 0) {
            const firstRombel = levelRombels[0];
            if (firstRombel.waliKelasId) {
              const wali = await db.select().from(tutors).where(eq(tutors.id, firstRombel.waliKelasId)).get();
              namaWaliKelas = wali?.nama || "-";
            }
          }
        }

        // Label kelas untuk template
        const kelasLabel = filterKelas
          ? filterKelas.toUpperCase()
          : filterLevel
            ? `KELAS ${filterLevel.toUpperCase()}`
            : "SEMUA KELAS";

        const buffer = fillTemplate("DAFTAR HADIR TUTOR.xlsx", {
          program: program.toUpperCase(), semester: semester.toUpperCase(),
          tahunAjaran: currentYear + "/" + (currentYear + 1),
          kelas: kelasLabel,
          bulan: now.toLocaleDateString("id-ID", { month: "long" }).toUpperCase(),
          waliKelas: waliKelasLabel.toUpperCase(), namaWaliKelas: namaWaliKelas.toUpperCase(),
          tanggalCetak: now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }).toUpperCase(),
          kecamatan: "JATINAGARA", namaPkbm: "MENUJU MAKMUR",
          nipPemilik: "-", nipKepalaPkbm: "-", nipWaliKelas: "-",
          namaKepalaPkbm: namaKepalaPkbm.toUpperCase(), namaPemilik: "-",
          tutors: tutorsData.map(t => ({
            ...t,
            namaTutor: t.namaTutor.toUpperCase(),
            mapel: t.mapel.toUpperCase(),
            kelas: t.kelas.toUpperCase(),
          })),
        });

        set.headers = {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": "attachment; filename=\"laporan_kehadiran_tutor_" + currentYear + "_" + (currentMonth + 1) + ".xlsx\"",
        };
        return buffer;
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  )

  // GET Laporan Kehadiran WB Per Mapel (xlsx template)
  .get(
    "/laporan/student-attendance",
    async (context: any) => {
      const { headers, jwt, query, set } = context;
      const authError = await verifyAdminOrTutor(headers, jwt, set);
      if (authError) return authError;

      try {
        const setupId = query.setupId ? parseInt(query.setupId, 10) : null;
        if (!setupId) { set.status = 400; return { success: false, message: "setupId diperlukan" }; }

        const setup = await db.select().from(elearningSetups).where(eq(elearningSetups.id, setupId)).get();
        if (!setup) { set.status = 404; return { success: false, message: "Setup tidak ditemukan" }; }

        const tutor = await db.select().from(tutors).where(eq(tutors.id, setup.tutorId)).get();
        const program = deriveProgram(setup.kelas);
        const course = await db.select().from(elearningCourses)
          .where(and(eq(elearningCourses.namaMapel, setup.mapel), eq(elearningCourses.program, program))).get();

        const rombelList = await db.select().from(rombels).where(eq(rombels.nama, setup.kelas)).all();
        const rombelIds = rombelList.map(r => r.id);
        const studentsList = rombelIds.length > 0 ? await db
          .select({ id: students.id, nama: students.nama, nis: students.nis, nisn: students.nisn, jenisKelamin: students.jenisKelamin })
          .from(students).innerJoin(rombelStudents, eq(students.id, rombelStudents.studentId))
          .where(inArray(rombelStudents.rombelId, rombelIds)).all() : [];

        const sessionsList = course ? await db.select().from(elearningSessions).where(eq(elearningSessions.courseId, course.id)).all() : [];
        const sessionIds = sessionsList.map(s => s.id);
        const attendances = sessionIds.length > 0 ? await db.select().from(elearningAttendances)
          .where(inArray(elearningAttendances.sessionId, sessionIds)).all() : [];

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        const sessionDates = new Set<number>();
        sessionsList.forEach(s => {
          if (s.startDate) {
            const dt = new Date(s.startDate);
            if (dt.getMonth() === currentMonth && dt.getFullYear() === currentYear) {
              sessionDates.add(dt.getDate());
            }
          }
        });

        const siswaData = studentsList.map((student, idx) => {
          const studentAtt = attendances.filter(a => a.studentId === student.id);
          const { dayData, rekap } = buildAttendanceGrid(
            studentAtt, a => a.attendedAt || a.createdAt, currentMonth, currentYear, daysInMonth, sessionDates
          );
          return { no: idx + 1, nis: student.nis || "", nisn: student.nisn || "", namaSiswa: student.nama, jenisKelamin: student.jenisKelamin || "", rombel: setup.kelas, ...dayData, rekap };
        });

        const buffer = fillTemplate("DAFTAR HADIR WARGA BELAJAR PER MAPEL.xlsx", {
          program: program.toUpperCase(), semester: (setup.semester || "Ganjil").toUpperCase(),
          tahunAjaran: currentYear + "/" + (currentYear + 1),
          mapel: setup.mapel.toUpperCase(), kelas: setup.kelas.toUpperCase(),
          namaTutor: (tutor?.nama || "-").toUpperCase(),
          bulan: now.toLocaleDateString("id-ID", { month: "long", year: "numeric" }).toUpperCase(),
          tanggalCetak: now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }).toUpperCase(),
          nipTutor: "-",
          siswa: siswaData.map(s => ({ ...s, namaSiswa: s.namaSiswa.toUpperCase(), jenisKelamin: s.jenisKelamin.toUpperCase(), rombel: s.rombel.toUpperCase() })),
        });

        set.headers = {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": "attachment; filename=\"kehadiran_wb_" + sanitizeFilename(setup.mapel) + "_" + currentYear + "_" + (currentMonth + 1) + ".xlsx\"",
        };
        return buffer;
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  )

  // GET Laporan Kehadiran WB Rekap (xlsx template)
  .get(
    "/laporan/student-attendance-rekap",
    async (context: any) => {
      const { headers, jwt, query, set } = context;
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      try {
        const filterKelas = query.kelas && query.kelas !== "Semua" ? query.kelas : null;
        const filterLevel = query.level && query.level !== "Semua" ? query.level : null;

        // Cari rombel berdasarkan filter
        const allRombels = await db.select().from(rombels).all();
        let rombelList: typeof allRombels;
        if (filterKelas) {
          rombelList = allRombels.filter(r => r.nama === filterKelas);
        } else if (filterLevel) {
          rombelList = allRombels.filter(r => r.nama.replace(/[A-Z]$/, "") === filterLevel);
        } else {
          set.status = 400;
          return { success: false, message: "kelas atau level diperlukan" };
        }

        const rombelIds = rombelList.map(r => r.id);
        const studentsListRaw = rombelIds.length > 0 ? await db
          .select({ id: students.id, nama: students.nama, nis: students.nis, nisn: students.nisn, jenisKelamin: students.jenisKelamin })
          .from(students).innerJoin(rombelStudents, eq(students.id, rombelStudents.studentId))
          .where(inArray(rombelStudents.rombelId, rombelIds)).all() : [];
        const studentsList = studentsListRaw.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

        const setups = filterKelas
          ? await db.select().from(elearningSetups).where(eq(elearningSetups.kelas, filterKelas)).all()
          : await db.select().from(elearningSetups).all();
        const filteredSetups = filterLevel && !filterKelas
          ? setups.filter(s => s.kelas.replace(/[A-Z]$/, "") === filterLevel)
          : setups;
        if (filteredSetups.length === 0) {
          set.status = 404;
          return { success: false, message: "Tidak ditemukan setup elearning untuk kelas tersebut" };
        }
        // Batch course lookup using Drizzle or()
        const courseConditions = filteredSetups.map(s => and(
          eq(elearningCourses.namaMapel, s.mapel),
          eq(elearningCourses.program, deriveProgram(s.kelas))
        ));
        const allCourses = courseConditions.length > 0
          ? await db.select().from(elearningCourses).where(
              courseConditions.length === 1 ? courseConditions[0] : or(...courseConditions)
            ).all()
          : [];
        const courseIds: number[] = [];
        for (const s of filteredSetups) {
          const prog = deriveProgram(s.kelas);
          const c = allCourses.find(c => c.namaMapel === s.mapel && c.program === prog);
          if (c) courseIds.push(c.id);
        }
        const allSessions = courseIds.length > 0 ? await db.select().from(elearningSessions)
          .where(inArray(elearningSessions.courseId, courseIds)).all() : [];
        const sessionIds = allSessions.map(s => s.id);
        const allAttendances = sessionIds.length > 0 ? await db.select().from(elearningAttendances)
          .where(inArray(elearningAttendances.sessionId, sessionIds)).all() : [];

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        const sessionDates = new Set<number>();
        allSessions.forEach(s => {
          if (s.startDate) {
            const dt = new Date(s.startDate);
            if (dt.getMonth() === currentMonth && dt.getFullYear() === currentYear) {
              sessionDates.add(dt.getDate());
            }
          }
        });

        const waliKelas = rombelList.length > 0 && rombelList[0].waliKelasId
          ? (await db.select().from(tutors).where(eq(tutors.id, rombelList[0].waliKelasId)).get())?.nama || "-" : "-";

        // Label kelas untuk template (declared before usage)
        const kelasLabel = filterKelas
          ? filterKelas.toUpperCase()
          : filterLevel
            ? `KELAS ${filterLevel.toUpperCase()}`
            : "-";

        const siswaData = studentsList.map((student, idx) => {
          const studentAtt = allAttendances.filter(a => a.studentId === student.id);
          const { dayData, rekap } = buildAttendanceGrid(
            studentAtt, a => a.attendedAt || a.createdAt, currentMonth, currentYear, daysInMonth, sessionDates
          );
          return { no: idx + 1, nis: student.nis || "", nisn: student.nisn || "", namaSiswa: student.nama, jenisKelamin: student.jenisKelamin || "", rombel: kelasLabel, ...dayData, rekap };
        });

        const program = deriveProgram(filteredSetups[0].kelas).toUpperCase();

        const kepalaPkbm = await db.select().from(managers).where(
          or(
            like(managers.jabatan, "%Kepala%"),
            like(managers.jabatan, "%Ketua%")
          )
        ).get();
        const namaKepalaPkbm = kepalaPkbm?.nama || "-";

        const buffer = fillTemplate("DAFTAR HADIR WARGA BELAJAR REKAP.xlsx", {
          program, semester: (filteredSetups[0].semester || "Ganjil").toUpperCase(),
          tahunAjaran: currentYear + "/" + (currentYear + 1),
          kelas: kelasLabel, waliKelas: kelasLabel.toUpperCase(), namaWaliKelas: waliKelas.toUpperCase(),
          bulan: now.toLocaleDateString("id-ID", { month: "long" }).toUpperCase(),
          tanggalCetak: now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }).toUpperCase(),
          kecamatan: "JATINAGARA", namaPkbm: "MENUJU MAKMUR",
          nipPemilik: "-", nipKepalaPkbm: "-", nipWaliKelas: "-",
          namaKepalaPkbm: namaKepalaPkbm.toUpperCase(), namaPemilik: "-",
          siswa: siswaData.map(s => ({ ...s, namaSiswa: s.namaSiswa.toUpperCase(), jenisKelamin: s.jenisKelamin.toUpperCase(), rombel: s.rombel.toUpperCase() })),
        }, 18);

        set.headers = {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": "attachment; filename=\"rekap_kehadiran_wb_" + sanitizeFilename(kelasLabel) + "_" + currentYear + "_" + (currentMonth + 1) + ".xlsx\"",
        };
        return buffer;
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  )

  // GET Laporan Kehadiran WB Per Mapel (JSON)
  .get(
    "/laporan/student-attendances",
    async (context: any) => {
      const { headers, jwt, query, set } = context;
      const authError = await verifyAdminOrTutor(headers, jwt, set);
      if (authError) return authError;

      try {
        const setupId = query.setupId ? parseInt(query.setupId, 10) : null;
        if (!setupId) { set.status = 400; return { success: false, message: "setupId diperlukan" }; }

        const setup = await db.select().from(elearningSetups).where(eq(elearningSetups.id, setupId)).get();
        if (!setup) { set.status = 404; return { success: false, message: "Setup tidak ditemukan" }; }

        const program = deriveProgram(setup.kelas);
        const course = await db.select().from(elearningCourses)
          .where(and(eq(elearningCourses.namaMapel, setup.mapel), eq(elearningCourses.program, program))).get();

        const rombelList = await db.select().from(rombels).where(eq(rombels.nama, setup.kelas)).all();
        const rombelIds = rombelList.map(r => r.id);
        const studentsList = rombelIds.length > 0 ? await db
          .select({ id: students.id, nama: students.nama, nis: students.nis })
          .from(students).innerJoin(rombelStudents, eq(students.id, rombelStudents.studentId))
          .where(inArray(rombelStudents.rombelId, rombelIds)).all() : [];

        const sessionsList = course ? await db.select().from(elearningSessions).where(eq(elearningSessions.courseId, course.id)).all() : [];
        const sessionIds = sessionsList.map(s => s.id);
        const attendances = sessionIds.length > 0 ? await db.select().from(elearningAttendances)
          .where(inArray(elearningAttendances.sessionId, sessionIds)).all() : [];

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        const sessionDates = new Set<number>();
        sessionsList.forEach(s => {
          if (s.startDate) {
            const dt = new Date(s.startDate);
            if (dt.getMonth() === currentMonth && dt.getFullYear() === currentYear) {
              sessionDates.add(dt.getDate());
            }
          }
        });

        const siswaData = studentsList.map((student) => {
          const studentAtt = attendances.filter(a => a.studentId === student.id);
          const { dayData, rekap } = buildAttendanceGrid(
            studentAtt, a => a.attendedAt || a.createdAt, currentMonth, currentYear, daysInMonth, sessionDates
          );
          return { nis: student.nis || "", namaSiswa: student.nama, rombel: setup.kelas, ...dayData, rekap };
        });

        return { success: true, data: siswaData, daysInMonth, month: currentMonth, year: currentYear };
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  )

  // GET Laporan Nilai WB Per Mapel (JSON)
  .get(
    "/laporan/student-grades",
    async (context: any) => {
      const { headers, jwt, query, set } = context;
      const authError = await verifyAdminOrTutor(headers, jwt, set);
      if (authError) return authError;

      try {
        const setupId = query.setupId ? parseInt(query.setupId, 10) : null;
        if (!setupId) { set.status = 400; return { success: false, message: "setupId diperlukan" }; }

        const setup = await db.select().from(elearningSetups).where(eq(elearningSetups.id, setupId)).get();
        if (!setup) { set.status = 404; return { success: false, message: "Setup tidak ditemukan" }; }

        const tutor = await db.select().from(tutors).where(eq(tutors.id, setup.tutorId)).get();
        const program = deriveProgram(setup.kelas);
        const course = await db.select().from(elearningCourses)
          .where(and(eq(elearningCourses.namaMapel, setup.mapel), eq(elearningCourses.program, program))).get();

        const rombelList = await db.select().from(rombels).where(eq(rombels.nama, setup.kelas)).all();
        const rombelIds = rombelList.map(r => r.id);
        const studentsList = rombelIds.length > 0 ? await db
          .select({ id: students.id, nama: students.nama, nis: students.nis, nisn: students.nisn, jenisKelamin: students.jenisKelamin })
          .from(students).innerJoin(rombelStudents, eq(students.id, rombelStudents.studentId))
          .where(inArray(rombelStudents.rombelId, rombelIds)).all() : [];

        const courseId = course ? course.id : null;
        const defaultSessions = setup.jumlahSesi && setup.jumlahSesi > 0 ? setup.jumlahSesi : 8;

        let allSessionIds: number[] = [];
        let allAttendances: any[] = [];
        let allForumPosts: any[] = [];
        let allSubmissions: any[] = [];

        if (courseId) {
          const sessions = await db.select().from(elearningSessions).where(eq(elearningSessions.courseId, courseId)).all();
          allSessionIds = sessions.map(s => s.id);
          if (allSessionIds.length > 0) {
            allAttendances = await db.select().from(elearningAttendances)
              .where(inArray(elearningAttendances.sessionId, allSessionIds)).all();
            allForumPosts = await db.select().from(elearningForumPosts)
              .where(and(eq(elearningForumPosts.courseId, courseId), eq(elearningForumPosts.authorRole, "siswa"), inArray(elearningForumPosts.sessionId, allSessionIds))).all();
            const assignments = await db.select().from(elearningAssignments)
              .where(inArray(elearningAssignments.sessionId, allSessionIds)).all();
            const assignmentIds = assignments.map(a => a.id);
            if (assignmentIds.length > 0) {
              allSubmissions = await db.select().from(elearningSubmissions)
                .where(inArray(elearningSubmissions.assignmentId, assignmentIds)).all();
            }
          }
        }

        const now = new Date();
        const currentYear = now.getFullYear();

        const siswaData = studentsList.map((student, idx) => {
          const sessionsCount = allSessionIds.length > 0 ? allSessionIds.length : defaultSessions;
          const attendedSessions = new Set(allAttendances.filter(a => a.studentId === student.id).map(a => a.sessionId));
          const participatedSessions = new Set(allForumPosts.filter(p => p.authorId === student.id).map(p => p.sessionId));
          const studentSubs = allSubmissions.filter(s => s.studentId === student.id);
          const studentGrades = studentSubs.filter(s => s.grade != null).map(s => s.grade as number);

          const kehadiran = Math.min(100, Math.round((attendedSessions.size / sessionsCount) * 100));
          const partisipasi = Math.min(100, Math.round((participatedSessions.size / sessionsCount) * 100));
          const tugas = studentGrades.length > 0 ? Math.min(100, Math.round(studentGrades.reduce((a, b) => a + b, 0) / studentGrades.length)) : 0;
          const { final, predikat } = calculateGrade(kehadiran, partisipasi, tugas);

          return {
            no: idx + 1, nis: student.nis || "", nisn: student.nisn || "", namaSiswa: student.nama, jenisKelamin: student.jenisKelamin || "", rombel: setup.kelas,
            nilaiTugas: tugas, nilaiDiskusi: partisipasi, nilaiKehadiran: kehadiran,
            nilaiAkhir: final, predikat,
          };
        });

        const buffer = fillTemplate("NILAI WARGA BELAJAR PER MAPEL.xlsx", {
          program: program.toUpperCase(), semester: (setup.semester || "Ganjil").toUpperCase(),
          tahunAjaran: currentYear + "/" + (currentYear + 1),
          mapel: setup.mapel.toUpperCase(), kelas: setup.kelas.toUpperCase(),
          namaTutor: (tutor?.nama || "-").toUpperCase(),
          tanggalCetak: now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }).toUpperCase(),
          nipTutor: "-",
          siswa: siswaData.map(s => ({ ...s, namaSiswa: s.namaSiswa.toUpperCase(), jenisKelamin: s.jenisKelamin.toUpperCase(), rombel: s.rombel.toUpperCase() })),
        });

        set.headers = {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": "attachment; filename=\"nilai_wb_" + sanitizeFilename(setup.mapel) + "_" + currentYear + ".xlsx\"",
        };
        return buffer;
      } catch (error: any) {
        set.status = 500;
        return { success: false, message: error.message };
      }
    }
  )

  // GET Laporan Nilai WB Rekap (xlsx template)
  .get(
    "/laporan/student-grades-rekap",
    async (context: any) => {
      const { headers, jwt, query, set } = context;
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      try {
        const filterKelas = query.kelas && query.kelas !== "Semua" ? query.kelas : null;
        const filterLevel = query.level && query.level !== "Semua" ? query.level : null;

        let setupsFilter: any = undefined;
        let kelasName = "SEMUA KELAS";
        if (filterKelas) {
          setupsFilter = eq(elearningSetups.kelas, filterKelas);
          kelasName = filterKelas.toUpperCase();
        } else if (filterLevel) {
          // Level filter - will filter after query
          kelasName = `KELAS ${filterLevel.toUpperCase()}`;
        }

        const setups = await db.select().from(elearningSetups).where(setupsFilter).all();
        const filteredSetups = filterLevel && !filterKelas
          ? setups.filter(s => s.kelas.replace(/[A-Z]$/, "") === filterLevel)
          : setups;
        if (filteredSetups.length === 0) {
          set.status = 404;
          return { success: false, message: "Tidak ditemukan setup elearning" };
        }

        // Get unique courses from setups to know how many mapels
        const mapelNames = [...new Set(filteredSetups.map(s => s.mapel))].sort();

        // Get all classes
        const allKelas = [...new Set(filteredSetups.map(s => s.kelas))];
        const rombelList = await db.select().from(rombels).where(inArray(rombels.nama, allKelas)).all();
        const rombelIds = rombelList.map(r => r.id);
        const studentsListRaw = rombelIds.length > 0 ? await db
          .select({ id: students.id, nama: students.nama, nis: students.nis, nisn: students.nisn, jenisKelamin: students.jenisKelamin, kelas: rombels.nama })
          .from(students)
          .innerJoin(rombelStudents, eq(students.id, rombelStudents.studentId))
          .innerJoin(rombels, eq(rombels.id, rombelStudents.rombelId))
          .where(inArray(rombelStudents.rombelId, rombelIds)).all() : [];
        const studentsList = studentsListRaw.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

        // Pre-fetch courses, sessions, attendances, forum posts, submissions
        const courseConditions = filteredSetups.map(s => and(
          eq(elearningCourses.namaMapel, s.mapel),
          eq(elearningCourses.program, deriveProgram(s.kelas))
        ));
        const allCourses = courseConditions.length > 0
          ? await db.select().from(elearningCourses).where(courseConditions.length === 1 ? courseConditions[0] : or(...courseConditions)).all()
          : [];
        const courseIds = allCourses.map(c => c.id);

        const allSessions = courseIds.length > 0 ? await db.select().from(elearningSessions).where(inArray(elearningSessions.courseId, courseIds)).all() : [];
        const sessionIds = allSessions.map(s => s.id);

        const allAttendances = sessionIds.length > 0 ? await db.select().from(elearningAttendances).where(inArray(elearningAttendances.sessionId, sessionIds)).all() : [];
        const allForumPosts = sessionIds.length > 0 ? await db.select().from(elearningForumPosts).where(and(inArray(elearningForumPosts.sessionId, sessionIds), eq(elearningForumPosts.authorRole, "siswa"))).all() : [];
        const assignments = sessionIds.length > 0 ? await db.select().from(elearningAssignments).where(inArray(elearningAssignments.sessionId, sessionIds)).all() : [];
        const assignmentIds = assignments.map(a => a.id);
        const allSubmissions = assignmentIds.length > 0 ? await db.select().from(elearningSubmissions).where(inArray(elearningSubmissions.assignmentId, assignmentIds)).all() : [];

        const now = new Date();
        const currentYear = now.getFullYear();

        // Optimizations: Map-based caching
        const setupsMap = new Map();
        for (const s of filteredSetups) setupsMap.set(`${s.kelas}-${s.mapel}`, s);

        const courseMap = new Map();
        for (const c of allCourses) courseMap.set(`${c.namaMapel}-${c.program}`, c);

        const sessionsByCourse = new Map<number, typeof allSessions>();
        for (const s of allSessions) {
          if (!sessionsByCourse.has(s.courseId)) sessionsByCourse.set(s.courseId, []);
          sessionsByCourse.get(s.courseId)!.push(s);
        }

        const attendancesByStudentSession = new Set();
        for (const a of allAttendances) attendancesByStudentSession.add(`${a.studentId}-${a.sessionId}`);

        const forumPostsByStudentSession = new Set();
        for (const p of allForumPosts) forumPostsByStudentSession.add(`${p.authorId}-${p.sessionId}`);

        const assignmentsBySession = new Map<number, number[]>();
        for (const a of assignments) {
          if (!assignmentsBySession.has(a.sessionId)) assignmentsBySession.set(a.sessionId, []);
          assignmentsBySession.get(a.sessionId)!.push(a.id);
        }

        const submissionsByStudentAssignment = new Map<string, number>();
        for (const s of allSubmissions) {
          if (s.grade != null) submissionsByStudentAssignment.set(`${s.studentId}-${s.assignmentId}`, s.grade as number);
        }

        const siswaData = studentsList.map((student, idx) => {
          const sData: any = {
            no: idx + 1,
            nis: student.nis || "",
            nisn: student.nisn || "",
            namaSiswa: student.nama,
            jenisKelamin: student.jenisKelamin || "",
            rombel: student.kelas
          };

          mapelNames.forEach((mapelName, mIdx) => {
            const mKey = `mapel${mIdx + 1}`;
            sData[mKey] = mapelName.toUpperCase(); // contains the mapel name

            const setup = setupsMap.get(`${student.kelas}-${mapelName}`);
            if (!setup) {
              sData[`${mKey}Nilai`] = "-";
              sData[`${mKey}Predikat`] = "-";
              return;
            }

            const prog = deriveProgram(setup.kelas);
            const course = courseMap.get(`${mapelName}-${prog}`);
            if (!course) {
              sData[`${mKey}Nilai`] = "-";
              sData[`${mKey}Predikat`] = "-";
              return;
            }

            const sessions = sessionsByCourse.get(course.id) || [];
            const sIds = sessions.map(s => s.id);
            const sessionsCount = sIds.length > 0 ? sIds.length : (setup.jumlahSesi || 8);
            
            let attendedCount = 0;
            let participatedCount = 0;
            const studentGrades: number[] = [];

            for (const sId of sIds) {
              if (attendancesByStudentSession.has(`${student.id}-${sId}`)) attendedCount++;
              if (forumPostsByStudentSession.has(`${student.id}-${sId}`)) participatedCount++;
              const assignIds = assignmentsBySession.get(sId) || [];
              for (const aId of assignIds) {
                const grade = submissionsByStudentAssignment.get(`${student.id}-${aId}`);
                if (grade !== undefined) studentGrades.push(grade);
              }
            }

            const kehadiran = Math.min(100, Math.round((attendedCount / sessionsCount) * 100));
            const partisipasi = Math.min(100, Math.round((participatedCount / sessionsCount) * 100));
            const tugas = studentGrades.length > 0 ? Math.min(100, Math.round(studentGrades.reduce((a, b) => a + b, 0) / studentGrades.length)) : 0;
            const { final, predikat } = calculateGrade(kehadiran, partisipasi, tugas);

            sData[`${mKey}Nilai`] = final;
            sData[`${mKey}Predikat`] = predikat;
          });

          return sData;
        });

        const program = filteredSetups.length > 0 ? deriveProgram(filteredSetups[0].kelas).toUpperCase() : "PAKET A/B/C";
        const semester = filteredSetups.length > 0 ? (filteredSetups[0].semester || "Ganjil").toUpperCase() : "GANJIL";

        // Ambil wali kelas dari rombel pertama di filter
        let waliKelasNama = "-";
        const rombelForWali = filterKelas
          ? rombelList.filter(r => r.nama === filterKelas)
          : filterLevel
            ? rombelList.filter(r => r.nama.replace(/[A-Z]$/, "") === filterLevel).sort((a, b) => a.nama.localeCompare(b.nama))
            : [];
        if (rombelForWali.length > 0 && rombelForWali[0].waliKelasId) {
          waliKelasNama = (await db.select().from(tutors).where(eq(tutors.id, rombelForWali[0].waliKelasId)).get())?.nama || "-";
        }

        const kepalaPkbm = await db.select().from(managers).where(
          or(
            like(managers.jabatan, "%Kepala%"),
            like(managers.jabatan, "%Ketua%")
          )
        ).get();
        const namaKepalaPkbm = kepalaPkbm?.nama || "-";

        const buffer = fillTemplate("NILAI WARGA BELAJAR REKAP.xlsx", {
          program, semester,
          tahunAjaran: currentYear + "/" + (currentYear + 1),
          kelas: kelasName, kelas2: kelasName,
          waliKelas: waliKelasNama.toUpperCase(), namaWaliKelas: waliKelasNama.toUpperCase(),
          tanggalCetak: now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }).toUpperCase(),
          kecamatan: "JATINAGARA", namaPkbm: "MENUJU MAKMUR",
          nipPemilik: "-", nipKepalaPkbm: "-", nipWaliKelas: "-",
          namaKepalaPkbm: namaKepalaPkbm.toUpperCase(), namaPemilik: "-",
          siswa: siswaData.map(s => ({ ...s, namaSiswa: s.namaSiswa.toUpperCase(), jenisKelamin: s.jenisKelamin.toUpperCase(), rombel: s.rombel.toUpperCase() })),
        }, 18, mapelNames.length);

        set.headers = {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": "attachment; filename=\"rekap_nilai_wb_" + sanitizeFilename(kelasName) + "_" + currentYear + ".xlsx\"",
        };
        return buffer;
      } catch (error: any) {
        console.error("Export error:", error);
        set.status = 500;
        return { success: false, message: "Terjadi kesalahan saat meng-export data." };
      }
    }
  )
  // ---------------------------------------------------------
  // TUTOR ATTENDANCE
  // ---------------------------------------------------------
  .get("/tutor-attendance", async (context: any) => {
    const { headers, jwt, set } = context;
    const authError = await verifyAdminOrTutor(headers, jwt, set);
    if (authError) return authError;

    try {
      const authHeader = headers["authorization"];
      const token = authHeader.split(" ")[1];
      const payload = await jwt.verify(token);
      if (payload.role !== "tutor") {
        return { success: true, attended: false }; // Not a tutor
      }

      const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
      const record = await db.select().from(tutorAttendances)
        .where(and(
          eq(tutorAttendances.tutorId, Number(payload.id)),
          eq(tutorAttendances.date, today)
        )).get();

      return { success: true, attended: !!record };
    } catch (error: any) {
      set.status = 500;
      return { success: false, message: error.message };
    }
  })
  .post("/tutor-attendance", async (context: any) => {
    const { headers, jwt, set } = context;
    const authError = await verifyAdminOrTutor(headers, jwt, set);
    if (authError) return authError;

    try {
      const authHeader = headers["authorization"];
      const token = authHeader.split(" ")[1];
      const payload = await jwt.verify(token);
      if (payload.role !== "tutor") {
        set.status = 403;
        return { success: false, message: "Only tutors can mark attendance here" };
      }

      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
      try {
        await db.insert(tutorAttendances).values({
          tutorId: Number(payload.id),
          date: today,
        });
        return { success: true, message: "Kehadiran berhasil ditandai" };
      } catch (err: any) {
        if (err.message && err.message.includes("UNIQUE constraint failed")) {
          return { success: true, message: "Sudah absen hari ini" };
        }
        throw err;
      }
    } catch (error: any) {
      set.status = 500;
      return { success: false, message: error.message };
    }
  })
  .get("/tutor-attendance/history", async (context: any) => {
    const { headers, jwt, query, set } = context;
    const authError = await verifyAdminOrTutor(headers, jwt, set);
    if (authError) return authError;

    try {
      const authHeader = headers["authorization"];
      const token = authHeader.split(" ")[1];
      const payload = await jwt.verify(token);
      
      const tutorId = payload.role === "tutor" ? Number(payload.id) : (query.tutorId ? Number(query.tutorId) : null);
      if (!tutorId) {
        set.status = 400;
        return { success: false, message: "Tutor ID required" };
      }

      const year = query.year ? Number(query.year) : new Date().getFullYear();
      const month = query.month ? Number(query.month) : (new Date().getMonth() + 1); // 1-12
      
      const prefix = `${year}-${month.toString().padStart(2, '0')}`;
      
      const records = await db.select().from(tutorAttendances)
        .where(and(
          eq(tutorAttendances.tutorId, tutorId),
          like(tutorAttendances.date, `${prefix}%`)
        )).all();

      return { success: true, data: records };
    } catch (error: any) {
      set.status = 500;
      return { success: false, message: error.message };
    }
  })

  // ---------------------------------------------------------
  // SESSION ANGKET PROGRESS (for navigation gating)
  // ---------------------------------------------------------
  .get("/session-angket/progress", async (context: any) => {
    const { headers, jwt, query, set } = context;
    const authError = await verifyUser(headers, jwt, set);
    if (authError) return authError;

    try {
      const setupId = Number(query.setupId);
      const authHeader = headers["authorization"];
      const token = authHeader.split(" ")[1];
      const payload = await jwt.verify(token);

      if (payload.role !== "siswa") {
        return { success: true, data: [] };
      }

      const studentId = Number(payload.id);

      const setup = await db.select().from(elearningSetups).where(eq(elearningSetups.id, setupId)).get();
      if (!setup) { set.status = 404; return { success: false, message: "Setup not found" }; }

      // Verify student belongs to the setup's rombel
      const studentRombel = await db.select().from(rombelStudents)
        .innerJoin(rombels, eq(rombelStudents.rombelId, rombels.id))
        .where(and(
          eq(rombelStudents.studentId, studentId),
          eq(rombels.nama, setup.kelas)
        )).get();
      if (!studentRombel) {
        set.status = 403;
        return { success: false, message: "Anda tidak terdaftar di kelas ini" };
      }

      const program = deriveProgram(setup.kelas);

      const course = await db.select().from(elearningCourses)
        .where(and(
          eq(elearningCourses.namaMapel, setup.mapel),
          eq(elearningCourses.program, program)
        )).get();
      if (!course) return { success: true, data: [] };

      const sessions = await db.select().from(elearningSessions)
        .where(eq(elearningSessions.courseId, course.id)).all();

      const sessionIds = sessions.map(s => s.id);

      const completedAngkets = sessionIds.length > 0 ? await db
        .select()
        .from(elearningSessionAngkets)
        .where(and(
          inArray(elearningSessionAngkets.sessionId, sessionIds),
          eq(elearningSessionAngkets.studentId, studentId)
        ))
        .all() : [];

      const completedSessionIds = new Set(completedAngkets.map(a => a.sessionId));

      const data = sessions.map(s => ({
        sessionNumber: s.sessionNumber,
        completed: completedSessionIds.has(s.id)
      }));

      return { success: true, data };
    } catch (error: any) {
      set.status = 500;
      return { success: false, message: error.message };
    }
  })

  // ---------------------------------------------------------
  // SESSION ANGKET (Tutor Evaluation per Session)
  // ---------------------------------------------------------
  .get("/session-angket", async (context: any) => {
    const { headers, jwt, query, set } = context;
    const authError = await verifyUser(headers, jwt, set);
    if (authError) return authError;

    try {
      const sessionId = Number(query.sessionId);
      const authHeader = headers["authorization"];
      const token = authHeader.split(" ")[1];
      const payload = await jwt.verify(token);
      
      if (payload.role !== "siswa") {
        return { success: true, completed: true }; // non-siswa don't need this
      }

      const studentId = Number(payload.id);

      // Verify student belongs to this session's rombel
      const session = await db.select().from(elearningSessions).where(eq(elearningSessions.id, sessionId)).get();
      if (session) {
        const course = await db.select().from(elearningCourses).where(eq(elearningCourses.id, session.courseId)).get();
        if (course) {
          const allSetups = await db.select().from(elearningSetups).all();
          const matchingKelas = allSetups
            .filter(s => s.mapel === course.namaMapel && deriveProgram(s.kelas) === course.program)
            .map(s => s.kelas);
          if (matchingKelas.length > 0) {
            const rombelCheck = await db.select().from(rombelStudents)
              .innerJoin(rombels, eq(rombelStudents.rombelId, rombels.id))
              .where(and(
                eq(rombelStudents.studentId, studentId),
                inArray(rombels.nama, matchingKelas)
              )).get();
            if (!rombelCheck) {
              set.status = 403;
              return { success: false, message: "Anda tidak terdaftar di kelas ini" };
            }
          }
        }
      }

      // Check if there's any record for this session + student
      const record = await db.select().from(elearningSessionAngkets)
        .where(and(
          eq(elearningSessionAngkets.sessionId, sessionId),
          eq(elearningSessionAngkets.studentId, studentId)
        )).limit(1).get();

      return { success: true, completed: !!record };
    } catch (error: any) {
      set.status = 500;
      return { success: false, message: error.message };
    }
  })
  .post("/session-angket", async (context: any) => {
    const { headers, jwt, body, set } = context;
    const authError = await verifyUser(headers, jwt, set);
    if (authError) return authError;

    try {
      const { sessionId, responses } = body;
      const authHeader = headers["authorization"];
      const token = authHeader.split(" ")[1];
      const payload = await jwt.verify(token);
      
      if (payload.role !== "siswa") {
        set.status = 403;
        return { success: false, message: "Only siswa can submit angket" };
      }

      const studentId = Number(payload.id);

      // Verify student belongs to this session's rombel
      const session = await db.select().from(elearningSessions).where(eq(elearningSessions.id, Number(sessionId))).get();
      if (session) {
        const course = await db.select().from(elearningCourses).where(eq(elearningCourses.id, session.courseId)).get();
        if (course) {
          const allSetups = await db.select().from(elearningSetups).all();
          const matchingKelas = allSetups
            .filter(s => s.mapel === course.namaMapel && deriveProgram(s.kelas) === course.program)
            .map(s => s.kelas);
          if (matchingKelas.length > 0) {
            const rombelCheck = await db.select().from(rombelStudents)
              .innerJoin(rombels, eq(rombelStudents.rombelId, rombels.id))
              .where(and(
                eq(rombelStudents.studentId, studentId),
                inArray(rombels.nama, matchingKelas)
              )).get();
            if (!rombelCheck) {
              set.status = 403;
              return { success: false, message: "Anda tidak terdaftar di kelas ini" };
            }
          }
        }
      }

      for (const res of responses) {
        try {
          await db.insert(elearningSessionAngkets).values({
            sessionId: Number(sessionId),
            studentId,
            evaluationId: Number(res.evaluationId),
            score: Number(res.score),
          });
        } catch (e: any) {
          // Only ignore unique constraint violations (already submitted)
          // Re-throw other errors so they propagate to the outer catch
          if (!e?.message?.includes("UNIQUE constraint failed")) {
            throw e;
          }
        }
      }

      return { success: true, message: "Angket berhasil disubmit" };
    } catch (error: any) {
      set.status = 500;
      return { success: false, message: error.message };
    }
  }, {
    body: t.Object({
      sessionId: t.Numeric(),
      responses: t.Array(t.Object({
        evaluationId: t.Numeric(),
        score: t.Numeric()
      }))
    })
  });
