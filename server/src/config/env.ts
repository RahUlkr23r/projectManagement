import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .union([z.string(), z.number()])
    .default(5000)
    .transform((val) => {
      const parsed = typeof val === 'number' ? val : parseInt(val, 10);
      return isNaN(parsed) ? 5000 : parsed;
    }),
  CLIENT_URL: z
    .string()
    .default('http://localhost:5173')
    .transform((val) => {
      if (!val || val.includes('<') || val.includes('>')) return 'http://localhost:5173';
      return val.trim().replace(/\/$/, '');
    }),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_ACCESS_SECRET: z
    .string()
    .min(1)
    .default('velozity_default_jwt_access_secret_production_2026'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(1)
    .default('velozity_default_jwt_refresh_secret_production_2026'),
  JWT_REFRESH_EXPIRY_DAYS: z
    .union([z.string(), z.number()])
    .default(7)
    .transform((val) => {
      const parsed = typeof val === 'number' ? val : parseInt(val, 10);
      return isNaN(parsed) ? 7 : parsed;
    }),
  COOKIE_SECRET: z
    .string()
    .min(1)
    .default('velozity_default_cookie_parser_secret_production_2026'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables configuration:');
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;
