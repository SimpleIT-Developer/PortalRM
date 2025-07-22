import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// TOTVS Authentication schemas
export const totvsLoginSchema = z.object({
  grant_type: z.literal("password"),
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
  servicealias: z.string().optional(),
  endpoint: z.string().url("Endpoint deve ser uma URL válida").min(1, "Endpoint é obrigatório"),
});

export const totvsRefreshSchema = z.object({
  grant_type: z.literal("refresh_token"),
  refresh_token: z.string().min(1, "Refresh token é obrigatório"),
});

export const totvsTokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  refresh_token: z.string().optional(),
});

export type TotvsLoginRequest = z.infer<typeof totvsLoginSchema>;
export type TotvsRefreshRequest = z.infer<typeof totvsRefreshSchema>;
export type TotvsTokenResponse = z.infer<typeof totvsTokenResponseSchema>;
