import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { endpoint, path, token } = req.query;
    
    if (!endpoint || !path) {
      return res.status(400).json({ error: "Endpoint e path são obrigatórios" });
    }

    // Ensure endpoint has protocol
    const endpointStr = Array.isArray(endpoint) ? endpoint[0] : endpoint;
    const pathStr = Array.isArray(path) ? path[0] : path;
    const tokenStr = Array.isArray(token) ? token[0] : token;

    const formattedEndpoint = endpointStr.replace(/^https?:\/\//i, '');
    const fullUrl = `http://${formattedEndpoint}${pathStr}`;

    console.log("🔗 Proxy GET - Consultando:", fullUrl);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (tokenStr) {
      headers["Authorization"] = `Bearer ${tokenStr}`;
    }

    const response = await fetch(fullUrl, {
      method: "GET",
      headers,
    });

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    let data;
    
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        // If not JSON, return as is or empty object
        data = { message: text }; 
      }
    }
    
    if (!response.ok) {
      console.log("⚠️ Proxy GET - Erro:", response.status, data);
      return res.status(response.status).json(data);
    }

    console.log("✅ Proxy GET - Sucesso");
    return res.status(200).json(data);
  } catch (error) {
    console.error("Proxy GET Error:", error);
    return res.status(500).json({ 
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
