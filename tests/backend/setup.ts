// Preload untuk SEMUA test backend (bunfig [test] preload).
// Menjamin isolasi sebelum modul production mana pun diimpor:
// - DATABASE_URL=:memory: agar tidak pernah menyentuh src/server/sqlite.db
// - JWT_SECRET deterministik agar token antar helper saling verifikasi
// - NODE_ENV=test agar IS_PROD false dan branch dev yang dipakai
// File ini bukan test (tidak ada *.test.ts) sehingga tidak masuk denominator gate.
if (!Bun.env.JWT_SECRET && Bun.env.BACKEND_TEST_ALLOW_MISSING_JWT !== "1") {
  Bun.env.JWT_SECRET = "backend-test-secret";
}
Bun.env.NODE_ENV = "test";
Bun.env.DATABASE_URL = ":memory:";
