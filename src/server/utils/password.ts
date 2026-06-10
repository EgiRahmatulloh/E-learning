// Hash dummy untuk mitigasi timing attack (dibuat saat startup agar valid)
export const DUMMY_HASH = await Bun.password.hash("dummy-password-never-matches", { algorithm: "bcrypt" });
