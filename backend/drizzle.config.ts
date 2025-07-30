import { defineConfig } from "drizzle-kit";
import fs from 'fs';
import path from 'path';

// Путь к файлу сертификата
const certPath = path.join(__dirname, 'ca.crt');

export default defineConfig({
  dialect: 'postgresql',
  out: './src/db/migrations',
  schema: './src/db/schema',
  migrations: {
    table: 'migrations',
    schema: 'public',
  },
  dbCredentials: {
    url: process.env.DB_URL,
    ssl: fs.existsSync(certPath) ? {
      ca: fs.readFileSync(certPath),
      rejectUnauthorized: true
    } : false
  },
  verbose: true
});