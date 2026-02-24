import { Resend } from 'resend';

interface WelcomeEmailData {
  nome: string;
  email: string;
  senha: string;
  codigoCliente?: string;
  nomeEmpresa?: string;
  baseUrl?: string;
}

interface ResetPasswordEmailData {
  nome: string;
  email: string;
  resetToken: string;
  baseUrl?: string;
}

function createWelcomeEmailHTML(data: WelcomeEmailData): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vindo ao SimpleDFE</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8fafc;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #581c87 0%, #7c3aed 50%, #a855f7 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 8px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .subtitle {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 300;
        }
        .content {
            padding: 40px 30px;
        }
        .welcome-title {
            color: #581c87;
            font-size: 24px;
            margin-bottom: 20px;
            font-weight: bold;
        }
        .welcome-text {
            font-size: 16px;
            margin-bottom: 25px;
            color: #555;
        }
        .access-box {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-left: 4px solid #581c87;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
        }
        .access-title {
            color: #581c87;
            font-weight: bold;
            margin-bottom: 15px;
            font-size: 18px;
        }
        .access-item {
            margin: 8px 0;
            font-size: 14px;
        }
        .access-label {
            font-weight: bold;
            color: #374151;
            display: inline-block;
            width: 100px;
        }
        .access-value {
            color: #581c87;
            font-weight: 600;
        }
        .security-note {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #92400e;
        }
        .features {
            margin: 25px 0;
            padding: 20px;
            background-color: #f9fafb;
            border-radius: 8px;
        }
        .features-title {
            color: #581c87;
            font-weight: bold;
            margin-bottom: 12px;
            font-size: 16px;
        }
        .feature-item {
            margin: 8px 0;
            padding-left: 20px;
            position: relative;
            font-size: 14px;
            color: #4b5563;
        }
        .feature-item::before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #10b981;
            font-weight: bold;
        }
        .footer {
            background-color: #f3f4f6;
            padding: 25px 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .support-info {
            font-size: 14px;
            color: #6b7280;
            margin: 10px 0;
        }
        .company-name {
            color: #581c87;
            font-weight: bold;
        }
        .url {
            color: #581c87;
            text-decoration: none;
            font-weight: bold;
        }
        .emoji {
            font-size: 20px;
            margin-right: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">SimpleDFe</div>
            <p class="subtitle">Gestão Inteligente de Documentos Fiscais</p>
        </div>
        
        <div class="content">
            <h1 class="welcome-title"><span class="emoji">🎉</span>Bem-vindo ao SimpleDFe${data.nomeEmpresa ? ` – ${data.nomeEmpresa}` : ''}!</h1>
            
            <p class="welcome-text">
                Olá <strong>${data.nome}</strong>! Seu acesso ao SimpleDFe foi criado com sucesso. 
                Agora você pode aproveitar todas as funcionalidades da nossa plataforma de gestão de documentos fiscais.
            </p>
            
            <div class="access-box">
                <div class="access-title">🔐 Seus dados de acesso</div>
                <div class="access-item">
                    <span class="access-label">Usuário:</span>
                    <span class="access-value">${data.email}</span>
                </div>
                <div class="access-item">
                    <span class="access-label">Senha:</span>
                    <span class="access-value">${data.senha}</span>
                </div>
                <div class="access-item">
                    <span class="access-label">URL:</span>
                    <a href="${data.baseUrl || 'https://www.simpledfe.com.br'}" class="url">${data.baseUrl ? data.baseUrl.replace(/^https?:\/\//, '') : 'www.simpledfe.com.br'}</a>
                </div>
                ${data.codigoCliente ? `<div class="access-item">
                    <span class="access-label">Código:</span>
                    <span class="access-value">${data.codigoCliente}</span>
                </div>` : ''}
            </div>
            
            <div class="security-note">
                <strong>⚠️ Importante:</strong> Por segurança, recomendamos alterar sua senha após o primeiro acesso.
            </div>
            
            <div class="features">
                <div class="features-title">🚀 O que você pode fazer com o SimpleDFe:</div>
                <div class="feature-item">Captura automática de XMLs de NFe e NFS-e emitidos contra o seu CNPJ</div>
                <div class="feature-item">Organização por CNPJ, datas e tipos de documentos</div>
                <div class="feature-item">Acesso seguro com controle de usuários</div>
                <div class="feature-item">Histórico e logs detalhados de todas as operações</div>
            </div>
            
            <div class="features">
                <div class="features-title">🎨 Plataforma com interface amigável:</div>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">
                    Nosso sistema foi desenvolvido com as cores institucionais e identidade visual do SimpleDFe, 
                    priorizando usabilidade, clareza e eficiência.
                </p>
            </div>
        </div>
        
        <div class="footer">
            <div class="features-title">🆘 Suporte e ajuda</div>
            <p class="support-info">Se precisar de qualquer apoio, conte com nosso time!</p>
            <div class="support-info">
                📧 <a href="mailto:contato@simpledfe.com.br" class="url">contato@simpledfe.com.br</a><br>
                📞 (11) 94498-7584
            </div>
            <br>
            <p class="support-info">
                © 2024 <span class="company-name">SimpleDFe</span>. Todos os direitos reservados.
            </p>
        </div>
    </div>
</body>
</html>
`;
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  // Validação dos dados obrigatórios
  if (!data.nome || !data.email) {
    console.error('❌ Dados obrigatórios não fornecidos - nome e email são necessários');
    return false;
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY não configurada - email não pode ser enviado');
    return false;
  }

  try {
    console.log(`📧 Preparando envio de email para: ${data.email}`);
    
    const resend = new Resend(process.env.RESEND_API_KEY);
    const htmlContent = createWelcomeEmailHTML(data);
    
    // Validar email antes de enviar
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      console.error(`❌ Email inválido fornecido: ${data.email}`);
      return false;
    }

    console.log(`📤 Enviando email de boas-vindas para: ${data.email}`);
    
    const emailPayload = {
      from: 'SimpleDFe <simpledfe@simpleit.com.br>',
      to: [data.email],
      subject: `Bem-vindo ao SimpleDFe${data.nomeEmpresa ? ` – ${data.nomeEmpresa}` : ''}`,
      html: htmlContent,
      text: `Bem-vindo ao SimpleDFe, ${data.nome}! 
      
Seus dados de acesso:
Usuário: ${data.email}
Senha: ${data.senha}
URL: ${data.baseUrl ? data.baseUrl.replace(/^https?:\/\//, '') : 'www.simpledfe.com.br'}
${data.codigoCliente ? `Código do Cliente: ${data.codigoCliente}` : ''}

Por segurança, altere sua senha após o primeiro acesso.

Equipe SimpleDFe
contato@simpledfe.com.br
(11) 94498-7584`
    };

    const result = await resend.emails.send(emailPayload);

    if (result.data?.id) {
      console.log(`✅ Email enviado com sucesso - ID: ${result.data.id} para: ${data.email}`);
      return true;
    } else if (result.error) {
      console.error(`❌ Erro do Resend:`, result.error);
      return false;
    } else {
      console.warn(`⚠️ Email enviado mas resposta inesperada:`, result);
      return true; // Considerar sucesso se não há erro explícito
    }
  } catch (error: any) {
    console.error(`❌ Erro crítico ao enviar email para ${data.email}:`);
    console.error(`   Mensagem: ${error.message}`);
    console.error(`   Tipo: ${error.name}`);
    
    if (error.response?.data) {
      console.error(`   Resposta da API:`, error.response.data);
    }
    
    // Tratamento de erros específicos
    if (error.message?.includes('API key') || error.message?.includes('Unauthorized')) {
      console.error('🔑 Erro de autenticação - verifique a RESEND_API_KEY');
    } else if (error.message?.includes('rate limit') || error.message?.includes('Too Many Requests')) {
      console.error('⏱️ Limite de envio atingido - tente novamente mais tarde');
    } else if (error.message?.includes('domain') || error.message?.includes('sender')) {
      console.error('🌐 Erro de domínio - verifique a configuração do remetente no Resend');
    }
    
    return false;
  }
}

function createResetPasswordEmailHTML(data: ResetPasswordEmailData): string {
  const resetUrl = `${data.baseUrl || 'https://www.simpledfe.com.br'}/reset-password?token=${data.resetToken}`;
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redefinir Senha - SimpleDFe</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8fafc;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #581c87 0%, #7c3aed 50%, #a855f7 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 8px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .subtitle {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 300;
        }
        .content {
            padding: 40px 30px;
        }
        .reset-title {
            color: #581c87;
            font-size: 24px;
            margin-bottom: 20px;
            font-weight: bold;
        }
        .reset-text {
            font-size: 16px;
            margin-bottom: 25px;
            color: #555;
        }
        .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #581c87 0%, #7c3aed 50%, #a855f7 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            margin: 20px 0;
            text-align: center;
            box-shadow: 0 4px 6px rgba(88, 28, 135, 0.3);
            transition: transform 0.2s;
        }
        .reset-button:hover {
            transform: translateY(-2px);
        }
        .reset-box {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-left: 4px solid #581c87;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
        }
        .security-note {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #92400e;
        }
        .footer {
            background-color: #f3f4f6;
            padding: 25px 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .support-info {
            font-size: 14px;
            color: #6b7280;
            margin: 10px 0;
        }
        .company-name {
            color: #581c87;
            font-weight: bold;
        }
        .url {
            color: #581c87;
            text-decoration: none;
            font-weight: bold;
        }
        .emoji {
            font-size: 20px;
            margin-right: 8px;
        }
        .token-display {
            font-family: 'Courier New', monospace;
            background-color: #f1f5f9;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
            word-break: break-all;
            font-size: 14px;
            color: #581c87;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">SimpleDFe</div>
            <p class="subtitle">Gestão Inteligente de Documentos Fiscais</p>
        </div>
        
        <div class="content">
            <h1 class="reset-title"><span class="emoji">🔐</span>Redefinir sua senha</h1>
            
            <p class="reset-text">
                Olá <strong>${data.nome}</strong>! Recebemos uma solicitação para redefinir a senha da sua conta no SimpleDFe.
            </p>
            
            <div class="reset-box">
                <p style="margin-bottom: 15px; font-weight: bold; color: #581c87;">Clique no botão abaixo para redefinir sua senha:</p>
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="reset-button">🔑 Redefinir Senha</a>
                </div>
            </div>
            
            <p class="reset-text" style="font-size: 14px; color: #6b7280;">
                Ou copie e cole o link abaixo no seu navegador:
            </p>
            <div class="token-display">
                ${resetUrl}
            </div>
            
            <div class="security-note">
                <strong>⚠️ Importante:</strong>
                <ul style="margin: 10px 0 0 20px; font-size: 14px;">
                    <li>Este link é válido por apenas 1 hora</li>
                    <li>Se você não solicitou esta redefinição, ignore este email</li>
                    <li>Nunca compartilhe este link com outras pessoas</li>
                </ul>
            </div>
            
            <p class="reset-text" style="font-size: 14px; color: #6b7280;">
                Se você não conseguir clicar no botão, copie e cole o link completo no seu navegador.
            </p>
        </div>
        
        <div class="footer">
            <div style="color: #581c87; font-weight: bold; margin-bottom: 12px; font-size: 16px;">🆘 Suporte e ajuda</div>
            <p class="support-info">Se precisar de qualquer apoio, conte com nosso time!</p>
            <div class="support-info">
                📧 <a href="mailto:contato@simpledfe.com.br" class="url">contato@simpledfe.com.br</a><br>
                📞 (11) 94498-7584
            </div>
            <br>
            <p class="support-info">
                © 2024 <span class="company-name">SimpleDFe</span>. Todos os direitos reservados.
            </p>
        </div>
    </div>
</body>
</html>
`;
}

export async function sendResetPasswordEmail(data: ResetPasswordEmailData): Promise<boolean> {
  // Validação dos dados obrigatórios
  if (!data.nome || !data.email || !data.resetToken) {
    console.error('❌ Dados obrigatórios não fornecidos - nome, email e resetToken são necessários');
    return false;
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY não configurada - email não pode ser enviado');
    return false;
  }

  try {
    console.log(`📧 Preparando envio de email de reset de senha para: ${data.email}`);
    
    const resend = new Resend(process.env.RESEND_API_KEY);
    const htmlContent = createResetPasswordEmailHTML(data);
    
    // Validar email antes de enviar
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      console.error(`❌ Email inválido fornecido: ${data.email}`);
      return false;
    }

    console.log(`📤 Enviando email de reset de senha para: ${data.email}`);
    
    const resetUrl = `${data.baseUrl || 'https://www.simpledfe.com.br'}/reset-password?token=${data.resetToken}`;
    
    const emailPayload = {
      from: 'SimpleDFe <simpledfe@simpleit.com.br>',
      to: [data.email],
      subject: 'Redefinir senha - SimpleDFe',
      html: htmlContent,
      text: `Redefinir senha - SimpleDFe
      
Olá ${data.nome}!

Recebemos uma solicitação para redefinir a senha da sua conta no SimpleDFe.

Clique no link abaixo para redefinir sua senha:
${resetUrl}

Importante:
- Este link é válido por apenas 1 hora
- Se você não solicitou esta redefinição, ignore este email
- Nunca compartilhe este link com outras pessoas

Equipe SimpleDFe
contato@simpledfe.com.br
(11) 94498-7584`
    };

    const result = await resend.emails.send(emailPayload);

    if (result.data?.id) {
      console.log(`✅ Email de reset enviado com sucesso - ID: ${result.data.id} para: ${data.email}`);
      return true;
    } else if (result.error) {
      console.error(`❌ Erro do Resend:`, result.error);
      return false;
    } else {
      console.warn(`⚠️ Email enviado mas resposta inesperada:`, result);
      return true; // Considerar sucesso se não há erro explícito
    }
  } catch (error: any) {
    console.error(`❌ Erro crítico ao enviar email de reset para ${data.email}:`);
    console.error(`   Mensagem: ${error.message}`);
    console.error(`   Tipo: ${error.name}`);
    
    if (error.response?.data) {
      console.error(`   Resposta da API:`, error.response.data);
    }
    
    return false;
  }
}

export async function testResendConnection(): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.error('Resend API Key não configurada');
    return false;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Teste usando email simples
    const result = await resend.emails.send({
      from: 'SimpleDFe <simpledfe@simpleit.com.br>',
      to: ['test@example.com'],
      subject: 'Teste de conexão Resend',
      html: '<p>Este é um teste de conexão.</p>',
      text: 'Este é um teste de conexão.'
    });

    console.log('Teste de conexão Resend: SUCESSO - ID:', result.data?.id);
    return true;
  } catch (error: any) {
    console.error('Teste de conexão Resend: FALHOU', {
      message: error.message,
      name: error.name
    });
    return false;
  }
}