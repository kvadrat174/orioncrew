import { defineConfig } from "drizzle-kit";
import fs from 'fs';
import path from 'path';

// Путь к файлу сертификата
const certPath = path.join(__dirname, 'ca.crt');

if (fs.existsSync(certPath)) {
  process.env.NODE_EXTRA_CA_CERTS = certPath;
}

export default defineConfig({
  dialect: 'postgresql',
  out: './src/db/migrations',
  schema: './src/db/schema',
  migrations: {
    table: 'migrations',
    schema: 'public',
  },
  dbCredentials: {
    url: 'postgresql://gen_user:Gd%7DofjYnX%5CZ5Pa@10e60462bd570ad3e0478fa0.twc1.net:5432/orion_db?sslmode=verify-full',
    ssl: fs.existsSync(certPath) ? {
      ca: fs.readFileSync(certPath),
      rejectUnauthorized: true
    } : false
  },
  verbose: true
});