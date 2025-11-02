import * as Joi from 'joi';

/**
 * Environment variable validation schema
 * Ensures all critical environment variables are present and valid before app starts
 */
export const envValidationSchema = Joi.object({
  // Application Configuration
  PORT: Joi.number().default(8000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  APP_URL: Joi.string().uri().required(),
  CLIENT_URL: Joi.string().uri().required(),

  // Database Configuration
  MONGO_URI: Joi.string()
    .required()
    .pattern(/^mongodb(\+srv)?:\/\//)
    .messages({
      'string.pattern.base':
        'MONGO_URI must be a valid MongoDB connection string',
    }),

  // JWT Configuration (Main Auth)
  JWT_SECRET_KEY: Joi.string().min(32).required().messages({
    'string.min': 'JWT_SECRET_KEY must be at least 32 characters long',
    'any.required': 'JWT_SECRET_KEY is required for authentication',
  }),
  JWT_EXPIRE_IN: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('15m')
    .messages({
      'string.pattern.base':
        'JWT_EXPIRE_IN must be in format like "15m", "1h", "7d"',
    }),

  // Refresh Token Configuration
  REFRESH_JWT_SECRET_KEY: Joi.string().min(32).required().messages({
    'string.min': 'REFRESH_JWT_SECRET_KEY must be at least 32 characters long',
    'any.required': 'REFRESH_JWT_SECRET_KEY is required for authentication',
  }),
  REFRESH_JWT_EXPIRE_IN: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('7d')
    .messages({
      'string.pattern.base':
        'REFRESH_JWT_EXPIRE_IN must be in format like "7d", "30d"',
    }),

  // Email JWT Configuration
  EMAIL_JWT_SECRET_KEY: Joi.string().min(32).required().messages({
    'string.min': 'EMAIL_JWT_SECRET_KEY must be at least 32 characters long',
    'any.required': 'EMAIL_JWT_SECRET_KEY is required for email verification',
  }),
  EMAIL_JWT_EXPIRE_IN: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('1h')
    .messages({
      'string.pattern.base':
        'EMAIL_JWT_EXPIRE_IN must be in format like "1h", "24h"',
    }),

  // Google OAuth Configuration (Optional)
  GOOGLE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().when('GOOGLE_CLIENT_ID', {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  GOOGLE_CALLBACK_URL: Joi.string().uri().when('GOOGLE_CLIENT_ID', {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  // Email Service Configuration (Resend)
  RESEND_API_KEY: Joi.string().required().messages({
    'any.required': 'RESEND_API_KEY is required for sending emails',
  }),
  MAIL_FROM: Joi.string().email().required().messages({
    'string.email': 'MAIL_FROM must be a valid email address',
    'any.required': 'MAIL_FROM is required for sending emails',
  }),

  // Cloudinary Configuration (for image uploads)
  CLOUDINARY_CLOUD_NAME: Joi.string().required().messages({
    'any.required': 'CLOUDINARY_CLOUD_NAME is required for image uploads',
  }),
  CLOUDINARY_API_KEY: Joi.string().required().messages({
    'any.required': 'CLOUDINARY_API_KEY is required for image uploads',
  }),
  CLOUDINARY_API_SECRET: Joi.string().required().messages({
    'any.required': 'CLOUDINARY_API_SECRET is required for image uploads',
  }),

  // VNPay Payment Gateway Configuration
  VNP_TMN_CODE: Joi.string().required().messages({
    'any.required': 'VNP_TMN_CODE is required for payment processing',
  }),
  VNP_HASH_SECRET: Joi.string().min(32).required().messages({
    'string.min': 'VNP_HASH_SECRET must be at least 32 characters long',
    'any.required': 'VNP_HASH_SECRET is required for payment security',
  }),
  VNP_URL: Joi.string().uri().required().messages({
    'string.uri': 'VNP_URL must be a valid URL',
    'any.required': 'VNP_URL is required for payment processing',
  }),
  VNP_RETURN_URL: Joi.string().uri().required().messages({
    'string.uri': 'VNP_RETURN_URL must be a valid URL',
    'any.required': 'VNP_RETURN_URL is required for payment callbacks',
  }),
});
