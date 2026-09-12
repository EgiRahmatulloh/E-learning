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
import { verifyUser, sanitizeFilename, deriveProgram, buildAttendanceGrid, calculateGrade, extractLevel } from "./helpers";
import { fillTemplate } from "../../utils/templateXlsx";

  // GET Monitoring Tutors
export const monitoringHandlers = new Elysia()
  .get(
    "/monitoring/tutors",
    async (context: any) => {
      const { headers, jwt, query, set } = context;
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      try {
        const filterLevel = query.level && query.level !== "Semua" ? query.level : null;

        const allSetups = await db.select().from(elearningSetups).all();
        let filteredSetups = allSetups;
        if (filterLevel) {
          filteredSetups = allSetups.filter(s => extractLevel(s.kelas) === parseInt(filterLevel));
        }

        const tutorIds = filterLevel ? [...new Set(filteredSetups.map(s => s.tutorId))] : null;
        const tutorsList = tutorIds
          ? (await db.select().from(tutors).all()).filter(t => tutorIds.includes(t.id))
          : await db.select().from(tutors).all();

        // Enrich tutors with stats
        const allPosts = await db.select().from(elearningForumPosts).where(eq(elearningForumPosts.authorRole, "tutor")).all();
        const allCourses = await db.select().from(elearningCourses).all();
        const allSessions = await db.select().from(elearningSessions).all();
        const allAssignments = await db.select().from(elearningAssignments).all();
        const allSubmissions = await db.select().from(elearningSubmissions).where(isNull(elearningSubmissions.grade)).all();

        const enrichedTutors = tutorsList.map(tutor => {
          const diskusiCount = allPosts.filter(p =>
            p.authorId == tutor.id && p.authorRole === "tutor"
          ).length;
          const tutorSetups = filteredSetups.filter(s => s.tutorId === tutor.id);
          const jumlahKelas = new Set(tutorSetups.map(s => s.kelas)).size;
          const tutorCourseIds = allCourses.filter(c => tutorSetups.some(s =>
            s.mapel === c.namaMapel && deriveProgram(s.kelas) === c.program
          )).map(c => c.id);
          const tutorSessionIds = allSessions
            .filter(s => tutorCourseIds.includes(s.courseId))
            .map(s => s.id);
          const tutorAssignmentIds = allAssignments
            .filter(a => tutorSessionIds.includes(a.sessionId))
            .map(a => a.id);
          const tugasBelumDinilai = allSubmissions.filter(s =>
            tutorAssignmentIds.includes(s.assignmentId) && s.grade == null
          ).length;
          return {
            ...tutor,
            jumlahKelas: jumlahKelas || tutorSetups.length,
            diskusiCount,
            tugasBelumDinilai
          };
        });

        return { success: true, data: enrichedTutors };
      } catch (error: any) {
        set.status = 500;
        console.error("Monitoring error:", error);
        return { success: false, message: "Terjadi kesalahan server" };
      }
    }
  )

  // GET Monitoring Students
  .get(
    "/monitoring/students",
    async (context: any) => {
      const { headers, jwt, query, set } = context;
      const authError = await verifyAdmin(headers, jwt, set);
      if (authError) return authError;

      try {
        const filterLevel = query.level && query.level !== "Semua" ? query.level : null;

        let studentsList;
        if (filterLevel) {
          const allRombels = await db.select().from(rombels).all();
          const levelRombels = allRombels.filter(r => extractLevel(r.nama) === parseInt(filterLevel));
          const rombelIds = levelRombels.map(r => r.id);

          studentsList = rombelIds.length > 0 ? await db
            .select({
              id: students.id,
              nama: students.nama,
              nis: students.nis,
              kelas: rombels.nama,
            })
            .from(students)
            .innerJoin(rombelStudents, eq(students.id, rombelStudents.studentId))
            .innerJoin(rombels, eq(rombelStudents.rombelId, rombels.id))
            .where(inArray(rombelStudents.rombelId, rombelIds))
            .all() : [];
        } else {
          studentsList = await db
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
        }

        // Calculate stats — fetch only what's needed via targeted queries
        const allPosts = await db.select().from(elearningForumPosts).where(eq(elearningForumPosts.authorRole, "siswa")).all();
        const allAttendances = await db.select().from(elearningAttendances).all();

        // Fetch graded submissions for tugas count and avg score
        const allGradedSubs = await db.select({
          studentId: elearningSubmissions.studentId,
          grade: elearningSubmissions.grade,
        }).from(elearningSubmissions).all();

        const uniqueStudentsList = studentsList.filter(
          (student, index, list) => list.findIndex(item => item.id === student.id) === index
        );

        const enhancedStudents = uniqueStudentsList.map(student => {
          const studentPosts = allPosts.filter(post =>
            post.authorId === student.id && post.authorRole === "siswa"
          );
          const kehadiranCount = allAttendances.filter(attendance =>
            attendance.studentId === student.id
          ).length;
          const studentGrades = allGradedSubs.filter(submission =>
            submission.studentId === student.id && submission.grade != null
          ).map(submission => submission.grade as number);
          return {
            ...student,
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
        console.error("Monitoring error:", error);
        return { success: false, message: "Terjadi kesalahan server" };
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

        const authHeader = headers["authorization"];
        let payload: any = null;
        if (authHeader) {
          const token = authHeader.split(" ")[1];
          payload = await jwt.verify(token);
        }

        let condition: any = eq(rombels.nama, setup.kelas);
        if (payload?.role === "siswa") {
          condition = and(condition, eq(students.id, payload.id as number));
        }

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
          .where(condition)
          .all();

        const courseId = course ? course.id : null;
        const defaultSessions = setup.jumlahSesi && setup.jumlahSesi > 0 ? setup.jumlahSesi : 8;

        let allSessionIds: number[] = [];
        let session0Ids: Set<number> = new Set();
        const sessionsMap: Record<number, number> = {};
        let allAttendances: any[] = [];
        let allForumPosts: any[] = [];
        let allSubmissions: any[] = [];
        let allAssignments: any[] = [];

        if (courseId) {
          const sessions = await db.select().from(elearningSessions).where(eq(elearningSessions.courseId, courseId)).all();
          const realSessions = sessions.filter(s => s.sessionNumber >= 1 && s.sessionNumber <= defaultSessions);
          allSessionIds = realSessions.map(s => s.id);
          session0Ids = new Set(sessions.filter(s => s.sessionNumber === 0).map(s => s.id));
          realSessions.forEach(s => {
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
          const sessionsCount = defaultSessions;
          if (courseId && allSessionIds.length > 0) {
            const attendedSessions = new Set(allAttendances.filter(attendance =>
              attendance.studentId === student.id && !session0Ids.has(attendance.sessionId)
            ).map(attendance => attendance.sessionId));
            kehadiran = Math.min(100, Math.round((attendedSessions.size / sessionsCount) * 100));
            const participatedSessions = new Set(allForumPosts.filter(post =>
              post.authorId === student.id && !session0Ids.has(post.sessionId)
            ).map(post => post.sessionId));
            partisipasi = Math.min(100, Math.round((participatedSessions.size / sessionsCount) * 100));
            const studentSubmissions = allSubmissions.filter(
              submission => submission.studentId === student.id
            );
            const totalAssignments = allAssignments.length;
            const studentGrades = studentSubmissions
              .filter(submission => submission.grade != null)
              .map(submission => submission.grade as number);
            if (totalAssignments > 0) {
              const sumGrade = studentGrades.reduce((sum, grade) => sum + grade, 0);
              tugas = Math.min(100, Math.round(sumGrade / totalAssignments));
            }
            for (let i = 1; i <= sessionsCount; i++) {
              const sessionIdText = Object.keys(sessionsMap).find(
                key => sessionsMap[parseInt(key)] === i
              );
              const sessionId = sessionIdText ? parseInt(sessionIdText) : null;
              if (sessionId) {
                detailKehadiran.push({
                  sessionNumber: i,
                  hadir: attendedSessions.has(sessionId)
                });
                detailDiskusi.push({
                  sessionNumber: i,
                  ikutDiskusi: participatedSessions.has(sessionId)
                });
                const assignment = allAssignments.find(item => item.sessionId === sessionId);
                if (assignment) {
                  const submission = studentSubmissions.find(
                    item => item.assignmentId === assignment.id
                  );
                  detailTugas.push({
                    sessionNumber: i,
                    grade: submission?.grade ?? null,
                    feedback: submission?.feedback ?? null
                  });
                } else { detailTugas.push({ sessionNumber: i, grade: null, feedback: null }); }
              } else {
                detailKehadiran.push({ sessionNumber: i, hadir: false });
                detailDiskusi.push({ sessionNumber: i, ikutDiskusi: false });
                detailTugas.push({ sessionNumber: i, grade: null, feedback: null }); }
            }
          } else {
            for (let i = 1; i <= sessionsCount; i++) {
              detailKehadiran.push({ sessionNumber: i, hadir: false });
              detailDiskusi.push({ sessionNumber: i, ikutDiskusi: false });
              detailTugas.push({ sessionNumber: i, grade: null, feedback: null }); }
          } const { final, predikat } = calculateGrade(kehadiran, partisipasi, tugas);
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
        console.error("Monitoring error:", error);
        return { success: false, message: "Terjadi kesalahan server" };
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

        let tugasMasuk = 0;
                if (setups.length > 0) {
          const tutorCourses = [];
          for (const setup of setups) {
            const actualProgram = deriveProgram(setup.kelas);
            const course = await db.select().from(elearningCourses)
              .where(and(eq(elearningCourses.namaMapel, setup.mapel), eq(elearningCourses.program, actualProgram)))
              .get();
            if (course) tutorCourses.push(course.id);
          }
          if (tutorCourses.length > 0) {
            const submissions = await db
              .select({ id: elearningSubmissions.id })
              .from(elearningSubmissions)
              .innerJoin(elearningAssignments, eq(elearningSubmissions.assignmentId, elearningAssignments.id))
              .innerJoin(elearningSessions, eq(elearningAssignments.sessionId, elearningSessions.id))
              .where(inArray(elearningSessions.courseId, tutorCourses))
              .all();
            tugasMasuk = submissions.length;
          }
        }

        const ip = "0.0"; // Placeholder

        return { success: true, data: { mapelAktif, tugasMasuk, ip } };
      } catch (error: any) {
        set.status = 500;
        console.error("Monitoring error:", error);
        return { success: false, message: "Terjadi kesalahan server" };
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
        console.error("Monitoring error:", error);
        return { success: false, message: "Terjadi kesalahan server" };
      }
    }
  )

;
