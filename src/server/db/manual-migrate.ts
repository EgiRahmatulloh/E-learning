import { createClient } from "@libsql/client";

const client = createClient({ url: "file:src/server/db/sqlite.db" });

async function run() {
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS tutor_attendances (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        tutor_id integer NOT NULL,
        date text NOT NULL,
        created_at integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
        FOREIGN KEY (tutor_id) REFERENCES tutors(id) ON UPDATE no action ON DELETE cascade
      );
    `);
    
    await client.execute(`
      CREATE TABLE IF NOT EXISTS elearning_session_angkets (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        session_id integer NOT NULL,
        student_id integer NOT NULL,
        responses text NOT NULL,
        created_at integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
        updated_at integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
        FOREIGN KEY (session_id) REFERENCES elearning_sessions(id) ON UPDATE no action ON DELETE cascade,
        FOREIGN KEY (student_id) REFERENCES students(id) ON UPDATE no action ON DELETE cascade
      );
    `);
    
    console.log("Tables created successfully!");
  } catch (error) {
    console.error("Error creating tables:", error);
  } finally {
    client.close();
  }
}

run();
