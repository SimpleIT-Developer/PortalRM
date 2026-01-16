
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { ConfigUser } from '../server/models/ConfigUser';
import { connectToMongo } from '../server/db-mongo';

async function createAdmin() {
  await connectToMongo();

  const CODUSUARIO = 'admin';
  const SENHA = 'admin123'; 
  const URLWS = 'http://erp-simpleit.sytes.net:8051';
  const NOMEDOAMBIENTE = 'Produção';
  const CODCLIENTE = '001';
  const NOMECLIENTE = 'Cliente Padrão';

  console.log(`Criando/Atualizando usuário: ${CODUSUARIO}`);

  try {
    const existingUser = await ConfigUser.findOne({ CODUSUARIO });
    if (existingUser) {
      console.log('Usuário admin já existe. Atualizando...');
      existingUser.SENHA = await bcrypt.hash(SENHA, 10);
      existingUser.URLWS = URLWS;
      existingUser.NOMEDOAMBIENTE = NOMEDOAMBIENTE;
      existingUser.CODCLIENTE = CODCLIENTE;
      existingUser.NOMECLIENTE = NOMECLIENTE;
      await existingUser.save();
      console.log('✅ Usuário admin atualizado com sucesso!');
    } else {
      const hashedPassword = await bcrypt.hash(SENHA, 10);
      const newUser = new ConfigUser({
        CODUSUARIO,
        SENHA: hashedPassword,
        URLWS,
        NOMEDOAMBIENTE,
        CODCLIENTE,
        NOMECLIENTE
      });
      await newUser.save();
      console.log('✅ Usuário admin criado com sucesso!');
    }
    console.log('Credenciais: admin / admin123');
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
  } finally {
    // Aguarda um pouco para garantir que o console.log seja exibido antes de sair
    setTimeout(() => {
        mongoose.disconnect();
        process.exit(0);
    }, 1000);
  }
}

createAdmin();
