// Script de teste para emissão de NFSe com verificação de DPS
const testarEmissaoNFSe = async () => {
  console.log("🧪 Testando emissão de NFSe com verificação automática de DPS");
  
  const testData = {
    cnpjPrestador: "35540032000108",
    cnpjTomador: "12345678000195",
    valorServico: 1500.00,
    descricaoServico: "Serviços de consultoria em TI",
    municipioPrestacao: "3550308", // São Paulo
    serie: "1"
  };
  
  try {
    // Testar emissão sem DPS específico (vai gerar automaticamente)
    console.log("\n📋 Testando emissão com DPS automático...");
    
    const response = await fetch('http://localhost:3000/api/nfse/emitir', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const responseText = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Resposta bruta: ${responseText.substring(0, 500)}...`);
    
    let resultado;
    try {
      resultado = JSON.parse(responseText);
    } catch (e) {
      console.log("⚠️ Resposta não é JSON, pode ser HTML de erro");
      console.log(`HTML recebido: ${responseText.substring(0, 300)}...`);
      return;
    }
    
    console.log("\n✅ Resultado da emissão:");
    console.log(JSON.stringify(resultado, null, 2));
    
    if (resultado.success) {
      console.log(`\n🎉 NFSe emitida com sucesso!`);
      console.log(`📄 DPS: ${resultado.dpsNumber}`);
      console.log(`🔑 Chave de Acesso: ${resultado.chaveAcesso}`);
      console.log(`📋 Protocolo: ${resultado.protocolo}`);
      console.log(`📄 XML Gerado: ${resultado.xmlGerado}`);
    } else {
      console.log(`\n❌ Erro na emissão: ${resultado.error}`);
    }
    
  } catch (error) {
    console.error("❌ Erro no teste:", error);
  }
};

// Testar com DPS específico que sabemos que existe
const testarEmissaoComDPSEspecifico = async () => {
  console.log("\n🧪 Testando emissão com DPS específico que já existe");
  
  const testData = {
    cnpjPrestador: "35540032000108",
    cnpjTomador: "12345678000195", 
    valorServico: 2000.00,
    descricaoServico: "Serviços de desenvolvimento de software",
    dpsNumber: "DPS355400325743108800011300900000000000000063", // DPS que já existe
    municipioPrestacao: "3550308",
    serie: "1"
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/nfse/emitir', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const responseText = await response.text();
    console.log(`Status: ${response.status}`);
    
    let resultado;
    try {
      resultado = JSON.parse(responseText);
      console.log("✅ Resultado da emissão com DPS existente:");
      console.log(JSON.stringify(resultado, null, 2));
    } catch (e) {
      console.log("⚠️ Resposta não é JSON");
      console.log(`HTML recebido: ${responseText.substring(0, 300)}...`);
    }
    
  } catch (error) {
    console.error("❌ Erro no teste:", error);
  }
};

// Executar testes
(async () => {
  await testarEmissaoNFSe();
  await testarEmissaoComDPSEspecifico();
})();