import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Responder imediatamente a requisições OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { endpoint, ...refreshData } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ error: "Endpoint é obrigatório" });
    }

    console.log("🔄 Proxy - Renovando token em:", `${endpoint}/api/connect/token`);

    // Garantir que endpoint não termine com barra e path comece com barra
    const baseUrl = endpoint.replace(/\/$/, '');
    const url = `${baseUrl}/api/connect/token`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(refreshData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.log("⚠️ Proxy - Erro na renovação:", response.status, data);
      return res.status(response.status).json(data);
    }

    console.log("✅ Proxy - Token renovado com sucesso");
    return res.json(data);
  } catch (error) {
    console.error("❌ Proxy - Erro na renovação:", error);
    return res.status(500).json({ 
      error: "Erro interno do servidor",
      message: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
}
