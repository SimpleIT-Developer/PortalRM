import express, { type Request, Response, NextFunction } from "express";
// @ts-ignore
import { registerRoutes } from "./_lib/routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Registra as rotas
// Nota: registerRoutes retorna um httpServer, mas aqui no Vercel só precisamos do app express
registerRoutes(app);

// Handler de erro básico
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

export default app;
