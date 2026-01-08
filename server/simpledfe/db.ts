
// import { Pool, neonConfig } from '@neondatabase/serverless';
// import { drizzle } from 'drizzle-orm/neon-serverless';
// import ws from "ws";
import * as schema from "@shared/schema";

// neonConfig.webSocketConstructor = ws;

/*
if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set. SimpleDFe database features will not work.");
}
*/

// Integration with PortalRM: Neon DB is disabled.
export const pool = null;

// Mock db object to prevent immediate crashes on property access, 
// though methods should be mocked in storage.ts to avoid calling this.
export const db = null as any;

console.log("SimpleDFe database features disabled (Neon DB integration removed).");
