const isProd = Bun.env.NODE_ENV === "production";
const jwtSecret = Bun.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("❌ CRITICAL: JWT_SECRET environment variable is missing! Please set it in your environment or .env.local file.");
}

export const finalJwtSecret = jwtSecret;
export const IS_PROD = isProd;

