import Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().default(4000),

  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().required().min(32),
  JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRY: Joi.string().default('30d'),

  ENCRYPTION_KEY: Joi.string().required().length(32),

  BELVO_SECRET_KEY_ID: Joi.string().optional().allow(''),
  BELVO_SECRET_KEY_PASSWORD: Joi.string().optional().allow(''),
  BELVO_ENV: Joi.string().valid('sandbox', 'development', 'production').default('sandbox'),
  BELVO_WEBHOOK_SECRET: Joi.string().optional().allow(''),

  PLAID_CLIENT_ID: Joi.string().optional().allow(''),
  PLAID_SECRET: Joi.string().optional().allow(''),
  PLAID_ENV: Joi.string().valid('sandbox', 'development', 'production').default('sandbox'),
  PLAID_WEBHOOK_SECRET: Joi.string().optional().allow(''),

  BITSO_API_KEY: Joi.string().optional().allow(''),
  BITSO_API_SECRET: Joi.string().optional().allow(''),

  BANXICO_API_TOKEN: Joi.string().optional().allow(''),

  SMTP_HOST: Joi.string().optional().allow('').default('localhost'),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().optional().allow(''),
  SMTP_PASS: Joi.string().optional().allow(''),
  EMAIL_FROM: Joi.string().email().default('noreply@dhanam.app'),

  POSTHOG_API_KEY: Joi.string().optional(),
  POSTHOG_HOST: Joi.string().uri().default('https://analytics.enclii.dev'),

  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),
});
