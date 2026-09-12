import { Elysia, t } from "elysia";
import { jwt } from "@elysia/jwt";
import { finalJwtSecret } from "../config/jwt";
import { verifyAdmin } from "../middleware/auth";
import { db } from "../config/db";
import {
  alumni,
  elearningMaterials,
  elearningSetups,
  managers,
  products,
  rombels,
  servicePoints,
  students,
  tutors,
} from "../models";

export function countActiveStudents(studentsList: Array<{ status: string }>) {
  return studentsList.filter((student) => student.status === "AKTIF").length;
}

export function countActiveProducts(productsList: Array<{ status: string }>) {
  return productsList.filter((product) => product.status === "AKTIF").length;
}

export function countStudentsInProgram(
  studentsList: Array<{ program: string }>,
  program: string,
) {
  return studentsList.filter(
    (student) => student.program.toLowerCase().includes(program),
  ).length;
}

export function countMaterialsByType(
  materials: Array<{ type: string }>,
  type: string,
) {
  return materials.filter((material) => material.type === type).length;
}

export const statsServices = new Elysia()
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
  // Public stats endpoint untuk landing page
  .get("/api/public-stats", async ({ set }) => {
    try {
      const studentsList = await db.select().from(students).all();
      const alumniList = await db.select().from(alumni).all();
      const tutorsList = await db.select().from(tutors).all();
      const managersList = await db.select().from(managers).all();
      const servicePointsList = await db.select().from(servicePoints).all();
      const rombelList = await db.select().from(rombels).all();

      return {
        success: true,
        data: {
          students: countActiveStudents(studentsList),
          alumni: alumniList.length,
          tutors: tutorsList.length,
          rombel: rombelList.length,
          managers: managersList.length,
          servicePoints: servicePointsList.length,
        },
      };
    } catch {
      set.status = 500;
      return { success: false, message: "Gagal mengambil data statistik publik" };
    }
  })
  .get("/api/dashboard-stats", async ({ headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    try {
      const tutorsList = await db.select().from(tutors).all();
      const studentsList = await db.select().from(students).all();
      const productsList = await db.select().from(products).all();
      const alumniList = await db.select().from(alumni).all();
      const rombelList = await db.select().from(rombels).all();

      const activeStudents = studentsList.filter((student) => student.status === "AKTIF");

      const setups = await db.select().from(elearningSetups).all();
      const materials = await db.select().from(elearningMaterials).all();

      return {
        success: true,
        data: {
          tutors: tutorsList.length,
          students: activeStudents.length,
          rombel: rombelList.length,
          products: countActiveProducts(productsList),
          paketA: countStudentsInProgram(activeStudents, "paket a"),
          paketB: countStudentsInProgram(activeStudents, "paket b"),
          paketC: countStudentsInProgram(activeStudents, "paket c"),
          alumni: alumniList.length,
          mapelAktif: setups.length,
          tugas: countMaterialsByType(materials, "TUGAS"),
          ip: "0.0", // Placeholder for global IP until full grading is implemented
        },
      };
    } catch (error: any) {
      set.status = 500;
      console.error("Stats error:", error);
      return { success: false, message: "Gagal mengambil data statistik dashboard" };
    }
  });
