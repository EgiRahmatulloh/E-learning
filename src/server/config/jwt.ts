const isProd = Bun.env.NODE_ENV === "production";
const jwtSecret = Bun.env.JWT_SECRET;

if (!jwtSecret && isProd) {
  throw new Error("❌ CRITICAL: JWT_SECRET environment variable is missing! Please set it in your environment or .env.local file.");
}
if (!jwtSecret) {
  console.warn("⚠️ Warning: JWT_SECRET is missing. Using insecure fallback secret for development.");
}

export const finalJwtSecret = jwtSecret!;
export const IS_PROD = isProd;


