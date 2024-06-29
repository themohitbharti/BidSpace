import dotenv from 'dotenv';

dotenv.config();

interface Config {
  PORT: number;
  MONGODB_URL: string;
  CORS_ORIGIN: string;
  OAUTH_CLIENT_ID: string;
  OAUTH_CLIENT_SECRET: string;
  NODE_ENV: string;
  SESSION_SECRET: string;
  ACCESS_TOKEN_SECRET: string;
  REFRESH_TOKEN_SECRET: string;
  ACCESS_TOKEN_EXPIRY: string;
  REFRESH_TOKEN_EXPIRY: string;
}

const getConfig = (): Config => {
  const {
    PORT,
    MONGODB_URL,
    CORS_ORIGIN,
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    NODE_ENV,
    SESSION_SECRET,
    ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_EXPIRY,
  } = process.env;

  if (
    !PORT ||
    !MONGODB_URL ||
    !CORS_ORIGIN ||
    !OAUTH_CLIENT_ID ||
    !OAUTH_CLIENT_SECRET ||
    !NODE_ENV ||
    !SESSION_SECRET ||
    !ACCESS_TOKEN_SECRET ||
    !REFRESH_TOKEN_SECRET ||
    !ACCESS_TOKEN_EXPIRY ||
    !REFRESH_TOKEN_EXPIRY
  ) {
    throw new Error('Missing required environment variables');
  }

  return {
    PORT: parseInt(PORT, 10),
    MONGODB_URL,
    CORS_ORIGIN,
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    NODE_ENV,
    SESSION_SECRET,
    ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_EXPIRY,
  };
};

export const config = getConfig();