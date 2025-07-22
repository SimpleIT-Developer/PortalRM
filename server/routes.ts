import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      message: "TOTVS RM Authentication Service" 
    });
  });

  // Note: Authentication is handled directly by the frontend against TOTVS servers
  // This backend serves as a bridge if needed for CORS or additional processing

  const httpServer = createServer(app);

  return httpServer;
}
