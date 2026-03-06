import "server-only";
import { z } from "zod";

const envSchema = z.object({
  API_BASE_URL: z.string().url().default("https://dummyjson.com"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(
      "❌ Invalid environment variables:",
      parsed.error.flatten().fieldErrors,
    );
    throw new Error("Invalid environment variables");
  }
  return parsed.data;
}

export const env = validateEnv();
