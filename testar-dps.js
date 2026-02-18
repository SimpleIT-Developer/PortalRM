// Script de teste para verificação de DPS
const testarVerificacaoDPS = async () => {
  const dpsNumber = "DPS355400325743108800011300900000000000000063";
  
  console.log(`🧪 Testando verificação de DPS: ${dpsNumber}`);
  
  try {
    // Testar endpoint de verificação individual
    console.log("\n📋 Testando endpoint de verificação individual...");
    const response1 = await fetch(`http://localhost:3000/api/dps/verificar/${dpsNumber}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    const data1 = await response1.json();
    console.log("✅ Resposta da verificação individual:");
    console.log(JSON.stringify(data1, null, 2));
    
    // Testar endpoint de próximo disponível
    console.log("\n📋 Testando endpoint de próximo DPS disponível...");
    const dpsBase = "DPS355400325743108800011300900000000000000000"; // Sem o 63 no final
    const response2 = await fetch(`http://localhost:3000/api/dps/proximo-disponivel/${dpsBase}?maxTentativas=10`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    const data2 = await response2.json();
    console.log("✅ Resposta do próximo disponível:");
    console.log(JSON.stringify(data2, null, 2));
    
  } catch (error) {
    console.error("❌ Erro nos testes:", error);
  }
};

// Executar teste
testarVerificacaoDPS();