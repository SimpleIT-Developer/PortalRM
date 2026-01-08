import { Resend } from 'resend';

interface NewPasswordEmailData {
  nome: string;
  email: string;
  novaSenha: string;
  baseUrl?: string;
}

function createNewPasswordEmailHTML(data: NewPasswordEmailData): string {
  const loginUrl = `${data.baseUrl || 'https://www.simpledfe.com.br'}/login`;
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nova Senha - SimpleDFe</title>
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
            width: 120px;
        }
        .access-value {
            color: #581c87;
            font-weight: 600;
            font-family: 'Courier New', monospace;
            font-size: 16px;
            background-color: #f1f5f9;
            padding: 8px 12px;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
            letter-spacing: 1px;
        }
        .login-button {
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
        .login-button:hover {
            transform: translateY(-2px);
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
            <h1 class="welcome-title"><span class="emoji">🔐</span>Nova senha gerada com sucesso!</h1>
            
            <p class="welcome-text">
                Olá <strong>${data.nome}</strong>! Uma nova senha temporária foi gerada para sua conta no SimpleDFe conforme solicitado.
            </p>
            
            <div class="access-box">
                <div class="access-title">🔑 Sua nova senha temporária</div>
                <div class="access-item" style="text-align: center; margin: 20px 0;">
                    <div class="access-value" style="font-size: 20px; letter-spacing: 3px; display: inline-block;">
                        ${data.novaSenha}
                    </div>
                </div>
                <div style="text-align: center; margin-top: 15px;">
                    <a href="${loginUrl}" class="login-button">🚀 Fazer Login Agora</a>
                </div>
            </div>
            
            <div class="security-note">
                <strong>⚠️ Importante:</strong> Esta é uma senha temporária. Por segurança, altere para uma senha de sua preferência após fazer login.
            </div>
            
            <div class="features">
                <div class="features-title">🔄 Próximos passos:</div>
                <div class="feature-item">Faça login com a senha temporária acima</div>
                <div class="feature-item">Vá para seu perfil ou configurações</div>
                <div class="feature-item">Altere para uma senha segura de sua escolha</div>
                <div class="feature-item">Mantenha sua nova senha em local seguro</div>
            </div>
            
            <div class="features">
                <div class="features-title">🛡️ Dicas de segurança:</div>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">
                    Use uma senha com pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos. 
                    Nunca compartilhe suas senhas e evite usar a mesma senha em múltiplos sites.
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

export async function sendNewPasswordEmail(data: NewPasswordEmailData): Promise<boolean> {
  // Validação dos dados obrigatórios
  if (!data.nome || !data.email || !data.novaSenha) {
    console.error('❌ Dados obrigatórios não fornecidos - nome, email e novaSenha são necessários');
    return false;
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY não configurada - email não pode ser enviado');
    return false;
  }

  try {
    console.log(`📧 Preparando envio de email de nova senha para: ${data.email}`);
    
    const resend = new Resend(process.env.RESEND_API_KEY);
    const htmlContent = createNewPasswordEmailHTML(data);
    
    // Validar email antes de enviar
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      console.error(`❌ Email inválido fornecido: ${data.email}`);
      return false;
    }

    console.log(`📤 Enviando email de nova senha para: ${data.email}`);
    
    const emailPayload = {
      from: 'SimpleDFe <simpledfe@simpleit.com.br>',
      to: [data.email],
      subject: 'Nova senha gerada - SimpleDFe',
      html: htmlContent,
      text: `Nova senha gerada - SimpleDFe
      
Olá ${data.nome}!

Uma nova senha temporária foi gerada para sua conta no SimpleDFe conforme solicitado.

Sua nova senha temporária: ${data.novaSenha}

Acesse: ${data.baseUrl || 'https://www.simpledfe.com.br'}/login

Importante:
- Esta é uma senha temporária - altere após fazer login
- Se você não solicitou esta alteração, entre em contato conosco
- Nunca compartilhe suas senhas com outras pessoas
- Defina uma senha segura após acessar sua conta

Equipe SimpleDFe
contato@simpledfe.com.br
(11) 94498-7584`
    };

    const result = await resend.emails.send(emailPayload);

    if (result.data?.id) {
      console.log(`✅ Email de nova senha enviado com sucesso - ID: ${result.data.id} para: ${data.email}`);
      return true;
    } else if (result.error) {
      console.error(`❌ Erro do Resend:`, result.error);
      return false;
    } else {
      console.warn(`⚠️ Email enviado mas resposta inesperada:`, result);
      return true; // Considerar sucesso se não há erro explícito
    }
  } catch (error: any) {
    console.error(`❌ Erro crítico ao enviar email de nova senha para ${data.email}:`);
    console.error(`   Mensagem: ${error.message}`);
    console.error(`   Tipo: ${error.name}`);
    
    if (error.response?.data) {
      console.error(`   Resposta da API:`, error.response.data);
    }
    
    return false;
  }
}