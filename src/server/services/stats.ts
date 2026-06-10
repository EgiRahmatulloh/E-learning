import { Elysia, t } from "elysia";
import { jwt } from "@elysia/jwt";
import { finalJwtSecret } from "../config/jwt";
import { verifyAdmin } from "../middleware/auth";
import { db } from "../config/db";
import { tutors, students, products, alumni } from "../models";

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
  .get("/api/dashboard-stats", async ({ headers, jwt, set }) => {
    const authError = await verifyAdmin(headers, jwt, set);
    if (authError) return authError;

    try {
      const tutorsList = await db.select().from(tutors).all();
      const studentsList = await db.select().from(students).all();
      const productsList = await db.select().from(products).all();
      const alumniList = await db.select().from(alumni).all();

      const activeStudents = studentsList.filter((s) => s.status === "AKTIF");
      const classes = new Set(activeStudents.map((s) => s.kelas).filter(Boolean));
      const activeProducts = productsList.filter((p) => p.status === "AKTIF");

      const paketA = activeStudents.filter(
        (s) => s.program && s.program.toLowerCase().includes("paket a")
      ).length;
      const paketB = activeStudents.filter(
        (s) => s.program && s.program.toLowerCase().includes("paket b")
      ).length;
      const paketC = activeStudents.filter(
        (s) => s.program && s.program.toLowerCase().includes("paket c")
      ).length;

      return {
        success: true,
        data: {
          tutors: tutorsList.length,
          students: activeStudents.length,
          rombel: classes.size || 0,
          products: activeProducts.length,
          paketA,
          paketB,
          paketC,
          alumni: alumniList.length,
        },
      };
    } catch {
      set.status = 500;
      return { success: false, message: "Gagal mengambil data statistik dashboard" };
    }
  });
