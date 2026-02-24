import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);

export async function generateDANFE(xmlContent: string): Promise<{ success: boolean, pdfPath?: string, error?: string, debug?: any }> {
  try {
    const tempDir = os.tmpdir();
    const xmlPath = path.join(tempDir, `nfe_${Date.now()}.xml`);
    const pdfPath = path.join(tempDir, `danfe_${Date.now()}.pdf`);

    // Ensure we have valid XML content
    if (!xmlContent) {
        throw new Error("Conteúdo XML vazio");
    }

    fs.writeFileSync(xmlPath, xmlContent);
    const xmlBase64 = Buffer.from(xmlContent).toString('base64');
    
    // Caminho para o script PHP - Ajustado para a estrutura do PortalRM
    const phpScriptPath = path.resolve('./php_bridge/danfe_generator.php');
    
    if (!fs.existsSync(phpScriptPath)) {
        throw new Error(`Script PHP não encontrado em ${phpScriptPath}`);
    }

    // Executa o PHP
    // Importante: Escapar aspas duplas se houver necessidade, mas base64 resolve isso
    const command = `php "${phpScriptPath}" "${xmlBase64}" "${pdfPath}"`;
    
    console.log(`[DANFE] Executando comando PHP: ${command.substring(0, 100)}...`);

    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
        console.warn(`[DANFE] PHP Stderr: ${stderr}`);
    }

    // Tenta extrair o JSON da saída
    const jsonMatch = stdout.match(/==JSON_BEGIN==\n([\s\S]*?)\n==JSON_END==/);
    
    if (!jsonMatch) {
        // Se falhar, tenta limpar o buffer e ler apenas o JSON se possível, ou lança erro com o stdout completo
        throw new Error(`Não foi possível extrair JSON da saída do PHP: ${stdout.substring(0, 200)}...`);
    }

    const result = JSON.parse(jsonMatch[1]);

    if (!result.success) {
        throw new Error(`Erro no script PHP ao gerar DANFE: ${result.error || 'Erro desconhecido'}`);
    }

    if (!fs.existsSync(pdfPath)) {
        throw new Error(`PDF não encontrado no caminho esperado após execução com sucesso: ${pdfPath}`);
    }

    return { success: true, pdfPath };

  } catch (error) {
    console.error('Erro ao gerar DANFE:', error);
    return { 
        success: false, 
        error: (error as Error).message, 
        debug: { 
            stack: (error as Error).stack, 
            name: (error as Error).name 
        } 
    };
  }
}
