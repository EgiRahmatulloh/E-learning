import { Database } from "bun:sqlite";

const db = new Database("src/server/db/sqlite.db");

console.log("Running migration...");

db.run(`
  CREATE TABLE IF NOT EXISTS tutor_attendances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tutor_id INTEGER NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

db.run(`
  CREATE UNIQUE INDEX IF NOT EXISTS unq_tutor_attendances ON tutor_attendances(tutor_id, date);
`);

db.run(`
  CREATE TABLE IF NOT EXISTS elearning_session_angkets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES elearning_sessions(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    evaluation_id INTEGER NOT NULL REFERENCES elearning_evaluations(id),
    score INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

db.run(`
  CREATE UNIQUE INDEX IF NOT EXISTS unq_elearning_session_angkets ON elearning_session_angkets(session_id, student_id, evaluation_id);
`);

console.log("Migration completed successfully.");
