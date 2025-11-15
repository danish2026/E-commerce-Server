import { Dialect } from "sequelize/types";
import dotenv from "dotenv";

// Load environment variables from .env file
const x = dotenv.config();

export const configuration = {
  database: {
    dialect: "postgres" as Dialect,
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USER,
    password: String(process.env.DATABASE_PASSWORD),
    database: process.env.DATABASE_NAME,
  },

  jwtPrivateKey: process.env.JWT_PRIVATE_KEY,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiry: process.env.JWT_EXPIRY,

  server: {
    port: process.env.PORT,
  },

  aws: {
    accessKeyId: process.env.ACCESSKEYID,
    secretAccessKey: process.env.SECRETKEYID,
    region: process.env.S3_REGION,
    signatureVersion: "v4",
  },

  firebase: {
    type: process.env.FIREBASE_TYPE,
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    clientId: process.env.FIREBASE_CLIENT_ID,
    authUri: process.env.FIREBASE_AUTH_URI,
    tokenUri: process.env.FIREBASE_TOKEN_URI,
    authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universeDomain: process.env.FIREBASE_UNIVERSE_DOMAIN,
  },
};

