import * as Joi from 'joi';

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
  
  BELVO_SECRET_KEY_ID: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
  }),
  BELVO_SECRET_KEY_PASSWORD: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
  }),
  BELVO_ENV: Joi.string().valid('sandbox', 'development', 'production').default('sandbox'),
  BELVO_WEBHOOK_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
  }),
  
  PLAID_CLIENT_ID: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
  }),
  PLAID_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
  }),
  PLAID_ENV: Joi.string().valid('sandbox', 'development', 'production').default('sandbox'),
  PLAID_WEBHOOK_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
  }),
  
  BITSO_API_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
  }),
  BITSO_API_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
  }),
  
  BANXICO_API_TOKEN: Joi.string().optional(),
  
  SMTP_HOST: Joi.string().default('localhost'),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().allow(''),
  SMTP_PASS: Joi.string().allow(''),
  EMAIL_FROM: Joi.string().email().default('noreply@dhanam.app'),
  
  POSTHOG_API_KEY: Joi.string().optional(),
  POSTHOG_HOST: Joi.string().uri().default('https://app.posthog.com'),
  
  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),
});