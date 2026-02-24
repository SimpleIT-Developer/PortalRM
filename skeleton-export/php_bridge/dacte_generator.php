<?php
require_once 'vendor/autoload.php';

use NFePHP\DA\CTe\Dacte;

if ($argc < 3) {
    echo "Uso: php dacte_generator.php <xml_base64> <output_path>\n";
    exit(1);
}

$xmlBase64 = $argv[1];
$outputPath = $argv[2];

try {
    // Decodificar o XML de base64
    $xmlContent = base64_decode($xmlBase64);
    
    if (!$xmlContent) {
        throw new Exception('Erro ao decodificar XML de base64');
    }

    echo "XML decodificado com sucesso" . PHP_EOL;
    echo "Tamanho do XML: " . strlen($xmlContent) . PHP_EOL;

    // Salvar o XML em um arquivo temporário para que o Dacte possa processá-lo
    $xmlFile = tempnam(sys_get_temp_dir(), 'xml_') . '.xml';
    file_put_contents($xmlFile, $xmlContent);

    // Debug
    echo "XML salvo em: " . $xmlFile . PHP_EOL;
    echo "Tamanho do XML: " . strlen($xmlContent) . PHP_EOL;
    echo "Primeiros 100 caracteres: " . substr($xmlContent, 0, 100) . PHP_EOL;

    try {
        // Inicializar o DACTE usando o sped-da conforme documentação oficial
        $dacte = new NFePHP\DA\CTe\Dacte($xmlContent, 'P', 'A4', '', 'I', '');
        
        // Adicionar rodapé personalizado
        $dacte->creditsIntegratorFooter('Sistema Fiscal');
        
        // Gerar o PDF do DACTE
        $pdf = $dacte->render();

        // Salvar o PDF no caminho especificado
        file_put_contents($outputPath, $pdf);

        // Retornar informações para o Node.js
        echo "==JSON_BEGIN==\n";
        echo json_encode([
            'success' => true,
            'message' => 'DACTE gerado com sucesso',
            'outputPath' => $outputPath
        ]);
        echo "\n==JSON_END==\n";
    } catch (Exception $e) {
        // Tentar método alternativo
        echo "Erro com o método original: " . $e->getMessage() . PHP_EOL;
        echo "Tentando método alternativo..." . PHP_EOL;

        // Método alternativo usando o arquivo XML
        $dacte = new NFePHP\DA\CTe\Dacte($xmlFile);
        // Adicionar rodapé personalizado sem tentar chamar montaDACTE
        $pdf = $dacte->render();
        file_put_contents($outputPath, $pdf);

        echo "==JSON_BEGIN==\n";
        echo json_encode([
            'success' => true,
            'message' => 'DACTE gerado com sucesso (método alternativo)',
            'outputPath' => $outputPath
        ]);
        echo "\n==JSON_END==\n";
    }

} catch (Exception $e) {
    echo "Erro detalhado: " . $e->getMessage() . PHP_EOL;
    echo "Stack trace: " . $e->getTraceAsString() . PHP_EOL;
    
    echo "==JSON_BEGIN==\n";
    echo json_encode([
        'success' => false,
        'message' => 'Erro ao gerar DACTE',
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
    echo "\n==JSON_END==\n";
} finally {
    // Limpar arquivo temporário
    if (isset($xmlFile) && file_exists($xmlFile)) {
        unlink($xmlFile);
    }
}
?>