
import mongoose from 'mongoose';
import { connectToMongo } from '../server/db-mongo';
import { Tenant } from '../server/models/Tenant';

async function checkTenants() {
  try {
    await connectToMongo();
    console.log("Conectado ao MongoDB.");

    const tenants = await Tenant.find({});
    console.log(`Encontrados ${tenants.length} tenants.`);

    for (const tenant of tenants) {
      console.log(`\nTenant: ${tenant.company.tradeName} (Key: ${tenant.tenantKey})`);
      console.log(`ID: ${tenant._id}`);
      
      if (tenant.environments && tenant.environments.length > 0) {
        console.log(`Ambientes (${tenant.environments.length}):`);
        tenant.environments.forEach(env => {
          // @ts-ignore
          console.log(`  - Nome: ${env.name}`);
          // @ts-ignore
          console.log(`    ID (_id): ${env._id} (Type: ${typeof env._id})`);
          // @ts-ignore
          console.log(`    ID String: ${env._id.toString()}`);
          // @ts-ignore
          console.log(`    URL: ${env.webserviceBaseUrl}`);
        });
      } else {
        console.log("  Nenhum ambiente configurado.");
      }
    }

  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDesconectado.");
  }
}

checkTenants();
