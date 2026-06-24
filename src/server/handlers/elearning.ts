/* eslint-disable @typescript-eslint/no-explicit-any */
import { Elysia, t } from "elysia";
import { db } from "../config/db";
import {
  elearningCourses,
  elearningSessions,
  elearningMaterials,
  elearningEvaluations,
  elearningSetups,
  elearningForumPosts,
  elearningAttendances,
  tutors,
  students,
  rombels,
  rombelStudents
} from "../models";
import { eq, and, inArray } from "drizzle-orm";
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
        const cleanHtml = sanitizeHtml(body.description, {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['font']),
          allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            'font': ['size', 'color', 'face']
          }
        });

        await db
          .update(elearningSessions)
          .set({ description: cleanHtml })
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
        let condition = undefined;
        const authHeader = headers["authorization"];
        const token = authHeader!.split(" ")[1];
        const payload = await jwt.verify(token);

        if (payload.role === "tutor") {
          condition = eq(elearningSetups.tutorId, payload.id as number);
        } else if (payload.role === "siswa" && query.kelas) {
          condition = eq(elearningSetups.kelas, query.kelas);
        } else if (query.tutorId) {
          condition = eq(elearningSetups.tutorId, parseInt(query.tutorId));
        } else if (query.kelas) {
          condition = eq(elearningSetups.kelas, query.kelas);
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
        kelas: t.Optional(t.String()),
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
        // Cari siswa
        const student = await db.select().from(students).where(eq(students.id, parseInt(studentId))).get();
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
      const authError = await verifyAdminOrTutor(headers, jwt, set);
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

        // Bisa ditambah relasi ke students dan tutors untuk nama, sementara pakai authorId & authorRole
        return { success: true, data: posts };
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
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['font']),
          allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            'font': ['size', 'color', 'face']
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

  // GET & POST attendance
  .get(
    "/attendance",
    async (context: any) => {
      const { headers, jwt, query, set } = context;
      const authError = await verifyUser(headers, jwt, set);
      if (authError) return authError;

      try {
        const { sessionId, studentId } = query;
        const record = await db
          .select()
          .from(elearningAttendances)
          .where(and(
            eq(elearningAttendances.sessionId, parseInt(sessionId)),
            eq(elearningAttendances.studentId, parseInt(studentId))
          ))
          .get();
        return { success: true, data: record || null };
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
        const { sessionId, studentId } = body;
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
        // Untuk tahap ini kita kirim list basic, di UI akan dihitung atau nanti di-enrich
        return { success: true, data: tutorsList };
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

        // Calculate simple stats
        const allPosts = await db.select().from(elearningForumPosts).all();
        
        const enhancedStudents = studentsList.map(s => {
          const studentPosts = allPosts.filter(p => p.authorId === s.id && p.authorRole === "siswa");
          const avgScore = 0; // Mock until phase 4 submissions are added
          const tugasCount = 0; // Mock until phase 4 submissions are added
            
          return {
            ...s,
            forumCount: studentPosts.length,
            tugasCount: tugasCount,
            avgScore: avgScore
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
        const setupId = parseInt(query.setupId);
        if (!setupId) return { success: false, message: "setupId diperlukan" };

        const setup = await db.select().from(elearningSetups).where(eq(elearningSetups.id, setupId)).get();
        if (!setup) return { success: false, message: "Setup tidak ditemukan" };

        const actualSubject = setup.mapel;
        const actualProgram = setup.kelas.includes("Paket A") ? "Paket A" : setup.kelas.includes("Paket B") ? "Paket B" : "Paket C";

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

        let courseId = course ? course.id : null;
        let sessionsCount = setup.jumlahSesi || 8;

        let allSessionIds: number[] = [];
        let allAttendances: any[] = [];
        let allForumPosts: any[] = [];

        if (courseId) {
          const sessions = await db.select().from(elearningSessions).where(eq(elearningSessions.courseId, courseId)).all();
          allSessionIds = sessions.map(s => s.id);

          if (allSessionIds.length > 0) {
            allAttendances = await db.select().from(elearningAttendances)
              .where(inArray(elearningAttendances.sessionId, allSessionIds))
              .all();
          }

          allForumPosts = await db.select().from(elearningForumPosts)
            .where(and(eq(elearningForumPosts.courseId, courseId), eq(elearningForumPosts.authorRole, "siswa")))
            .all();
        }

        const results = studentsList.map((student) => {
          let kehadiran = 0;
          let partisipasi = 0;
          let tugas = 0; // default for now

          if (courseId && allSessionIds.length > 0) {
            const validAtt = allAttendances.filter(a => a.studentId === student.id);
            kehadiran = Math.min(100, Math.round((validAtt.length / sessionsCount) * 100));

            const studentPosts = allForumPosts.filter(p => p.authorId === student.id);
            partisipasi = Math.min(100, Math.round((studentPosts.length / sessionsCount) * 100));
          }

          let final = (kehadiran * 0.2) + (partisipasi * 0.3) + (tugas * 0.5);
          let predikat = final >= 85 ? "A" : final >= 70 ? "B" : final >= 55 ? "C" : final >= 40 ? "D" : "E";

          return {
            id: student.id,
            nama: student.nama,
            kelas: student.kelas,
            kehadiran,
            partisipasi,
            tugas,
            final,
            predikat
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
  );
