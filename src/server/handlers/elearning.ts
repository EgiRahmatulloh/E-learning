/* eslint-disable @typescript-eslint/no-explicit-any */
import { Elysia, t } from "elysia";
import { jwt } from "@elysia/jwt";
import { finalJwtSecret } from "../config/jwt";

import { courseHandlers } from "./elearning/course";
import { setupHandlers } from "./elearning/setup";
import { forumHandlers } from "./elearning/forum";
import { attendanceHandlers } from "./elearning/attendance";
import { monitoringHandlers } from "./elearning/monitoring";
import { submissionsHandlers } from "./elearning/submissions";
import { quizHandlers } from "./elearning/quiz";
import { completionsHandlers } from "./elearning/completions";
import { laporanHandlers } from "./elearning/laporan";
import { tutorAttendanceHandlers } from "./elearning/tutorAttendance";
import { angketHandlers } from "./elearning/angket";

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
  .use(courseHandlers)
  .use(setupHandlers)
  .use(forumHandlers)
  .use(attendanceHandlers)
  .use(monitoringHandlers)
  .use(submissionsHandlers)
  .use(quizHandlers)
  .use(completionsHandlers)
  .use(laporanHandlers)
  .use(tutorAttendanceHandlers)
  .use(angketHandlers);
