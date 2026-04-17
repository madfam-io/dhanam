import { z } from 'zod';

const envSchemaBase = z.object({
  // API
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_BASE_URL: z.string().url().default('http://localhost:3040'),
  NEXT_PUBLIC_ADMIN_URL: z.string().url().optional(),

  // Auth (Janua OIDC)
  NEXT_PUBLIC_AUTH_MODE: z.enum(['local', 'janua']).default('local'),
  NEXT_PUBLIC_JANUA_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_JANUA_API_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_OIDC_ISSUER: z.string().url().optional(),
  NEXT_PUBLIC_OIDC_CLIENT_ID: z.string().min(1).optional(),

  // Analytics (PostHog)
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),

  // Error Monitoring (Sentry)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_ENVIRONMENT: z.string().optional(),

  // Billing
  NEXT_PUBLIC_STRIPE_MX_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: z.string().optional(),
  NEXT_PUBLIC_PADDLE_ENVIRONMENT: z.enum(['sandbox', 'production']).optional(),

  // Localization
  NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(['en', 'es', 'pt']).default('en'),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const envSchema = envSchemaBase.superRefine((data, ctx) => {
  // In janua auth mode, OIDC vars are required
  if (data.NEXT_PUBLIC_AUTH_MODE === 'janua') {
    if (!data.NEXT_PUBLIC_OIDC_ISSUER) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'NEXT_PUBLIC_OIDC_ISSUER is required when auth mode is janua',
        path: ['NEXT_PUBLIC_OIDC_ISSUER'],
      });
    }
    if (!data.NEXT_PUBLIC_OIDC_CLIENT_ID) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'NEXT_PUBLIC_OIDC_CLIENT_ID is required when auth mode is janua',
        path: ['NEXT_PUBLIC_OIDC_CLIENT_ID'],
      });
    }
    if (!data.NEXT_PUBLIC_JANUA_API_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'NEXT_PUBLIC_JANUA_API_URL is required when auth mode is janua',
        path: ['NEXT_PUBLIC_JANUA_API_URL'],
      });
    }
  }

  // Production guards
  if (data.NODE_ENV === 'production') {
    if (!data.NEXT_PUBLIC_POSTHOG_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'NEXT_PUBLIC_POSTHOG_KEY should be set in production for observability',
        path: ['NEXT_PUBLIC_POSTHOG_KEY'],
      });
    }
  }
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    const message = Object.entries(formatted)
      .map(([key, errors]) => `  ${key}: ${errors?.join(', ')}`)
      .join('\n');
    throw new Error(`[dhanam-web] Invalid environment variables:\n${message}`);
  }
  cachedEnv = parsed.data;
  return cachedEnv;
}

export function getEnvUnsafe(): Partial<Env> {
  return envSchemaBase.partial().parse(process.env);
}
